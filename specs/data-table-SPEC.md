# Phase: DataTable étendu — Specification

**Created:** 2026-07-31
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 12 locked

## Goal

Livrer un hook headless `useDataTable` + un composant présentationnel `<DataTable>` (TanStack Table v8, mode manuel/server-driven) qui filtre, trie, recherche, masque/affiche et réordonne ses colonnes, en mappant son état vers le contrat spatie/laravel-query-builder existant (`f[key]=value`, `s=-updated_at`, `query=`, `page`/`per_page`), avec persistance de la vue en `localStorage` et i18n par contrat de namespace, câblé de bout en bout sur le module `users`.

## Background

État actuel du codebase :

- `@tanstack/react-table` v8 est installé mais **utilisé nulle part**.
- `src/components/ui/table.tsx` : primitives shadcn muettes (`<Table>`, `<TableRow>`, `<TableHead>`…). Aucun wrapper « data-table ».
- Le backend utilise **spatie/laravel-query-builder**, params renommés : `f` (= `filter`) et `s` (= `sort`). **La virgule dénote un tableau** (`f[status]=active,pending` → `['active','pending']`) et **chaque filtre/tri doit être whitelisté** côté backend (`allowedFilters()` / `allowedSorts()`) — le front ne peut cibler que des clés autorisées.
- Contrat serveur déjà en place : `src/modules/core/service/`
  - `TableQueries = { page, per_page, query, filters: Record<string, unknown>, sort }`
  - `adaptFilters()` sérialise en `f[key]=value`, `s=<sort>` (`-` = desc, multi `,`, défaut `-updated_at`), `query=`, `page`, `per_page` (défaut 10). `flattenFilters()` ne gère que des scalaires — à étendre (tableaux + ranges).
  - Retour : `PaginatedResponse<T>` Laravel (`data[]` + `meta{current_page,last_page,per_page,total}` + `links`).
- **Pattern service canonique = fonctionnel**, pas la classe `Service` (legacy). Réf. `notifications.service.ts` : `listNotifications(tableQueries)` = `api.get(res, { searchParams: adaptFilters(q) }).json<PaginatedResponse<T>>()`. Et `notifications.queries.ts` : factory de clés + `useX(tableQueries)` (`queryKey: [res,'list',q]`, erreur loggée + rethrow).
- Primitives dispo : Base UI + Radix + shadcn (`dropdown-menu`, `popover`, `select`, `checkbox`, `input`, `calendar`/`react-day-picker`). `zustand`, `ky`, `@tanstack/react-query` installés. **Aucune lib DnD.**
- i18n : `react-i18next`, namespaces = modules (`useTranslation('<module>')` → `src/modules/<module>/locales/<lng>.json`, `defaultNS: "core"`). `core` locales vides aujourd'hui.
- Routing : `<Routes>` JSX, zone protégée sous `app` + `AppLayout` + `RequireAuth`. → page users = `/app/users`.
- E2E : mock hermétique via `page.route` quand `E2E_MOCK=1` (fixture `e2e/fixtures/mock-api.ts`), sinon vrai backend en local. Le backend `/api/users` existe déjà (whitelists spatie en place).
- Le module `src/modules/users` est **vide** — à créer (service fonctionnel + colonnes + page + états).

Cœur (filtre/tri/recherche/visibilité) fourni par TanStack. Le vrai travail : (a) mapping état TanStack → `TableQueries` spatie, (b) DnD reorder, (c) persistance localStorage + réconciliation, (d) extension `flattenFilters` (tableaux + ranges opérateurs), (e) contrat i18n, (f) alignement `filterKey`/`sortKey` sur les whitelists.

## Architecture (décisions de grilling)

