---
status: pending
---

# Instruction: écran d'installation guidée et re-vérification

## Architecture projection

```txt
src/ui/
├── app/App.tsx                                        ✏️ garde : écran sbx tant que statut ≠ ok
└── features/onboarding/
    ├── SbxSetup.tsx                                   ✅ écran missing / outdated
    ├── install-guide.ts (+ .test.ts)                  ✅ instructions et lien par plateforme
    └── use-sbx-status.ts                              ✅ check au montage + au focus
src/shell/electron/ipc/sbx.ts                          ✏️ `sbx:open-releases` (shell.openExternal, URL figée)
```

## User Journey

```mermaid
flowchart TD
  A[Démarrage] --> B[sbx.check]
  B -- ok --> C[Sessions]
  B -- missing / outdated --> D[Écran sbx : instructions pour mon OS]
  D --> E[J'installe hors de sandy]
  E --> F[Retour de focus ou Revérifier]
  F --> B
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    sbx absent du PATH => app lancée: 5: browser
  section Happy path
    ouvrir sandy => écran sbx avec les instructions de mon OS: 5: browser
    installer sbx puis revenir sur la fenêtre => l'écran laisse place aux sessions sans redémarrage: 5: browser
  section Edge case - ancien
    sbx 0.40 => message « mise à jour requise » avec la version trouvée: 1: browser
  section Edge case - installé mais pas dans le PATH de l'app
    clic sur Revérifier => message inchangé, pas de crash: 1: browser
```

## Wireframe

```txt
┌──────────────────────────────────────┐
│ sandy                                │
├──────────────────────────────────────┤
│ 1  sbx est requis                    │
│ 2  Absent / version 0.40 (min 0.49.2)│
│ 3  Instructions pour macOS           │
│ 4  [Ouvrir la page de téléchargement]│
│ 5  [Revérifier]                      │
└──────────────────────────────────────┘
```

1. Titre · 2. Cause (absent ou trop ancien) · 3. Étapes de l'OS détecté · 4. Lien vers les releases `sbx` · 5. Re-vérification manuelle.

## Tasks to do

### `1)` Guide d'installation par OS

> Texte et lien, sans exécution.

1. `install-guide.ts` : pour `darwin` (`.dmg`), `win32` (`.msi` / WinGet), `linux` (`install.sh`, `.deb`, `.rpm`), instructions courtes + URL des releases `docker/sbx-releases`.
2. Plateforme lue via le preload (`process.platform`), pas côté UI directe.

### `2)` Écran et garde

> Bloquer les sessions tant que `sbx` n'est pas utilisable.

1. `use-sbx-status` : appel au montage et sur `window` focus.
2. `SbxSetup` : écran du wireframe, bouton « Revérifier ».
3. `App.tsx` : affiche `SbxSetup` si statut ≠ ok, sinon l'app actuelle ; pendant le chargement, rien de clignotant.
4. IPC `sbx:open-releases` ouvre l'URL figée dans le navigateur (aucune URL venant du renderer).

## Test acceptance criteria

| Task | Acceptance criteria |
| ---- | ------------------- |
| 1 | chaque plateforme renvoie des instructions et une URL `https://github.com/docker/sbx-releases` |
| 2 | sbx absent → écran sbx ; après installation, retour sur la fenêtre → sessions, sans relancer sandy ; `sbx` ok au démarrage → pas d'écran intermédiaire visible |
