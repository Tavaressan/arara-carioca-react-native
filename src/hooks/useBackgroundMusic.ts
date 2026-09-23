import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createAudioPlayer, AudioPlayer, AudioSource } from 'expo-audio';

/**
 * Carrega, toca e descarrega uma trilha de fundo em loop, sincronizada com o
 * foco da tela (via useFocusEffect). Ao trocar de `trackSource`, a trilha
 * anterior é descarregada antes da nova ser carregada. A posição de playback
 * de cada trilha é lembrada entre trocas (expo-audio não reseta a posição
 * sozinho, diferente do expo-av).
 */
export function useBackgroundMusic(trackSource: AudioSource | null | undefined) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const trackPositions = useRef<Map<AudioSource, number>>(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!trackSource) {
        playerRef.current = null;
        return;
      }

      const source: AudioSource = trackSource;
      let isCancelled = false;
      const player = createAudioPlayer(source);
      player.loop = true;
      playerRef.current = player;

      async function start() {
        try {
          const savedPosition = trackPositions.current.get(source) || 0;
          await player.seekTo(savedPosition);
          if (!isCancelled) {
            player.play();
          }
        } catch (e) {
          console.warn('Music track not found:', e);
        }
      }
      start();

      return () => {
        isCancelled = true;
        trackPositions.current.set(source, player.currentTime);
        player.remove();
        if (playerRef.current === player) {
          playerRef.current = null;
        }
      };
    }, [trackSource])
  );

  return playerRef;
}
