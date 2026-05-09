import { useState, useEffect } from 'react';
import { useSharedValue, useFrameCallback, runOnJS } from 'react-native-reanimated';
import { Dimensions, Platform } from 'react-native';
import { Audio } from 'expo-av';

const { width: windowWidth, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(windowWidth, 800) : windowWidth;

const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const OBSTACLE_SPEED = 4;
const BIRD_SIZE = 110;
const BIRD_X = 50;
const OBSTACLE_WIDTH = 120;

export function useGameLoop(difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
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
      if (newScore === 50) {
        setGameState('victory');
      } else if (newScore === 16 || newScore === 31) {
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

  useFrameCallback((frameInfo) => {
    if (gameState !== 'playing') return;

    birdVelocity.value += GRAVITY;
    birdY.value += birdVelocity.value;

    obstacleX.value -= OBSTACLE_SPEED;

    if (obstacleX.value < -OBSTACLE_WIDTH) {
      obstacleX.value = SCREEN_WIDTH;
      const scoreNext = scoreSV.value + 1;
      const nextGap = scoreNext < 16 ? gaps.phase1 :
                      scoreNext < 31 ? gaps.phase2 : gaps.phase3;
      currentGapSize.value = nextGap;
      obstacleGapY.value = Math.random() * (SCREEN_HEIGHT - nextGap - 200) + 100;
      scoreSV.value += 1;
      runOnJS(updateScoreAndCheckPhase)();
    }

    const isHittingGround = birdY.value > SCREEN_HEIGHT - BIRD_SIZE;
    const isHittingCeiling = birdY.value < 0;

    let isHittingObstacle = false;
    if (scoreSV.value < 50) {
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

