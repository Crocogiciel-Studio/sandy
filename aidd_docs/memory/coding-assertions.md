# Coding Assertions

## Before commit

| Order | Command | Checks |
| ----- | ------- | ------ |
| 1 | `pnpm typecheck` | TypeScript strict |
| 2 | `pnpm lint` | ESLint, dont les frontières d'architecture (`core` ne dépend de rien) |

## Before push

| Order | Command | Checks |
| ----- | ------- | ------ |
| 1 | `pnpm test` | Vitest |
| 2 | `pnpm build` | build `electron-vite` |

## Behavior

If a fix is needed, spawn 1 agent per assertion to fix (e.g typechecking / tests / rules violated on category UI = 3 agents).
