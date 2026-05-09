import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameLoop } from '../hooks/useGameLoop';
import Bird from '../components/Bird';
import Obstacle from '../components/Obstacle';
import Score from '../components/Score';
import { COLORS, FONTS } from '../constants/theme';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

export function GameScreenInner() {
  const navigation = useNavigation();
  const {
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
  } = useGameLoop();

  const [canExitVictory, setCanExitVictory] = useState(false);

  const getCurrentTrack = () => {
    if (gameState === 'victory') return require('../../assets/sounds/music/last-party-music.mp3');
    if (gameState === 'playing' || gameState === 'countdown') {
      if (score < 16) return require('../../assets/sounds/music/gameplay-loop.mp3');
      if (score < 31) return require('../../assets/sounds/music/high-score.mp3');
      return require('../../assets/sounds/music/game-over.mp3');
    }
    return null;
  };

  const trackSource = getCurrentTrack();

  useFocusEffect(
    React.useCallback(() => {
      let sound: Audio.Sound | null = null;
      let isCancelled = false;

      async function playMusic() {
        if (!trackSource) return;
        try {
          const { sound: s } = await Audio.Sound.createAsync(
            trackSource,
            { isLooping: true }
          );
          if (isCancelled) {
            s.unloadAsync();
            return;
          }
          sound = s;
          await sound.playAsync();
        } catch (e) {
          console.warn('Music track not found:', e);
        }
      }

      playMusic();

      return () => {
        isCancelled = true;
        if (sound) sound.unloadAsync();
      };
    }, [trackSource])
  );

  useEffect(() => {
    if (gameState === 'victory') {
      const timer = setTimeout(() => {
        setCanExitVictory(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setCanExitVictory(false);
    }
  }, [gameState]);

  const getBackgroundImage = () => {
    if (gameState === 'victory') return require('../../assets/images/victory-image.png');
    if (score < 16) return require('../../assets/images/bkg-image-1.png');
    if (score < 31) return require('../../assets/images/bkg-image-2.png');
    return require('../../assets/images/bkg-image-3.png');
  };

  const handlePress = () => {
    if (gameState === 'victory') {
      if (canExitVictory) {
        navigation.goBack();
      }
    } else {
      jump();
    }
  };

  const aspect = 1672 / 941;
  let bgWidth = SCREEN_HEIGHT * aspect;

  if (bgWidth < SCREEN_WIDTH) {
    bgWidth = SCREEN_WIDTH;
  }

  const bgTranslateX = useDerivedValue(() => {
    let phaseStartScore = 0;
    let phaseTargetScore = 16;
    if (scoreSV.value >= 31) {
      phaseStartScore = 31;
      phaseTargetScore = 50;
    } else if (scoreSV.value >= 16) {
      phaseStartScore = 16;
      phaseTargetScore = 31;
    }

    const totalPointsInPhase = phaseTargetScore - phaseStartScore;
    const pointsEarned = scoreSV.value - phaseStartScore;

    let obstacleProgress = (SCREEN_WIDTH - obstacleX.value) / (SCREEN_WIDTH + OBSTACLE_WIDTH);
    obstacleProgress = Math.max(0, Math.min(1, obstacleProgress));

    const phaseProgress = (pointsEarned + obstacleProgress) / totalPointsInPhase;
    const safeProgress = Math.min(1, Math.max(0, phaseProgress));

    if (gameState === 'victory') {
      return 0;
    }

    const maxTranslate = Math.max(0, bgWidth - SCREEN_WIDTH);
    return -safeProgress * maxTranslate;
  });

  const bgAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: bgTranslateX.value }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <Animated.Image
          source={getBackgroundImage()}
          style={[
            styles.background, 
            { width: gameState === 'victory' ? SCREEN_WIDTH : bgWidth, height: SCREEN_HEIGHT },
            gameState === 'victory' ? {} : bgAnimatedStyle
          ]}
          resizeMode="cover"
        />

        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {gameState !== 'victory' && (
            <>
              <Score score={score} />

              {score < 31 && (
                <>
                  <Obstacle
                    x={obstacleX}
                    y={obstacleGapY.value - SCREEN_HEIGHT}
                    width={OBSTACLE_WIDTH}
                    height={SCREEN_HEIGHT}
                    isTop={true}
                  />

                  <Obstacle
                    x={obstacleX}
                    y={obstacleGapY.value + GAP_SIZE}
                    width={OBSTACLE_WIDTH}
                    height={SCREEN_HEIGHT}
                    isTop={false}
                  />
                </>
              )}

              <Bird x={BIRD_X} y={birdY} velocity={birdVelocity} size={BIRD_SIZE} />
            </>
          )}

          {gameState === 'idle' && (
            <View style={styles.overlay}>
              <Text style={styles.messageText}>Toque para Começar</Text>
            </View>
          )}

          {gameState === 'countdown' && (
            <View style={styles.overlay}>
              <Text style={styles.countdownText}>{countdownValue}</Text>
            </View>
          )}

          {gameState === 'gameOver' && (
            <View style={styles.overlay} pointerEvents="auto">
              <View style={styles.card}>
                <Text style={styles.gameOverText}>Game Over!</Text>
                <Text style={styles.finalScore}>Pontuação: {score}</Text>

                <TouchableOpacity style={styles.button} onPress={jump}>
                  <Text style={styles.buttonText}>Tentar Novamente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 10 }]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Menu Principal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {gameState === 'victory' && (
            <View style={styles.victoryOverlay}>
              <Text style={styles.victoryText}>Lenda Carioca!</Text>
              <Text style={styles.victorySubText}>Você dominou a Lapa!</Text>
              {canExitVictory && (
                <Text style={[styles.victorySubText, { marginTop: 20, fontSize: 20, opacity: 0.8 }]}>
                  Toque na tela para sair
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  background: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  messageText: {
    fontFamily: FONTS.main,
    fontSize: 44,
    color: COLORS.secondary,
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 77, 40, 0.6)',
    borderRadius: 15,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  countdownText: {
    fontFamily: FONTS.main,
    fontSize: 100,
    color: COLORS.secondary,
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 5,
  },
  card: {
    backgroundColor: '#fdfbf7',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    elevation: 10,
    borderWidth: 4,
    borderColor: '#d4af37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gameOverText: {
    fontFamily: FONTS.main,
    fontSize: 50,
    color: '#004d28',
    marginBottom: 10,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  finalScore: {
    fontFamily: FONTS.main,
    fontSize: 30,
    color: COLORS.dark,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#004d28',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d4af37',
    elevation: 5,
  },
  buttonText: {
    fontFamily: FONTS.main,
    fontSize: 26,
    color: '#fdfbf7',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  victoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 77, 40, 0.75)',
  },
  victoryText: {
    fontFamily: FONTS.main,
    fontSize: 60,
    color: '#d4af37',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    textAlign: 'center',
  },
  victorySubText: {
    fontFamily: FONTS.main,
    fontSize: 30,
    color: '#fdfbf7',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    textAlign: 'center',
  }
});

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20 }}>
          <Text style={{ color: 'red', fontSize: 20 }}>CRASH:</Text>
          <Text style={{ color: 'black' }}>{String(this.state.error)}</Text>
          <Text style={{ color: 'black', fontSize: 10 }}>{this.state.error?.stack}</Text>
        </View>
      );
    }
    return <GameScreenInner {...this.props} />;
  }
}

export default ErrorBoundary;
