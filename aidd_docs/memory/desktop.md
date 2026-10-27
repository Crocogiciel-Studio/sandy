# Desktop

## Framework

- Electron. Le process principal vit dans `src/shell/electron`, le PTY dans un `utilityProcess` (`src/pty-host`), relié par MessagePort.

## Native access

- Process `sbx` lancés via `child_process` et `node-pty`, uniquement depuis les adapters.
- Glisser-déposer : chemins obtenus par `webUtils.getPathForFile()` dans le preload (`File.path` n'existe plus).
- Aucun stockage de secrets côté app. Seules les préférences d'UI sont en JSON local.

## Build and release

- `node-pty` est un module natif : ses prebuilds N-API couvrent chaque OS et architecture, donc pas de recompilation (`npmRebuild: false`), mais il reste à exclure de l'asar (`asarUnpack`), avec un build par architecture.
- Electron ne télécharge plus son binaire à l'installation : le `postinstall` lance `install-electron`, sinon `pnpm dev` échoue sur un clone propre.
- pnpm : `node-linker=hoisted`, et `onlyBuiltDependencies` pour les modules natifs (`node-pty` quand il arrivera ; pnpm 10 bloque leurs scripts de build par défaut).
- Le preload est construit en CommonJS (`.cjs`) : Electron l'exige pour un preload sandboxé.
- Linux : construire sur Ubuntu 24.04 ou plus récent.
- Electron sort une version majeure toutes les 8 semaines et n'en supporte que 3 : suivre les mises à jour.
