# FilterPanel Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for integration and superpowers:dispatching-parallel-agents for the independent core and value-editor tasks. Preserve the existing uncommitted work; do not commit or publish during component development.

**Goal:** Deliver the complete, reusable Wow FilterPanel and Storybook examples.

**Architecture:** Keep the transient editable tree separate from the emitted Wow FilterExpression. The core validates and compiles all 50 operators without React; React provides structured field, logical and element editors plus controlled application of queries. Use the existing shadcn/Base UI primitives and value controls.

**Tech Stack:** TypeScript 6, React 19, Wow query helpers, shadcn Base UI, Vitest, Storybook.

**Spec:** `docs/superpowers/specs/2026-09-05-wow-view-engine-filter-design.md` and the extension section of `2026-09-05-wow-view-engine-design.md`.

## Constraints

- Simple mode is an implicit flat AND; advanced supports all Wow operators through structured controls.
- Fixed fields; compact ordinary filters; distinct AND/OR/NOR/ELEMENT_MATCH containers.
- Edit, clear, undo and mode changes never execute queries. Query applies once after validation.
- Fully unset predicates are omitted; partial or invalid values block application. Preserve null, false, zero, empty strings and optional protocol parameters.
- Keep empty filter controls after applying; prune inactive nested groups before composing expressions, using MATCH_ALL only at the empty query root.
- Parent owns requests, view saving, definition loading, access control and instance identity. Expose draft changes so a host can retain transient buffers per mounted/unmounted instance.
- Extensions are local maps, support mode fallbacks, cannot change a bound field, and cannot hide invalid state behind an old valid value.
- External dependencies use the workspace catalog; internal Wow uses `workspace:^`. Core exports must not load React/CSS.

## Shared contract

`src/filter/filterModel.ts` owns FilterFieldDefinition, FilterDraftNode, FilterOperatorDefinition and FilterCompileResult. A draft uses Wow property names plus an ephemeral `id`; numeric text uses an explicit `{type: 'number', value: raw}` wrapper so loaded protocol strings retain their type; scalar properties can temporarily contain raw input and are never sent directly to the backend. Date/time drafts use `{date?: string, time?: string, offsetMinutes?: number}`; date output is YYYY-MM-DD, datetime output epoch milliseconds. `timeZone` on field metadata defaults to the browser/runtime local zone.

`src/filter/filterCore.ts` exports:

```ts
createFilterDraft(expression: FilterExpression): FilterDraftNode
newFilterDraft(op: FilterOperator, field?: string): FilterDraftNode
compileFilterDraft(draft: FilterDraftNode, fields: readonly FilterFieldDefinition[], allowedOperators?: readonly FilterOperator[]): FilterCompileResult
getFieldOperators(field: FilterFieldDefinition): readonly FilterOperator[]
isSimpleFilter(draft: FilterDraftNode): boolean
FILTER_OPERATORS: Readonly<Record<FilterOperator, FilterOperatorDefinition>>
```

`src/filter/FilterValueEditor.tsx` consumes `{node, field?, fields, disabled?, onChange(node)}` and emits immutable raw drafts while preserving the id/field/other parameters. It uses FILTER_OPERATORS input descriptors and the existing controls.

## Task 1: Headless compiler and operator metadata

Files: `filterModel.ts`, `filterCore.ts`, `test/filterCore.test.ts`; add Wow and the already-installed date timezone helper as direct dependencies.

- [x] Write tests proving all 50 operators round-trip without inserting default parameters.

```ts
expect(
  compileFilterDraft(createFilterDraft(filter.eq('amount', 0)), fields)
    .expression,
).toEqual(filter.eq('amount', 0));
```

- [x] Add missing/partial values, invalid raw numbers, range ordering, field capabilities, element-relative scopes, invalid operators, and inactive OR/NOR/ELEMENT_MATCH tests; observe failure before implementation.
- [x] Implement explicit operator descriptors and compile through existing Wow constructors. Restore omitted optional parameters instead of injecting constructor defaults.
- [x] Run `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/filterCore.test.ts`.

## Task 2: Complete structured value editors

