// Limiares de score que marcam o início de cada fase de dificuldade do jogo.
// Compartilhados entre a lógica de jogo (useGameLoop) e a UI (Score/HUD) para
// evitar que os dois fiquem dessincronizados.

export const PHASE_2_SCORE_THRESHOLD = 16;
export const PHASE_3_SCORE_THRESHOLD = 31;
export const VICTORY_SCORE_THRESHOLD = 50;
