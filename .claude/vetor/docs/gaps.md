# Gaps e dívidas técnicas observadas — Arara Carioca

> Guia gerado a partir da leitura do código-fonte em 2026-09-22. Cada item é um fato observado
> diretamente no repositório (arquivo:linha), não uma opinião de estilo. Serve de insumo para o
> `/vetor:backlog` propor issues concretas.

- **Tipagem `any` em `sounds` (`src/hooks/useGameLoop.ts:32`)** — `const [sounds, setSounds] =
  useState<any>({})` perde toda checagem de tipo dos objetos `Audio.Sound` carregados.
- **Tipagem `any` no `ErrorBoundary` (`src/screens/GameScreen.tsx:372-379`)** — `props`/`state`
  do único Error Boundary do app não são tipados.
- **Duplicação do padrão de música de fundo** entre `WelcomeScreen.tsx:16-56` e
  `GameScreen.tsx:52-94` — ambos reimplementam `Audio.Sound.createAsync` +
  `unloadAsync`/cleanup + `useFocusEffect` de forma independente, sem um hook compartilhado (ex.
  `useBackgroundMusic`).
- **`expo-av` deprecado** (SDK 54, remoção prevista na SDK 55 — confirmado via Context7, ver
  `.claude/rules/vetor/best-practices/expo.md`) — usado tanto para efeitos sonoros quanto para
  música em `useGameLoop.ts`, `WelcomeScreen.tsx` e `GameScreen.tsx`. Migração para
  `expo-audio` é candidata a issue, com atenção ao comportamento de reset de posição (diferente
  entre as duas libs).
- **Duas fontes de verdade divergentes sobre "progresso do jogador"**: as fases de dificuldade em
  `useGameLoop.ts` (`getPhaseGaps`, limites 16/31/50) e os "títulos" em `Score.tsx` (`getTitle`,
  limites 5/15/30/50) não estão sincronizados — ver `game-mechanics.md`.
- **Música da fase 3 reusa a trilha de game over** (`GameScreen.tsx`, `getCurrentTrack`,
  `score >= 31` durante `gameState === 'playing'` retorna `game-over.mp3`) — mesma trilha toca
  tanto na fase final do gameplay quanto na tela de derrota; pode ser intencional ou um bug de
  cópia-e-cola do mapeamento de fases.
- **Sem ESLint/Prettier configurado** — nenhum `.eslintrc*`/`eslint.config.*` na raiz do projeto
  (confirmado por busca; os únicos arquivos desse nome pertencem a dependências em
  `node_modules/`). A única checagem estática disponível hoje é o TypeScript (`tsconfig.json`).
- **Cobertura de testes mínima** — só existe `src/components/__tests__/Score.test.tsx` (2 casos,
  adicionado em 2026-09-22). A lógica central do jogo (`useGameLoop.ts` — máquina de estados,
  colisão, fases) não tem nenhum teste.
- **Lógica de escala do background duplicada/complexa** (`GameScreen.tsx:124-157`,
  `bgTranslateX`) — cálculo de aspect ratio, progresso de fase e tradução do fundo concentrado
  inline no componente da tela, sem extração para um hook ou util testável.
