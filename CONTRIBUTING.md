# Contributing to sandy

## Setup

See `aidd_docs/INSTALL.md`.

## Workflow

1. Open or pick a GitHub issue: no branch without an issue.
2. Branch off `main` as `type/<issue-number>-short-description` (e.g. `feat/12-drag-and-drop`).
3. Keep the architecture boundaries: `src/core` depends on nothing, `src/adapters` and `src/shell` depend on `core` (see `aidd_docs/memory/architecture.md`).
4. Add or extend tests alongside the code.
5. Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` before opening a pull request.

## Conventions

- Commits: Conventional Commits (`<type>(<scope>): description`), imperative, lowercase.
- No attribution metadata in commits or pull requests (no `Co-Authored-By`).
- `sbx` is the single source of truth: never reimplement what it already does.
- Before building a feature, look for a maintained open source project to integrate.
