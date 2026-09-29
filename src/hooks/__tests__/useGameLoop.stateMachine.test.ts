import { act, renderHook } from '@testing-library/react-native';
import { REFERENCE_FRAME_MS } from '../physics';
import { PHASE_2_SCORE_THRESHOLD, PHASE_3_SCORE_THRESHOLD, VICTORY_SCORE_THRESHOLD } from '../../constants/gamePhases';
import type { FrameCallback } from '../testUtils/reanimatedMock';

// Diferente do mock de useGameLoop.dimensions.test.ts (que descarta o callback de frame, pois só
// cobre estados fora de 'playing'), aqui capturamos o callback passado a useFrameCallback numa
// variável de escopo do módulo, para poder invocá-lo manualmente a partir dos testes e simular o
// avanço de frames.
let capturedFrameCallback: FrameCallback | null = null;

jest.mock('react-native-reanimated', () => {
  const { createReanimatedMock } = require('../testUtils/reanimatedMock');
  return createReanimatedMock((cb: FrameCallback) => {
    capturedFrameCallback = cb;
  });
});

jest.mock('expo-audio', () => require('../testUtils/reanimatedMock').createExpoAudioMock());

import { useGameLoop } from '../useGameLoop';

const RN = require('react-native');
const mockUseWindowDimensions = jest.spyOn(RN, 'useWindowDimensions');

const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 800;

