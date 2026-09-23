# Mecânicas de jogo — Arara Carioca

> Guia gerado a partir da leitura de `src/hooks/useGameLoop.ts`, `src/screens/GameScreen.tsx` e
> `src/components/Score.tsx` em 2026-09-22. Regras de domínio do jogo, para contextualizar issues
> de gameplay/balanceamento propostas pelo `/vetor:backlog`.

## Objetivo

Manter o pássaro (Tico Azul) voando ao tocar a tela (bate asas), desviando de pilares, até atingir
**50 pontos** — condição de vitória fixa (`useGameLoop.ts`, `updateScoreAndCheckPhase`).

## Fases por pontuação

O jogo tem 3 fases de dificuldade progressiva, cada uma com um `gap` (abertura entre pilares)
menor que a anterior — quanto menor o gap, mais difícil:

| Fase | Faixa de score | Gap (fácil/normal/difícil) | Background | Música |
|------|-----------------|------------------------------|-------------|--------|
| 1 | 0–15 | 650 / 550 / 380 | `bkg-image-1.png` | `gameplay-loop.mp3` |
| 2 | 16–30 | 550 / 450 / 280 | `bkg-image-2.png` | `high-score.mp3` |
| 3 | 31–49 | 450 / 350 / 180 | `bkg-image-3.png` | `game-over.mp3`* |

*Nota: `GameScreen.tsx` (`getCurrentTrack`) reusa a trilha `game-over.mp3` também como música da
fase 3 durante o gameplay (`score >= 31`), não só na tela de derrota — comportamento observado no
código, possivelmente não intencional.

Ao cruzar score 16 ou 31, o jogo entra em `countdown` (3 segundos, `setInterval` de 1s), reseta a
posição do pássaro e do obstáculo, e retoma em `playing` com um novo `JUMP_FORCE` aplicado
automaticamente.

## Dificuldade selecionável

`WelcomeScreen.tsx` deixa o jogador escolher `easy` | `normal` | `hard` antes de jogar (default
`normal`). Essa escolha **só afeta os gaps de cada fase** (`getPhaseGaps` em `useGameLoop.ts`) —
gravidade (`GRAVITY = 0.5`), força do pulo (`JUMP_FORCE = -10`) e velocidade dos obstáculos
(`OBSTACLE_SPEED = 4`) são constantes fixas, iguais nas três dificuldades.

## Colisão

Calculada por frame dentro do `useFrameCallback`: chão (`birdY > SCREEN_HEIGHT - BIRD_SIZE`), teto
(`birdY < 0`), ou sobreposição com o pilar atual (só verificada enquanto `score < 50`, já que após
a vitória os obstáculos somem). Qualquer uma das três aciona `handleGameOver` via `runOnJS`.

## Título do jogador (HUD)

`Score.tsx` (`getTitle`) exibe um título textual baseado no score atual, com faixas **próprias e
independentes** das fases de `useGameLoop.ts`:

| Score | Título |
|-------|--------|
| ≤ 5 | Turista Perdido |
| ≤ 15 | Sambista de Esquina |
| ≤ 30 | Boêmio da Lapa |
| ≤ 50 | Rei dos Arcos |
| > 50 | Lenda Carioca |

Note que os limites (5/15/30/50) não coincidem exatamente com os limites de fase do jogo (16/31/50)
— são duas fontes de verdade separadas sobre "progresso do jogador". Ver `gaps.md`.
