# View Engine Boundaries Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement and review each task.

**Goal:** Make public page contracts, per-kind session derivation and analysis result rendering independently maintainable.

**Architecture:** Keep one store and existing lifecycle/recovery semantics. Put record/analysis policy in their domains and compose them explicitly; do not add registries, dependencies or compatibility wrappers.

**Tech Stack:** TypeScript, React, Vitest, pnpm.

**Spec:** User-approved architectural review in this task (September 12): public contracts → session responsibility → analysis results. This plan records that approved design; the other structural-refactor spec belongs to concurrent work.

## Global Constraints

- Work in the existing isolated checkout at audited commit 500f5363; do not alter the original checkout's ongoing AnalysisEditor work.
- No new packages or build configuration changes. PR submission is authorized by the follow-up user request.
- Preserve draft/result/baseline distinction, editor lifetime, conflict reviews, async admission and cache eviction semantics.
- Update public API references and both wiki languages for changed page props.

### Task 1: Public contracts and validation ownership

- [x] Define page props explicitly; record-only options become `record?: Pick<RecordViewProps, 'selectable' | 'autoRefreshPaused' | 'renderToolbar' | 'renderCard' | 'renderPagination'>`. Shared engine/extensions/filterContext/className remain at page level. Page owns configuration panel state.
- [x] Move ViewExtensions composition to view/viewReactTypes.ts; record components consume RecordExtensions (filters and record renderers only). Keep public ViewExtensions export at react entry, add RecordExtensions.
- [x] Move common instance validation to contracts/validation; delegate config validation to record and analysis modules, preserving all checks. Update callers and public exports without compatibility files.
- [x] Migrate examples/tests/docs and add a compiler contract rejecting top-level record-only page props. Run type checks and affected page/host tests.

### Task 2: Per-kind session derivation

- [x] Extract recordSession.ts under record/engine and analysisSession.ts under analysis, owning initialization and derivation. Preserve all field values/cache semantics.
- [x] Keep shared edit-version and reconciliation semantics in engine/sessionState.ts. Domain helpers must not import this dispatcher; pass common values explicitly. Avoid new generic strategy interfaces.
- [x] Existing SessionStore remains sole publisher. Extract type-specific result cleanup if it fits naturally with the new helpers; preserve eviction order.
- [x] Run engine tests, analysisEngine tests and architecture graph test, then test:type. Report changed files and invariants.

### Task 3: Analysis result presentation

- [x] Extract internal AnalysisResult component from AnalysisView.tsx, including projection, tabs/table/chart/error recovery and empty states.
- [x] Consume readonly session/definition/compilers and narrow callbacks rather than ViewEngine. Leave query admission, panel coordination and retained instance lifetime in AnalysisView.
- [x] Preserve executed result captions/schema, stale-result presentation, query-free layout changes, chart fallback/reset keys, table keepMounted and active chart guard.
- [x] Run analysisView, analysisViewFailure, analysisResultSummary, analysisDisplaySelection and compiled-mode tests plus test:type.

### Task 4: Integration and review

- [x] Run package test (coverage, compiled, type), affected dependency/package build, wiki build and lint.
- [x] Review final diff for lifecycle/union/contract regressions; check git diff --check.
- [x] Report actual checks and material limitations. Leave changes uncommitted.

## Execution evidence

- Task 1: type-contract negative test failed before page migration; migrated page/validation tests: 6 files / 91 tests passed.
- Task 2: 34 engine/analysis/architecture files / 331 tests passed; type and scoped lint passed.
- Independent task 1/2 review: 38 files / 410 tests passed; no code regression found. Stale parameter documentation corrected.
- Ruling: no commit or upstream integration; user approved implementation, not publication. Original checkout remains untouched.
- Ruling: preserve existing query admission and recovery behavior. Public page record-only props are intentionally nested with no legacy wrappers, per active-development API policy.

- Task 3: AnalysisView 672 → 483 lines; internal AnalysisResultView.tsx 261 lines, no engine/subscriptions. Both normal and compiled targeted suites: 48 tests each passed.
- Ruling: use AnalysisResultView.tsx (component AnalysisResult) because AnalysisResult.tsx collides with existing analysisResult.ts under TypeScript casing checks.
- Final independent source review: no actionable regression; chart/tab lifecycle, result/draft meaning, sort/admission/focus verified.
- Storybook build: 19 navigation targets, 171 regression stories verified. Targeted browser tests using installed Chrome: 4 files / 6 tests passed.
- Default-worker full suite encountered 5-second timeouts in architecture and OverlayScope while other builds were active. Re-running complete coverage and compiled suites with maxWorkers=4, without changing assertions or timeout configuration.

## Final verification

- Full normal coverage suite, maxWorkers=4: 159 files, 1432 passed, 2 existing skips. Statements 96.29%, branches 91.70%, functions 97.35%, lines 98.05%; existing thresholds passed.
- Full React Compiler suite, maxWorkers=4: 159 files, 1432 passed, 2 existing skips.
- Final test:type, package build, package+story lint and git diff --check passed.
- Storybook build passed (19 navigation targets, 171 regression stories); targeted Chrome browser verification passed (4 files, 6 tests).
- Both-language wiki build and 11 documentation tests passed; public symbol indexes and LLM corpus regenerated with repository scripts.
- No commits, pushes, merges or changes to the original checkout. No dependencies or build configuration changed.

## PR preparation

The user subsequently authorized creating a PR. The feature branch retains the 14 prerequisite structural-refactor commits from the audited baseline, followed by this boundary refactor. The original checkout and its uncommitted work remain excluded. Full workspace package builds precede the required root unit suite.

PR review caught a prerequisite reload-ordering regression: stale receipts reached validation and cleared an unverified-delete marker. Restored the pre-validation currency check and added a public-engine race test. The new test failed before the fix; 53 targeted deletion/reentrant-write/recovery tests passed after it. Scoped re-review passed.

After the race fix, `VITEST_MAX_WORKERS=4 pnpm test:unit` passed across all workspace packages. View Engine normal and compiled suites each passed 1433 tests (2 existing skips); type checks passed.
