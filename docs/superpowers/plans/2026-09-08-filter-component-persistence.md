# Filter Component Persistence Implementation Plan

**Goal:** Persist lossless filter component configuration, compile it through component-owned pure functions, and distinguish configuration edits from query changes.

**Spec:** The user confirmed the adversarial review in this task: save stable serializable component configuration, keep compilation independent of React mounting, allow saving an added unset control without querying, and require querying changed query semantics before saving.

**Baseline:** `ea224f35`, clean worktree. Existing library is unpublished; the user explicitly waived compatibility. The user subsequently authorized a local commit. Push, publication, dependency and build-configuration changes remain outside the request.

**Tech stack:** Existing strict TypeScript, React, shadcn/Base UI and Wow filter DSL. Core must remain independent of React/DOM.

## Contract

The persisted instance becomes:

```ts
interface RecordViewConfig {
  filters: FilterConfiguration;
  sort: FieldSort[];
  pagination: { mode: 'paged' | 'cursor'; size: number };
  presentation: RecordTablePresentation;
}

interface FilterConfiguration {
  mode: FilterMode;
  root: FilterComponentConfig;
}

interface FilterComponentConfig {
  id: string;
  component: FilterEditorReference; // name + JSON options; reserved name "builtin"
  operator: FilterOperator;
  field?: string;
  props: FilterComponentProperties;
  operands?: FilterComponentConfig[];
  predicate?: FilterComponentConfig;
}

type FilterComponentProperties = Record<string, FilterJsonValue | undefined>;

interface FilterCompilerContext {
  operator: FilterOperator;
  field?: DeepReadonly<FilterFieldDefinition>;
  fields: DeepReadonly<readonly FilterFieldDefinition[]>;
  options?: DeepReadonly<Record<string, FilterJsonValue>>;
}

interface FilterCompiler {
  compile(
    props: DeepReadonly<FilterComponentProperties>,
    context: FilterCompilerContext,
  ): FilterExpression | undefined;
  clear?(
    props: DeepReadonly<FilterComponentProperties>,
    context: FilterCompilerContext,
  ): FilterComponentProperties;
}

type FilterCompilerRegistry = Readonly<Record<string, FilterCompiler>>;
```

Object properties with `undefined` represent unset input and are omitted in saved JSON; null, false, zero and empty string retain their meaning. Arrays cannot contain non-JSON values. Reject functions, DOM values, non-finite numbers and cycles. Component IDs are stable configuration identities, distinct from mounted DOM IDs.

`FilterDraftNode` remains the internal editor tree used by existing built-in controls. Add `editor?: FilterEditorReference` for a chosen component and `props?: FilterComponentProperties` for opaque custom state. Built-in payload fields remain as editor attributes. The conversion between this tree and saved configuration copies attributes, never reverse-engineers a compiled query.

Public filter helpers:

```ts
createFilterConfiguration(draft: DeepReadonly<FilterDraftNode>, mode?: FilterMode, fields?: readonly FilterFieldDefinition[], editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>): FilterConfiguration;
restoreFilterConfiguration(config: DeepReadonly<FilterConfiguration>): FilterDraftNode;
validateFilterConfiguration(value: unknown, fields?: readonly FilterFieldDefinition[]): asserts value is FilterConfiguration;
compileFilterConfiguration(config: DeepReadonly<FilterConfiguration>, fields: readonly FilterFieldDefinition[], allowedOperators?: readonly FilterOperator[], compilers?: FilterCompilerRegistry): FilterCompileResult;
compileFilterDraft(draft: DeepReadonly<FilterDraftNode>, fields: readonly FilterFieldDefinition[], allowedOperators?: readonly FilterOperator[], compilers?: FilterCompilerRegistry, editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>): FilterCompileResult;
compileBuiltinFilter(props: DeepReadonly<FilterComponentProperties>, context: FilterCompilerContext): FilterExpression | undefined;
clearBuiltinFilterProps(props: DeepReadonly<FilterComponentProperties>): FilterComponentProperties;
clearFilterDraftValues(node: DeepReadonly<FilterDraftNode>, fields: readonly FilterFieldDefinition[], compilers?: FilterCompilerRegistry, editors?: Readonly<Partial<Record<FilterOperator, FilterEditorReference>>>): FilterDraftNode;
```

