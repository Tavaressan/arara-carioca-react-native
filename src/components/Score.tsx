import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface ScoreProps {
  score: number;
}

export default function Score({ score }: ScoreProps) {
  const getTitle = (s: number) => {
    if (s <= 5) return 'Turista Perdido';
    if (s <= 15) return 'Sambista de Esquina';
    if (s <= 30) return 'Boêmio da Lapa';
    if (s <= 50) return 'Rei dos Arcos';
    return 'Lenda Carioca';
  };

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
