import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, FONTS } from '../constants/theme';
import { Audio } from 'expo-av';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [soundRef, setSoundRef] = useState<Audio.Sound | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  useEffect(() => {
    let sound: Audio.Sound | null = null;
    let isCancelled = false;

    async function initMusic() {
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          require('../../assets/sounds/music/menu-theme.mp3'),
          { isLooping: true }
        );
        if (isCancelled) {
          s.unloadAsync();
          return;
        }
        sound = s;
        setSoundRef(s);
        await sound.playAsync();
      } catch (e) {
        console.warn('Sound not found or failed to load:', e);
      }
    }
    initMusic();

    return () => {
      isCancelled = true;
      if (sound) sound.unloadAsync();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (soundRef) {
        soundRef.playAsync().catch(() => {});
      }
      return () => {
        if (soundRef) {
          soundRef.pauseAsync().catch(() => {});
        }
      };
    }, [soundRef])
  );

  const handleInteraction = async () => {
    if (soundRef) {
      const status = await soundRef.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        soundRef.playAsync().catch(() => {});
      }
    }
  };

  const startGame = async () => {
    if (soundRef) {
      await soundRef.pauseAsync();
    }
    navigation.navigate('Game', { difficulty });
  };

  return (
    <TouchableWithoutFeedback onPress={handleInteraction}>
      <View style={styles.container}>
        <ImageBackground 
          source={require('../../assets/images/bkg-image-1.png')} 
          style={styles.background}
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>Arara Carioca</Text>
            <Text style={styles.slogan}>Ganhe Fama na Lapa</Text>

            <Image 
              source={require('../../assets/images/main_character/tico-azul.png')} 
              style={styles.character} 
              resizeMode="contain"
            />

            <View style={styles.difficultyContainer}>
              <TouchableOpacity 
                style={[styles.diffButton, difficulty === 'easy' && styles.diffSelected, { backgroundColor: '#4CAF50' }]} 
                onPress={() => { handleInteraction(); setDifficulty('easy'); }}
              >
                <Text style={styles.diffText}>Fácil</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.diffButton, difficulty === 'normal' && styles.diffSelected, { backgroundColor: '#FFC107' }]} 
                onPress={() => { handleInteraction(); setDifficulty('normal'); }}
              >
                <Text style={styles.diffText}>Médio</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.diffButton, difficulty === 'hard' && styles.diffSelected, { backgroundColor: '#F44336' }]} 
                onPress={() => { handleInteraction(); setDifficulty('hard'); }}
              >
                <Text style={styles.diffText}>Difícil</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: COLORS.accent }]} 
                onPress={startGame}
              >
                <Text style={styles.buttonText}>Jogar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: COLORS.primary }]} 
                onPress={() => {
                  handleInteraction();
                  navigation.navigate('Instructions');
                }}
              >
                <Text style={styles.buttonText}>Instruções</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: COLORS.green }]} 
                onPress={() => {
                  handleInteraction();
                  navigation.navigate('Credits');
                }}
              >
                <Text style={styles.buttonText}>Créditos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontFamily: FONTS.main,
    fontSize: 64,
    color: '#d4af37',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    marginBottom: 5,
    textAlign: 'center',
  },
  slogan: {
    fontFamily: FONTS.main,
    fontSize: 28,
    color: '#fdfbf7',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 40,
    textAlign: 'center',
  },
  character: {
    width: 150,
    height: 150,
    marginBottom: 50,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
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
    fontSize: 28,
    color: '#fdfbf7',
    textShadowColor: COLORS.dark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    marginBottom: 20,
  },
  diffButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  diffSelected: {
    borderColor: '#fdfbf7',
    opacity: 1,
    transform: [{ scale: 1.05 }],
    elevation: 5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  diffText: {
    fontFamily: FONTS.main,
    fontSize: 20,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  }
});
