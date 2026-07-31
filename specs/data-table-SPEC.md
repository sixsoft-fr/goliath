# Phase: DataTable étendu — Specification

**Created:** 2026-07-31
**Ambiguity score:** 0.14 (gate: ≤ 0.20)
**Requirements:** 11 locked

## Goal

Livrer un composant générique et réutilisable `<DataTable>` (TanStack Table v8 en mode manuel/server-driven) qui filtre, trie, recherche, masque/affiche et réordonne ses colonnes, en mappant son état vers le contrat `TableQueries` existant (`f[key]=value`, `s=-updated_at`, `query=`, `page`/`per_page`), avec persistance de la vue en `localStorage`, câblé de bout en bout sur le module `users`.

## Background

État actuel du codebase :

- `@tanstack/react-table` v8 est installé mais **utilisé nulle part**.
- `src/components/ui/table.tsx` : primitives shadcn muettes (`<Table>`, `<TableRow>`, `<TableHead>`…). Aucun wrapper « data-table ».
- Le backend utilise **spatie/laravel-query-builder**, avec les params renommés : `f` (= param `filter` de spatie) et `s` (= param `sort` de spatie). Chez spatie, **la virgule dénote un tableau** (`f[status]=active,pending` → `['active','pending']`), et **chaque filtre/tri doit être whitelisté** côté backend (`allowedFilters()` / `allowedSorts()`) — le front ne peut cibler que des clés autorisées.
- Le contrat serveur existe déjà : `src/modules/core/service/`
  - `TableQueries = { page, per_page, query, filters: Record<string, unknown>, sort }`
  - `adaptFilters()` sérialise en `f[key]=value` (filtres spatie), `s=<sort>` (`-` = desc, multi séparés par `,`, défaut `-updated_at`), `query=`, `page`, `per_page` (défaut 10). `flattenFilters()` ne gère aujourd'hui que des scalaires — à étendre pour les tableaux (comma) et les ranges (opérateurs).
  - `Service.list<T>(queries)` fait l'appel `ky` et retourne un `PaginatedResponse<T>` Laravel (`data[]` + `meta{current_page,last_page,per_page,total}` + `links`).
- Primitives disponibles : Base UI + Radix + shadcn (`dropdown-menu`, `popover`, `select`, `checkbox`, `input`, `calendar`/`react-day-picker`).
- `@tanstack/react-query`, `zustand`, `ky` installés. Aucune lib DnD installée.
- Le module `src/modules/users` est **vide** — la table de référence implique de créer `UsersService`, la définition de colonnes et la page liste.

Le cœur (filtre/tri/recherche/visibilité) est fourni par TanStack Table ; le vrai travail est (a) le mapping état TanStack → `TableQueries` conforme spatie, (b) le drag-and-drop de réordonnancement, (c) la persistance `localStorage`, (d) l'extension de `flattenFilters` pour les tableaux (multi-select) et les ranges (opérateurs spatie), (e) l'alignement des clés `filterKey`/`sortKey` des colonnes sur les whitelists backend.

## Requirements

1. **Composant générique `<DataTable>`** : un seul composant piloté par une définition de colonnes, réutilisable sur tous les modules (users, pim, sales, wms).
   - Current : aucun wrapper, seulement les primitives muettes de `table.tsx`
   - Target : `<DataTable columns={...} query={...} data={...} meta={...} state / onStateChange ... />` en mode `manual*` TanStack (pas de filtre/tri/pagination côté client), contrôlé, sans logique métier
   - Acceptance : le composant est monté avec deux définitions de colonnes différentes (users + un jeu mock) sans modification de son code source

2. **Recherche globale** : une barre de recherche unique alimente le paramètre `query`.
   - Current : aucun mécanisme de recherche
   - Target : un champ de recherche debouncé (≥ 250 ms) met à jour `query` dans `TableQueries` ; vide → clé `query` absente de la requête (conforme `adaptFilters`)
   - Acceptance : saisir « abc » émet `query=abc` ; vider le champ retire `query` de la query string

