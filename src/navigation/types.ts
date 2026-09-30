export type RootStackParamList = {
  Welcome: undefined;
  Instructions: undefined;
  // startInVictory: atalho só de desenvolvimento (ignorado quando __DEV__ é false) que abre o jogo
  // já na tela de vitória.
  Game: { difficulty: 'easy' | 'normal' | 'hard'; startInVictory?: boolean };
  Credits: undefined;
};
