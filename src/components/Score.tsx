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

// Subfaixa só de HUD (flavor text), sem fase de dificuldade real correspondente em
// useGameLoop — por isso não muda o instante do countdown de fase, diferente de
// PHASE_2/PHASE_3/VICTORY, que estão alinhados a useGameLoop de propósito.
const REI_DOS_ARCOS_SCORE_THRESHOLD = 45;

// Limiares de fase alinhados a useGameLoop (PHASE_2/PHASE_3/VICTORY), para que o
// título mude exatamente quando a fase muda.
export function getTitle(s: number) {
  if (s < PHASE_2_SCORE_THRESHOLD) return 'Turista Perdido';
  if (s < PHASE_3_SCORE_THRESHOLD) return 'Sambista de Esquina';
  if (s < REI_DOS_ARCOS_SCORE_THRESHOLD) return 'Boêmio da Lapa';
  if (s < VICTORY_SCORE_THRESHOLD) return 'Rei dos Arcos';
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
