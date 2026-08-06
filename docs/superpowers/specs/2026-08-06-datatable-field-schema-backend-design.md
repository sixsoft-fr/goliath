# Design — Schéma de champs DataTable (backend, spatie/laravel-query-builder)

**Date:** 2026-08-06  
**Statut:** validé — prêt pour plan d'implémentation

## Contexte

La table générique frontend
([`2026-08-06-datatable-column-inference-design.md`](2026-08-06-datatable-column-inference-design.md))
déduit ses colonnes d'un objet ligne. Le choix de cellule s'infère côté client,
mais **le tri et le filtre ne le peuvent pas** : spatie/laravel-query-builder
whiteliste les clés via `allowedSorts` / `allowedFilters`. Toute clé non
whitelistée est rejetée (403). Le serveur doit donc **publier** son schéma de
champs, et ce schéma doit être **cohérent par construction** avec les whitelists
spatie.

Ce spec décrit le contrat que le backend doit remplir. Le repo backend est
distinct — ce document définit la forme du payload et la règle anti-drift, pas
l'implémentation Laravel exacte.

## Choix validés

| Sujet | Décision |
|---|---|
| Livraison | Embarqué dans `meta.fields` de la réponse paginée — **pas** d'endpoint `/schema` dédié |
| Source unique | Une définition de champs par ressource dérive **à la fois** les whitelists spatie **et** `meta.fields` |
| Anti-drift | `sortable:true` ⇔ clé dans `allowedSorts`, par construction (jamais déclaré deux fois) |
| Options de select | Déclarées en config, avec callback optionnel (enum/lookup DB) |
| Fréquence | `fields` envoyé à **chaque** page (simple, toujours correct, payload faible) |
| Casse des clés | Même casse que le modèle sérialisé (aligné sur les clés de ligne côté client) |

## Contrat de payload

`PaginatedResponse<T, M>` est déjà extensible côté client (`M = {}`) et `meta`
atteint déjà `<DataTable>`. On ajoute une clé `fields` à `meta` :

```jsonc
"meta": {
  "current_page": 1, "last_page": 3, "per_page": 20, "total": 42, /* …pagination spatie/Laravel… */
  "fields": {
    "email":     { "type": "email",  "sortable": true,  "filterable": { "type": "text" } },
    "status":    { "type": "status", "sortable": false, "filterable": { "type": "select", "options": ["active", "pending"] } },
    "createdAt": { "type": "date",   "sortable": true,  "filterable": { "type": "dateRange" } },
    "name":      { "type": "text",   "sortable": true,  "filterable": { "type": "text" } }
  }
}
```

### Schéma d'un champ

```ts
type FieldSchema = {
  type: "text" | "number" | "boolean" | "date" | "email" | "status"
  sortable: boolean
  filterable?: {
    type: "text" | "select" | "boolean" | "dateRange"
    options?: string[]   // requis si type === "select"
    multiple?: boolean
  }
}
```

- `type` pilote le choix de cellule côté client et sert de défaut au contrôle de
  filtre. Aligné sur les 4 cellules existantes (+ `text`, `number`, `date`).
- `filterable.type` mappe 1:1 sur `ColumnFilterDef` frontend
  (`text|select|boolean|dateRange`).
- Une clé absente de `fields` reste rendue par le client (fallback inférence),
  sans tri ni filtre.

## Règle centrale — déclarer chaque champ une seule fois

Le risque unique est le **drift** : `meta.fields` annonce `sortable:true` mais la
clé n'est pas dans `allowedSorts` → spatie renvoie 403 au premier clic sur
l'en-tête. Pour l'éliminer, une **définition de champs unique par ressource**
dérive les trois sorties :

```
fieldsConfig (par ressource)
   ├──►  QueryBuilder ->allowedSorts([...])      (clés où sortable = true)
   ├──►  QueryBuilder ->allowedFilters([...])    (clés où filterable présent, type spatie selon filterable.type)
   └──►  meta.fields                             (schéma client)
```

`sortable:true` **est** la présence de la clé dans `allowedSorts`, par
construction. Aucune liste n'est écrite deux fois ; l'incohérence UI↔serveur
devient structurellement impossible.

### Correspondance filtre → spatie

| `filterable.type` | `AllowedFilter` spatie (indicatif) |
|---|---|
| `text` | `AllowedFilter::partial(key)` |
| `select` (single) | `AllowedFilter::exact(key)` |
| `select` (`multiple:true`) | `AllowedFilter::exact(key)` (liste comma — cf. `list.utils.adaptFilters`) |
| `boolean` | `AllowedFilter::exact(key)` (cast bool) |
| `dateRange` | `AllowedFilter::scope`/callback → opérateurs `>=..,<=..` (cf. sérialisation frontend `{gte,lte}`) |

La sérialisation côté client (`list.utils.adaptFilters`) émet déjà : tableau →
liste comma (`f[k]=a,b`), `{gte,lte}` → opérateurs dynamiques (`f[k]=>=..,<=..`).
Les filtres spatie doivent accepter cette forme.

## Décisions bakées

- **Options select** : déclarées statiquement dans la config du champ ; callback
  optionnel pour résoudre depuis un enum PHP ou une table de lookup.
- **Coût payload** : `fields` à chaque page (pas de « page 1 seulement »).
  Toujours correct, jamais désynchronisé ; volume négligeable.
- **Casse** : `fields` émis dans la **même casse que le modèle sérialisé**
  (ex. `createdAt` si l'API renvoie du camelCase), pour matcher les clés de ligne
  vues par `deriveColumns`. Si spatie filtre en snake_case en interne, la
  traduction casse d'affichage ↔ casse de filtre reste côté serveur.

## Cohérence & tests (backend)

À couvrir dans le repo backend :

1. Pour chaque ressource : toute clé `sortable:true` de `meta.fields` ∈
   `allowedSorts` ; toute clé `filterable` ∈ `allowedFilters`. (Test de
   non-drift — idéalement dérivé automatiquement de la source unique.)
2. `select` → `options` non vide.
3. Casse des clés `fields` == casse des clés de `data[0]`.
4. Un filtre `dateRange` accepte la forme `>=..,<=..` produite par le client.

## Hors périmètre

- Implémentation Laravel concrète (structure de la config, classe/trait porteur).
- Autorisations/visibilité par rôle des champs.
- Pagination, includes, sparse fieldsets spatie au-delà du besoin colonnes.
- Endpoint `/schema` séparé (explicitement rejeté).

## DOX

Documenter le contrat `meta.fields` dans le repo backend (là où vivent les
définitions spatie par ressource) et laisser une note de renvoi dans
`src/components/ds/data-table/AGENTS.md` côté frontend.
