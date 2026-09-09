# View engine state consistency implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development task-by-task, with independent review and regression verification.

**Goal:** Resolve the three reproduced defects and remove their shared state/policy causes before further merge consideration.

**Architecture:** Keep ViewHost services, the public ViewEngine facade and UI extensions. InstanceWork owns one private context per instance for writes, reloads and uncertain outcomes; services use semantic methods instead of mutating maps. Published session derivation enforces current-row selection. Completion releases operation ownership before notifying observers. A shared filter node-context check governs structural admission and compilation without executing custom compilers at the admission boundary.

**Tech Stack:** Existing TypeScript, Vitest, React Compiler, Storybook and Fetcher/Wow; no new dependencies.

**Spec:** User-approved architectural review of 4a5764ff; reproductions at /tmp/fve-architecture-repro.mjs: stale selection after abort reentry, published idle before write release, forbidden root operator inside an element predicate accepted by metadata validation.

## Constraints

- Preserve the nine unrelated uncommitted height/layout files.
- Preserve saved component props, runtime extension contracts, request identity, uncertain-write reconciliation, revisions, permissions and source-less recovery.
- Do not introduce a generic workflow framework or change synchronous subscription semantics.
- Keep CI, coverage and performance gates intact. Automatic merge stays paused during remediation.

## Tasks

- [x] Add RED public-engine regressions for selection membership and synchronous save/rename/reload completion chaining; observe invariants at notifications, including cancellation/new-query interleaving.
- [x] Consolidate InstanceWork state and migrate callers. Release completed write/reload ownership before success/error notifications. Normalize selection at the session derivation boundary and validate operation-sequence regressions.
- [x] Add RED saved element-context cases; share context rules between configuration validation and compilation. Preserve permitted unset/opaque props and compiler output rules.
- [x] Run independent reviews of each area and the final combined change; resolve findings against the agreed contracts.
- [x] Run affected tests, build, lint/format, full pnpm test:unit and Storybook on an isolated exact candidate. Update relevant API guidance. Report precise evidence and limitations before resuming merge consideration.

## Decisions and evidence

- Keep query cancellation identities separate from write recovery; their lifetimes differ.
- A synchronous published state must agree with operation eligibility; observers may issue commands immediately.
- Coverage complements operation invariants; it does not establish correctness by itself.

- Review refinement: a reload completion observer can navigate a cursor page before the old reload issues its automatic refresh. RecordQueries now captures per-instance query intent before notification and suppresses stale automatic reads across reload/save-as/delete. The original reproducer and 12 operation-invariant tests pass.
- Filter contextual regressions: 19 cases; 13 initially failed, all now pass. Independent filter and engine reviews passed; final cross-boundary review found the follow-up issue above and confirmed its correction.

- Final verification on the isolated exact candidate: Node 24, `VITEST_MAX_WORKERS=4 pnpm test:unit` 5,510 passed / 1 skipped; view-engine 840 normal + 840 compiled, type checks passed. `pnpm test:storybook` 286 passed. Affected dependency/package build, ESLint and scoped Prettier passed.
- `VIEW_ENGINE_BROWSERS=chromium,firefox,webkit pnpm verify:view-engine` passed public archive/types, LocalStorage and HTTP recovery, production Storybook, all three browser readiness suites and unchanged performance budgets. WebKit retains the existing reviewed Base UI focus-sentinel findings; this is not VoiceOver certification. Logs: `/tmp/fve-state-final-unit.log`, `/tmp/fve-state-storybook.log`, `/tmp/fve-state-acceptance/`.