describe('useGameLoop - máquina de estados', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, scale: 1, fontScale: 1 });
    capturedFrameCallback = null;
  });

  test('transita de idle para playing ao chamar jump()', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));

    expect(result.current.gameState).toBe('idle');

    await act(async () => {
      result.current.jump();
    });

    expect(result.current.gameState).toBe('playing');
  });

  test('transita de playing para gameOver ao colidir com o chão', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));

    await act(async () => {
      result.current.jump();
    });
    expect(result.current.gameState).toBe('playing');

    await act(async () => {
      // Posiciona o pássaro muito abaixo do limite do chão; o próprio passo de física
      // (gravidade) mantém a posição acima do limiar mesmo após o incremento do frame.
      result.current.birdY.value = SCREEN_HEIGHT + 1000;
      capturedFrameCallback!({ timeSincePreviousFrame: REFERENCE_FRAME_MS });
    });

    expect(result.current.gameState).toBe('gameOver');
  });

  test('avança score via passagem de obstáculos, alternando playing -> countdown -> playing nos scores 16 e 31, até victory em 50', async () => {
    jest.useFakeTimers();
    try {
      const { result } = await renderHook(() => useGameLoop('normal'));

      await act(async () => {
        result.current.jump();
      });
      expect(result.current.gameState).toBe('playing');

      const OBSTACLE_WIDTH = result.current.OBSTACLE_WIDTH;

      // Simula a passagem de um obstáculo: posiciona o pássaro em zona segura (sem colidir
      // com chão/teto/obstáculo) e o obstáculo além do limite que dispara o incremento de
      // score dentro do useFrameCallback.
      const passOneObstacle = async () => {
        await act(async () => {
          result.current.birdY.value = SCREEN_HEIGHT / 2;
          result.current.birdVelocity.value = 0;
          result.current.obstacleX.value = -(OBSTACLE_WIDTH + 10);
          capturedFrameCallback!({ timeSincePreviousFrame: REFERENCE_FRAME_MS });
        });
      };

      const advanceThroughCountdown = async () => {
        await act(async () => {
          jest.advanceTimersByTime(3000);
        });
      };

      // Gaps de obstáculo por fase para a dificuldade 'normal' (ver getPhaseGaps em useGameLoop.ts).
      const GAP_PHASE_1 = 550;
      const GAP_PHASE_2 = 450;
      const GAP_PHASE_3 = 350;
      const expectedGapForScore = (nextScore: number) =>
        nextScore < PHASE_2_SCORE_THRESHOLD ? GAP_PHASE_1 :
        nextScore < PHASE_3_SCORE_THRESHOLD ? GAP_PHASE_2 : GAP_PHASE_3;

      for (let target = 1; target <= VICTORY_SCORE_THRESHOLD; target++) {
        await passOneObstacle();

        // scoreSV precisa acumular de verdade entre frames (não resetar a cada render) para que
        // o gap do próximo obstáculo seja escolhido pela fase correta.
        expect(result.current.currentGapSize.value).toBe(expectedGapForScore(target));

        if (target === PHASE_2_SCORE_THRESHOLD || target === PHASE_3_SCORE_THRESHOLD) {
          expect(result.current.gameState).toBe('countdown');
          expect(result.current.score).toBe(target);

          await advanceThroughCountdown();
          expect(result.current.gameState).toBe('playing');
        } else if (target === VICTORY_SCORE_THRESHOLD) {
          expect(result.current.gameState).toBe('victory');
        } else {
          expect(result.current.gameState).toBe('playing');
        }
      }

      expect(result.current.score).toBe(VICTORY_SCORE_THRESHOLD);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('useGameLoop - voo do pássaro na vitória', () => {
  type HookResult = { current: ReturnType<typeof useGameLoop> };

  // Leva o hook até 'victory' passando obstáculo por obstáculo (com fake timers ativos,
  // para atravessar os countdowns dos scores 16 e 31).
  const enterVictory = async (result: HookResult) => {
    await act(async () => {
      result.current.jump();
    });

    for (let target = 1; target <= VICTORY_SCORE_THRESHOLD; target++) {
      await act(async () => {
        result.current.birdY.value = SCREEN_HEIGHT / 2;
        result.current.birdVelocity.value = 0;
        result.current.obstacleX.value = -(result.current.OBSTACLE_WIDTH + 10);
        capturedFrameCallback!({ timeSincePreviousFrame: REFERENCE_FRAME_MS });
      });

      if (target === PHASE_2_SCORE_THRESHOLD || target === PHASE_3_SCORE_THRESHOLD) {
        await act(async () => {
          jest.advanceTimersByTime(3000);
        });
      }
    }
  };

  const advanceFrame = async (deltaMs: number) => {
    await act(async () => {
      capturedFrameCallback!({ timeSincePreviousFrame: deltaMs });
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockUseWindowDimensions.mockReturnValue({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, scale: 1, fontScale: 1 });
    capturedFrameCallback = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('em victory, o X do pássaro avança, cruza a largura da tela e reinicia à esquerda em loop, mantendo a flutuação em Y', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { birdX, birdY, BIRD_X, BIRD_SIZE } = result.current;
    expect(birdX.value).toBe(BIRD_X);

    const xs: number[] = [birdX.value];
    const ys: number[] = [birdY.value];
    for (let frame = 0; frame < 300; frame++) {
      await advanceFrame(REFERENCE_FRAME_MS);
      xs.push(birdX.value);
      ys.push(birdY.value);
    }

    // O X sobe frame a frame até o pássaro passar da borda direita...
    const wrapIndex = xs.findIndex((x, i) => i > 0 && x < xs[i - 1]);
    expect(wrapIndex).toBeGreaterThan(1);
    for (let i = 1; i < wrapIndex; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
    expect(xs[wrapIndex - 1]).toBeGreaterThan(SCREEN_WIDTH);

    // ...reaparece imediatamente à esquerda (todo o pássaro fora da tela) e volta a avançar.
    expect(xs[wrapIndex]).toBe(-BIRD_SIZE);
    expect(xs[wrapIndex + 1]).toBeGreaterThan(xs[wrapIndex]);

    // A flutuação senoidal em Y continua ativa durante o voo.
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(1);
  });

  test('em victory, o deslocamento horizontal é proporcional ao tempo do frame (independe da taxa de quadros)', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { birdX } = result.current;
    const startX = birdX.value;
    await advanceFrame(REFERENCE_FRAME_MS);
    const singleFrameStep = birdX.value - startX;

    const beforeDoubleFrame = birdX.value;
    await advanceFrame(REFERENCE_FRAME_MS * 2);

    expect(singleFrameStep).toBeGreaterThan(0);
    expect(birdX.value - beforeDoubleFrame).toBeCloseTo(singleFrameStep * 2, 5);
  });

  test('fora de victory o X do pássaro permanece em BIRD_X', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));

    await act(async () => {
      result.current.jump();
    });
    await advanceFrame(REFERENCE_FRAME_MS);

    expect(result.current.gameState).toBe('playing');
    expect(result.current.birdX.value).toBe(result.current.BIRD_X);
  });
});
