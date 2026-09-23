import React from 'react';
import { render } from '@testing-library/react-native';

import Score, { getTitle } from '../Score';

describe('<Score />', () => {
  test('exibe o valor numérico do score', async () => {
    const { getByText } = await render(<Score score={10} />);

    getByText('10');
  });

  test('exibe o título correspondente à faixa de score', async () => {
    const { getByText } = await render(<Score score={20} />);

    getByText('Sambista de Esquina');
  });
});

describe('getTitle - alinhamento com as fases de dificuldade de useGameLoop', () => {
  test('getTitle(16) retorna o título do início da fase 2 (mesmo limiar que dispara o countdown de fase)', () => {
    expect(getTitle(16)).toBe('Sambista de Esquina');
  });

  test('getTitle(31) retorna o título do início da fase 3 (mesmo limiar que dispara o countdown de fase)', () => {
    expect(getTitle(31)).toBe('Boêmio da Lapa');
  });

  test('getTitle(50) retorna o título de vitória (mesmo limiar de useGameLoop para victory)', () => {
    expect(getTitle(50)).toBe('Lenda Carioca');
  });

  test('getTitle(15) ainda retorna o título da fase 1, um score abaixo do limiar', () => {
    expect(getTitle(15)).toBe('Turista Perdido');
  });
});

describe('getTitle - subfaixa "Rei dos Arcos" (só HUD, sem fase de dificuldade correspondente)', () => {
  test('getTitle(45) retorna "Rei dos Arcos"', () => {
    expect(getTitle(45)).toBe('Rei dos Arcos');
  });

  test('getTitle(44) ainda retorna "Boêmio da Lapa", um score abaixo do limiar de "Rei dos Arcos"', () => {
    expect(getTitle(44)).toBe('Boêmio da Lapa');
  });

  test('getTitle(49) ainda retorna "Rei dos Arcos", um score abaixo da vitória', () => {
    expect(getTitle(49)).toBe('Rei dos Arcos');
  });
});