- **Séparation hook / présentation** : `useDataTable({ tableId, namespace, columns })` possède l'état (sorting, filters, columnOrder, columnVisibility, pagination) + la persistance localStorage + l'instance TanStack, et expose `{ table, queries }`. `<DataTable>` est **présentationnel** (rend `table` + états). **Le fetch reste chez l'appelant** : `const { table, queries } = useDataTable(...)` → `useUsers(queries)` → passe `data/meta` au composant. Découplé de ky/react-query, testable sans réseau.
- **Mono-tri** dans l'UI (clic = remplace, cycle asc→desc→off), mapping serveur **multi-capable** conservé (aucun coût).
- **Filtres live** : texte debounce 250 ms, contrôles discrets (select/booléen/date) immédiats, pas de bouton « Appliquer ». Tout changement de query **reset page à 1**.
- **Anti-flash** : react-query `placeholderData: keepPreviousData` — anciennes lignes gardées pendant le fetch, `isFetching` discret (opacity/spinner). Skeleton plein **uniquement au 1er chargement** (`isLoading`).

## Requirements

1. **Hook `useDataTable` + `<DataTable>` présentationnel** : générique, réutilisable (users, pim, sales, wms).
   - Current : aucun wrapper, primitives muettes seulement
   - Target : `useDataTable({ tableId, namespace, columns })` en mode `manual*` TanStack (pas de filtre/tri/pagination client) retourne `{ table, queries }` ; `<DataTable table ... />` rend. Aucune logique métier, aucun fetch interne.
   - Acceptance : monté avec 2 définitions de colonnes différentes (users + jeu mock) sans modifier le source du hook/composant

2. **Recherche globale** : une barre unique alimente `query`.
   - Current : aucun mécanisme de recherche
   - Target : champ debouncé 250 ms met à jour `query` + reset page 1 ; vide → clé `query` absente (conforme `adaptFilters`)
   - Acceptance : « abc » émet `query=abc&page=1` ; vider retire `query`

3. **Filtres par colonne — texte / select (multi) / booléen** : filtres spatie, application live.
   - Current : aucun filtre ; `flattenFilters` scalaire
   - Target : colonne déclare `text` (contains → `AllowedFilter::partial`), `select` (single **et** multi, valeurs jointes par virgule → tableau spatie) ou `boolean`. Texte debouncé 250 ms ; select/booléen immédiats ; tout changement reset page 1. `flattenFilters` étendu pour sérialiser un tableau en liste comma.
   - Acceptance : texte `name=jean` + select multi `status=[active,pending]` → `f[name]=jean&f[status]=active,pending` ; test unitaire `adaptFilters` sur le cas tableau

4. **Filtres date-range (opérateurs dynamiques spatie)** : plage via `>=` / `<=` embarqués.
   - Current : aucune convention range ; `flattenFilters` scalaire
   - Target : un `dateRange` sur une colonne → **une seule clé**, bornes comma-séparées opérateur embarqué : `f[<col>]=>=<from>,<=<to>` (`AllowedFilter::operator(FilterOperator::DYNAMIC)`, virgule = AND). Bornes optionnelles (from seule / to seule). `adaptFilters` étendu pour `{gte?, lte?}`.
   - Acceptance : 2026-01-01→2026-01-31 produit exactement `f[created_at]=>=2026-01-01,<=2026-01-31` ; borne seule → une contrainte ; test unitaire `adaptFilters` sur 3 cas
   - Backend : `AllowedFilter::operator('<col>', FilterOperator::DYNAMIC)` whitelisté (déjà en place)

5. **Tri** : mono-tri UI, mapping `s` multi-capable.
   - Current : aucun tri
   - Target : clic en-tête cycle asc→desc→off et **remplace** le tri courant (mono) ; état `sorting` mappé en `s` (`-x` desc, `x` asc, code multi-capable via `adaptSort`) ; défaut `-updated_at`
   - Acceptance : trier `name` asc → `s=name` ; puis `created_at` desc remplace → `s=-created_at` ; test unitaire du mapping (dont cas multi `name,-created_at`)

6. **Visibilité des colonnes** : sélecteur masquer/afficher.
   - Current : aucune gestion
   - Target : menu (dropdown/popover) de cases à cocher pilotant `columnVisibility` ; colonnes marquées non-masquables toujours visibles
   - Acceptance : décocher retire la colonne de `<thead>` et des lignes ; re-cocher rétablit

