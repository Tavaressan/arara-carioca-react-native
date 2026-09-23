import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import {
  PHASE_2_SCORE_THRESHOLD,
  PHASE_3_SCORE_THRESHOLD,
  VICTORY_SCORE_THRESHOLD,
} from '../constants/gamePhases';

interface ScoreProps {
  score: number;
}

// Limiares alinhados às fases de dificuldade de useGameLoop (PHASE_2/PHASE_3/VICTORY),
// para que o título mude exatamente quando a fase muda.
export function getTitle(s: number) {
  if (s < PHASE_2_SCORE_THRESHOLD) return 'Turista Perdido';
  if (s < PHASE_3_SCORE_THRESHOLD) return 'Sambista de Esquina';
  if (s < VICTORY_SCORE_THRESHOLD) return 'Boêmio da Lapa';
  return 'Lenda Carioca';
}

export default function Score({ score }: ScoreProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>{score}</Text>
      <Text style={styles.titleText}>{getTitle(score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
  },
  scoreText: {
    fontFamily: FONTS.main,
    fontSize: 60,
    color: COLORS.white,
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
  titleText: {
    fontFamily: FONTS.main,
    fontSize: 24,
    color: COLORS.secondary,
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  }
});