3. **Filtres par colonne — texte / select (multi) / booléen** : filtres spatie.
   - Current : aucun filtre ; `flattenFilters` ne gère que des scalaires
   - Target : chaque colonne peut déclarer un filtre `text` (contains → `AllowedFilter::partial`), `select` ou `boolean`. Le `select` supporte **single et multi** : les valeurs sont jointes par virgule → tableau spatie (`f[status]=active,pending`). `flattenFilters` étendu pour sérialiser un tableau de valeurs en liste comma-separated.
   - Acceptance : un filtre texte `name`=`jean` + un select multi `status`=`[active,pending]` produisent `f[name]=jean&f[status]=active,pending` ; test unitaire sur `adaptFilters` couvrant le cas tableau

4. **Filtres date-range (opérateurs dynamiques spatie)** : plage de dates via comparateurs `>=` / `<=` embarqués dans la valeur.
   - Current : aucune convention range ; `flattenFilters` scalaire uniquement
   - Target : un filtre `dateRange` sur une colonne est mappé vers **une seule clé** portant deux bornes comma-séparées, opérateur embarqué : `f[<col>]=>=<from>,<=<to>` (spatie `AllowedFilter::operator(FilterOperator::DYNAMIC)` parse la virgule en tableau et ANDe les deux contraintes). Bornes optionnelles : seule `from` → `f[<col>]=>=<from>` ; seule `to` → `f[<col>]=<=<to>`. `adaptFilters` étendu pour sérialiser une valeur range `{gte?, lte?}` sous cette forme.
   - Acceptance : une plage `created_at` du 2026-01-01 au 2026-01-31 produit exactement `f[created_at]=>=2026-01-01,<=2026-01-31` ; une borne seule produit une seule contrainte ; test unitaire sur `adaptFilters` couvrant les trois cas (deux bornes / from seule / to seule)
   - Backend : nécessite `AllowedFilter::operator('<col>', FilterOperator::DYNAMIC)` whitelisté (voir Req. 11).

5. **Tri multi-colonnes** : mapping état de tri TanStack → paramètre `s`.
   - Current : aucun tri
   - Target : clic sur en-tête cycle asc → desc → off ; l'état `sorting` de TanStack est mappé en `s` (`-updated_at` pour desc, `updated_at` pour asc, multi joint par `,`) ; défaut `-updated_at` quand aucun tri
   - Acceptance : trier par `name` asc puis `created_at` desc produit `s=name,-created_at`

6. **Visibilité des colonnes** : sélecteur masquer/afficher.
   - Current : aucune gestion de visibilité
   - Target : un menu (dropdown/popover) liste les colonnes masquables avec des cases à cocher ; l'état pilote `columnVisibility` de TanStack ; les colonnes marquées non-masquables restent toujours visibles
   - Acceptance : décocher une colonne la retire du `<thead>` et de toutes les lignes ; la re-cocher la rétablit

7. **Réordonnancement des colonnes (drag-and-drop)** : glisser les en-têtes via `@dnd-kit`.
   - Current : aucun DnD ; aucune lib DnD installée
   - Target : ajout de `@dnd-kit/core` + `@dnd-kit/sortable` ; glisser un en-tête réordonne visuellement les colonnes en pilotant `columnOrder` de TanStack ; les colonnes techniques (ex. futures actions) peuvent être exclues du DnD
   - Acceptance : glisser la colonne C en position A réordonne le rendu ; l'ordre est reflété dans l'état `columnOrder`

8. **Pagination serveur** : contrôles page/per_page basés sur la meta Laravel.
   - Current : aucune pagination
   - Target : contrôles précédent/suivant + numéro de page + sélecteur `per_page`, pilotés par `meta.current_page` / `meta.last_page` / `meta.total` ; changement de page/taille met à jour `TableQueries`
   - Acceptance : sur une réponse `meta{current_page:1,last_page:3}`, « suivant » émet `page=2` ; changer per_page à 25 émet `per_page=25&page=1`

