import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../constants/theme';

export default function InstructionsScreen() {
  const navigation = useNavigation();

  return (
    <ImageBackground 
      source={require('../../assets/images/bkg-image-1.png')} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Instruções</Text>
          <Text style={styles.text}>
            Toque na tela para manter Tico Azul no ar. Atravesse os Arcos da Lapa e conquiste Fama na Lapa.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 77, 40, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fdfbf7',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 40,
    width: '90%',
    elevation: 10,
    borderWidth: 4,
    borderColor: '#d4af37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontFamily: FONTS.main,
    fontSize: 42,
    color: '#004d28',
    marginBottom: 20,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  text: {
    fontFamily: FONTS.main,
    fontSize: 24,
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 32,
  },
  button: {
    backgroundColor: '#004d28',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#d4af37',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    fontFamily: FONTS.main,
    fontSize: 26,
    color: '#fdfbf7',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  }
});
