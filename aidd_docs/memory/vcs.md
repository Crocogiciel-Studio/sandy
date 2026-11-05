# VCS

## Setup

- Main branch: `main`
- Platform: `github`

## Branches

- Format: `type/<issue-number>-short-description` (ex. `feat/12-drag-and-drop`)
- Pas de branche sans issue GitHub.
- Types in use: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

## Commits

- Convention: Conventional Commits
- Format: `type(scope): description`
- Rules: impératif, minuscules, sert à générer les notes de release
- Aucune métadonnée d'attribution : pas de `Co-Authored-By`, pas de mention « Generated with », ni dans les commits ni dans les PR.

## Commit Strategy

AI should auto commit: `after feature`

## Delivery cycle

- Plan, implémentation, revue, PR en draft, puis l'utilisateur teste sur sa machine et merge.
- L'utilisateur ne peut tester qu'une branche poussée : après l'implémentation, pousser la branche et ouvrir la PR en draft avant de lui demander de tester. Un commit local ne lui est d'aucune utilité.
