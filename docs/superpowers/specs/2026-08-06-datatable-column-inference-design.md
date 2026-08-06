# Design — Déduction des colonnes DataTable (frontend)

**Date:** 2026-08-06  
**Statut:** validé — prêt pour plan d'implémentation

## Contexte

`src/components/ds/resources/list/index.tsx` est une table générique pilotée par
un `resource: string` : fetch via `useFlexList` → lignes `DynamicModel<unknown>`
(`Model & Record<string, unknown>`) → `<DataTable>`. La prop `columns` passée à
`useDataTable` (ligne 19) est **référencée mais jamais définie** — c'est le trou à
combler.

Comme la ressource est générique, il n'existe pas de type de colonne statique par
entité. Les colonnes doivent être **déduites d'un objet ligne** (« discover any
row object to deduce columns »).

Contrainte structurante : la DataTable est server-driven via
spatie/laravel-query-builder. Tri/filtre exigent des clés whitelistées côté
serveur (`allowedSorts` / `allowedFilters`). Le client **ne peut pas** inventer
ces clés à partir des seules valeurs. Voir le spec backend jumeau
[`2026-08-06-datatable-field-schema-backend-design.md`](2026-08-06-datatable-field-schema-backend-design.md).

## Choix validés

| Sujet | Décision |
|---|---|
| Source des colonnes | Hybride, séquencé en 2 phases |
| Phase 1 | Inférence pure depuis les lignes — cellule choisie par valeur, **sans** tri/filtre |
| Phase 2 | Lecture de `meta.fields` (schéma serveur) pour tri/filtre/options ; inférence = fallback cellule |
| Choix de cellule | Par valeur/clé (email, date, number, boolean/status, sinon texte) |
| Clés tri/filtre | **Jamais** inférées — proviennent uniquement de `meta.fields` (Phase 2) |
| Libellés | i18n existant `namespace:fields.<key>` |
| Robustesse null | Scan des N premières lignes, merge des clés, fallback texte |

## Architecture

Fichier unique : `src/components/ds/data-table/derive-columns.ts` (helper pur,
exporté depuis le barrel `index.ts`).

```
deriveColumns(rows, schema?) → ColumnDef<DynamicModel<unknown>>[]
  ├─ collecte des clés : union des N premières lignes (défaut N=20)
  ├─ filtre technique : id, morph_name exclus ; deletedAt caché
  ├─ par clé :
  │    ├─ cell = pickCell(key, sampleValue)         (inférence valeur)
  │    └─ meta = schema?.[key] → sortKey/filter      (Phase 2 uniquement)
  └─ header : namespace:fields.<key> via i18n (résolu au rendu, pas ici)
```

`list/index.tsx` : remplacer `columns: columns` par
`columns: deriveColumns(rows, meta?.fields)`. Les colonnes se calculent après le
1er chargement (dépendance sur `query.data`), mémoïsées (`useMemo`).

### `pickCell(key, value)` — table de décision

| Signal (clé ou valeur) | Cellule |
|---|---|
| `value instanceof Date`, ou clé ∈ {`createdAt`,`updatedAt`,`deletedAt`}, ou string ISO-date | `DateCell` |
| `isEmail({ value })` | `EmailCell` |
| `typeof value === "number"` | `NumberCell` |
| `typeof value === "boolean"` ou clé === `status` | `StatusCell` |
| sinon | texte brut (`String(value)`) |

Ordre d'évaluation : Date → email → number → boolean/status → texte. `isEmail`
existe déjà dans `cells/email.cell.tsx`.

### `meta.fields` (Phase 2)

Forme consommée (produite par le spec backend) :

```ts
type FieldSchema = {
  type: "text" | "number" | "boolean" | "date" | "email" | "status"
  sortable: boolean
  filterable?: ColumnFilterDef  // { key, type: 'text'|'select'|'boolean'|'dateRange', options?, multiple? }
}
type FieldsMeta = Record<string /* row key */, FieldSchema>
```

Mapping vers `ColumnDef.meta` :

- `sortable: true` → `meta.sortKey = key`
- `filterable` présent → `meta.filter = filterable`
- `type` prime sur l'inférence pour le choix de cellule (le serveur fait foi) ;
  l'inférence ne sert que si la clé est **absente** de `meta.fields`.

La casse des clés de `meta.fields` doit matcher la casse des clés de ligne
sérialisées (cf. spec backend).

## Cas limites

1. **Champs `null`/`undefined`** : une seule ligne ne suffit pas à typer. → scan
   des N premières lignes ; première valeur non-nulle rencontrée détermine la
   cellule ; colonne entièrement nulle → cellule texte.
2. **Résultat vide** : pas de lignes → pas de colonnes. Accepté ; les colonnes
   apparaissent après le 1er chargement réussi. En Phase 2, `meta.fields` permet
   de construire les colonnes **même sur résultat vide** (source indépendante des
   lignes) — comportement préféré dès que le schéma existe.
3. **Clé présente dans le schéma mais absente des lignes** (Phase 2) : colonne
   créée depuis le schéma, cellule selon `type`.

## API

```ts
// src/components/ds/data-table/derive-columns.ts
export function deriveColumns(
  rows: DynamicModel<unknown>[],
  schema?: FieldsMeta,
): ColumnDef<DynamicModel<unknown>>[]

export function pickCell(key: string, value: unknown): ColumnDef<DynamicModel<unknown>>["cell"]
```

Usage :

```ts
const query = useFlexList<unknown>(resource, dt.queries)
const rows = (query.data?.data ?? []) as DynamicModel<unknown>[]
const columns = useMemo(
  () => deriveColumns(rows, query.data?.meta?.fields),
  [rows, query.data?.meta?.fields],
)
const dt = useDataTable<DynamicModel<unknown>>({ tableId: resource, namespace: resource, columns })
```

> Note d'intégration : `useDataTable` reçoit `columns` en entrée. L'ordre
> hook/colonnes dans `list/index.tsx` devra être réagencé pour que `columns`
> soit calculé avant l'appel au hook. À valider dans le plan.

## Tests (vitest)

Fichier : `src/components/ds/data-table/derive-columns.test.ts`.

Couverture minimale :

1. `pickCell` — chaque branche : Date/clé-date → date ; email → email ;
   number → number ; boolean & clé `status` → status ; string quelconque → texte.
2. `deriveColumns` — exclut `id`/`morph_name` ; cache `deletedAt` ;
   génère un `ColumnDef` par clé métier.
3. Robustesse null — première ligne `{ email: null }`, seconde
   `{ email: "a@b.co" }` → colonne `email` = EmailCell.
4. Phase 2 — avec `schema`, `sortable:true` → `meta.sortKey` posé ;
   `filterable` → `meta.filter` posé ; `type` schéma prime sur l'inférence.
5. Résultat vide + schéma → colonnes construites depuis le schéma.

Pas de framework additionnel ; `isEmail` réutilisé depuis `cells/email.cell.tsx`.

## Hors périmètre

- Production de `meta.fields` (spec backend jumeau).
- Nouveaux renderers de cellule au-delà des 4 existants.
- Réordonnancement/visibilité personnalisés par ressource (gérés par la persistance existante).
- Édition inline, actions de ligne.

## DOX

Après implémentation : mettre à jour `src/components/ds/data-table/AGENTS.md`
(section « Local Contracts » — Colonne) pour documenter `deriveColumns` et la
lecture de `meta.fields`.
