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

// Posição do fundo (0 = borda esquerda da imagem, 1 = borda direita) e opacidade da máscara com o
// título que o mock de useGameLoop devolve; cada teste ajusta a sua.
let mockVictoryScroll = 0;
let mockVictoryOverlayOpacity = 1;

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
    victoryScroll: { value: mockVictoryScroll },
    victoryOverlayOpacity: { value: mockVictoryOverlayOpacity },
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
import { VICTORY_EXIT_ENABLED_MS } from '../../hooks/victoryTimeline';

// Limite de opacidade do scrim da vitória: acima disso a imagem deixa de ser a protagonista.
const MAX_VICTORY_SCRIM_ALPHA = 0.35;

const parseAlpha = (color: string) => {
  const match = color.match(/^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/);
  return match ? Number(match[1]) : 1;
};

describe('GameScreenInner - tela de vitória', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockVictoryScroll = 0;
    mockVictoryOverlayOpacity = 1;
  });

  // O estilo animado não pode ser removido em victory: a Reanimated não reverte o último
  // translateX nativo ao desanexar o estilo (empurraria a imagem para fora da tela), então o
  // deslocamento tem de vir sempre do estilo animado.
  const renderBackgroundStyle = async () => {
    const { getByTestId } = await render(<GameScreenInner />);
    const background = getByTestId('game-background');
    const style = StyleSheet.flatten(background.props.style);
    const translateX: number = style.transform?.find((t: object) => 'translateX' in t)?.translateX;
    return { background, style, translateX };
  };

  test('usa victory-image.png como panorama mais largo que a tela, para poder rolar atrás do pássaro', async () => {
    const { background, style } = await renderBackgroundStyle();

    expect(background.props.source).toEqual(require('../../../assets/images/victory-image.png'));
    expect(style.left).toBe(0);
    expect(style.height).toBe(SCREEN_HEIGHT);
    expect(style.width).toBeGreaterThan(SCREEN_WIDTH);
  });

  test.each([
    ['no início do voo, mostra a borda esquerda da imagem', 0],
    ['no fim do voo, mostra a borda direita da imagem', 1],
    ['no meio do voo, o fundo já rolou metade do caminho', 0.5],
  ])('%s', async (_descricao, progress) => {
    mockVictoryScroll = progress;
    const { style, translateX } = await renderBackgroundStyle();

    const scrollableWidth = (style.width as number) - SCREEN_WIDTH;
    expect(scrollableWidth).toBeGreaterThan(0);
    expect(translateX).toBeCloseTo(-progress * scrollableWidth, 5);
  });

  test('o overlay de vitória é um scrim leve que não oculta a imagem', async () => {
    const { getByTestId } = await render(<GameScreenInner />);

    const overlayStyle = StyleSheet.flatten(getByTestId('victory-overlay').props.style);

    expect(parseAlpha(overlayStyle.backgroundColor as string)).toBeLessThanOrEqual(MAX_VICTORY_SCRIM_ALPHA);
  });

  test.each([
    ['durante o voo, a máscara e o título ficam invisíveis', 0],
    ['depois que o pássaro saiu, a máscara e o título ficam visíveis', 1],
  ])('%s', async (_descricao, opacity) => {
    mockVictoryOverlayOpacity = opacity;
    const { getByTestId } = await render(<GameScreenInner />);

    const overlayStyle = StyleSheet.flatten(getByTestId('victory-overlay').props.style);

    expect(overlayStyle.opacity).toBe(opacity);
  });

  test('mantém os textos da vitória e só libera o toque para sair quando a máscara aparece', async () => {
    jest.useFakeTimers();
    try {
      const { getByText, queryByText, getByTestId } = await render(<GameScreenInner />);

      getByText('Lenda Carioca!');
      getByText('Você dominou a Lapa!');
      expect(queryByText('Toque na tela para sair')).toBeNull();

      await fireEvent.press(getByTestId('game-background'));
      expect(mockGoBack).not.toHaveBeenCalled();

      // Um pouco antes de a máscara aparecer, ainda não dá para sair (nem há o aviso na tela).
      await act(async () => {
        jest.advanceTimersByTime(VICTORY_EXIT_ENABLED_MS - 1);
      });
      expect(queryByText('Toque na tela para sair')).toBeNull();
      await fireEvent.press(getByTestId('game-background'));
      expect(mockGoBack).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      getByText('Toque na tela para sair');

      await fireEvent.press(getByTestId('game-background'));
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
