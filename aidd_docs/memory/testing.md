# Testing

## Strategy

- Unitaires sur `src/core` : les use cases sont testés avec des faux adapters en mémoire, sans Electron ni `sbx`.
- Intégration sur les adapters : l'adapter `sbx` est testé contre la vraie CLI quand elle est disponible.

## Tools

- Vitest.

## Conventions

- Le cœur est testable sans rien lancer : c'est la raison d'être des ports.
