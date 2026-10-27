# Design

## System

- UI React dans `src/ui`, découpée par feature.
- Sandbox-first, calme, peu encombré : le terminal est l'élément principal, le reste s'efface. Le seul signal visuel fort est la frontière de la session, dont la couleur dit l'état.
- Tokens CSS dans `src/ui/app/theme.css` (sombre par défaut, clair selon le système). Aucune couleur en dur dans les composants : `var(--...)`.

## Tokens

| Token | Rôle |
| ----- | ---- |
| `--bg`, `--surface`, `--line` | fond, surfaces (sidebar, palette), séparateurs |
| `--text`, `--text-muted` | texte principal, secondaire |
| `--isolated` | session en cours dans sa sandbox (jamais décoratif) |
| `--attention` | une action est attendue (autorisation réseau, 403) |
| `--danger` | erreurs uniquement ; une sandbox arrêtée est en gris, pas en couleur |
| `--term-*` | les 16 couleurs ANSI du terminal, lues par `terminal-theme.ts` |

## Typography

- UI : Instrument Sans (400, 500, 600). Terminal : Commit Mono (400, 700). Polices OFL embarquées via `@fontsource` (l'app est hors ligne, CSP `font-src 'self'`).
- Sentence case partout, pas de majuscules d'étiquette.

## Components

- Terminal : xterm.js avec l'addon WebGL, et repli sur le renderer DOM si le contexte WebGL est perdu. Son thème est dérivé des tokens et suit le thème du système.

## Direction (écrans à venir)

- Sidebar étroite de sessions groupées par projet, un point d'état par session, sans barre d'onglets.
- Actions à la demande (survol, palette `⌘K`), pas de boutons permanents. Pas de cartes ni de dégradés.
- Vocabulaire de l'utilisateur, pas celui de `sbx`.
