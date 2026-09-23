---
paths:
  - "**/*.{ts,tsx,js,jsx}"
---

> Gerado por `/stack-practices` a partir da documentação de react@19.1.0 via Context7 em 2026-09-22.
> Conhecimento externo, não um fato observado neste repositório — pode ficar desatualizado.
> Rode `/stack-practices --refresh` periodicamente. Editável — não sobrescrito sem `--refresh`.

# Melhores práticas — react@19.1.0

- `useEffect` deve ser usado só para sincronizar React com estado externo; evite `useEffect` sempre que houver alternativa. Não chame `setState` dentro de um `useEffect` (degrada performance). Inclua todas as dependências necessárias no array de dependências, sem suprimir regras do ESLint. Sempre que possível, retorne uma função de cleanup. Lógica disparada por ação do usuário (clique, submit) deve ficar em um event handler, não em um `useEffect`.
- `forwardRef` requer uma função de render que aceite exatamente dois parâmetros (`props`, `ref`); não suporta `defaultProps`. Ordem correta ao combinar com `memo` é `memo(forwardRef(...))`, nunca `forwardRef(memo(...))`.
- APIs removidas no React 19 (breaking changes): `propTypes` (usar TypeScript), `defaultProps` em componentes função (usar parâmetros default ES6 — componentes classe continuam suportando `defaultProps`), `contextTypes`/`getChildContext` (usar `contextType`), string refs (migrar para ref callbacks), `React.createFactory`, `react-test-renderer/shallow`. Tipos TypeScript deprecados também foram removidos (`ReactChild`, `ReactFragment`, `ReactNodeArray`, `ReactText`, `VoidFunctionComponent`/`VFC`); há codemod oficial: `npx types-react-codemod@latest preset-19`.
- Erros em render não são mais relançados automaticamente: erros não capturados por um Error Boundary agora vão para `window.reportError`; erros capturados vão para `console.error`. `createRoot`/`hydrateRoot` aceitam `onUncaughtError` e `onCaughtError` para customizar esse tratamento.
