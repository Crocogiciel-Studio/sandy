# Desktop

## Framework

- Electron. Le process principal vit dans `src/shell/electron`, le PTY dans un processus détaché (`src/pty-host`), relié par socket (voir `architecture.md`).

## Window and quit

- Fermer la fenêtre la masque (elle n'est pas détruite) : les terminaux xterm et la liste des sessions vivent dans le renderer, donc les sessions continuent et reviennent intactes. 
- Quitter (Cmd+Q, menu du tray) avec des sessions ouvre un choix : « Keep running » (défaut) laisse le `pty-host` et les agents tourner, « Stop sessions » les arrête et arrête l'hôte, « Cancel » annule. Sans session, quitter arrête l'hôte.
- Au lancement suivant, sandy se reconnecte à l'hôte, restaure les onglets (`session:list-live`) et rejoue l'écran de chacun. Les sessions finies pendant l'absence n'apparaissent plus. Un titre de session et son état d'activité se rétablissent au prochain signal de l'agent.
- Un hôte laissé par une autre version de sandy (mise à jour) ne peut pas être repris : sandy propose de l'arrêter ou de quitter.
- Windows et Linux : pas de Dock, une icône de zone de notification (`tray.ts`) rouvre la fenêtre. L'icône est livrée hors asar (`extraResources`).

## Native access

- Process `sbx` lancés via `child_process` et `node-pty`, uniquement depuis les adapters.
- Glisser-déposer : chemins obtenus par `webUtils.getPathForFile()` dans le preload (`File.path` n'existe plus).
- Aucun stockage de secrets côté app. Seules les préférences d'UI sont en JSON local.

## Build and release

- Le `pty-host` embarque `@xterm/*` (`externalizeDeps.exclude` : `@xterm/headless` est en CommonJS et l'hôte tourne en Node simple). Il est lancé depuis l'asar par `process.execPath` en mode Node : à vérifier sur un build packagé.
- `node-pty` est un module natif : ses prebuilds N-API couvrent chaque OS et architecture, donc pas de recompilation (`npmRebuild: false`), mais il reste à exclure de l'asar (`asarUnpack`), avec un build par architecture.
- Electron ne télécharge plus son binaire à l'installation : le `postinstall` lance `install-electron`, sinon `pnpm dev` échoue sur un clone propre.
- pnpm : `node-linker=hoisted`, et `onlyBuiltDependencies` pour les modules natifs (`node-pty` quand il arrivera ; pnpm 10 bloque leurs scripts de build par défaut).
- Le preload est construit en CommonJS (`.cjs`) : Electron l'exige pour un preload sandboxé.
- Linux : construire sur Ubuntu 24.04 ou plus récent.
- Electron sort une version majeure toutes les 8 semaines et n'en supporte que 3 : suivre les mises à jour.
