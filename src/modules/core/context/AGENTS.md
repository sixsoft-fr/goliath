# AGENTS.md — core/context

## Purpose

Contexte React de la ressource « courante » (show/edit) : `resource`,
`identifier`, `identifierType`, `model`. Bridge pour les consumers flex
(`useFlex(resource, identifier)`) — pas de `FlexService` ici.

## Ownership

- Possède : `subject.context.tsx`, tests associés.
- Consomme : `@/modules/core/model.types`.

## Local Contracts

- Pattern Auth : `createContext(null)`, `useSubject()` throw hors provider.
- Setters fluides : `setResource` / `setIdentifier` / `setModel` retournent
  l’objet fluent ; `clear()` reset.
- `identifierType` déduit via `inferIdentifierType` (`number` → `"id"`,
  UUID → `"uuid"`, sinon `"slug"`). Pas d’override manuel MVP.
- Types : `as const` + type dérivé, pas d’enum TS.

## Work Guidance

- Ne pas coupler ce contexte à `FlexService` / `Service` singleton.
- Nouveaux champs sujet : étendre `SubjectState` + setter fluent + tests.

## Verification

- `bunx vitest run src/modules/core/context/subject.context.test.tsx`

## Child DOX Index

Aucun enfant.
