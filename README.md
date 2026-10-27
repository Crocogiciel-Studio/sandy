# sandy

[![CI](https://github.com/Crocogiciel-Studio/sandy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Crocogiciel-Studio/sandy/actions/workflows/ci.yml)
[![Release](https://github.com/Crocogiciel-Studio/sandy/actions/workflows/release.yml/badge.svg)](https://github.com/Crocogiciel-Studio/sandy/actions/workflows/release.yml)
[![Latest release](https://img.shields.io/github/v/release/Crocogiciel-Studio/sandy?include_prereleases)](https://github.com/Crocogiciel-Studio/sandy/releases)

Desktop app to run AI coding agents (Claude Code, Codex, Gemini…) in [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) (`sbx`), with a real GUI.

## Download

Installers for macOS, Windows and Linux are on the [Releases page](https://github.com/Crocogiciel-Studio/sandy/releases). sandy needs `sbx` and a Docker sign-in (`sbx login`).

The builds are not signed with a paid certificate yet, so your OS warns on first launch:

- **macOS**: open the `.dmg`, drag sandy to Applications, then right-click it and choose **Open**. If macOS says the app is damaged, run `xattr -dr com.apple.quarantine /Applications/sandy.app`.
- **Windows**: in the SmartScreen dialog, click **More info**, then **Run anyway**.
- **Linux**: `chmod +x sandy-*.AppImage && ./sandy-*.AppImage`.

## Develop

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Release

Push a version tag; the `Release` workflow builds the installers and publishes them.

```sh
git tag v0.1.0 && git push origin v0.1.0
```
