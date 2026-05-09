import React from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue, interpolate, Extrapolate } from 'react-native-reanimated';

interface BirdProps {
  x: number;
  y: SharedValue<number>;
  velocity: SharedValue<number>;
  size: number;
}

export default function Bird({ x, y, velocity, size }: BirdProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      velocity.value,
      [-10, 10], 
      [-25, 90], 
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY: y.value },
        { rotate: `${rotation}deg` }
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, { left: x, width: size, height: size }, animatedStyle]}>
      <Image 
        source={require('../../assets/images/main_character/tico-azul.png')} 
        style={styles.image} 
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  }
});
