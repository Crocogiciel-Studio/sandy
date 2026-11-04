---
status: done
---

# Instruction: sidebar de projets et page projet

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
src/ui/
├── app/
│   ├── App.tsx                          ✏️ imports de session-state ; vue active : nouvelle session, projet ou terminal ; sandboxes remontées
│   └── app.css                          ✏️ lignes de projet, page projet
└── features/sessions/
    ├── Sidebar.tsx                      ✏️ « Nouvelle session » + liste de projets
    ├── ProjectPage.tsx                  ✅ sessions en cours, sandboxes, nouvelle session
    ├── use-sandboxes.ts                 ✅ liste de sandboxes et actions arrêter / supprimer
    ├── LaunchSession.tsx                ✏️ projet pré-rempli optionnel
    └── SandboxList.tsx                  ❌ repris par ProjectPage et use-sandboxes
```

## Test Scope

| Scenario     | Action                  | Observable outcome   | Actor                           |
| ------------ | ----------------------- | -------------------- | ------------------------------- |
| Setup        | deux projets, un agent Claude qui travaille dans l'un | sidebar à deux projets | browser |
| Happy path   | cliquer un projet | la page liste ses sessions en cours et ses sandboxes | browser |
| Happy path   | « Nouvelle session » depuis la page projet | le formulaire s'ouvre avec ce dossier choisi | browser |
| Happy path   | ouvrir une session depuis la page | le terminal s'affiche, la pastille du projet suit l'état | browser |
| Happy path   | cliquer une session sous un projet dans la sidebar | son terminal s'affiche directement | browser |
| Edge case    | sandbox existante sans session | elle apparaît dans la page de son projet, sans pastille | browser |
| Edge case    | sandbox sans workspace | rangée dans « Autres », non ré-attachable | browser |
| Edge case    | `sbx ls` échoue | message d'erreur, sidebar limitée aux sessions ouvertes | browser |
| Teardown     | supprimer la sandbox de test | le projet disparaît de la sidebar s'il n'a plus rien | browser |

## Wireframe

```txt
┌────────────────┬─────────────────────────────────────┐
│ (1) Nouvelle   │ (4) api                              │
│     session    │ ─────────────────────────────────── │
│ ────────────── │ (5) Sessions en cours                │
│ (2) ● api      │   ● claude          travaille        │
│      ● claude  │   ○ codex (2)       terminée (0)     │
│      ○ codex(2)│ (6) Sandboxes                        │
│     ○ web      │                                      │
│                │   claude-api-b3482f  running  [Arrêter] [Supprimer] │
│ (3) Connecté   │ (7) [Nouvelle session]               │
└────────────────┴─────────────────────────────────────┘
```

1. Nouvelle session : le formulaire actuel.
2. Projets : un par dossier, pastille d'état agrégée ; ses sessions ouvertes dessous, une par ligne avec leur pastille, qui ouvrent directement le terminal. Aucune sandbox.
3. Compte Docker : inchangé.
4. Projet ouvert : son nom, son chemin en infobulle.
5. Sessions en cours : mêmes sessions que dans la sidebar ; ouvrir (affiche le terminal) ou fermer.
6. Sandboxes du projet : ré-attacher, arrêter, supprimer (au survol ou focus), « Actualiser ».
7. Nouvelle session sur ce projet.

## Tasks to do

### `1)` Liste de sandboxes remontée

> Une seule source de sandboxes pour la sidebar et la page.

1. `use-sandboxes.ts` : charge via `session.listSandboxes`, expose `sandboxes`, `error`, `refresh`, `busy`, `stop`, `remove` (confirmation conservée), reprenant la logique de `SandboxList.tsx`.
2. `App.tsx` : appelle le hook, relit après chaque session ouverte, terminée ou fermée.

### `2)` Sidebar de projets

> Projets avec leurs sessions dessous, sans sandboxes.

1. `Sidebar.tsx` : bouton « Nouvelle session », puis par projet de `buildProjects` un en-tête cliquable (nom, pastille `projectState`, chemin en infobulle) ouvrant la page projet, ses sessions ouvertes dessous (lignes actuelles : pastille, libellé, état, Fermer), puis le compte Docker. Un projet sans session ouverte n'a que son en-tête.
2. Retirer `SandboxList` de la sidebar.

### `3)` Page projet

> Sessions, sandboxes et nouvelle session d'un projet.

1. `ProjectPage.tsx` : sections du wireframe ; une sandbox ré-attachable ouvre un terminal via `attach`, comme `SandboxList` aujourd'hui.
2. Une sandbox sans workspace reste visible mais non ré-attachable.
3. Supprimer `SandboxList.tsx`.

### `4)` Navigation

> Trois vues : nouvelle session, projet, terminal.

1. `App.tsx` : la vue active vaut `new`, un chemin de projet ou l'id d'une session ; ouvrir une session affiche son terminal.
2. `LaunchSession.tsx` : prop optionnelle pour pré-remplir le dossier ; « Nouvelle session » de la page projet l'utilise.
3. `app.css` : classes pour la page projet, tokens uniquement.

## Test acceptance criteria

| Task | Acceptance criteria              |
| ---- | -------------------------------- |
| 1 | la liste se recharge après l'ouverture ou la fin d'une session ; une erreur de `sbx ls` s'affiche sans bloquer le reste |
| 2 | la sidebar liste un projet par dossier avec ses sessions dessous ; un clic sur une session ouvre son terminal sans passer par la page projet ; la pastille d'un projet dont un agent travaille pulse ; plus de section « Sandboxes » |
| 3 | la page d'un projet montre ses sessions et ses sandboxes ; arrêter, supprimer et ré-attacher fonctionnent comme avant |
| 4 | « Nouvelle session » depuis la page projet ouvre le formulaire avec le dossier choisi ; ouvrir une session affiche son terminal |
