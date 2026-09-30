import {
  getVictoryFrame,
  VICTORY_FLIGHT_MS,
  VICTORY_REVEAL_MS,
  VICTORY_HOLD_MS,
  VICTORY_PAN_BACK_MS,
  VICTORY_TOTAL_MS,
  VICTORY_FINAL_SCROLL,
} from '../victoryTimeline';

const SCREEN_WIDTH = 400;
const BIRD_SIZE = 110;
// Pior caso de quanto o sprite girado invade a tela além da caixa do pássaro (quadrado girado 45°):
// com o pássaro inclinado na vitória, a cauda aparecia na borda mesmo com a caixa já fora da tela.
const ROTATION_OVERHANG = (BIRD_SIZE * (Math.SQRT2 - 1)) / 2;

const at = (elapsedMs: number) => getVictoryFrame(elapsedMs, SCREEN_WIDTH, BIRD_SIZE);

describe('victoryTimeline - linha do tempo da tela de vitória', () => {
  test('no início, o pássaro está todo fora da tela, à esquerda (mesmo girado), sem máscara e com o fundo na borda esquerda', () => {
    const frame = at(0);

    expect(frame.birdX + BIRD_SIZE + ROTATION_OVERHANG).toBeLessThanOrEqual(1e-9);
    expect(frame.scroll).toBe(0);
    expect(frame.overlayOpacity).toBe(0);
  });

  test('no fim do voo, o pássaro saiu por completo pela direita, inclusive a cauda do sprite girado, e o fundo está na borda direita', () => {
    const frame = at(VICTORY_FLIGHT_MS);

    expect(frame.birdX - ROTATION_OVERHANG).toBeGreaterThanOrEqual(SCREEN_WIDTH - 1e-9);
    expect(frame.scroll).toBe(1);
  });

  test('durante o voo, o pássaro avança e o fundo rola junto, sem máscara nem título', () => {
    let previous = at(0);
    for (let ms = 500; ms <= VICTORY_FLIGHT_MS; ms += 500) {
      const frame = at(ms);
      expect(frame.birdX).toBeGreaterThan(previous.birdX);
      expect(frame.scroll).toBeGreaterThan(previous.scroll);
      expect(frame.overlayOpacity).toBe(0);
      previous = frame;
    }
  });

  test('a máscara e o título só aparecem depois que o pássaro saiu, e o pássaro não volta', () => {
    const exitedX = at(VICTORY_FLIGHT_MS).birdX;

    expect(at(VICTORY_FLIGHT_MS - 1).overlayOpacity).toBe(0);

    const halfway = at(VICTORY_FLIGHT_MS + VICTORY_REVEAL_MS / 2);
    expect(halfway.overlayOpacity).toBeGreaterThan(0);
    expect(halfway.overlayOpacity).toBeLessThan(1);

    expect(at(VICTORY_FLIGHT_MS + VICTORY_REVEAL_MS).overlayOpacity).toBe(1);
    expect(at(VICTORY_TOTAL_MS).birdX).toBe(exitedX);
  });

  test('com a máscara visível o fundo espera na borda direita e depois volta à borda esquerda da imagem (Dom Pedro II)', () => {
    const panBackStart = VICTORY_FLIGHT_MS + VICTORY_REVEAL_MS + VICTORY_HOLD_MS;

    expect(at(panBackStart).scroll).toBe(1);
    expect(at(panBackStart).overlayOpacity).toBe(1);

    let previous = at(panBackStart).scroll;
    for (let ms = panBackStart + 200; ms <= panBackStart + VICTORY_PAN_BACK_MS; ms += 200) {
      const { scroll } = at(ms);
      expect(scroll).toBeLessThan(previous);
      expect(scroll).toBeGreaterThanOrEqual(VICTORY_FINAL_SCROLL - 1e-9);
      previous = scroll;
    }

    expect(at(VICTORY_TOTAL_MS).scroll).toBeCloseTo(0, 9);
    expect(at(VICTORY_TOTAL_MS).overlayOpacity).toBe(1);
  });

  test('passado o fim da linha do tempo, nada mais muda', () => {
    expect(at(VICTORY_TOTAL_MS + 5000)).toEqual(at(VICTORY_TOTAL_MS));
  });
});
