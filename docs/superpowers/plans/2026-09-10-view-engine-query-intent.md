# Record command query ownership

Baseline: `60b1bf6c`. User approved repairing the system-wide edit/query ordering gap, while retaining explicit instance IDs and promise error ownership.

## Invariant and implementation

Every editing command that triggers a record read crosses `RecordQueries.change`: capture lifecycle and query intent before synchronous state publication, run the edit, check ownership, optionally invalidate summaries, then check ownership again before reading. A rejected invalid edit never manufactures a new query intent. Automatic follow-ups reuse the same intent predicate but additionally require the instance to remain selected; explicitly addressed editing commands do not have that selection restriction.

The six editing commands (sort, page, page size, apply filter, restore, next cursor page) and manual refresh use this boundary. `RecordEdits` receives only `change`/`cancel` and summary `key`/`sync` capabilities, so direct `run`/`invalidate` calls cannot bypass the boundary through its declared dependencies. No new state library, public API or persistence format is introduced.

## Regression matrix

- Six commands × newer success, newer failure, navigation, disposal, explicitly non-selected instance, and own-query failure.
- Invalid nested sort must not suppress a valid outer query.
- Apply/restore/refresh summary invalidation notifications must yield to a newer query.

Forty-three new cases: the forty-case command matrix plus three column/summary continuation cases. On the original forty-case matrix, 27 failed and 13 control cases passed (`/tmp/fve-edit-owner-full-red.log`). On the fix all forty pass in compiled mode; targeted related lifecycle suites pass. The new test module also passes a standalone TypeScript check rather than relying solely on Vitest transpilation. Independent review found no additional issue.

Column edits now use a non-throwing lookup after notification, leaving summary sync to its existing disposal guard. Explicit summary refresh checks lifecycle/request/key after page-summary notification and lifecycle after invalidation; three additional regressions first failed and then passed. Independent re-review found no additional issue.

Nine unrelated height/layout modifications remain untouched. Final validation results are recorded below after the full gates complete.

## Final verification

Full `pnpm test:unit` passed: 5,654 tests / one skipped, including view-engine 912 ordinary + 912 compiled tests and type checks. The corrected matrix test module also passes standalone TypeScript checking. Full Storybook: 286 passed. Build, package/story lint, scoped formatting and staged diff checks passed. Logs: `/tmp/fve-command-final-unit.log`, `/tmp/fve-command-final-storybook.log`.

Final `verify:view-engine` passed public archive/types, LocalStorage/HTTP recovery and Chromium/Firefox/WebKit readiness at unchanged scales and budgets. Artifacts: `/tmp/fve-command-final-acceptance/`. Existing reviewed WebKit focus-sentinel findings remain; no VoiceOver certification is claimed.
