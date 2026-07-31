## Absolute Rules (non-negotiable, this project)

1. **Do not start developing a feature if the baseline is red.** Before writing any feature code, `vitest` (`npx vitest run`) and the e2e suite (`npx playwright test`) must both pass. If any test fails at the start, stop and fix or report it first — no feature work on a red baseline.
2. **Every new feature must ship with tests** covering its new behaviors (unit via vitest and/or e2e via playwright, whichever fits). A feature is not complete until its behavior is covered.
3. **All tests passing is an absolute success criterion for "done".** A task cannot be considered finished while any test fails. If a test fails, concisely explain the failure to the human and propose options to fix it — never silently move on or declare done.

## Learned User Preferences

- When discussing API contracts or query strings, show the exact convention form (e.g. `f[topNode]=1&f[account]=3`); do not digress into URL percent-encoding.
- Do not invent helper or utility functions inside test files; put reusable helpers in source modules and import them from tests.
- Tests should thoroughly cover the function under test, including related helper behavior when relevant.

## Learned Workspace Facts

- List/table filters are serialized as bracketed query params `f[key]=value` (not a single JSON `f` param).
- TypeScript is configured with `erasableSyntaxOnly`; prefer `as const` objects plus derived types over TypeScript enums.
- Hugeicons: import icon glyphs from `@hugeicons/core-free-icons` and use `HugeiconsIcon` from `@hugeicons/react`.
