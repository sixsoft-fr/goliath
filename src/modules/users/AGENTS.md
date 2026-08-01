# AGENTS.md — users

## Purpose

Câblage de référence de la DataTable générique sur une ressource : liste des
utilisateurs à `/app/users`. Sert de patron pour les futures tables de ressource.

## Ownership

- Possède : `users.service.ts`, `users.queries.ts`, `users.types.ts`,
  `users.columns.tsx`, `pages/UsersPage.tsx`, `locales/*`.
- Consomme : `@/components/ds/data-table`, `@/modules/core/service`.

## Local Contracts

- **Accès données** : classe `Service` (`UsersService extends Service`) —
  déviation assumée du pattern fonctionnel (`notifications.*`), retenue par
  décision utilisateur. `useUsers` dé-wrappe le `KyResponse` (`.json()`) et
  utilise `keepPreviousData`.
- **Colonnes** : clés serveur dans `ColumnDef.meta`. Aucun `header` → la
  DataTable résout `users:fields.<id>`. Câblées : `name`/`email` (texte + tri),
  `status` (select multi), `created_at` (dateRange + tri).
- **Dates** : formatées via `@/lib/date` `formatDateTime(value, i18n.language)`
  (`Intl`, dépendant de la langue) ; le binding i18n se fait dans un `DateCell`.
- **i18n** : `users:fields.*` (colonnes), `users:values.status.*` (enum),
  `users:title`.
- **Backend** : `name`/`email`/`status`/`created_at` doivent être whitelistés en
  `allowedFilters`/`allowedSorts` spatie (opérateur dynamique pour `created_at`).

## Work Guidance

- Nouvelle table de ressource : reproduire ce câblage (service + `useX` +
  colonnes `meta` + locales `<resource>:fields.*` / `values.*`).

## Verification

- E2E : `e2e/users.spec.ts` (mock hermétique, `E2E_MOCK=1`).

## Child DOX Index

Aucun enfant.
