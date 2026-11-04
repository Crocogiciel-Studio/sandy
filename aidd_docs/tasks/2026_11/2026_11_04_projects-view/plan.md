---
objective: "La sidebar liste les projets (pastille de travail en cours agrégée) avec leurs sessions ouvertes dessous ; ouvrir un projet affiche sa page : sessions en cours, sandboxes (ré-attacher, arrêter, supprimer) et démarrage d'une session."
status: done
---

# Plan: vue projets avec leurs sessions

Source: issue GitHub #40 (Crocogiciel-Studio/sandy)

## Phases

| #   | Phase        | File                         | Depends on |
| --- | ------------ | ---------------------------- | ---------- |
| 1   | Modèle des projets (logique pure) | [`phase-1.md`](./phase-1.md) | none |
| 2   | Sidebar de projets et page projet | [`phase-2.md`](./phase-2.md) | 1 |
| 3   | Documentation de la navigation et du design | [`phase-3.md`](./phase-3.md) | 2 |

## External sources

| URL   | What it settled   |
| ----- | ----------------- |
| none | none |

## Impact

| Category | Verdict and evidence | Handled in |
| -------- | -------------------- | ---------- |
| runtime | `sbx ls --json` donne `workspaces: string[]` par sandbox (fixture `src/adapters/sandbox/sbx/__fixtures__/ls.json`). Unverified : égalité exacte entre le chemin choisi dans le dialogue et `workspaces[0]` (lien symbolique, slash final, casse Windows) ; un écart afficherait deux projets pour un même dossier | 1 |
| regression | `Sidebar.tsx`, `SandboxList.tsx`, `App.tsx`, `LaunchSession.tsx` changent. Seul `group-by-project.test.ts` les couvre ; aucun test de composant. Risque medium : l'attache, l'arrêt et la suppression de sandbox ne sont couverts que côté core (`attach-session.test.ts`, `manage-sandbox.test.ts`). Pas de phase filet : le core et l'IPC ne changent pas | 2 |
| architecture | Aucun changement : tout vit dans `src/ui` (la source de vérité reste `sbx ls`, relu à la demande, pas de cache durable). Le core, les ports, l'IPC et `contracts` sont inchangés | none |
| documentation | `aidd_docs/memory/design.md` (Layout décrit la sidebar avec sandboxes) et `navigation.md` (pas de vue projet) | 3 |

## Rules

| Rule | Why it applies |
| ---- | -------------- |
| `sbx` seule source de vérité, pas d'état de sandbox en cache durable (architecture.md) | la liste de sandboxes est relue à chaque événement, jamais persistée |
| Pas de couleur en dur, styles en classes dans `app.css`, actions au survol ou focus clavier, pas de cartes ni de dégradés (design.md) | la page projet et la sidebar |
| Vocabulaire de l'utilisateur, pas celui de `sbx` (design.md) | libellés « projet », « session » |
| Avant commit : `pnpm typecheck`, `pnpm lint` ; avant push : `pnpm test`, `pnpm build` (coding-assertions.md) | validation de chaque phase |

## Decisions

| Decision | Why |
| -------- | --- |
| Un projet = un dossier de workspace, formé des sandboxes (`workspaces[0]`) et des sessions ouvertes ; les sandboxes sans workspace vont dans un projet « Autres » | décidé avec l'auteur : les sandboxes vivent dans la vue de leur projet, la section « Sandboxes » disparaît de la sidebar |
| La sidebar liste les projets avec leurs sessions ouvertes dessous ; les sandboxes sont seulement sur la page projet | changer de session reste un clic (passer par la page projet l'alourdirait) ; la sidebar ne mélange plus les sandboxes avec le reste |
| Pastille d'un projet = état le plus urgent de ses sessions : autorisation > travaille > à vous > en cours | un projet qui attend l'utilisateur doit se voir sans l'ouvrir |
| La liste de sandboxes est relue au démarrage, après chaque session ouverte ou terminée, après arrêt ou suppression, et par « Actualiser » | pas de polling : `sbx` n'a pas de flux d'événements |
