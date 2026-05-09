import React from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';

interface ObstacleProps {
  x: SharedValue<number>;
  y: number;
  width: number;
  height: number;
  isTop: boolean;
}

export default function Obstacle({ x, y, width, height, isTop }: ObstacleProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { rotate: isTop ? '180deg' : '0deg' }
      ],
    };
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { top: y, width, height }, 
        animatedStyle
      ]}
    >
      <Image
        source={require('../../assets/images/pillar-obstacle.png')}
        style={styles.image}
        resizeMode="stretch"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  }
});