7. **Réordonnancement (drag-and-drop)** : glisser les en-têtes via `@dnd-kit`.
   - Current : aucun DnD ; aucune lib installée
   - Target : ajout `@dnd-kit/core` + `@dnd-kit/sortable` ; glisser un en-tête pilote `columnOrder` ; colonnes techniques exclues du DnD
   - Acceptance : glisser C en position A réordonne le rendu ; reflété dans `columnOrder`

8. **Pagination serveur** : contrôles page/per_page sur la meta Laravel.
   - Current : aucune pagination
   - Target : précédent/suivant + n° de page + sélecteur `per_page`, pilotés par `meta.{current_page,last_page,total}`
   - Acceptance : `meta{current_page:1,last_page:3}` → « suivant » émet `page=2` ; per_page à 25 émet `per_page=25&page=1`

9. **Persistance de la vue en `localStorage`** : par table, versionnée + réconciliée.
   - Current : aucune persistance
   - Target : clé `datatable:v1:{tableId}` persiste `columnOrder`, `columnVisibility`, `per_page`, filtres actifs, `sort`. **NON persisté** : `query` (recherche volatile) et `page` (repart à 1). Au montage : réconciliation — intersecter l'ordre stocké avec les ids actuels (drop inconnus), append les nouvelles colonnes, drop les filtres dont le `filterKey` a disparu. Bump de version invalide tout le stock.
   - Acceptance : réordonner/masquer + filtrer, recharger → ordre/visibilité/filtres restaurés, `query` non restaurée, page = 1 ; 2 `tableId` isolés ; une colonne retirée du code ne casse pas la restauration

10. **Câblage de référence sur `users` + états** : implémentation de bout en bout.
    - Current : `src/modules/users` vide
    - Target : `users.service.ts` (`listUsers(queries)` fonctionnel + `adaptFilters`), `users.queries.ts` (`useUsers` façon `useNotifications`), type `User`, définition de colonnes, page `/app/users` (sous `app`/`AppLayout`) branchant `useDataTable` + `useUsers`. États : skeleton (1er chargement), `isFetching` discret ensuite (keepPreviousData), empty (composant `empty`), error.
    - Acceptance : la page charge une liste paginée/filtrable/triable, colonnes masquables/réordonnables ; états 0 / 1 / N lignes + error sans erreur ; pas de flash au changement de filtre/page