9. **Persistance de la vue en `localStorage`** : préférences mémorisées entre sessions, par table.
   - Current : aucune persistance
   - Target : la vue (`columnOrder`, `columnVisibility`, filtres actifs, `sort`, `per_page`) est persistée en `localStorage` sous une clé dérivée d'une prop obligatoire `tableId` ; rechargée au montage
   - Acceptance : réordonner/masquer une colonne + appliquer un filtre, recharger la page → l'ordre, la visibilité et le filtre sont restaurés ; deux `tableId` distincts n'écrasent pas leurs préférences

10. **Câblage de référence sur `users` + états** : implémentation de bout en bout.
    - Current : `src/modules/users` est vide
    - Target : `UsersService` (extends `Service`, resource `"users"`), une définition de colonnes users, et une page liste utilisant `<DataTable>` via `@tanstack/react-query` + `Service.list` ; états loading (skeleton), empty (composant `empty`) et error rendus
    - Acceptance : la page users charge une liste paginée, filtrable, triable, avec colonnes masquables/réordonnables ; les états 0 ligne, 1 ligne et N lignes s'affichent sans erreur

11. **Contrat de définition de colonnes + alignement whitelist spatie** : chaque colonne déclare ses clés serveur.
    - Current : aucune définition de colonnes ; aucun lien front↔whitelist backend
    - Target : la définition de colonne porte un `filterKey` (et `sortKey`) explicite ; seules les colonnes avec `filterKey` affichent un contrôle de filtre, seules celles avec `sortKey` sont triables ; ces clés doivent correspondre aux `allowedFilters()` / `allowedSorts()` du backend spatie
    - Acceptance : une colonne sans `sortKey` n'expose pas de tri ; une colonne sans `filterKey` n'expose pas de filtre ; la table users ne cible que des clés whitelistées côté backend (aucun 400 spatie sur filtre/tri non autorisé)

## Boundaries

**In scope:**
- Composant générique `<DataTable>` server-driven (mode manuel TanStack v8)
- Recherche globale (`query`)
- Filtres par colonne : texte, select/enum, booléen, date-range
- Tri multi-colonnes (mapping `s`)
- Visibilité des colonnes (sélecteur)
- Réordonnancement par drag-and-drop des en-têtes (`@dnd-kit`)
- Pagination serveur (page/per_page, meta Laravel)
- Persistance `localStorage` de la vue, par `tableId`
- Extension de `flattenFilters`/`adaptFilters` pour les tableaux (comma, multi-select) et les ranges (opérateurs spatie)
- Contrat de colonne avec `filterKey`/`sortKey` alignés sur les whitelists spatie (`allowedFilters`/`allowedSorts`)
- Câblage de référence sur le module `users` (service + colonnes + page + états)
- Tests : unitaires (vitest) pour le mapping état→`TableQueries` et `adaptFilters` ; e2e (playwright) pour le parcours users

