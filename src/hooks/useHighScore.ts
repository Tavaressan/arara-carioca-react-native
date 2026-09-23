import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_STORAGE_KEY = '@arara_carioca:high_score';

export function useHighScore() {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(HIGH_SCORE_STORAGE_KEY).then((storedValue) => {
      if (!isMounted || storedValue === null) return;
      setHighScore(Number(storedValue));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setScore = useCallback((score: number) => {
    setHighScore((currentHighScore) => {
      if (score <= currentHighScore) return currentHighScore;

      AsyncStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
      return score;
    });
  }, []);

  return { highScore, setScore };
}
