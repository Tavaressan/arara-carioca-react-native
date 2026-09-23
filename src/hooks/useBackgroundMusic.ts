import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { createAudioPlayer, AudioPlayer, AudioSource } from 'expo-audio';

/**
 * Carrega, toca e pausa uma trilha de fundo em loop, sincronizada com o foco
 * da tela (via useFocusEffect). Enquanto `trackSource` não muda, a mesma
 * instância do player é reaproveitada entre focos (pause no blur, resume no
 * focus) em vez de recriada. Ao trocar de `trackSource`, a trilha anterior é
 * descarregada (remove) antes da nova ser carregada. A posição de playback de
 * cada trilha é lembrada entre trocas (expo-audio não reseta a posição
 * sozinho, diferente do expo-av). O player é descarregado definitivamente no
 * unmount.
 */
export function useBackgroundMusic(trackSource: AudioSource | null | undefined) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const loadedSourceRef = useRef<AudioSource | null>(null);
  const trackPositions = useRef<Map<AudioSource, number>>(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!trackSource) {
        if (playerRef.current) {
          playerRef.current.remove();
        }
        playerRef.current = null;
        loadedSourceRef.current = null;
        return;
      }

      const source: AudioSource = trackSource;

      // Mesma trilha já carregada: reaproveita a instância existente.
      if (playerRef.current && loadedSourceRef.current === source) {
        const existingPlayer = playerRef.current;
        existingPlayer.play();

        return () => {
          trackPositions.current.set(source, existingPlayer.currentTime);
          existingPlayer.pause();
        };
      }

      // Trilha diferente: descarrega a anterior antes de carregar a nova.
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      let isCancelled = false;
      const player = createAudioPlayer(source);
      player.loop = true;
      playerRef.current = player;
      loadedSourceRef.current = source;

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
        player.pause();
      };
    }, [trackSource])
  );

  // Descarrega o player definitivamente no unmount (blur apenas pausa).
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  return playerRef;
}
