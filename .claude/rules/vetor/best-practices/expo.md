---
paths:
  - "**/*.{ts,tsx,js,jsx}"
  - "app.json"
---

> Gerado por `/stack-practices` a partir da documentação de expo@54.0.33 via Context7 em 2026-09-22.
> Conhecimento externo, não um fato observado neste repositório — pode ficar desatualizado.
> Rode `/stack-practices --refresh` periodicamente. Editável — não sobrescrito sem `--refresh`.

# Melhores práticas — expo@54.0.33

- **Relevante para este projeto (que usa `expo-av`):** as APIs `Video` e `Audio` de `expo-av` estão deprecadas desde a SDK 54, substituídas por `expo-video` e `expo-audio`. `expo-av` não recebe mais patches e será removido na SDK 55 — a migração é recomendada.
- Ao migrar de `expo-av` para `expo-audio`: `expo-audio` não reseta automaticamente a posição de playback quando o áudio termina (diferente de `expo-av`). Após `play()`, o player fica pausado no fim do som; para tocar de novo, chame `seekTo(seconds)` para resetar a posição.
- `expo-video` tem um config plugin próprio: para habilitar background playback e Picture-in-Picture, configure em `app.json` (`expo.plugins`, opções `supportsBackgroundPlayback`/`supportsPictureInPicture`) — exige novo build nativo para ter efeito.
- Desde a SDK 53, todos os pacotes `expo-*` do SDK suportam a New Architecture (incluindo bridgeless). A New Architecture é habilitada via `newArchEnabled: true` em `app.json` (na raiz do objeto `expo`, ou por plataforma).
