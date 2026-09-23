---
paths:
  - "**/*.{ts,tsx,js,jsx}"
---

> Gerado por `/stack-practices` a partir da documentação de react-native@0.81.5 via Context7 em 2026-09-22.
> Conhecimento externo, não um fato observado neste repositório — pode ficar desatualizado.
> Rode `/stack-practices --refresh` periodicamente. Editável — não sobrescrito sem `--refresh`.

# Melhores práticas — react-native@0.81.5

- `Clipboard` importado diretamente de `react-native` (`import { Clipboard } from 'react-native'`) foi totalmente removido do core a partir da 0.82 — use um pacote da comunidade (ver reactnative.directory) em vez da API nativa antiga.
- APIs deprecadas com remoção agendada (release 0.87, atual do upstream): `react-native/Libraries/Core/InitializeCore` (usar `react-native/setup-env`), `@react-native/assets-registry` (usar `AssetRegistry` de `react-native` + `@react-native/asset-utils`), `ImageBackground` (usar `View` com `Image` posicionado de forma absoluta), a interface `NativeMethods` (usar `HostInstance`), `Appearance.setColorScheme('unspecified')` (usar `'auto'`).
- Android: `DrawerLayoutAndroid` está deprecado (usar `react-native-drawer-layout`); `UIBlock`/`UIManagerModule.addUIBlock`/`prependUIBlock` estão deprecados (usar `UIManagerListener` ou View Commands).
- iOS: `TimingModule` e `RCTTurboModuleEnabled()`/`RCTEnableTurboModule()` estão deprecados.