**Out of scope:**
- Sélection de lignes / actions groupées (bulk) — non demandé, phase ultérieure
- Édition inline des cellules — non demandé
- Redimensionnement des colonnes (resize) — non demandé (seul le reorder l'est)
- Export CSV/Excel — non demandé
- Virtualisation des lignes — non nécessaire au volume paginé (per_page)
- Pagination cursor/infinie — le contrat existant est page-based
- Synchronisation serveur des préférences (par user) — `localStorage` a été choisi ; pas d'endpoint de préférences
- Vues sauvegardées / presets nommés — non demandé
- Synchronisation de l'état filtres/tri dans l'URL — `localStorage` couvre la persistance

## Constraints

- **Dépendances :** ajout de `@dnd-kit/core` + `@dnd-kit/sortable` (aucune autre lib nouvelle ; le reste du besoin est couvert par TanStack Table + primitives déjà installées).
- **Contrat API (spatie/laravel-query-builder) :** filtres via le param `f` (= `filter` renommé), `f[key]=value` bracketé (jamais un unique param JSON) ; tri via `s` (= `sort` renommé, `-` = desc, multi séparés par `,`) ; **virgule = tableau** (`f[status]=active,pending`) ; conforme à `adaptFilters` existant.
- **Whitelist spatie :** chaque `filterKey`/`sortKey` envoyé doit être déclaré côté backend (`allowedFilters()` / `allowedSorts()`), sinon spatie renvoie une erreur. Les définitions de colonnes front doivent rester alignées sur ces listes.
- **Range = opérateurs dynamiques spatie :** date-range sérialisé en `f[<col>]=>=<from>,<=<to>` (opérateur embarqué, virgule = AND) ; backend `AllowedFilter::operator(FilterOperator::DYNAMIC)`.
- **TypeScript :** `erasableSyntaxOnly` activé → pas d'`enum`, utiliser des objets `as const` + types dérivés.
- **UI :** primitives shadcn/Base UI/Radix existantes + util `cn` ; icônes via `@hugeicons/react` + `@hugeicons/core-free-icons`.
- **Baseline & tests (AGENTS.md, non négociable) :** ne pas démarrer sur baseline rouge (`vitest` + `playwright` verts d'abord) ; toute nouvelle behavior livrée avec tests ; « done » ⇔ tous les tests passent.

## Acceptance Criteria

- [ ] `<DataTable>` se monte avec ≥ 2 définitions de colonnes différentes sans modifier son source
- [ ] La recherche globale émet `query=<valeur>` et l'omet quand vide
- [ ] Des filtres texte + select + booléen actifs produisent `f[key]=value` combinés
- [ ] Un select multi produit `f[status]=active,pending` (test unitaire `adaptFilters` sur tableau)
- [ ] Un filtre date-range produit `f[created_at]=>=2026-01-01,<=2026-01-31` ; borne seule → une contrainte (test unitaire `adaptFilters`, 3 cas)
- [ ] Une colonne sans `sortKey`/`filterKey` n'expose pas de tri/filtre ; aucune clé non-whitelistée envoyée par la table users
- [ ] Le tri multi produit `s=name,-created_at` (mapping vérifié par test unitaire)
- [ ] Masquer une colonne la retire de `<thead>` et des lignes ; la ré-afficher la rétablit
- [ ] Glisser un en-tête réordonne le rendu et met à jour `columnOrder`
- [ ] Pagination : « suivant » émet `page=2` ; changer per_page émet `per_page=N&page=1`
- [ ] Recharger la page restaure ordre + visibilité + filtres depuis `localStorage`, isolés par `tableId`
- [ ] La page users rend loading / empty / error / N lignes sans erreur
- [ ] `vitest` et `playwright` verts

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                        |
|--------------------|-------|------|--------|--------------------------------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Composant server-driven mappé sur contrat existant           |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | In/out explicites (resize, bulk, export, cursor exclus)      |
| Constraint Clarity | 0.88  | 0.65 | ✓      | spatie (f/s renommés, comma=array, whitelist) ; @dnd-kit ; range opérateur dynamique figé (Req. 4) |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 13 critères pass/fail                                        |
| **Ambiguity**      | 0.14  | ≤0.20| ✓      |                                                              |

Status : ✓ = minimum atteint. Toutes les dimensions au-dessus du minimum, aucune assumption ouverte.

## Interview Log

| Round | Perspective              | Question summary                          | Decision locked                                              |
|-------|--------------------------|-------------------------------------------|--------------------------------------------------------------|
| 0     | Researcher (scout)       | Qu'existe-t-il aujourd'hui ?              | TanStack installé/inutilisé ; contrat `Service.list` + `adaptFilters` déjà là ; users vide |
| 1     | Researcher / Simplifier  | Source données ? persistance ? portée ?   | Server-side (API) ; localStorage ; composant générique       |
| 2     | Boundary / Constraint    | Reorder ? types de filtres ? ressource ?  | @dnd-kit (drag en-têtes) ; texte+select+bool+date-range ; users |
| 3     | Constraint (spatie)      | Forme range ? select multi ?              | Range via opérateurs spatie (`>=`/`<=`) ; select multi+single (comma). Contrainte whitelist `allowedFilters`/`allowedSorts` ajoutée |

---

*Feature: data-table étendu*
*Spec created: 2026-07-31*
*Next step: implémentation — ce projet n'a pas de roadmap `.planning/` ; ce SPEC tient lieu de contrat de requirements. Voir DOX.md + AGENTS.md pour les conventions d'exécution et de tests.*