11. **Contrat de définition de colonnes + alignement whitelist spatie** : via `ColumnDef.meta`.
    - Current : aucune définition ; aucun lien front↔whitelist
    - Target : module augmentation de `ColumnMeta` (TanStack) portant `sortKey?`, `filter?: { key, type: 'text'|'select'|'boolean'|'dateRange', options? }`. **Clés explicites** : pas de tri/filtre tant que `meta` ne le déclare pas (zéro clé involontaire). Types via unions `as const` (pas d'enum — `erasableSyntaxOnly`). Les clés doivent matcher `allowedFilters()`/`allowedSorts()`.
    - Acceptance : colonne sans `sortKey` → pas de tri ; sans `filter` → pas de contrôle de filtre ; la table users n'envoie que des clés whitelistées (aucun 400 spatie)

12. **Contrat i18n par namespace** : chrome partagé + vocabulaire ressource.
    - Current : `core` locales vides ; aucun texte de table
    - Target : `useDataTable` reçoit un `namespace` (ex. `"users"`). **Chrome générique** (recherche, « Aucun résultat », « Lignes par page », « Page X/Y », menu colonnes, « Effacer les filtres ») → namespace `core`, clés `table.*`. **Noms de colonnes** → `t('fields.<columnId>', { ns: namespace })`. **Options de select (enums)** → `t('values.<field>.<value>', { ns: namespace })`. Aucun texte en dur dans le composant ; l'appelant ne fournit que les valeurs.
    - Acceptance : header users résolu depuis `users:fields.*` ; option `status` résolue depuis `users:values.status.*` ; chrome depuis `core:table.*` ; `fr` livré ; changer de langue met à jour les libellés

## Boundaries

**In scope:**
- Hook `useDataTable` + `<DataTable>` présentationnel, server-driven (TanStack v8 manuel)
- Recherche globale (`query`), filtres colonne (texte/select multi/booléen/date-range), tri mono-UI
- Visibilité colonnes, reorder DnD (`@dnd-kit`), pagination serveur
- Persistance `localStorage` versionnée + réconciliée par `tableId`
- Extension `flattenFilters`/`adaptFilters` (tableaux comma + ranges opérateurs)
- Contrat colonne via `ColumnDef.meta` (clés explicites, alignées whitelist spatie)
- Contrat i18n (`core:table.*`, `<ns>:fields.*`, `<ns>:values.*`)
- Câblage users (service fonctionnel + queries + type + colonnes + page `/app/users` + états)
- Tests : vitest (mapping `adaptFilters`/`flattenFilters`/tri, réconciliation localStorage) ; e2e playwright (parcours users, mock hermétique)

**Out of scope:**
- Sélection de lignes / actions groupées (bulk) — non demandé
- Édition inline des cellules — non demandé
- Redimensionnement des colonnes (resize) — non demandé (seul le reorder l'est)
- Export CSV/Excel — non demandé
- Multi-tri dans l'UI (shift-clic) — mapping conservé multi-capable, mais UI mono ; activable plus tard sans changer le contrat
- Virtualisation des lignes — inutile au volume paginé
- Pagination cursor/infinie — contrat page-based
- Synchronisation serveur des préférences (par user) — `localStorage` choisi
- Vues sauvegardées / presets nommés — non demandé
- Synchronisation filtres/tri dans l'URL — `localStorage` couvre la persistance
- Bouton « Appliquer » les filtres — filtres live retenus

## Constraints

- **Dépendances :** ajout de `@dnd-kit/core` + `@dnd-kit/sortable` uniquement.
- **Contrat API (spatie) :** `f` (= `filter`), `f[key]=value` bracketé ; `s` (= `sort`, `-` = desc, multi `,`) ; **virgule = tableau** ; conforme à `adaptFilters`.
- **Whitelist spatie :** chaque `filterKey`/`sortKey` doit être dans `allowedFilters()`/`allowedSorts()` ; colonnes front alignées.
- **Range = opérateurs dynamiques spatie :** `f[<col>]=>=<from>,<=<to>` (`FilterOperator::DYNAMIC`).
- **Service = fonctionnel** (`listUsers` + `adaptFilters`), pas la classe `Service` (legacy). react-query façon `notifications.queries.ts`.
- **i18n :** namespaces = modules ; contrat `core:table.*` / `<ns>:fields.*` / `<ns>:values.*`.
- **TypeScript :** `erasableSyntaxOnly` → pas d'`enum`, unions `as const` + types dérivés.
- **UI :** primitives shadcn/Base UI/Radix + `cn` ; icônes `@hugeicons/react` + `@hugeicons/core-free-icons`.
- **Baseline & tests (AGENTS.md, non négociable) :** baseline verte avant feature (`vitest` + `playwright`) ; toute behavior livrée avec tests ; « done » ⇔ tous les tests passent.

## Acceptance Criteria

- [ ] `useDataTable`/`<DataTable>` montés avec ≥ 2 définitions de colonnes sans modifier leur source
- [ ] Recherche globale émet `query=<v>&page=1` et l'omet quand vide (non persistée au reload)
- [ ] Filtres texte + select multi + booléen → `f[name]=jean&f[status]=active,pending` (test `adaptFilters` tableau)
- [ ] Date-range → `f[created_at]=>=2026-01-01,<=2026-01-31` ; borne seule → une contrainte (test `adaptFilters`, 3 cas)
- [ ] Tout changement de filtre/tri/recherche reset la page à 1
- [ ] Colonne sans `sortKey`/`filter` n'expose pas tri/filtre ; aucune clé non-whitelistée envoyée (users)
- [ ] Tri mono : clic remplace le tri ; mapping `s` vérifié en unitaire (dont cas multi `name,-created_at`)
- [ ] Masquer une colonne la retire de `<thead>`/lignes ; ré-afficher rétablit
- [ ] Glisser un en-tête réordonne le rendu et met à jour `columnOrder`
- [ ] Pagination : « suivant » → `page=2` ; per_page → `per_page=N&page=1`
- [ ] Reload restaure ordre/visibilité/filtres/sort/per_page depuis `localStorage` (clé `datatable:v1:{tableId}`), `query`/page exclus, isolés par `tableId`, réconciliation OK si une colonne disparaît
- [ ] Pas de flash au changement de filtre/page (keepPreviousData) ; skeleton au 1er chargement seulement
- [ ] i18n : headers via `<ns>:fields.*`, options select via `<ns>:values.*`, chrome via `core:table.*`, `fr` livré
- [ ] Page users rend loading / empty / error / N lignes sans erreur
- [ ] `vitest` et `playwright` verts

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                        |
|--------------------|-------|------|--------|--------------------------------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | Hook+composant server-driven, contrat existant, users concret |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | In/out explicites (resize, bulk, export, multi-tri UI, URL exclus) |
| Constraint Clarity | 0.90  | 0.65 | ✓      | spatie figé, service fonctionnel, i18n contrat, @dnd-kit      |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 15 critères pass/fail                                        |
| **Ambiguity**      | 0.10  | ≤0.20| ✓      |                                                              |

Status : ✓ = minimum atteint. Aucune assumption ouverte (backend users existant confirmé).

## Interview Log

| Round | Perspective              | Question summary                          | Decision locked                                              |
|-------|--------------------------|-------------------------------------------|--------------------------------------------------------------|
| 0     | Researcher (scout)       | Qu'existe-t-il aujourd'hui ?              | TanStack installé/inutilisé ; contrat `adaptFilters` là ; users vide |
| 1     | Researcher / Simplifier  | Source ? persistance ? portée ?           | Server-side ; localStorage ; composant générique             |
| 2     | Boundary / Constraint    | Reorder ? filtres ? ressource ?           | @dnd-kit ; texte+select+bool+date-range ; users              |
| 3     | Constraint (spatie)      | Forme range ? select multi ?              | Opérateurs spatie ; select multi+single ; whitelist ajoutée  |
| 4 (grill) | Architecture          | Où vit l'état / le fetch ?                | Hook `useDataTable` + `<DataTable>` présentationnel ; fetch appelant |
| 5 (grill) | Contrat colonne       | Comment déclarer sort/filter ?            | `ColumnDef.meta` augmenté ; clés explicites (zéro implicite)  |
| 6 (grill) | Persistance           | Quoi persister ? réconciliation ?         | Tout sauf `query`/`page` ; clé `v1:{tableId}` ; réconciliation |
| 7 (grill) | Tri                   | Mono ou multi UI ?                        | Mono-UI, mapping multi-capable                               |
| 8 (grill) | Fetch UX              | Anti-flash ?                              | keepPreviousData + skeleton 1er chargement                   |
| 9 (grill) | Timing filtres        | Live ou bouton Appliquer ?                | Live (texte debounce 250 ms, discrets immédiats) + reset page 1 |
| 10 (grill)| i18n                  | Structure des libellés ?                  | `core:table.*` / `<ns>:fields.*` / `<ns>:values.*` ; `namespace` en prop |
| 11 (grill)| Users concret         | Colonnes ? backend existe ?               | name/email/status/created_at ; backend `/api/users` existant |

---

*Feature: data-table étendu*
*Spec created: 2026-07-31*
*Grilled: 2026-07-31 (8 branches, ambiguïté 0.14 → 0.10)*
*Next step: implémentation — pas de roadmap `.planning/` ; ce SPEC tient lieu de contrat. Voir DOX.md + AGENTS.md pour l'exécution et les tests.*
