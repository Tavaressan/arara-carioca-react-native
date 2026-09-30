import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../hooks/useBackgroundMusic', () => ({
  useBackgroundMusic: () => ({ current: null }),
}));

import WelcomeScreen from '../WelcomeScreen';

const SHORTCUT_LABEL = '[DEV] Ver tela de vitória';

// __DEV__ é uma constante global do React Native; nos testes ela vale true, e aqui a trocamos para
// simular um build de produção.
const setDev = (value: boolean) => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = value;
};

describe('WelcomeScreen - atalho de desenvolvimento para a vitória', () => {
  const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    setDev(originalDev as boolean);
  });

  test('em desenvolvimento, o atalho leva ao jogo já na vitória, com a dificuldade escolhida', async () => {
    setDev(true);
    const { getByText } = await render(<WelcomeScreen />);

    await fireEvent.press(getByText('Fácil'));
    await fireEvent.press(getByText(SHORTCUT_LABEL));

    expect(mockNavigate).toHaveBeenCalledWith('Game', { difficulty: 'easy', startInVictory: true });
  });

  test('fora de desenvolvimento (build de produção), o atalho não existe na tela', async () => {
    setDev(false);
    const { queryByText } = await render(<WelcomeScreen />);

    expect(queryByText(SHORTCUT_LABEL)).toBeNull();
  });

  test('o botão Jogar continua iniciando o jogo normal, sem startInVictory', async () => {
    setDev(true);
    const { getByText } = await render(<WelcomeScreen />);

    await fireEvent.press(getByText('Jogar'));

    expect(mockNavigate).toHaveBeenCalledWith('Game', { difficulty: 'normal' });
  });
});
