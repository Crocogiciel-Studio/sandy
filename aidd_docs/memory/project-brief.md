# Project Brief

## What it is

- sandy : un ADE (Agent Development Environment) desktop, open source et cross-platform, qui pilote Docker Sandboxes (`sbx`) depuis une vraie interface graphique.
- Pour les devs qui codent avec des agents IA (Claude Code, Codex, Gemini… tout ce que `sbx` lance) : d'abord son auteur, puis quiconque veut faire du dev agentic en sécurité sans connaître la CLI.

## Why it exists

- Les ADEs existants ne sont pas pensés pour le sandboxing. Avec `sbx`, chaque interaction (copier un fichier, autoriser un domaine, ouvrir un port, ajouter un secret) est une commande qui interrompt la session de l'agent.
- But : rendre le dev agentic sandboxé sûr par défaut, avec un faible ticket d'entrée.
- Différenciation face à l'interface officielle de `sbx` : agents en parallèle, glisser-déposer dans la session, aperçu annoté.

## Domain language

| Term | Meaning |
| ---- | ------- |
| sandbox | une microVM `sbx` isolée où tourne un agent, avec ses propres policies réseau, ports et secrets |
| session | un agent qui tourne dans une sandbox, affiché dans un terminal embarqué de sandy |
| agent | la CLI de codage IA lancée par `sbx` (Claude Code, Codex, Gemini…) |
| kit | un ensemble préinstallé (framework, skills) appliqué à la création d'une sandbox |
| drop | un fichier glissé dans une session : copié dans la sandbox, puis son chemin est transmis à l'agent |
| annotation | (v2) un commentaire attaché à un élément HTML ou une zone de l'aperçu, envoyé à l'agent dans un format fixe |

## Key features

- v1 : onboarding (détecter et installer `sbx`), sessions sandboxées multi-agents dans des terminaux embarqués, glisser-déposer de fichiers fiable.
- Ensuite : ports en un clic, autorisations réseau (réagir aux 403), secrets, diffs, logs de session, kits.
- v2 : aperçu live de l'app développée, avec inspecteur d'éléments et capture de zone, et des annotations transmises à l'agent par un processus déterministe.
- Brief complet : `aidd_docs/tasks/2026_10/2026_10_23_sandy/brainstorm.md`.
