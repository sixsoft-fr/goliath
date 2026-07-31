# Design — Subject context (ressource courante)

**Date:** 2026-07-31  
**Statut:** validé — prêt pour plan d'implémentation

## Contexte

Brouillon incomplet dans `src/modules/core/context/subject.context.tsx` : types incohérents (`setSubject` passé sans être dans le type), check `if (!context)` inerte (valeur par défaut non-null), API de pose peu ergonomique.

Le sujet représente la ressource « courante » (page show/edit) et expose `resource` / `identifier` pour que les consommateurs (ex. `useFlex`) configurent un `FlexService` — sans couplage au service dans le contexte.

## Choix validés

| Sujet | Décision |
|---|---|
| Rôle | Page show/edit + bridge `resource` / `identifier` |
| API de mutation | Setters fluides (`setResource`, `setIdentifier`, `setModel`) |
| `identifierType` | Déduit automatiquement |
| Pont service | Aucun — le consommateur lit le sujet puis appelle `useFlex` / `new FlexService(resource)` |
| Pattern React | Comme `AuthContext` : `createContext(null)`, throw hors provider |
| Props Provider | Aucune (approche 1 pure) — seed via setters |

## Architecture

Fichier unique : `src/modules/core/context/subject.context.tsx`.

```
SubjectProvider (useState)
  └─ SubjectContext value = { state + setters + clear }
       └─ useSubject() → throw si null
```

État :

```ts
type IdentifierType = "uuid" | "id" | "slug"

type SubjectState = {
  resource: string | undefined
  identifier: string | number | undefined
  identifierType: IdentifierType | undefined
  model: Model | undefined
}
```

Valeur contexte = `SubjectState` + méthodes de mutation.

Helper exporté (testable) : `inferIdentifierType(value)`.

Export depuis `@/modules/core` (barrel `index.ts`).

## API

```ts
const {
  resource,
  identifier,
  identifierType,
  model,
  setResource,
  setIdentifier,
  setModel,
  clear,
} = useSubject()

setResource("users").setIdentifier(user.uuid)
setModel(loadedUser)
clear()
```

### Setters fluides

- Chaque setter met à jour l’état React et **retourne l’objet fluent** (pas le state), pour chaîner sans attendre le re-render.
- `setResource(name: string)`
- `setIdentifier(value: string | number)` — pose `identifier` + `identifierType` via `inferIdentifierType`
- `setModel(model: Model)` — générique optionnel `Model & T` acceptable si simple à typer
- `clear()` — reset à l’état vide (tous les champs `undefined`)

### Déduction `identifierType`

| Entrée | Résultat |
|---|---|
| `typeof value === "number"` | `"id"` |
| string matching UUID v4/standard | `"uuid"` |
| autre string | `"slug"` |

Pas de surcharge manuelle du type dans le MVP.

## Flux de données (usage typique)

```ts
const { setResource, setIdentifier, setModel, resource, identifier } = useSubject()

useEffect(() => {
  setResource("users").setIdentifier(id)
}, [id])

const query = useFlex(resource!, identifier!)
useEffect(() => {
  if (query.data) setModel(/* modèle extrait */)
}, [query.data])
```

Le Provider se place au niveau layout app ou page ressource selon le besoin — **hors scope** de ce fichier.

## Erreurs

- `useSubject()` hors `<SubjectProvider>` → `throw new Error("useSubject must be used within <SubjectProvider>")`
- Pas de validation métier sur `resource` (string libre, comme `FlexService`)

## Tests (vitest)

Fichier : `src/modules/core/context/subject.context.test.tsx` (ou voisin).

Couverture minimale :

1. `inferIdentifierType` — number → `id` ; UUID → `uuid` ; slug → `slug`
2. Provider — chaîne `setResource` → `setIdentifier` → état cohérent (`identifierType` déduit)
3. `setModel` pose le modèle
4. `clear` remet l’état vide
5. `useSubject` hors provider throw

Helpers de test : pas de helpers inventés dans le fichier de test ; `inferIdentifierType` vit dans le module source.

## Hors périmètre

- Wiring pages users / show-edit
- Modification de `useFlex` / `FlexService`
- Props initiales sur `SubjectProvider`
- Override manuel de `identifierType`
- Sync automatique sujet ↔ singleton `service`

## DOX

Après implémentation : si `src/modules/core/context/` devient une frontière durable, ajouter un `AGENTS.md` enfant (Purpose / Ownership / Local Contracts) et l’indexer depuis le parent core ou root selon la structure DOX du moment.
