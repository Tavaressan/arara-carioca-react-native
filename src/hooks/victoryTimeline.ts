// Linha do tempo pura da tela de vitória, independente de plataforma/frame rate (mesmo padrão de
// physics.ts). Em ordem: o pássaro cruza a tela com o fundo rolando atrás dele; depois que ele saiu
// por completo, a máscara escura e o título aparecem; então o fundo espera um instante e volta ao
// centro da imagem (onde fica o palacete da Ilha Fiscal).

export const VICTORY_FLIGHT_MS = 10000;
export const VICTORY_REVEAL_MS = 800;
export const VICTORY_HOLD_MS = 1200;
export const VICTORY_PAN_BACK_MS = 2000;
export const VICTORY_TOTAL_MS =
  VICTORY_FLIGHT_MS + VICTORY_REVEAL_MS + VICTORY_HOLD_MS + VICTORY_PAN_BACK_MS;

// Quando o título já apareceu por completo: libera o toque para sair e o aviso na tela.
export const VICTORY_EXIT_ENABLED_MS = VICTORY_FLIGHT_MS + VICTORY_REVEAL_MS;

// Posição final do fundo: 0 = borda esquerda da imagem, 1 = borda direita, 0.5 = centro.
export const VICTORY_FINAL_SCROLL = 0.5;

export interface VictoryFrame {
  birdX: number;
  scroll: number;
  overlayOpacity: number;
}

export function getVictoryFrame(elapsedMs: number, screenWidth: number, birdSize: number): VictoryFrame {
  'worklet';
  const t = Math.min(Math.max(elapsedMs, 0), VICTORY_TOTAL_MS);

  // O pássaro fica inclinado, então o sprite girado invade a tela até (√2 − 1)/2 do seu tamanho
  // além da caixa (quadrado girado 45°). A folga garante que ele saia e entre por completo, sem
  // deixar a cauda aparecendo na borda.
  const offscreenMargin = (birdSize * (Math.SQRT2 - 1)) / 2;
  const startX = -birdSize - offscreenMargin;
  const endX = screenWidth + offscreenMargin;

  const flight = Math.min(1, t / VICTORY_FLIGHT_MS);
  const birdX = startX + flight * (endX - startX);

  const overlayOpacity = Math.min(1, Math.max(0, (t - VICTORY_FLIGHT_MS) / VICTORY_REVEAL_MS));

  const panBackStart = VICTORY_FLIGHT_MS + VICTORY_REVEAL_MS + VICTORY_HOLD_MS;
  const panBack = Math.min(1, Math.max(0, (t - panBackStart) / VICTORY_PAN_BACK_MS));
  const easedPanBack = panBack * panBack * (3 - 2 * panBack);
  // Durante o voo o fundo acompanha o pássaro (flight); depois espera na borda direita e volta.
  const scroll = flight + (VICTORY_FINAL_SCROLL - 1) * easedPanBack;

  return { birdX, scroll, overlayOpacity };
}
