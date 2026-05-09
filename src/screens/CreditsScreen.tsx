import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../constants/theme';

export default function CreditsScreen() {
  const navigation = useNavigation();

  return (
    <ImageBackground 
      source={require('../../assets/images/bkg-image-1.png')} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Créditos</Text>
          
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Aluno:</Text>
            <Text style={styles.value}>Vitor Tavares Chaves</Text>
            
            <Text style={styles.label}>Instituição:</Text>
            <Text style={styles.value}>FATEC Itaquera</Text>
            
            <Text style={styles.label}>Curso:</Text>
            <Text style={styles.value}>Desenvolvimento de Software Multiplataforma</Text>

            <Text style={styles.label}>Instrutor:</Text>
            <Text style={styles.value}>Prof. Jeferson de Souza Dias</Text>
          </View>

          <Text style={styles.disclaimer}>
            Este jogo é um projeto acadêmico da FATEC, criado apenas para fins de estudo. Não utilize as informações aqui para uso real.
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
    marginBottom: 30,
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontFamily: FONTS.main,
    fontSize: 20,
    color: '#ca6702',
    textAlign: 'center',
  },
  value: {
    fontFamily: FONTS.main,
    fontSize: 28,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 10,
  },
  disclaimer: {
    fontFamily: FONTS.main,
    fontSize: 16,
    color: '#004d28',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#d4af37',
    paddingTop: 20,
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
