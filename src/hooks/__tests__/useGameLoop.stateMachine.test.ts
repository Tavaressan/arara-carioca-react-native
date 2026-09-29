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

  test('ao entrar em victory o voo recomeça: progresso zerado e pássaro fora da tela, à esquerda', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    expect(result.current.victoryProgress.value).toBe(0);
    expect(result.current.birdX.value).toBe(-result.current.BIRD_SIZE);
  });

  test('em victory, o pássaro cruza a tela da esquerda para a direita uma única vez, acompanhando o progresso do fundo, e para fora da tela', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { birdX, birdY, victoryProgress, BIRD_SIZE } = result.current;

    const progresses: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    // Frames de 100 ms: bem mais que 60 fps, para percorrer o voo inteiro em poucas iterações.
    for (let frame = 0; frame < 300; frame++) {
      await advanceFrame(100);
      progresses.push(victoryProgress.value);
      xs.push(birdX.value);
      ys.push(birdY.value);
    }

    // O progresso só cresce e trava em 1 (sem reiniciar: é uma passada única)...
    for (let i = 1; i < progresses.length; i++) {
      expect(progresses[i]).toBeGreaterThanOrEqual(progresses[i - 1]);
    }
    expect(progresses[progresses.length - 1]).toBe(1);

    // ...e o X do pássaro acompanha o progresso: do lado esquerdo (fora da tela) ao direito.
    xs.forEach((x, i) => {
      expect(x).toBeCloseTo(-BIRD_SIZE + progresses[i] * (SCREEN_WIDTH + BIRD_SIZE), 5);
    });
    expect(xs[0]).toBeLessThan(SCREEN_WIDTH / 2);
    expect(xs[xs.length - 1]).toBe(SCREEN_WIDTH);

    // A flutuação senoidal em Y continua ativa durante o voo.
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(1);
  });

  test('em victory, o avanço do voo é proporcional ao tempo do frame (independe da taxa de quadros)', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { victoryProgress } = result.current;
    const startProgress = victoryProgress.value;
    await advanceFrame(REFERENCE_FRAME_MS);
    const singleFrameStep = victoryProgress.value - startProgress;

    const beforeDoubleFrame = victoryProgress.value;
    await advanceFrame(REFERENCE_FRAME_MS * 2);

    expect(singleFrameStep).toBeGreaterThan(0);
    expect(victoryProgress.value - beforeDoubleFrame).toBeCloseTo(singleFrameStep * 2, 8);
  });

  test('fora de victory o X do pássaro permanece em BIRD_X e o progresso do voo em 0', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));

    await act(async () => {
      result.current.jump();
    });
    await advanceFrame(REFERENCE_FRAME_MS);

    expect(result.current.gameState).toBe('playing');
    expect(result.current.birdX.value).toBe(result.current.BIRD_X);
    expect(result.current.victoryProgress.value).toBe(0);
  });
});
