# View Engine Contract Repairs Implementation Plan

> Execute inline with superpowers:executing-plans in the current worktree. The user approved these three findings; leave changes uncommitted until requested.

**Goal:** Keep filter submission, extension recovery and snapshot types consistent with their runtime behavior.

**Architecture:** Reject filter application while a reported editor buffer is invalid. Reset action error boundaries when their actual inputs change. Reuse `DeepReadonly` at snapshot/read boundaries and retain editable command payloads.

**Tech Stack:** Existing TypeScript, React, Vitest and Storybook; no new dependencies.

**Spec:** The user-approved follow-up architecture review in this task; existing manual-query and immutable-snapshot contracts in `skills/fetcher-view-engine/references/api.md`.

## Constraints

- Preserve manual Query, legal unset values, instance isolation and bound action refresh.
- No root/build configuration changes, added dependencies or new abstraction framework.
- Use the existing test fixtures and compiler-level contract test.
- The package is unpublished; synchronize changed API contracts with callers and documentation.

## 1. Filter application validity

Files: `packages/view-engine/src/record/ViewEngine.ts`, `packages/view-engine/test/viewPage.test.tsx`, `packages/view-engine/test/recordEngine.test.ts`.

- [x] Add a regression: a custom editor reports false, `engine.applyFilter(currentExpression)` rejects, Query/Save stay disabled, and no request occurs. Report true after correcting the editor, then Query/Save succeed.
- [x] Run `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/viewPage.test.tsx -t 'invalid custom'` and confirm the old implementation resolves instead of rejecting.
- [x] Guard `applyFilter` with `if (!session.filterValid) throw new Error('筛选输入无效，请先修正或撤销修改')` before any mutation/request. Update the existing core scenario to explicitly restore validity before submission.
- [x] Run engine and page regressions, including legal unset controls.

## 2. Action renderer recovery

Files: `packages/view-engine/src/record/RecordView.tsx`, `packages/view-engine/test/viewPage.test.tsx`.

- [x] Add regressions: batch actions recover when selection changes; global actions recover when a pending query finishes. Unrelated filter edits must not repeatedly retry a failed renderer.
- [x] Run these regressions and confirm stale rendering errors on the old code.
- [x] Include the renderer's definition, instance, options, selection, querying and refresh inputs in the existing `RecordRendererBoundary.resetKey` array.
- [x] Verify each action remains bound to its originating instance after navigation.

## 3. Snapshot/read contracts

Files: `packages/view-engine/src/record/recordModel.ts`, `packages/view-engine/src/record/ViewEngine.ts`, read-only consumers as required by TypeScript, `packages/view-engine/test/extensionContracts.test.ts`.

- [x] Extend the existing compiler probe with `@ts-expect-error` on snapshot title assignment, sort mutation, draft mutation and definition metadata mutation; confirm unused directives before changing types.
- [x] Apply existing `DeepReadonly<T>` to snapshot definitions, instances, drafts and records. Make read-only helper/React inputs accept snapshots; preserve mutable copies at command boundaries rather than casting away readonly data.
- [x] Verify snapshot reapplication and editable payload construction remain supported, then run package and Storybook type checks.

## 4. Documentation and verification

- [x] Update both READMEs and `skills/fetcher-view-engine/references/api.md` for invalid application rejection and deep readonly core snapshots.
- [x] Run affected package tests/build, all view-engine Storybook interactions, scoped ESLint/Prettier and `git diff --check`.
- [x] Inspect the final diff and leave the work ready for local commit.

## Verification completed before local commit

- Regression red run: the invalid apply resolved, both action areas failed to recover, and snapshot mutation directives were unused.
- Affected package: 286 tests passed; declared TypeScript checks passed.
- Package production build passed.
- View-engine Storybook: 38 browser interactions passed; Storybook TypeScript checks passed against the rebuilt package.
- Scoped ESLint, Prettier and git whitespace checks passed.
- Full monorepo `pnpm test:unit`: 3546 passed, 1 skipped; declared type checks passed.
- No dependencies or root/build configuration changed.
