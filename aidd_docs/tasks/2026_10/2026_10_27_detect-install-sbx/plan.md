---
objective: "Au démarrage, sandy détecte si `sbx` est présent et assez récent ; sinon un écran explique comment l'installer selon l'OS, et se débloque seul une fois `sbx` installé."
status: pending
---

# Plan: détecter et installer sbx

## Overview

| Field      | Value |
| ---------- | ----- |
| **Goal**   | Écran d'onboarding « sbx » : détection via `sbx version --json`, installation guidée par OS, re-vérification sans redémarrage. |
| **Source** | Issue GitHub #10 (Crocogiciel-Studio/sandy), `aidd_docs/backlog/spikes/sbx-cli-drivability.md`, `aidd_docs/memory/` |

## Phases

| #   | Phase | File |
| --- | ----- | ---- |
| 1   | Détection de `sbx` : port, adapter, use case, IPC | [`phase-1.md`](./phase-1.md) |
| 2   | Écran d'installation guidée et re-vérification | [`phase-2.md`](./phase-2.md) |

## Resources

| Source | Verified |
| ------ | -------- |
| spike `sbx-cli-drivability.md` (v0.49.2) | `sbx version --json` est la commande de détection ; installation par OS : Linux tarball + `install.sh` / `.deb` / `.rpm`, macOS `.dmg`, Windows `.msi` / WinGet, depuis les releases GitHub `docker/sbx-releases` |
| `sbx version --json` (relevé sur Mac, v0.49.2) | `client.version` = `"v0.49.2"` (préfixe `v`), `server.state` = `"running"` ; fixture dans `src/adapters/sandbox/sbx/__fixtures__/version.json` |

## Decisions

| Decision | Why |
| -------- | --- |
| Installation **guidée** (instructions et lien par OS), sandy ne lance aucun installeur | décision validée sur #10 : pas d'élévation de droits, et le format des installeurs `sbx` bouge vite |
| Version minimale = `0.49.2` (celle contre laquelle l'adapter a été écrit) | seule version observée ; à relever quand un breaking change l'exige |
| Re-vérification au retour de focus de la fenêtre et par bouton « Revérifier » | détecte l'installation sans redémarrage ni polling permanent |
| Détection distincte de `list()` : nouveau `checkInstall()` sur le port | `list()` échoue aussi quand on n'est pas connecté (#11) ; il faut séparer « absent / trop ancien » de « non connecté » |