The compiler resolves the node's explicit editor first, then the field/operator default for newly added controls, then `builtin`. Serialization records the chosen reference. Unknown components and invalid outputs are errors, never implicit `MATCH_ALL`. Custom compiler output is validated against the declared field binding, field capabilities and allowed operators. Logical/element nodes keep their structure; ordinary custom components cannot change their binding or turn into component containers. A compiler may return an expression combining predicates for its bound field.

The React registration extends `FilterCompiler`. Renderer props become `props: DeepReadonly<FilterComponentProperties>` and `onChange(props: FilterComponentProperties): void`, replacing the compiled `node`/expression callback. Existing field/operator/context/mode/options/disabled metadata remains. Complete components retain guarded operator change and removal; `onClear` is available only when the component supplies clear semantics. `supports`, when provided, inspects component props and compiler context. Builtin-compatible custom renderers can reuse `compileBuiltinFilter` and `clearBuiltinFilterProps`.

## State and query boundaries

- `ViewEngineOptions.filterCompilers?: FilterCompilerRegistry` provides headless compilation. `ViewPage` excludes the core `filterCompilers` option and supplies these capabilities solely from the complete component definitions in `extensions.filters`. Keep one consistent registry per engine scope; do not depend on mounting a component or reading its local state.
- Add `RecordSession.appliedFilter: DeepReadonly<FilterExpression> | null`. It is the query-only scope used by records, summaries and action contexts. Null means compilation has not succeeded; no record or aggregate request may run.
- `instance.config.filters` holds the accepted component configuration. `filterDraft` retains edits not yet accepted for a changed query, and `filterBaseline` retains the accepted editor tree for Undo and applied tags.
- `setFilterDraft` compiles the candidate. If local input is valid and the compiled result equals `appliedFilter`, accept the component configuration immediately and advance the editor baseline without a request. This enables saving unset controls and non-query props. Otherwise preserve the draft, leave accepted instance configuration/result scope intact, and mark query pending.
- `filterPending` is derived from compiler errors, local input validity and compiled-query equality. It is not editor-tree equality. `dirty` remains accepted configuration versus saved baseline.
- `setFilterMode` persists supported mode changes when the query is synchronized; pending edits retain their mode until Query accepts the whole configuration.
- `applyFilter(expression?: DeepReadonly<FilterExpression>, id?: string)` compiles the current component configuration. An optional supplied expression must equal that result. It can no longer create editor state from an expression. Programmatic clients first call `setFilterDraft`, then `applyFilter()`.
- Query acceptance updates `config.filters`, `filterBaseline`, `appliedFilter`, page/cursor and summaries atomically. Save/save-as/reload restore component attributes from configuration. Preserve all existing write reconciliation, immutable snapshots and scope/cancellation guards.
- Record/Table/action consumers receive the runtime applied filter explicitly. They must not read or compile a saved query from `instance.config`. No fallback to all records when it is null.

## Work packages

### 1. Filter component contract, compiler and editor UI

Files: `src/filter/**`, filter tests. The filter worker owns these files.

- [x] Add the model and conversion/compiler functions above; keep unrelated UI style unchanged.
- [x] Add failing tests for JSON round-trip of unset, date/time and opaque custom properties; compile through a custom pure registration; reject unknown/malformed components and cross-field output.
- [x] Update editor registrations and callbacks to use raw component props. Keep guards for stale callbacks, invalid buffers, modes, keyboard Query, and explicit fallback.
- [x] Derive panel pending from compiled semantics. New unset controls must not show an unqueried change; invalid buffers still block Query.
- [x] Use registration clear semantics for builtin/custom values while retaining controls, groups and IDs.
- [x] Run filter-domain tests and report exact new exports/types to the other workers.

