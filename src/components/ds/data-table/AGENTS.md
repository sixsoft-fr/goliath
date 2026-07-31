# AGENTS.md — data-table

## Purpose

Table générique server-driven (TanStack Table v8, mode manuel) : recherche
globale, filtres colonne, tri, visibilité, réordonnancement DnD, pagination
serveur, persistance localStorage de la vue. Mappe l'état vers le contrat
spatie/laravel-query-builder.

## Ownership

- Possède : `useDataTable` (état + persistance + `queries`), `<DataTable>`
  (rendu), helpers purs `query-map.ts` / `persistence.ts`, contrôles de filtre,
  toolbar, pagination, types `ColumnDef.meta`.
- Ne possède PAS : le fetch (react-query côté appelant), les définitions de
  colonnes (par ressource), la sérialisation query (`@/modules/core/service/list.utils`).

## Local Contracts

- **API** : `const dt = useDataTable({ tableId, namespace, columns })` →
  `useX(dt.queries)` → `<DataTable instance={dt} data={rows} meta={meta} isLoading isFetching isError />`.
  Le hook ne construit pas la table (state-only) ; `<DataTable>` la monte avec `data`.
- **Colonne** : déclarer les clés serveur dans `ColumnDef.meta` — `sortKey`,
  `filter: { key, type: 'text'|'select'|'boolean'|'dateRange', options?, multiple? }`,
  `noReorder?`, `noHide?`. **Clés explicites** : sans `sortKey`/`filter` → pas de
  tri/filtre. Les clés doivent matcher les `allowedSorts`/`allowedFilters` spatie.
- **Query** : `buildQueries` → `TableQueries`. Tri mono-UI mais `s` multi-capable.
  Sérialisation dans `list.utils.adaptFilters` : tableau → liste comma
  (`f[k]=a,b`), `{gte,lte}` → opérateurs dynamiques spatie (`f[k]=>=..,<=..`).
- **Persistance** : clé `datatable:v1:{tableId}`. Persiste ordre/visibilité/
  filtres/tri/pageSize ; PAS `globalFilter` ni `pageIndex`. Réconcilie contre les
  ids de colonnes au montage.
- **i18n** : chrome `core:table.*` ; libellés champs `<namespace>:fields.<columnId>` ;
  options select `<namespace>:values.<filterKey>.<value>`. Utiliser un hook dédié
  `useTranslation(namespace)` pour fields/values (l'option `{ ns }` ne résout pas ici).
- Tout changement de query (tri/filtre/recherche) **reset la page à 1**.

## Work Guidance

- Contrôles via `DropdownMenu` (Base UI, prop `render`), pas le Select Base UI.
- `keepPreviousData` côté appelant (anti-flash) ; skeleton au 1er chargement seul.
- Reorder via `@dnd-kit` ; poignée de drag séparée du clic de tri.
- Pas d'enum (`erasableSyntaxOnly`) : unions `as const`.

## Verification

- Unit : `query-map.test.ts`, `persistence.test.ts`, `../../../modules/core/service/list.utils.test.ts`.
- E2E : `e2e/users.spec.ts` (table câblée). `npx vitest run` + `E2E_MOCK=1 npx playwright test` + `npx tsc --noEmit`.

## Child DOX Index

Aucun enfant.
