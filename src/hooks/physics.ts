// Física pura do jogo, independente de plataforma/frame rate.
// Extraída para permitir normalização por delta-time e testes unitários isolados.

export const REFERENCE_FRAME_MS = 1000 / 60;

export const GRAVITY = 0.5;
export const JUMP_FORCE = -10;
export const OBSTACLE_SPEED = 4;

export interface PhysicsState {
  birdVelocity: number;
  birdY: number;
  obstacleX: number;
}

export function applyPhysicsStep(state: PhysicsState, deltaMs: number): PhysicsState {
  'worklet';
  const timeScale = deltaMs / REFERENCE_FRAME_MS;
  const birdVelocity = state.birdVelocity + GRAVITY * timeScale;
  const birdY = state.birdY + birdVelocity * timeScale;
  const obstacleX = state.obstacleX - OBSTACLE_SPEED * timeScale;

  return { birdVelocity, birdY, obstacleX };
}
