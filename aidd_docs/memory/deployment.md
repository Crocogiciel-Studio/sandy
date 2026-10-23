# Deployment

## Pipeline

- GitHub Actions : lint, tests et build sur macOS, Windows et Linux, par architecture (x64, arm64, mac universel).
- Pas de serveur ni d'environnement hébergé : sandy est une app locale.

## Release

- `electron-builder` publie les installeurs sur GitHub Releases, et `electron-updater` les distribue.
- Pas de signature payante pour l'instant : signature ad hoc sur macOS, contournement Gatekeeper et SmartScreen documenté dans le README.
- Plus tard : SignPath (gratuit pour l'open source) pour Windows, puis Apple Developer quand l'auto-update macOS deviendra nécessaire.
