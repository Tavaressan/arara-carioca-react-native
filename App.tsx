import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Chewy_400Regular } from '@expo-google-fonts/chewy';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, Platform, StyleSheet } from 'react-native';

export default function App() {
  const [fontsLoaded] = useFonts({
    Chewy_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Fonts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    // Limita a largura no desktop para simular tela de celular/tablet em pé e permitir scroll real do cenário
    maxWidth: Platform.OS === 'web' ? 800 : undefined,
    overflow: 'hidden',
    backgroundColor: '#000',
  }
});
