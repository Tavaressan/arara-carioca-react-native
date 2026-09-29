import { renderHook } from '@testing-library/react-native';

// react-native-reanimated exige inicialização nativa (worklets), indisponível no ambiente
// de teste. Mock mínimo suficiente para renderizar useGameLoop fora do estado 'playing'
// (o callback de useFrameCallback não é capturado, pois este teste não avança frames).
jest.mock('react-native-reanimated', () =>
  require('../testUtils/reanimatedMock').createReanimatedMock()
);

jest.mock('expo-audio', () => require('../testUtils/reanimatedMock').createExpoAudioMock());

import { useGameLoop } from '../useGameLoop';

// Usar require (não `import * as`) preserva a mesma referência de módulo usada
// internamente por useGameLoop.ts — necessário para o spy interceptar a chamada real.
const RN = require('react-native');
const mockUseWindowDimensions = jest.spyOn(RN, 'useWindowDimensions');

describe('useGameLoop - dimensões reativas', () => {
  test('reflete novas SCREEN_WIDTH/SCREEN_HEIGHT quando useWindowDimensions muda entre renders', async () => {
    mockUseWindowDimensions.mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
    const { result, rerender } = await renderHook(() => useGameLoop());

    expect(result.current.SCREEN_WIDTH).toBe(400);
    expect(result.current.SCREEN_HEIGHT).toBe(800);

    mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 });
    await rerender(undefined);

    // SCREEN_WIDTH acompanha diretamente a largura da janela de forma responsiva sem clamp fixo de 800px
    expect(result.current.SCREEN_WIDTH).toBe(1024);
    expect(result.current.SCREEN_HEIGHT).toBe(768);
  });

  test('adapta dinamicamente em resoluções widescreen (ex: 1920x1080) sem restrição fixa de 800px', async () => {
    mockUseWindowDimensions.mockReturnValue({ width: 1920, height: 1080, scale: 1, fontScale: 1 });
    const { result } = await renderHook(() => useGameLoop());

    expect(result.current.SCREEN_WIDTH).toBe(1920);
    expect(result.current.SCREEN_HEIGHT).toBe(1080);
  });

  test('suporta orientação landscape mobile (ex: 844x390)', async () => {
    mockUseWindowDimensions.mockReturnValue({ width: 844, height: 390, scale: 1, fontScale: 1 });
    const { result } = await renderHook(() => useGameLoop());

    expect(result.current.SCREEN_WIDTH).toBe(844);
    expect(result.current.SCREEN_HEIGHT).toBe(390);
  });
});
