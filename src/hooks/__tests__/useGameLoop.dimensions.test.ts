import { renderHook } from '@testing-library/react-native';

// react-native-reanimated exige inicialização nativa (worklets), indisponível no ambiente
// de teste. Mock mínimo suficiente para renderizar useGameLoop fora do estado 'playing'.
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => ({ value: initial }),
  useFrameCallback: () => undefined,
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: { unloadAsync: jest.fn() } }),
    },
  },
}));

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

    // Fora da plataforma web não há clamp: SCREEN_WIDTH acompanha diretamente a largura da janela.
    expect(result.current.SCREEN_WIDTH).toBe(1024);
    expect(result.current.SCREEN_HEIGHT).toBe(768);
  });
});
