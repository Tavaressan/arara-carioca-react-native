import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useHighScore } from '../useHighScore';

describe('useHighScore', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  test('persiste um novo recorde e o recupera após reload do hook', async () => {
    const { result, unmount } = await renderHook(() => useHighScore());

    await act(async () => {
      result.current.setScore(30);
    });

    expect(result.current.highScore).toBe(30);

    await unmount();

    const { result: reloaded } = await renderHook(() => useHighScore());

    await waitFor(() => {
      expect(reloaded.current.highScore).toBe(30);
    });
  });

  test('não sobrescreve um recorde salvo com uma pontuação menor', async () => {
    const { result, unmount } = await renderHook(() => useHighScore());

    await act(async () => {
      result.current.setScore(30);
    });

    await unmount();

    const { result: reloaded, unmount: unmountReloaded } = await renderHook(() => useHighScore());

    await waitFor(() => {
      expect(reloaded.current.highScore).toBe(30);
    });

    await act(async () => {
      reloaded.current.setScore(10);
    });

    expect(reloaded.current.highScore).toBe(30);

    await unmountReloaded();

    const { result: reloadedAgain } = await renderHook(() => useHighScore());

    await waitFor(() => {
      expect(reloadedAgain.current.highScore).toBe(30);
    });
  });
});