Files: `FilterValueEditor.tsx`, `test/filterValueEditor.test.tsx`.

- [x] Write failing interaction tests for typed scalar, null/empty string, collection, between, datetime and special operator parameters.

```tsx
// Edit both bounds, clear one, verify raw state retains the other bound.
// Select false or numeric enum 0, verify emitted values keep their types.
```

- [x] Implement scalar and enum inputs, editable collection entries, bounds, date/time controls and all optional string/search/relative-time parameters. No JSON editor substitutes.
- [x] Reuse shadcn Select/InputGroup/Popover. Preserve incomplete raw values for core validation.
- [x] Run the focused value-editor tests.

## Task 3: FilterPanel and extension integration

Files: `FilterPanel.tsx`, `filterReactTypes.ts`, `test/filterPanel.test.tsx`, core and React export entrypoints.

- [x] Test manual apply, clear/undo, query failure/retry, edits during requests, external value changes and independent panel instances.

```tsx
// Change an amount: onApply is untouched; click Query: exactly one complete expression.
// Clear a field and Apply: omit predicate but retain the visible field control.
```

- [x] Build recursive logical/element containers, adding/removing/moving nodes with scope checks, and lossless simple/advanced switching.
- [x] Add local extension resolution, invalid-input notifications, fixed-field guards, missing-renderer feedback and per-editor error boundaries with built-in fallback.
- [x] Verify input composition/Enter does not inadvertently apply; keyboard accessible moves and group editing.

## Task 4: Storybook, documentation and verification

Files: `stories/view-engine/FilterPanel.stories.tsx`, package README files and `skills/fetcher-view-engine/references/api.md`.

- [x] Demonstrate business filters, nested OR/NOR/ELEMENT_MATCH, every operator family, custom async-capable editor, invalid inputs, empty values, query errors and dark mode.
- [x] Build the package and run its tests/type checks/lint and focused Storybook tests.
- [x] Inspect actual Storybook UI, including narrow containers and dark popups.
- [x] Independent review of core semantics and component state; fix verified issues and run covering checks.
- [x] Update API documentation and report actual delivery and validation; no service requests or publication.

## Execution notes

The user already approved the architectural/filter design and requested complete implementation. Continue within the current worktree. The existing standalone date/time stories remain available; the new FilterPanel is the integrated entrypoint. Existing complete view engines and persistence work remain out of this task.

## Completion evidence (2026-09-06)

- Delivered headless compilation for all 50 Wow operators, structured value editors, FilterPanel, local extension integration and seven complete-panel Storybook scenarios.
- Package tests: 124 passed; package type check, ESLint and build passed. Full repository `pnpm test:unit` passed (viewer retains one existing skipped test).
- Public-package Storybook browser tests: 14 passed across FilterPanel, Select and Date/Time; story type checks passed.
- Built core imported in Node with React/CSS imports forbidden; all 50 operators and a zero-valued expression verified.
- Actual UI checked at desktop and 414px: compact groups wrap within their boundaries, advanced element groups remain usable, and dark Select/Calendar portals inherit the theme. Container borders now use the default theme token.
- Independent core/value and panel reviews closed their verified findings. Regressions cover restored draft baselines, in-flight query de-duplication, external rollback, stale custom callbacks and validity after operator changes.
- Package README files and public API reference updated. No business service requests, commits or publication.

## Review follow-up (2026-09-06)

- Removed simple-mode condition menus and ordering controls; advanced moves only appear for compatible destination groups. Clear is in the value control, with optional special literals kept separate.
- Invalid extension state is independent of an empty message; replaced editor sessions permanently invalidate their callbacks.
- Datetime drafts preserve an optional offset hint for loaded instants in repeated DST hours; cross-season edits resolve with the target date's actual offset.
- Added regression tests and a saved-instant Storybook scenario. Validation below supersedes the earlier completion counts.
- Follow-up verification: 136 package tests, 15 View Engine Storybook browser tests, package and story type checks, ESLint, formatting and build passed. Full `pnpm test:unit` passed (viewer retains its existing skipped test). Original independent reproductions now pass; actual UI confirms no simple condition menu and only compatible-group moves in advanced mode. No commits or publication.
