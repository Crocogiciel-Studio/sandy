# Design

## System

- Interface en anglais uniquement, pas d'i18n : libellés, erreurs du shell et des adapters, `aria-label`, infobulles. Seule `aidd_docs/` reste en français.
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

- Bannière de domaine bloqué : sous l'en-tête du terminal, non modale, bordure `--attention`, une ligne par hôte bloqué. « Keep blocked » est l'action mise en avant ; « Allow … permanently » crée une règle limitée à la sandbox (hôte exact, port compris), jamais globale. Elle ne prend pas le focus : l'utilisateur peut être en train de taper à l'agent.

## Layout

- Sidebar étroite : « New sandbox » (toujours une sandbox neuve), puis les projets (point d'état = session la plus urgente) avec leurs sessions ouvertes dessous. Pas de sandboxes ni de barre d'onglets.
- Page projet (clic sur un projet) : sessions en cours, sandboxes du projet (« New session » = ré-attacher la sandbox, arrêter, supprimer), « New sandbox » pré-remplie. Les sandboxes sans workspace sont dans « Others ».
- Le terminal occupe la zone principale ; son filet est la frontière de sandbox (`--isolated` en cours, `--line` terminée).
- Actions (fermer, arrêter, supprimer) visibles au survol ou au focus clavier seulement. Pas de cartes ni de dégradés.
- Styles en classes dans `app.css`, pas d'inline. Vocabulaire de l'utilisateur, pas celui de `sbx`.
- À venir : palette `⌘K`.
