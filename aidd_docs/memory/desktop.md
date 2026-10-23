# Desktop

## Framework

- Electron. Le process principal vit dans `src/shell/electron`, le PTY dans un `utilityProcess` (`src/pty-host`), relié par MessagePort.

## Native access

- Process `sbx` lancés via `child_process` et `node-pty`, uniquement depuis les adapters.
- Glisser-déposer : chemins obtenus par `webUtils.getPathForFile()` dans le preload (`File.path` n'existe plus).
- Aucun stockage de secrets côté app. Seules les préférences d'UI sont en JSON local.

## Build and release

- `node-pty` est un module natif : à recompiler pour Electron (`@electron/rebuild`) et à exclure de l'asar (`asarUnpack`), avec un build par architecture.
- pnpm : `node-linker=hoisted`, et scripts de build autorisés pour `electron`, `node-pty` et `esbuild` (pnpm 10 les bloque par défaut).
- Linux : construire sur Ubuntu 24.04 ou plus récent.
- Electron sort une version majeure toutes les 8 semaines et n'en supporte que 3 : suivre les mises à jour.