### 2. Core state, persistence, validation and query integration

Files: `src/record/recordModel.ts`, `src/record/engine/**`, `src/record/validation/**`, `src/index.ts`, core/summary/validation tests and core fixtures. Primary agent owns these files.

- [x] Migrate the persisted model to `filters`; validate component JSON separately from runtime compilation. Reject the former `config.filter` shape.
- [x] Restore configuration on load, compile through the provided registry, and block unresolved component queries without dropping their configuration.
- [x] Implement accepted configuration versus pending query rules, including save/reload of newly added unset controls with zero extra queries.
- [x] Update query/summaries to `appliedFilter`, preserving retries, pagination and stale-work exclusion.
- [x] Update save/save-as/reload reconciliation and programmatic apply callers. Add failing regressions proving raw props survive a JSON-backed host and new engine reload.
- [x] Run core tests and integrate public exports.

### 3. React page/table consumers and their tests

Files: `src/record/RecordView.tsx`, `ViewPage.tsx`, `recordReactTypes.ts`, `src/record/page/**`, `src/record/table/**`, table/page tests and their fixtures. React integration worker owns these files.

- [x] Supply a consistent compiler registry from ViewPage extension registrations to its engine. Keep existing scope/host lifetime rules.
- [x] Pass `session.appliedFilter` explicitly to table/row/global/batch consumers. Allow null only as an uncompiled state; never invent an all-records filter.
- [x] Render/clear applied tags using component definitions and raw configuration. Preserve fields, groups, unsets, focus and keyboard behavior.
- [x] Update affected UI tests/fixtures to component configuration; prove Save enables for an added unset control but blocks changed query values until Query.
- [x] Run table/page tests and report API changes needed by examples.

### 4. Runnable examples, stories and documentation

Files: `stories/view-engine/**`, `examples/**`, `scripts/verify-package.mjs`, both READMEs and `skills/fetcher-view-engine/references/api.md`. Examples worker owns these files.

- [x] Migrate fixture construction to `filters` and renderer registrations to props + pure compilers.
- [x] Demonstrate a custom component with extra display props that cannot be recovered from its compiled expression. Save it through JSON and reload it correctly.
- [x] Add Storybook interaction coverage for save/reload of unset controls, unchanged query counts, and changed-value Query-before-Save.
- [x] Update public core/React examples, packed consumer/type checks and bilingual/API documentation together.
- [x] Run affected Storybook cases once the package has been rebuilt; no private-source import workarounds.

## Final gates

- [x] Review all changed paths and public contracts for consistency; resolve cross-domain findings without extra features.
- [x] Package tests/type check, build and scoped lint/format pass.
- [x] Relevant Storybook browser tests, public packed consumers and `pnpm test:unit` pass.
- [x] Verify actual save/reload and keyboard/clear behavior in the browser, including custom and unset controls.
- [x] Record evidence and remaining host-system limits; create a local commit when explicitly requested.

## Verification evidence

- Pre-commit `pnpm test:unit`: 3,610 passed, 1 skipped. View engine: 64 files / 350 tests, including declared TypeScript checks.
- Final `pnpm test:storybook stories/view-engine`: 5 files / 43 passed, including accessibility checks.
- Package build, headless JSON persistence example and packed consumers passed. Packed verification covered 7 React example modules, 5 public targets, 234 identical distribution files and 2 React-free core runtime modules.
- Final archive SHA-256: `75e3823441069e154e1145ed6e1ec806048964db98fd631abd0f1b069411e27d`.
- Browser checks confirmed saving an unset builtin control, Query-before-Save, Enter query, clearing values while retaining controls, and custom selected ID/display label save/reopen through JSON. Temporary pages and the standalone example server were closed.
- Cross-review identified and fixed cancellation reentrancy in save-as copying and record queries. Regressions cover fresh raw props after cancellation, and newer queries triggered by both state and abort notifications.
- No new dependencies, compatibility persistence layer, pushes or publication. A local commit was explicitly requested after verification. Source compilation functions remain a host registration contract and cannot depend on React state.
