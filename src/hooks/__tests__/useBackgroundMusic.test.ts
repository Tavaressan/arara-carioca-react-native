import { renderHook } from '@testing-library/react-native';
import { useBackgroundMusic } from '../useBackgroundMusic';

const mockCalls: string[] = [];

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn((source: unknown) => {
    mockCalls.push(`create:${source}`);
    return {
      loop: false,
      playing: false,
      isLoaded: true,
      currentTime: 0,
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => {
        mockCalls.push(`remove:${source}`);
      }),
    };
  }),
}));

describe('useBackgroundMusic', () => {
  beforeEach(() => {
    mockCalls.length = 0;
  });

  test('carrega e toca a trilha ao focar a tela', async () => {
    const { result } = await renderHook(() => useBackgroundMusic('track-a'));
    // aguarda o microtask do seekTo() mockado antes do play()
    await Promise.resolve();

    expect(mockCalls).toEqual(['create:track-a']);
    expect(result.current.current?.play).toHaveBeenCalled();
  });

  test('descarrega a trilha anterior antes de carregar a nova ao trocar trackSource', async () => {
    const { rerender } = await renderHook(
      ({ track }: { track: string }) => useBackgroundMusic(track),
      { initialProps: { track: 'track-a' } }
    );

    await rerender({ track: 'track-b' });

    expect(mockCalls).toEqual(['create:track-a', 'remove:track-a', 'create:track-b']);
  });

  test('descarrega a trilha no unmount', async () => {
    const { unmount } = await renderHook(() => useBackgroundMusic('track-a'));

    await unmount();

    expect(mockCalls).toEqual(['create:track-a', 'remove:track-a']);
  });

  test('não cria player quando trackSource é null', async () => {
    const { result } = await renderHook(() => useBackgroundMusic(null));

    expect(mockCalls).toEqual([]);
    expect(result.current.current).toBeNull();
  });
});
