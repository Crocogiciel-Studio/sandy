---
status: done
---

# Instruction: modèle des projets (logique pure)

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
src/ui/features/sessions/
├── session-state.ts             ✅ OpenSession, SessionState, sessionState, STATE_TEXT (sortis de Sidebar.tsx)
├── group-by-project.ts          ❌ remplacé par projects.ts
├── group-by-project.test.ts     ❌
├── projects.ts                  ✅ projectName, buildProjects, projectState
└── projects.test.ts             ✅
```

## Test Scope

| Scenario     | Action                  | Observable outcome   | Actor                           |
| ------------ | ----------------------- | -------------------- | ------------------------------- |
| Setup        | deux sandboxes et trois sessions en mémoire | données prêtes | system |
| Happy path   | `buildProjects` sur des sandboxes et des sessions | un projet par dossier, avec ses sessions et ses sandboxes | system |
| Edge case    | une sandbox sans workspace | rangée dans le projet « Autres » | system |
| Edge case    | `/a/api/` côté sandbox et `/a/api` côté session | un seul projet | system |
| Edge case    | sessions `waiting` et `attention` dans un projet | pastille `attention` | system |

## Tasks to do

### `1)` Chemin et nom de projet

> Reprendre `projectName` et ajouter la comparaison de chemins.

1. Déplacer `projectName` dans `projects.ts`.
2. Ajouter une clé de comparaison qui retire les séparateurs finaux (`/` et `\`), sans changer le chemin affiché.

### `2)` Construire les projets

> Fusionner sandboxes et sessions ouvertes en projets.

1. `buildProjects(sandboxes, sessions)` : un projet par clé de chemin, avec `path`, `name`, `sessions`, `sandboxes`.
2. Chemin d'une sandbox = `workspaces[0]` ; sans workspace, projet « Autres » (chemin vide), placé en dernier.
3. Ordre : première apparition, sessions avant sandboxes.
4. Supprimer `group-by-project.ts` et son test, dont les cas passent dans `projects.test.ts`.

### `3)` État agrégé d'un projet

> Une pastille par projet.

1. `session-state.ts` : y déplacer `OpenSession`, `SessionState`, `sessionState` et `STATE_TEXT` depuis `Sidebar.tsx`, pour que `projects.ts` et `Sidebar.tsx` les importent sans cycle ; `App.tsx` et `Sidebar.tsx` adaptent leurs imports.
2. `projectState(project)` : `attention` > `working` > `waiting` > `running` ; `undefined` sans session ouverte ou si toutes sont terminées.

## Test acceptance criteria

| Task | Acceptance criteria              |
| ---- | -------------------------------- |
| 1 | `/a/api/` et `/a/api` désignent le même projet ; le chemin affiché reste celui reçu |
| 2 | une sandbox et une session du même dossier donnent un projet ; sans workspace, la sandbox est dans « Autres », en dernier |
| 3 | un projet avec une session `attention` et une `working` est `attention` ; sans session ouverte, aucun état |
