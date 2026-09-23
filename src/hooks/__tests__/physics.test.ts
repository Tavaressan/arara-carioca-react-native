import { applyPhysicsStep, REFERENCE_FRAME_MS, GRAVITY, OBSTACLE_SPEED } from '../physics';

describe('applyPhysicsStep', () => {
  const baseState = { birdVelocity: 2, birdY: 100, obstacleX: 400 };

  test('normaliza o incremento de velocidade pelo deltaMs (60Hz vs 120Hz)', () => {
    const at60Hz = applyPhysicsStep(baseState, 16.6);
    const at120Hz = applyPhysicsStep(baseState, 8.3);

    const velocityDelta60 = at60Hz.birdVelocity - baseState.birdVelocity;
    const velocityDelta120 = at120Hz.birdVelocity - baseState.birdVelocity;

    expect(velocityDelta120).toBeCloseTo(velocityDelta60 / 2, 5);
  });

  test('normaliza o deslocamento do obstáculo pelo deltaMs (60Hz vs 120Hz)', () => {
    const at60Hz = applyPhysicsStep(baseState, 16.6);
    const at120Hz = applyPhysicsStep(baseState, 8.3);

    const obstacleDelta60 = baseState.obstacleX - at60Hz.obstacleX;
    const obstacleDelta120 = baseState.obstacleX - at120Hz.obstacleX;

    expect(obstacleDelta120).toBeCloseTo(obstacleDelta60 / 2, 5);
  });

  test('a 60Hz (deltaMs = REFERENCE_FRAME_MS) o incremento de velocidade é exatamente GRAVITY', () => {
    const result = applyPhysicsStep(baseState, REFERENCE_FRAME_MS);
    expect(result.birdVelocity - baseState.birdVelocity).toBeCloseTo(GRAVITY, 5);
  });

  test('a 60Hz (deltaMs = REFERENCE_FRAME_MS) o obstáculo se move exatamente OBSTACLE_SPEED', () => {
    const result = applyPhysicsStep(baseState, REFERENCE_FRAME_MS);
    expect(baseState.obstacleX - result.obstacleX).toBeCloseTo(OBSTACLE_SPEED, 5);
  });
});
