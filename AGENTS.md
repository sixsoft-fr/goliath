## Learned User Preferences

- When discussing API contracts or query strings, show the exact convention form (e.g. `f[topNode]=1&f[account]=3`); do not digress into URL percent-encoding.
- Do not invent helper or utility functions inside test files; put reusable helpers in source modules and import them from tests.
- Tests should thoroughly cover the function under test, including related helper behavior when relevant.

## Learned Workspace Facts

- List/table filters are serialized as bracketed query params `f[key]=value` (not a single JSON `f` param).
- TypeScript is configured with `erasableSyntaxOnly`; prefer `as const` objects plus derived types over TypeScript enums.
- Hugeicons: import icon glyphs from `@hugeicons/core-free-icons` and use `HugeiconsIcon` from `@hugeicons/react`.
