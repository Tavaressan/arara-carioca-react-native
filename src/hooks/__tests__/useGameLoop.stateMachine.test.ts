import { act, renderHook } from '@testing-library/react-native';
import { REFERENCE_FRAME_MS } from '../physics';
import { PHASE_2_SCORE_THRESHOLD, PHASE_3_SCORE_THRESHOLD, VICTORY_SCORE_THRESHOLD } from '../../constants/gamePhases';
import type { FrameCallback } from '../testUtils/reanimatedMock';
import { getVictoryFrame, VICTORY_TOTAL_MS } from '../victoryTimeline';

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

describe('useGameLoop - atalho de desenvolvimento para a vitória', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, scale: 1, fontScale: 1 });
    capturedFrameCallback = null;
  });

  test('com startInVictory o hook já nasce em victory, com score de vitória, pássaro fora da tela à esquerda e sem máscara', async () => {
    const { result } = await renderHook(() => useGameLoop('normal', { startInVictory: true }));

    const { gameState, score, scoreSV, birdX, victoryScroll, victoryOverlayOpacity, BIRD_SIZE } = result.current;
    expect(gameState).toBe('victory');
    expect(score).toBe(VICTORY_SCORE_THRESHOLD);
    expect(scoreSV.value).toBe(VICTORY_SCORE_THRESHOLD);
    expect(birdX.value).toBe(getVictoryFrame(0, SCREEN_WIDTH, BIRD_SIZE).birdX);
    expect(victoryScroll.value).toBe(0);
    expect(victoryOverlayOpacity.value).toBe(0);
  });

  test('com startInVictory a linha do tempo da vitória anda a partir do primeiro frame', async () => {
    const { result } = await renderHook(() => useGameLoop('normal', { startInVictory: true }));

    await act(async () => {
      capturedFrameCallback!({ timeSincePreviousFrame: 1000 });
    });

    expect(result.current.victoryScroll.value).toBeGreaterThan(0);
  });

  test('sem a opção o hook segue nascendo em idle, com score 0', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));

    expect(result.current.gameState).toBe('idle');
    expect(result.current.score).toBe(0);
    expect(result.current.scoreSV.value).toBe(0);
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

  test('ao entrar em victory a linha do tempo recomeça: pássaro fora da tela à esquerda, fundo na borda esquerda e sem máscara', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { birdX, victoryScroll, victoryOverlayOpacity, BIRD_SIZE } = result.current;
    const start = getVictoryFrame(0, SCREEN_WIDTH, BIRD_SIZE);
    expect(birdX.value).toBe(start.birdX);
    expect(victoryScroll.value).toBe(0);
    expect(victoryOverlayOpacity.value).toBe(0);
  });

  test('em victory, cada frame avança a linha do tempo pelo deltaMs e posiciona pássaro, fundo e máscara, até parar no fim', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { birdX, birdY, victoryScroll, victoryOverlayOpacity, BIRD_SIZE } = result.current;

    const ys: number[] = [];
    let elapsed = 0;
    // Frames de 1 s: bem mais que 60 fps, para percorrer a linha do tempo inteira em poucas iterações.
    while (elapsed < VICTORY_TOTAL_MS + 2000) {
      await advanceFrame(1000);
      elapsed += 1000;
      const expected = getVictoryFrame(elapsed, SCREEN_WIDTH, BIRD_SIZE);
      expect(birdX.value).toBeCloseTo(expected.birdX, 9);
      expect(victoryScroll.value).toBeCloseTo(expected.scroll, 9);
      expect(victoryOverlayOpacity.value).toBeCloseTo(expected.overlayOpacity, 9);
      ys.push(birdY.value);
    }

    // A flutuação senoidal em Y continua ativa durante o voo.
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(1);
  });

  test('em victory, o avanço é proporcional ao tempo do frame (independe da taxa de quadros)', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));
    await enterVictory(result);
    expect(result.current.gameState).toBe('victory');

    const { victoryScroll } = result.current;
    await advanceFrame(REFERENCE_FRAME_MS);
    const singleFrameStep = victoryScroll.value;

    const beforeDoubleFrame = victoryScroll.value;
    await advanceFrame(REFERENCE_FRAME_MS * 2);

    expect(singleFrameStep).toBeGreaterThan(0);
    expect(victoryScroll.value - beforeDoubleFrame).toBeCloseTo(singleFrameStep * 2, 8);
  });

  test('fora de victory o pássaro permanece em BIRD_X, o fundo em 0 e a máscara em 0', async () => {
    const { result } = await renderHook(() => useGameLoop('normal'));

    await act(async () => {
      result.current.jump();
    });
    await advanceFrame(REFERENCE_FRAME_MS);

    expect(result.current.gameState).toBe('playing');
    expect(result.current.birdX.value).toBe(result.current.BIRD_X);
    expect(result.current.victoryScroll.value).toBe(0);
    expect(result.current.victoryOverlayOpacity.value).toBe(0);
  });
});
