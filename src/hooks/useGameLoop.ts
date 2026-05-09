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
const GAP_SIZE = 500;

export function useGameLoop() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver' | 'victory' | 'countdown'>('idle');
  const [score, setScore] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);


  const [sounds, setSounds] = useState<any>({});

  const birdY = useSharedValue(SCREEN_HEIGHT / 2);
  const birdVelocity = useSharedValue(0);
  
  const obstacleX = useSharedValue(SCREEN_WIDTH);
  const obstacleGapY = useSharedValue(SCREEN_HEIGHT / 2 - GAP_SIZE / 2);
  const scoreSV = useSharedValue(0);

  useEffect(() => {
    async function loadSounds() {
      try {
        const flap = await Audio.Sound.createAsync(require('../../assets/sounds/sfx/flap.mp3'));
        const point = await Audio.Sound.createAsync(require('../../assets/sounds/sfx/sfx_point.mp3'));
        const hit = await Audio.Sound.createAsync(require('../../assets/sounds/sfx/hit-sound.mp3'));
        
        setSounds({ flap: flap.sound, point: point.sound, hit: hit.sound });
      } catch (e) {
        console.warn('Could not load some sounds', e);
      }
    }
    loadSounds();

    return () => {
      Object.values(sounds).forEach((s: any) => s.unloadAsync());
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
  }, [gameState]);

  useFrameCallback((frameInfo) => {
    if (gameState !== 'playing') return;

    birdVelocity.value += GRAVITY;
    birdY.value += birdVelocity.value;

    obstacleX.value -= OBSTACLE_SPEED;

    if (obstacleX.value < -OBSTACLE_WIDTH) {
      obstacleX.value = SCREEN_WIDTH;
      obstacleGapY.value = Math.random() * (SCREEN_HEIGHT - GAP_SIZE - 200) + 100;
      scoreSV.value += 1;
      runOnJS(updateScoreAndCheckPhase)();
    }

    const isHittingGround = birdY.value > SCREEN_HEIGHT - BIRD_SIZE;
    const isHittingCeiling = birdY.value < 0;
    
    let isHittingObstacle = false;
    if (scoreSV.value < 31) {
      const isWithinObstacleX = 
        BIRD_X + BIRD_SIZE > obstacleX.value && 
        BIRD_X < obstacleX.value + OBSTACLE_WIDTH;
        
      const isHittingTopObstacle = birdY.value < obstacleGapY.value;
      const isHittingBottomObstacle = birdY.value + BIRD_SIZE > obstacleGapY.value + GAP_SIZE;

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
    GAP_SIZE,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
  };
}

