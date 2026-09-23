# Arquitetura — Arara Carioca

> Guia gerado a partir da leitura do código-fonte em 2026-09-22. Descreve a estrutura real do
> projeto neste momento — não um plano futuro. Usado pelo `/vetor:backlog` para propor issues
> contextualizadas.

## Stack

- **Expo SDK 54** (`~54.0.33`) + **React Native 0.81.5** + **React 19.1.0**, TypeScript.
- **React Navigation** (`@react-navigation/native` + `native-stack`) para navegação entre telas.
- **React Native Reanimated 4** para todas as animações do jogo (worklets, `SharedValue`,
  `useFrameCallback`).
- **expo-av** para áudio (efeitos sonoros e música de fundo) — deprecado desde a SDK 54, ver
  `.claude/rules/vetor/best-practices/expo.md`.
- **Jest + jest-expo + @testing-library/react-native** para testes (adicionados em 2026-09-22;
  cobertura ainda mínima, ver `gaps.md`).

## Estrutura de pastas

```
App.tsx                    — raiz: carrega a fonte Chewy, envolve NavigationContainer
src/
  navigation/
    AppNavigator.tsx        — Stack Navigator (headerShown: false)
    types.ts                — RootStackParamList (contrato de rotas/params)
  screens/
    WelcomeScreen.tsx        — menu principal, seleção de dificuldade, música de menu
    InstructionsScreen.tsx   — tela estática de instruções
    GameScreen.tsx            — gameplay em si (ver abaixo), envolvida por um ErrorBoundary
    CreditsScreen.tsx          — tela estática de créditos
  hooks/
    useGameLoop.ts            — TODA a lógica de jogo: estado, física, colisão, áudio de efeitos
  components/
    Bird.tsx                  — personagem, puramente apresentacional (recebe SharedValues)
    Obstacle.tsx               — pilar (topo/base), puramente apresentacional
    Score.tsx                   — HUD de pontuação + "título" textual por faixa de score
  constants/
    theme.ts                    — COLORS e FONTS compartilhados entre todas as telas
assets/                        — imagens de fundo, personagem, obstáculo, sons/músicas
```

## Fluxo de navegação

`RootStackParamList` (`src/navigation/types.ts`) define 4 rotas: `Welcome` (undefined),
`Instructions` (undefined), `Game` (`{ difficulty: 'easy' | 'normal' | 'hard' }`), `Credits`
(undefined). `WelcomeScreen` é a única tela que navega para `Game`, passando a dificuldade
escolhida pelo usuário como param.

## Padrão de máquina de estados do jogo

`useGameLoop` (`src/hooks/useGameLoop.ts`) modela o jogo como uma máquina de 5 estados:
`idle → playing → countdown → playing → (gameOver | victory)`. `countdown` também é reusado nas
transições de fase de dificuldade (ver `game-mechanics.md`). O estado é `useState` (React) para o
que a UI precisa re-renderizar (`gameState`, `score`, `countdownValue`) e `useSharedValue`
(Reanimated) para tudo que precisa rodar a 60fps sem re-render (`birdY`, `birdVelocity`,
`obstacleX`, `obstacleGapY`, `scoreSV`).

## Loop de física

`useFrameCallback` (Reanimated) roda a cada frame **na UI thread** (worklet) e só pode tocar
`SharedValue`s diretamente; qualquer mudança de estado React (`setGameState`, `setScore`) dentro
dele passa obrigatoriamente por `runOnJS(...)`. Esse é o padrão usado para `updateScoreAndCheckPhase`
e `handleGameOver`. Constantes físicas (`GRAVITY`, `JUMP_FORCE`, `OBSTACLE_SPEED`, `BIRD_SIZE`,
`BIRD_X`, `OBSTACLE_WIDTH`) são fixas no topo de `useGameLoop.ts`, não configuráveis por prop.

## Áudio

`Audio.Sound` (expo-av) é carregado em `useEffect` e descarregado (`unloadAsync`) no cleanup, tanto
para efeitos sonoros (`useGameLoop.ts`) quanto para música de fundo (`WelcomeScreen.tsx` e
`GameScreen.tsx`, cada um com sua própria implementação — ver `gaps.md` sobre duplicação). A música
de gameplay muda conforme a faixa de score (`getCurrentTrack` em `GameScreen.tsx`), com posição de
playback preservada por faixa (`trackPositions` ref) ao trocar de faixa e voltar.

## Tratamento de erro

`GameScreen.tsx` exporta um `ErrorBoundary` de classe que envolve `GameScreenInner` — é o único
Error Boundary do app; as demais telas não têm proteção equivalente.
