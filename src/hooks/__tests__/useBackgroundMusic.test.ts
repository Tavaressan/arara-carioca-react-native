import { renderHook } from '@testing-library/react-native';
import { useBackgroundMusic } from '../useBackgroundMusic';

const mockCalls: string[] = [];

// Modela o useFocusEffect real do @react-navigation/native: o efeito React
// (keyed em [callback]) roda a cada montagem/troca de dependência (mesmo
// mecanismo que "descarrega a trilha anterior antes de carregar a nova" usa),
// enquanto __simulateBlur/__simulateFocus disparam o MESMO callback
// diretamente, reproduzindo os listeners 'blur'/'focus' que o React
// Navigation aciona sem re-render nem troca de dependência.
jest.mock('@react-navigation/native', () => {
  let currentCallback: (() => void | (() => void)) | null = null;
  let currentCleanup: void | (() => void);

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      const React = require('react');
      React.useEffect(() => {
        currentCallback = callback;
        currentCleanup = callback();
        return () => {
          if (currentCleanup) {
            currentCleanup();
            currentCleanup = undefined;
          }
        };
      }, [callback]);
    },
    __simulateBlur: () => {
      if (currentCleanup) {
        currentCleanup();
        currentCleanup = undefined;
      }
    },
    __simulateFocus: () => {
      if (currentCallback) {
        currentCleanup = currentCallback();
      }
    },
  };
});

const {
  __simulateBlur: simulateBlur,
  __simulateFocus: simulateFocus,
} = jest.requireMock('@react-navigation/native') as {
  __simulateBlur: () => void;
  __simulateFocus: () => void;
};

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

  test('descarrega a trilha quando trackSource muda para null', async () => {
    const { rerender } = await renderHook(
      ({ track }: { track: string | null }) => useBackgroundMusic(track),
      { initialProps: { track: 'track-a' as string | null } }
    );

    await rerender({ track: null });

    expect(mockCalls).toEqual(['create:track-a', 'remove:track-a']);
  });

  test('reaproveita a mesma instância do player quando trackSource não muda entre focos (focus → blur → focus)', async () => {
    const { result } = await renderHook(() => useBackgroundMusic('track-a'));
    await Promise.resolve();

    const player = result.current.current;

    simulateBlur();
    simulateFocus();
    await Promise.resolve();

    expect(mockCalls).toEqual(['create:track-a']);
    expect(player?.remove).not.toHaveBeenCalled();
    expect(player?.pause).toHaveBeenCalledTimes(1);
    expect(player?.play).toHaveBeenCalledTimes(2);
    expect(result.current.current).toBe(player);
  });
});
