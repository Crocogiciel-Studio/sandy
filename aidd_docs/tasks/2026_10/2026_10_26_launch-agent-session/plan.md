---
objective: "Depuis sandy, je choisis un dossier de projet et un agent, et l'agent démarre dans une sandbox `sbx` avec sa vraie interface dans un terminal embarqué."
status: pending
---

# Plan: lancer un agent dans une session sandboxée

## Overview

| Field      | Value |
| ---------- | ----- |
| **Goal**   | Premier parcours de bout en bout : terminal embarqué relié à un PTY isolé, puis lancement de `sbx run` pour l'agent choisi. |
| **Source** | Issue GitHub #3 (Crocogiciel-Studio/sandy), `aidd_docs/backlog/spikes/sbx-cli-drivability.md`, `aidd_docs/memory/` |

## Phases

| #   | Phase | File |
| --- | ----- | ---- |
| 1   | Terminal embarqué relié à un PTY isolé | [`phase-1.md`](./phase-1.md) |
| 2   | Lancer un agent `sbx` dans le terminal | [`phase-2.md`](./phase-2.md) |

## Resources

| Source | Verified |
| ------ | -------- |
| registre npm (2026-10-26) | `node-pty` 1.2.0-beta.18 (dist-tag `beta`, la 1.1.0 stable n'a pas les correctifs ConPTY) dépend de `node-addon-api` : module N-API, donc un même binaire charge sous Node (Vitest) et Electron ; prebuilds tentés, sinon `node-gyp`. `@xterm/xterm` 6.0.0, `@xterm/addon-fit` 0.11.0 |
| `sbx run --help` v0.49.2 (spike) | `sbx run [AGENT] [PATH...] --name NAME` crée la sandbox si besoin puis ouvre la session de l'agent ; agents intégrés : claude, codex, cursor, devin, docker-agent, gemini, opencode, shell |

## Decisions

| Decision | Why |
| -------- | --- |
| Le PTY vit dans un `utilityProcess` (`src/pty-host`), piloté par l'adapter `node-pty` via `MessagePort` | un crash natif de `node-pty` ne fait pas tomber l'app (`desktop.md`) |
| Flux terminal renderer ↔ main par IPC, regroupé côté pty-host toutes les ~8 ms | suffisant pour une session ; un `MessagePort` direct vers le renderer reste possible si le débit pose problème |
| Liste d'agents figée dans l'adapter `sbx` (celle du `--help` v0.49.2) | `sbx` n'expose pas cette liste en JSON ; à revoir si `sbx` en ajoute une |
| `node-pty` épinglé sur la ligne 1.2 bêta | recommandé par l'audit de stack pour les correctifs ConPTY sous Windows |
