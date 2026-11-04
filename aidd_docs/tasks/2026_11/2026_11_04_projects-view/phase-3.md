---
status: done
---

# Instruction: documentation de la navigation et du design

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
aidd_docs/memory/
├── design.md                            ✏️ Layout : sidebar de projets, page projet
└── navigation.md                        ✏️ Projets entre Onboarding et Terminal
```

## Test Scope

| Scenario     | Action                  | Observable outcome   | Actor                           |
| ------------ | ----------------------- | -------------------- | ------------------------------- |
| Happy path   | relire `design.md` et `navigation.md` | décrivent la sidebar de projets et la page projet | system |

## Tasks to do

### `1)` Mettre la mémoire à jour

> Que la mémoire décrive l'interface livrée.

1. `design.md` : remplacer la ligne Layout de la sidebar (« sessions ouvertes groupées par projet, puis les sandboxes existantes ») par les projets (pastille agrégée) avec leurs sessions ouvertes dessous, et ajouter la page projet qui porte les sandboxes.
2. `navigation.md` : `Sessions --> Projet --> Terminal` dans le diagramme.

## Test acceptance criteria

| Task | Acceptance criteria              |
| ---- | -------------------------------- |
| 1 | `design.md` ne mentionne plus les sandboxes dans la sidebar ; `navigation.md` montre la page projet |
