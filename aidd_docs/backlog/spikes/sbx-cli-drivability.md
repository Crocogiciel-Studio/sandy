---
type: spike
status: resolved
source: aidd_docs/product/sandy.md
---

# Spike: sbx CLI drivability

## Question

sandy peut-elle couvrir chaque besoin de la v1 en pilotant uniquement la CLI `sbx`, avec une sortie exploitable par un programme ?

## Decision

Conserver le principe « sandy pilote `sbx` via sa CLI » de `aidd_docs/memory/architecture.md`, ou prévoir une autre voie (API du daemon, réimplémentation) avant de spécifier la v1.

## Bounds

- Evidence needed : le `--help` de chaque commande utile, plus les notes de version qui touchent aux sorties machine.
- Stop when : chaque besoin v1 a un verdict (pilotable, pilotable avec contournement, non pilotable).

## Investigation

| Attempt | Evidence | Result |
| ------- | -------- | ------ |
| Doc web docs.docker.com (référence CLI, get-started) | WebFetch | inexploitable : pages rendues vides ou renvoyant vers d'autres pages |
| Binaire officiel `sbx` v0.49.2 linux-arm64, `--help` de chaque commande | release `docker/sbx-releases` v0.49.2 | inventaire complet des commandes et des flags ci-dessous |
| `sbx ls --json` sans connexion | exécution locale | `Error: not signed in to Docker`, code de sortie 1 : `sbx login` est obligatoire avant toute commande sandbox |
| `sbx settings ls` | exécution locale | fonctionne sans connexion ; `clipboard.imagePaste` vaut `unavailable` sur cet hôte Linux |
| Notes de version v0.40 à v0.50 | `gh release view` | `sbx ls --json` enrichi (`created_at`, CPU, mémoire) ; une « daemon API » est mentionnée mais non documentée ; MSI et WinGet sous Windows |

### Verdict par besoin

| Besoin | Commandes | Sortie machine | Verdict |
| --- | --- | --- | --- |
| Détecter `sbx` et sa version | `sbx version --json` | JSON | pilotable |
| Santé de l'installation | `sbx diagnose --json`, `sbx daemon status --json` | JSON | pilotable |
| Installer `sbx` | Linux : tarball + `install.sh`, `.deb`, `.rpm` ; macOS : `.dmg` ; Windows : `.msi` / WinGet | n/a | pilotable par OS (téléchargement depuis les releases GitHub) |
| Connexion Docker | `sbx login` (navigateur), ou `--username` + `--password-stdin` | code de sortie | pilotable, mais **étape obligatoire de l'onboarding** |
| Lister les sessions | `sbx ls --json` | JSON | pilotable |
| Créer une session | `sbx create [--name] AGENT PATH` | pas de `--json` ; `--no-progress` | pilotable avec contournement : on fixe `--name` soi-même, puis on relit `sbx ls --json` |
| Lancer ou rattacher un agent dans un terminal | `sbx run --name NAME` (rattachement), `sbx run -d` (démarre et affiche l'ID) | TTY interactif | pilotable : c'est le process que sandy lance dans son PTY |
| Agents disponibles | `sbx create --help` : claude, codex, cursor, devin, docker-agent, gemini, opencode, shell, plus les kits | texte | pilotable, liste à parser ou à figer |
| Arrêter, supprimer | `sbx stop --json`, `sbx rm --json [-f]` | JSON | pilotable |
| Glisser-déposer hors workspace | `sbx cp SRC SANDBOX:DST [-L]` | pas de `--json`, code de sortie | pilotable : succès ou échec via le code de sortie |
| Glisser-déposer dans le workspace | aucun : le workspace est monté au même chemin absolu | n/a | rien à faire, transmettre le chemin tel quel |
| Ports (plus tard) | `sbx ports NAME --json`, `--publish`, `--unpublish` | JSON | pilotable |
| Policies réseau (plus tard) | `sbx policy allow network [--sandbox]`, `sbx policy ls`, `sbx policy check` | JSON sur `ls` | pilotable |
| Détecter un 403 en direct (plus tard) | `sbx policy log [NAME] --json --limit N` | JSON, **pas de flux continu** | pilotable par interrogation périodique |
| Secrets (plus tard) | `sbx secret set SERVICE [--sandbox]` via stdin, `sbx secret ls --json` | JSON | pilotable, la valeur ne transite que par stdin |
| Réglages | `sbx settings get/set/ls` | texte | pilotable |

## Outcome

- Result : **oui.** Chaque besoin v1 est pilotable par la CLI `sbx`. Les lectures (`ls`, `version`, `diagnose`, `daemon status`, `ports`, `policy log`, `secret ls`) ont un `--json`. Les actions sans `--json` (`create`, `cp`) se contrôlent par le code de sortie, puis une relecture via `ls --json`. Le principe de `architecture.md` tient.
- Confidence : élevée pour l'existence des commandes et des flags (binaire officiel v0.49.2). Moyenne pour le comportement réel : aucune commande n'a été exécutée sur une vraie sandbox, faute de connexion Docker dans cet environnement.
- Remaining uncertainty :
  - le schéma exact des sorties JSON (non documenté, à figer par des tests de contrat dans l'adapter `sbx`) ;
  - la stabilité de la CLI : versions très fréquentes, avec des breaking changes réguliers dans les notes ;
  - une « daemon API » existe (citée dans les notes de version) mais n'est pas documentée, donc non retenue ;
  - pas de flux d'événements : la détection des 403 se fera par interrogation périodique de `policy log` ;
  - `clipboard.imagePaste` dépend de la plateforme (`unavailable` sous Linux ici).

## Follow-up

- Onboarding v1 : ajouter l'étape `sbx login` (connexion Docker obligatoire) après l'installation.
- Adapter `sbx` : utiliser `--json` partout où il existe, nommer chaque sandbox explicitement (`--name`), traiter les codes de sortie et figer les schémas JSON par des tests de contrat.
- Suivre les breaking changes de `sbx` à chaque release (version minimale supportée vérifiée au démarrage via `sbx version --json`).
- La v1 peut être découpée en epic et en stories.
