# sandy — un ADE desktop « sandbox-first »

sandy est une application desktop open source et cross-platform qui pilote Docker Sandboxes (`sbx`). Elle rend le développement avec des agents IA **sécurisé par défaut et accessible**. Aujourd'hui, les ADEs ne sont pas pensés pour le sandboxing, et `sbx` oblige à taper une commande pour chaque interaction : copier un fichier, autoriser un domaine, ouvrir un port, ajouter un secret. Chaque fois, la session de l'agent s'interrompt. sandy remplace ces commandes par des gestes directs dans une vraie interface graphique, et offre une vue d'ensemble des projets et des sessions.

Le premier utilisateur est son auteur, un dev qui code surtout avec des agents dans des sandboxes. Le projet vise aussi un dev qui n'a jamais sandboxé : il doit pouvoir partir de zéro. La philosophie du projet : **ne pas réinventer la roue**. Avant chaque fonctionnalité, on cherche s'il existe une solution open source sérieuse et maintenue qu'on peut intégrer.

## Ce qui est clair

- C'est un vrai logiciel desktop, pas une TUI. Cross-platform (macOS, Windows, Linux) et open source.
- C'est une surcouche de `sbx`, donc **multi-agents** : tout agent que `sbx` sait lancer fonctionne.
- Chaque session d'agent s'affiche dans un **terminal embarqué** qui montre la vraie interface de l'agent dans la sandbox.
- **v1** :
  - onboarding : sandy détecte et installe les outils nécessaires (Docker, `sbx`…) ;
  - création et gestion de sessions sandboxées multi-agents dans un terminal embarqué ;
  - **glisser-déposer de fichiers fiable** : copie dans la sandbox, chemin transmis à l'agent.
- **Ensuite**, les autres frictions : ports, autorisations réseau (réagir aux 403), secrets, diffs, logs et monitoring des sessions, kits et skills préinstallés à la création d'une sandbox.
- **v2, la fonctionnalité phare : l'aperçu annoté.** sandy affiche l'app en cours de développement. Tu sélectionnes un élément HTML comme dans l'inspecteur de Chrome, ou une zone en screenshot (les deux modes), tu laisses un commentaire, et l'agent implémente directement. L'esprit est celui des artefacts de Claude.
- **Les annotations suivent un format défini à l'avance**, transmis à l'agent par un processus déterministe, par exemple une skill installée dans la sandbox qui sait les lire. Le but est que le résultat ne dépende pas de l'humeur de l'agent.
- Règle de conduite : vérifier l'existant open source avant de construire chaque brique.

## Encore ouvert

- **Ce que veut dire « correctement » pour le glisser-déposer.** Plusieurs fichiers d'un coup, un dossier, un screenshot collé depuis le presse-papiers, et où ça atterrit dans la sandbox. À préciser au moment de spécifier la v1.
- **Quelle part de `sbx` est pilotable proprement** (CLI, sortie JSON, API) et quels événements sandy peut écouter, par exemple les 403 en temps réel.
- **L'existant open source à évaluer** : ADEs, terminal embarqué, inspection d'éléments web.

## Prochaine étape

Choisir l'architecture et la stack de l'app desktop cross-platform. Ça commence par repérer les projets open source qu'on pourrait réutiliser pour le terminal embarqué, l'aperçu et l'inspection d'éléments.
