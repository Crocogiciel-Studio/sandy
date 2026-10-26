---
objective: "Permettre à un dev de mener une session d'agent sandboxée de bout en bout sans taper une seule commande sbx."
revision: current
---

# Product Brief: sandy

sandy est un ADE desktop open source qui pilote Docker Sandboxes (`sbx`) pour les devs qui codent avec des agents IA. Il en est au stade de l'idée cadrée : architecture choisie, aucun code.

## Opportunity

Faire tourner un agent dans une sandbox `sbx` est la façon sûre de l'utiliser en mode bypass. Mais chaque interaction entre l'hôte et la sandbox passe par une commande : copier un fichier, ouvrir un port, autoriser un domaine, ajouter un secret. La session de l'agent s'interrompt à chaque fois. La cause de fond, c'est que l'hôte et la sandbox ont deux systèmes de fichiers et deux réseaux distincts. Ce qui marche naturellement en local (coller une image, ouvrir `localhost:3000`) casse en sandbox.

Les alternatives actuelles sont la CLI ou la TUI de `sbx`, ou bien un éditeur ou une app branchés sur la sandbox en SSH (VS Code, Cursor, Claude Desktop, T3 Code, Orca). Dans ce dernier cas, la sandbox est vue comme une simple machine distante, sans pilotage de ses ports, policies ou secrets, et le setup est manuel et fragile.

## Audience and Context

- D'abord l'auteur : un dev qui code surtout avec des agents, utilise `sbx` systématiquement et maîtrise sa CLI. Ce qui lui coûte, c'est la friction répétée.
- Ensuite : des devs qui veulent faire du dev agentic en sécurité mais ne franchissent pas le pas, parce qu'ils ne connaissent pas `sbx` ou ne veulent pas apprendre sa CLI.

## Product Bet

Si chaque friction entre l'hôte et la sandbox se résout par un geste dans l'interface, au moment où elle se présente, alors travailler en sandbox devient aussi fluide qu'en local. La sandbox devient le choix par défaut, plus un effort. La v1 vise la friction la plus fréquente, donner des fichiers à l'agent. Elle s'accompagne des terminaux d'agents en parallèle et d'un onboarding qui installe `sbx`.

## Evidence and Assumptions

| Claim | Status | Basis or next check |
| --- | --- | --- |
| Copier-coller une image dans une session sandboxée échoue (chemin hôte inaccessible à l'agent) | evidence (auteur, n=1) | vécu, conversation du 2026-10-26 |
| Les commandes `sbx` interrompent les sessions (fichiers, 403, ports, secrets) | evidence (auteur, n=1) | brainstorm du 2026-10-23 |
| Docker ne propose pas d'interface graphique pour `sbx` | evidence | notes de version v0.43 à v0.50 et doc officielle, vérifiées le 2026-10-26 |
| Brancher un ADE existant sur une sandbox en SSH est trop pénible pour être adopté | evidence (auteur, n=1) | essai T3 Code du 2026-10-26 : le kit `t3code` échoue sur `libatomic1`, puis l'environnement SSH est introuvable dans T3, et l'essai est abandonné |
| Les intégrations SSH ne couvrent pas les frictions (fichiers, ports, 403) | assumption, acceptée sans test | la doc T3 Code n'en parle pas ; revérifier si un ADE annonce un support de `sbx` |
| Les fichiers du projet n'ont pas besoin de copie (workspace monté au même chemin) | evidence | doc `sbx` ; seuls les fichiers hors projet ont besoin de `sbx cp` |
| `clipboard.imagePaste` ne résout pas le cas des screenshots | assumption | l'activer et refaire le test du collage |
| sandy peut tout faire en pilotant la CLI `sbx` | assumption, critique | spike : sorties JSON, `cp`, `ports`, `policy`, `secret`, événements ou logs exploitables |
| Des devs non initiés adopteraient le sandboxing grâce à une GUI | assumption | à tester après la v1, auprès de quelques devs |
| sandy pilote `sbx` et ne refait rien de ce qu'il fait | decision | brainstorm, `aidd_docs/memory/architecture.md` |
| sandy est un outil autonome, pas une extension d'un ADE existant | decision | 2026-10-26, après l'essai T3 Code |

## Boundaries

- Addresses: piloter des sessions `sbx` multi-agents depuis une GUI desktop, et résoudre les frictions entre l'hôte et la sandbox.
- Leaves out: remplacer `sbx` (isolation, secrets, policies restent les siens), être un éditeur de code, les sandboxes cloud.

## Success

- Pour l'auteur : une journée de travail type se fait entièrement dans sandy, sans taper aucune commande `sbx` dans un terminal à côté.
- Signal de valeur : le nombre de commandes `sbx` tapées hors de sandy par semaine, qui doit tendre vers zéro.
- Garde-fou : une session dans sandy ne doit pas être plus lente ni moins stable qu'avec `sbx run` directement.

## Validation and Feedback

- Prochaine validation : un spike sur la doc et la CLI de `sbx`, pour confirmer que chaque action de la v1 (installer, créer et lancer une session, `cp`) est pilotable proprement, avec une sortie lisible par une machine.
- Retours après usage : chaque semaine, l'auteur note les commandes `sbx` qu'il a encore dû taper. Chacune devient une issue GitHub candidate et oriente la priorité des frictions suivantes.

## Open Decisions

- Comportement exact du glisser-déposer pour un fichier hors projet : où il atterrit dans la sandbox, et comment le chemin est transmis.
