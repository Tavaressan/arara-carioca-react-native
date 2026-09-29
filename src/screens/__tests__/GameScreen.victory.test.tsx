import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

// react-native-reanimated exige inicialização nativa (worklets), indisponível no ambiente de teste.
jest.mock('react-native-reanimated', () =>
  require('../../hooks/testUtils/reanimatedMock').createReanimatedViewMock()
);

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { difficulty: 'easy' } }),
}));

jest.mock('../../hooks/useHighScore', () => ({
  useHighScore: () => ({ setScore: jest.fn() }),
}));

jest.mock('../../hooks/useBackgroundMusic', () => ({
  useBackgroundMusic: jest.fn(),
}));

const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 800;

// useGameLoop mockado já em 'victory' com o progresso de fundo no máximo (score 50), que é o cenário
// em que o último translateX da fase 3 vale -(bgWidth - SCREEN_WIDTH).
jest.mock('../../hooks/useGameLoop', () => ({
  useGameLoop: () => ({
    gameState: 'victory',
    score: 50,
    countdownValue: 3,
    birdY: { value: 400 },
    birdVelocity: { value: 0 },
    birdX: { value: 50 },
    obstacleX: { value: -130 },
    obstacleGapY: { value: 100 },
    scoreSV: { value: 50 },
    jump: jest.fn(),
    BIRD_SIZE: 110,
    BIRD_X: 50,
    OBSTACLE_WIDTH: 120,
    currentGapSize: { value: 450 },
    SCREEN_WIDTH: 400,
    SCREEN_HEIGHT: 800,
  }),
}));

import { GameScreenInner } from '../GameScreen';

// Limite de opacidade do scrim da vitória: acima disso a imagem deixa de ser a protagonista.
const MAX_VICTORY_SCRIM_ALPHA = 0.35;

const parseAlpha = (color: string) => {
  const match = color.match(/^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/);
  return match ? Number(match[1]) : 1;
};

describe('GameScreenInner - tela de vitória', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  test('exibe victory-image.png em tela cheia, sem deslocamento residual de translateX', async () => {
    const { getByTestId } = await render(<GameScreenInner />);

    const background = getByTestId('game-background');
    expect(background.props.source).toEqual(require('../../../assets/images/victory-image.png'));

    const style = StyleSheet.flatten(background.props.style);
    expect(style.left).toBe(0);
    expect(style.width).toBe(SCREEN_WIDTH);
    expect(style.height).toBe(SCREEN_HEIGHT);

    // O estilo animado não pode ser removido em victory: a Reanimated não reverte o último
    // translateX nativo ao desanexar o estilo (empurraria a imagem para fora da tela), então o
    // reset tem de ser explícito.
    const translateX = style.transform?.find((t: object) => 'translateX' in t)?.translateX;
    expect(translateX).toBe(0);
  });

  test('o overlay de vitória é um scrim leve que não oculta a imagem', async () => {
    const { getByTestId } = await render(<GameScreenInner />);

    const overlayStyle = StyleSheet.flatten(getByTestId('victory-overlay').props.style);

    expect(parseAlpha(overlayStyle.backgroundColor as string)).toBeLessThanOrEqual(MAX_VICTORY_SCRIM_ALPHA);
  });

  test('mantém os textos da vitória e libera o toque para sair somente após 5 segundos', async () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText, getByTestId } = await render(<GameScreenInner />);

      getByText('Lenda Carioca!');
      getByText('Você dominou a Lapa!');
      expect(queryByText('Toque na tela para sair')).toBeNull();

      await fireEvent.press(getByTestId('game-background'));
      expect(mockGoBack).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      getByText('Toque na tela para sair');

      await fireEvent.press(getByTestId('game-background'));
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
