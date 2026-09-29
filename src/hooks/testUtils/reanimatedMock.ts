import { useRef } from 'react';

// Tipo mínimo do frameInfo consumido pelo callback registrado via useFrameCallback.
export type FrameInfo = { timeSincePreviousFrame: number | null };
export type FrameCallback = (frameInfo: FrameInfo) => void;

/**
 * Mock mínimo e compartilhado de react-native-reanimated, usado pelos testes de useGameLoop
 * (react-native-reanimated exige inicialização nativa/worklets, indisponível no ambiente de teste).
 *
 * `useSharedValue` retorna o mesmo objeto entre re-renders via useRef — mesma semântica de ref
 * interna estável da lib real. Um objeto literal (`{ value: initial }`) seria recriado a cada
 * render, perdendo mutações feitas em frame callbacks anteriores (issue #23).
 *
 * `captureFrameCallback` é opcional: passe-o quando o teste precisar invocar manualmente o
 * callback registrado via useFrameCallback para simular o avanço de frames.
 */
export function createReanimatedMock(captureFrameCallback?: (cb: FrameCallback) => void) {
  return {
    useSharedValue: (initial: unknown) => useRef({ value: initial }).current,
    useFrameCallback: (cb: FrameCallback) => {
      captureFrameCallback?.(cb);
      return { setActive: jest.fn() };
    },
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  };
}

/**
 * Mock de react-native-reanimated para testes de componentes/telas que renderizam
 * Animated.View / Animated.Image. `useAnimatedStyle` e `useDerivedValue` executam o worklet uma
 * vez, de forma síncrona, para que o estilo resultante apareça na árvore renderizada.
 */
export function createReanimatedViewMock() {
  const { Image, View } = require('react-native');
  return {
    __esModule: true,
    default: { Image, View },
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    interpolate: () => 0,
    Extrapolate: { CLAMP: 'clamp' },
  };
}

/** Mock mínimo e compartilhado de expo-audio, usado pelos testes de useGameLoop. */
export function createExpoAudioMock() {
  return {
    createAudioPlayer: jest.fn(() => ({
      play: jest.fn(),
      seekTo: jest.fn(() => Promise.resolve()),
      remove: jest.fn(),
    })),
  };
}
