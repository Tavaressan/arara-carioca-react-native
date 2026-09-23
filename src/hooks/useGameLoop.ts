import { useState, useEffect } from 'react';
import { useSharedValue, useFrameCallback, runOnJS } from 'react-native-reanimated';
import { Platform, useWindowDimensions } from 'react-native';
import { Audio } from 'expo-av';
import { applyPhysicsStep, REFERENCE_FRAME_MS, JUMP_FORCE } from './physics';
import {
  PHASE_2_SCORE_THRESHOLD,
  PHASE_3_SCORE_THRESHOLD,
  VICTORY_SCORE_THRESHOLD,
} from '../constants/gamePhases';

const BIRD_SIZE = 110;
const BIRD_X = 50;
const OBSTACLE_WIDTH = 120;
const VICTORY_FLOAT_AMPLITUDE = 20;
const VICTORY_FLOAT_SPEED = 0.04;
const VICTORY_VELOCITY_EASE_FRAMES = 15;

export function useGameLoop(difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
  const { width: windowWidth, height: SCREEN_HEIGHT } = useWindowDimensions();
  const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;

  const getPhaseGaps = () => {
    switch (difficulty) {
      case 'easy': return { phase1: 650, phase2: 550, phase3: 450 };
      case 'hard': return { phase1: 380, phase2: 280, phase3: 180 };
      case 'normal':
      default: return { phase1: 550, phase2: 450, phase3: 350 };
    }
  };
  const gaps = getPhaseGaps();

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver' | 'victory' | 'countdown'>('idle');
  const [score, setScore] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);


  const [sounds, setSounds] = useState<any>({});

  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  const birdVelocity = useSharedValue(0);

  const obstacleX = useSharedValue(SCREEN_WIDTH);
  const currentGapSize = useSharedValue(gaps.phase1);
  const obstacleGapY = useSharedValue(SCREEN_HEIGHT / 2 - gaps.phase1 / 2);
  const scoreSV = useSharedValue(0);

  const victoryBaseline = useSharedValue(SCREEN_HEIGHT / 2);
  const victoryFrame = useSharedValue(0);
  const victoryEntryVelocity = useSharedValue(0);

  useEffect(() => {
    let loadedSounds: any = {};
    async function loadSounds() {
      try {
        const flap = await Audio.Sound.createAsync(require('../../assets/sounds/sfx/flap.mp3'));
        const point = await Audio.Sound.createAsync(require('../../assets/sounds/sfx/sfx_point.mp3'));
        const hit = await Audio.Sound.createAsync(require('../../assets/sounds/sfx/hit-sound.mp3'));

        loadedSounds = { flap: flap.sound, point: point.sound, hit: hit.sound };
        setSounds(loadedSounds);
      } catch (e) {
        console.warn('Could not load some sounds', e);
      }
    }
    loadSounds();

    return () => {
      Object.values(loadedSounds).forEach((s: any) => s.unloadAsync());
    };
  }, []);

  const playSound = (name: string) => {
    if (sounds[name]) {
      sounds[name].replayAsync();
    }
  };

  const handleGameOver = () => {
    setGameState('gameOver');
    playSound('hit');
  };

  const updateScoreAndCheckPhase = () => {
    setScore((s) => {
      playSound('point');
      const newScore = s + 1;
      if (newScore === VICTORY_SCORE_THRESHOLD) {
        setGameState('victory');
      } else if (newScore === PHASE_2_SCORE_THRESHOLD || newScore === PHASE_3_SCORE_THRESHOLD) {
        setGameState('countdown');
        setCountdownValue(3);
      }
      return newScore;
    });
  };

  useEffect(() => {
    if (gameState === 'countdown') {
      birdY.value = SCREEN_HEIGHT / 2;
      birdVelocity.value = 0;
      obstacleX.value = SCREEN_WIDTH;

      const interval = setInterval(() => {
        setCountdownValue((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState('playing');
            birdVelocity.value = JUMP_FORCE;
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, birdY, birdVelocity, obstacleX]);

  useEffect(() => {
    if (gameState === 'victory') {
      // Parte da posição e da velocidade atuais do pássaro para não gerar salto visual
      // (nem de posição, nem de inclinação) ao entrar na vitória.
      victoryBaseline.value = birdY.value;
      victoryEntryVelocity.value = birdVelocity.value;
      victoryFrame.value = 0;
    }
  }, [gameState, birdY, birdVelocity, victoryBaseline, victoryEntryVelocity, victoryFrame]);

  useFrameCallback((frameInfo) => {
    if (gameState === 'victory') {
      // Flutuação senoidal em vez de física de gravidade/pulo; velocidade é a derivada
      // do seno, mantida na mesma unidade "px por frame" da física de jogo, para que a
      // inclinação do pássaro em Bird.tsx continue coerente. A velocidade parte da que
      // o pássaro tinha ao entrar na vitória e converge para a da flutuação em alguns
      // frames, evitando uma mudança brusca de inclinação.
      victoryFrame.value += 1;
      const angle = victoryFrame.value * VICTORY_FLOAT_SPEED;
      birdY.value = victoryBaseline.value + Math.sin(angle) * VICTORY_FLOAT_AMPLITUDE;
      const floatVelocity = Math.cos(angle) * VICTORY_FLOAT_AMPLITUDE * VICTORY_FLOAT_SPEED;
      const ease = Math.min(victoryFrame.value / VICTORY_VELOCITY_EASE_FRAMES, 1);
      birdVelocity.value = victoryEntryVelocity.value + (floatVelocity - victoryEntryVelocity.value) * ease;
      return;
    }

    if (gameState !== 'playing') return;

    const deltaMs = frameInfo.timeSincePreviousFrame ?? REFERENCE_FRAME_MS;
    const nextPhysics = applyPhysicsStep(
      { birdVelocity: birdVelocity.value, birdY: birdY.value, obstacleX: obstacleX.value },
      deltaMs
    );
    birdVelocity.value = nextPhysics.birdVelocity;
    birdY.value = nextPhysics.birdY;
    obstacleX.value = nextPhysics.obstacleX;

    if (obstacleX.value < -OBSTACLE_WIDTH) {
      obstacleX.value = SCREEN_WIDTH;
      const scoreNext = scoreSV.value + 1;
      const nextGap = scoreNext < PHASE_2_SCORE_THRESHOLD ? gaps.phase1 :
                      scoreNext < PHASE_3_SCORE_THRESHOLD ? gaps.phase2 : gaps.phase3;
      currentGapSize.value = nextGap;
      obstacleGapY.value = Math.random() * (SCREEN_HEIGHT - nextGap - 200) + 100;
      scoreSV.value += 1;
      runOnJS(updateScoreAndCheckPhase)();
    }

    const isHittingGround = birdY.value > SCREEN_HEIGHT - BIRD_SIZE;
    const isHittingCeiling = birdY.value < 0;

    let isHittingObstacle = false;
    if (scoreSV.value < VICTORY_SCORE_THRESHOLD) {
      const isWithinObstacleX =
        BIRD_X + BIRD_SIZE > obstacleX.value &&
        BIRD_X < obstacleX.value + OBSTACLE_WIDTH;

      const isHittingTopObstacle = birdY.value < obstacleGapY.value;
      const isHittingBottomObstacle = birdY.value + BIRD_SIZE > obstacleGapY.value + currentGapSize.value;

      if (isWithinObstacleX && (isHittingTopObstacle || isHittingBottomObstacle)) {
        isHittingObstacle = true;
      }
    }

    if (isHittingGround || isHittingCeiling || isHittingObstacle) {
      runOnJS(handleGameOver)();
    }
  });

  const jump = () => {
    if (gameState === 'countdown') return;

    if (gameState === 'playing') {
      birdVelocity.value = JUMP_FORCE;
      playSound('flap');
    } else if (gameState === 'idle') {
      setGameState('playing');
      birdVelocity.value = JUMP_FORCE;
      playSound('flap');
    } else if (gameState === 'gameOver' || gameState === 'victory') {
      if (gameState === 'victory') {
        return;
      }
      birdY.value = SCREEN_HEIGHT / 2;
      birdVelocity.value = 0;
      obstacleX.value = SCREEN_WIDTH;
      scoreSV.value = 0;
      currentGapSize.value = gaps.phase1;
      obstacleGapY.value = SCREEN_HEIGHT / 2 - gaps.phase1 / 2;
      setScore(0);
      setGameState('idle');
    }
  };

  return {
    gameState,
    score,
    countdownValue,
    birdY,
    birdVelocity,
    obstacleX,
    obstacleGapY,
    scoreSV,
    jump,
    BIRD_SIZE,
    BIRD_X,
    OBSTACLE_WIDTH,
    currentGapSize,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
  };
}

