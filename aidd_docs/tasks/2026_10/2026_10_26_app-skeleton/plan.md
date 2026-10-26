---
objective: "sandy a un squelette Electron hexagonal où `pnpm dev` ouvre une fenêtre vide, où le lint de frontières protège `src/core`, et où la CI 3 OS fait passer typecheck, lint, test et build."
status: implemented
---

# Plan: squelette de l'app

## Overview

| Field      | Value |
| ---------- | ----- |
| **Goal**   | Poser l'outillage, l'arborescence hexagonale, le lint de frontières et la CI pour que les stories de l'epic #1 puissent être livrées. |
| **Source** | Issue GitHub #2 (Crocogiciel-Studio/sandy), `aidd_docs/INSTALL.md`, `aidd_docs/memory/` |

## Phases

| #   | Phase | File |
| --- | ----- | ---- |
| 1   | Outillage et shell Electron | [`phase-1.md`](./phase-1.md) |
| 2   | Cœur hexagonal, lint de frontières et tests | [`phase-2.md`](./phase-2.md) |
| 3   | CI GitHub Actions 3 OS | [`phase-3.md`](./phase-3.md) |

## Resources

| Source | Verified |
| ------ | -------- |
| registre npm (`npm view`, 2026-10-26) | electron 45.0.0 (node ≥ 22.12), electron-vite 6.0.0 (vite 6–8), vite 8.3.5, @vitejs/plugin-react 6.1.2 (vite 8), react 19.3.1, vitest 5.0.5 (node ^22.12), eslint 10.13.0, typescript-eslint 8.72.0 (**typescript < 6.1**), eslint-plugin-boundaries 7.3.0, pnpm 10.34.9 |
| `aidd_docs/backlog/spikes/sbx-cli-drivability.md` | règle de nommage d'une sandbox `sbx` (`--name`) utilisée par le premier objet de domaine |

## Decisions

| Decision | Why |
| -------- | --- |
| TypeScript 6.0.x, pas 7 | typescript-eslint 8.72 exige `typescript < 6.1` ; TS 7 casserait le lint |
| pnpm 10 épinglé via `packageManager` | conforme à `INSTALL.md` ; `onlyBuiltDependencies` y est le mécanisme documenté pour autoriser les scripts de build d'`electron` et `esbuild` |
| electron-vite avec entrées personnalisées (`src/shell/electron/main.ts`, `src/shell/electron/preload/index.ts`, `src/ui`) | l'arborescence hexagonale de `INSTALL.md` remplace la structure par défaut `src/main`, `src/preload`, `src/renderer` |
| `postinstall: install-electron` | Electron 45 ne télécharge plus son binaire à l'installation ; sans ce script, `pnpm dev` échoue sur un clone propre |
| Preload construit en CommonJS (`.cjs`) | Electron exige un preload CommonJS quand `sandbox: true`, alors que le paquet est en `type: module` |
| L'UI peut importer des paquets externes, sauf `electron` | React et ses dépendances sont nécessaires ; le renderer ne parle au process principal que par l'API du preload |
| Node 22.12+ requis, CI sur Node 24 | `INSTALL.md` recommande Node 24 LTS ; `engines` accepte 22.12+ (minimum d'Electron 45 et de Vitest 5) |
| `node-pty` hors de ce plan | aucun PTY n'est nécessaire pour une fenêtre vide ; il arrive avec la story #3 |
