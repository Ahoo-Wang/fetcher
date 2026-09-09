# RecordView Production Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver the existing data-view library against a reproducible acceptance gate and prepare the analysis-view contract handoff.

**Architecture:** Reuse current core/UI/service responsibilities; repair only demonstrated shared causes. Add development-only acceptance instrumentation and connect existing verifiers to CI. Analysis remains documentation.

**Tech Stack:** TypeScript, React 19/React Compiler, shadcn/Base UI, TanStack Table, Vitest, Storybook, installed Playwright/axe, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-09-record-view-production-design.md`

## Global Constraints

- No new dependencies or published entry points; no push, publish, deployment or real-business security claim.
- Preserve record semantics and reuse Fetcher APIs; no generic analysis runtime or speculative virtualizer/cache.
- Scale fixture: 100 loaded rows, 30 visible data columns, 100 filter candidate fields; warm no-network interaction p95 ceiling 1000ms.
- Test viewports: 1440px and 390px; default light/dark themes; record exact tested browser versions.
- Root `pnpm test:unit` passes before committing; use `VITEST_MAX_WORKERS=4`, without timeout inflation or assertion suppression.
- Existing worktree/branch is authorized. The user delegated decisions and intermediate review. Commit only after integration verification; workers do not commit individually.

### Task 1: Reproducible delivery gate

**Files:** root `package.json`; `.github/workflows/ci.yml`, `build-storybook.yml`, `codecov.yml`, `README.md`; `scripts/verify-view-engine.mjs`; `packages/view-engine/scripts/verify-view-host.mjs`, `verify-http-view-host.mjs`; relevant script fixtures if needed.

**Interfaces:** Produces `pnpm verify:view-engine` after workspace build. It runs the existing package verifier, launches an owned Storybook dev server at an isolated port, then runs host verifiers and Task 3's `verify-readiness.mjs`. Pass `VIEW_ENGINE_E2E_BASE_URL` to child scripts. Preserve `VIEW_HOST_E2E_URL` override for the local verifier. Browser launch accepts `VIEW_ENGINE_BROWSER_CHANNEL`; empty means installed Playwright Chromium, otherwise use that channel. `VIEW_ENGINE_ARTIFACTS` names an optional artifact directory. The readiness child is included once Task 3 supplies it.

- [x] Read each existing verifier and trace its URL/server ownership, error propagation and teardown before editing.
- [x] Make the smallest orchestration script using Node child_process/http APIs: no shell interpolation, bounded readiness wait, propagate nonzero child exit, terminate only the server it started on success/error/signal.
- [x] Expose the root command and connect the existing CI Storybook job; install required browser binaries explicitly. Set bounded unit workers in existing unit jobs. Avoid duplicate full builds/tests inside the verifier.
- [x] Validate syntax, script configuration, real local/HTTP recovery flows and failure behavior on an invalid server URL. Report exact commands and any remaining dependency on Task 3.

```sh
node --check scripts/verify-view-engine.mjs
node --check packages/view-engine/scripts/verify-view-host.mjs
node --check packages/view-engine/scripts/verify-http-view-host.mjs
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm verify:view-engine
```

### Task 2: Core/host correctness and lifetime audit

**Files:** inspect `packages/view-engine/src/record/engine/**`, `ViewEngine.ts`, `LocalStorageViewHost.ts`, `validation/**`, `filter/**` and matching tests. Changes limited to confirmed defects and their tests.

**Interfaces:** Consumes current ViewHost services and ViewEngine commands; preserves public signatures. Produces evidence for stale-response rejection, uncertain-write recovery, disposal, field-path and extension behavior.

- [x] Trace each query/write path through scope/controller/version validation, including synchronous subscriber reentry.
- [x] Reproduce each finding with one focused test exercising the real engine/host; report reproduction separately from repair.
- [x] Fix the owner of the shared cause; run affected ordinary and compiled tests. Do not rewrite working modules for size/style alone.
- [x] Add any missing high-value lifecycle or nested-rendering coverage; inspect tests for assertions on real outcomes, not timers/mock echoes.

```sh
pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/engine test/localStorageViewHost.test.ts test/localStorageViewHost.contract.test.tsx --maxWorkers=4
pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run --mode compiled --maxWorkers=4
```

### Task 3: Browser, accessibility and scale acceptance

**Files:** new `stories/view-engine/development/Readiness.stories.tsx`, supporting readiness fixture files in the same directory; new `packages/view-engine/scripts/verify-readiness.mjs`; minimal owned component fixes and focused tests if checks reveal defects.

**Interfaces:** Story ID `development-view-engine-readiness--workbench`, consumes public built core/React/CSS imports. Script consumes `VIEW_ENGINE_E2E_BASE_URL`, `VIEW_ENGINE_BROWSER_CHANNEL`, `VIEW_ENGINE_ARTIFACTS`; writes JSON measurements and screenshots and exits nonzero on failed assertions. Runtime instrumentation belongs solely to the development fixture.

- [x] Supply real public ViewEngine/ViewPage data with nested paths and all built-in cell types; 100 rows, 30 visible data columns, 100 candidate fields. Reuse helpers before adding any. Fixture query simulator supports only explicitly advertised operations and rejects unsupported ones.
- [x] Check dark/light/narrow layouts, keyboard filter/query/select/escape, popup accessibility and failed/empty/loading recovery using installed Playwright and axe-core. Retain screenshots for visual inspection.
- [x] Measure warm refresh, selection and field-panel interaction across repeated samples with two animation-frame settlement; assert the stated p95 ceiling, record all raw values and environment. Prove idle resources settle on repeated disposal with source-owned request/subscription counters.
- [x] Repair confirmed root causes with focused regression tests, and rerun the failing scenario. Avoid adding a general benchmark framework.

```sh
VIEW_ENGINE_BROWSER_CHANNEL=chrome node packages/view-engine/scripts/verify-readiness.mjs
pnpm lint:view-engine
```

### Task 4: Reviewable completion and analysis handoff

**Files:** `packages/view-engine/README.md`, `README.zh-CN.md`, `skills/fetcher-view-engine/references/api.md`; `docs/superpowers/reviews/2026-09-09-record-view-production.md`; `docs/superpowers/specs/2026-09-09-analysis-view-handoff.md`.

- [x] Write scope, commands, environment, evidence matrix, actual results and known limits; explicitly distinguish local CI-equivalent validation from remote CI execution.
- [x] Document reusable configuration/services/formatting and record-only primary keys, pagination, selection/row actions and summary-vs-analysis semantics. Next phase starts with dimension/measure schema and persisted component configuration; no implementation stubs.
- [x] Run final package/workspace builds, all unit tests, both compiler modes/types, Storybook, lint, formatting, public-package and browser-host/readiness gate.
- [x] Request independent scoped and whole-change review; resolve blocking findings, recheck changed areas, then commit. Keep the user's current worktree intact and return commit IDs plus report links.

```sh
pnpm build
VITEST_MAX_WORKERS=4 pnpm test:unit
pnpm lint:view-engine
pnpm test:storybook
pnpm build-storybook
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm verify:view-engine
git diff --check
```

## Completion evidence

Executed and independently reviewed on 2026-09-09. See `docs/superpowers/reviews/2026-09-09-record-view-production.md` for the authoritative checks, measured browser results, disclosed WebKit exception, and decisions. Full build/unit/Storybook/lifecycle and public-package/host/browser gates passed. Local commits preserve this worktree for the user's next-day review; nothing was pushed or deployed.
