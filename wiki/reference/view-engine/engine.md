---
title: ViewEngine lifecycle and commands
description: Own engine lifetimes, read immutable snapshots and issue scoped commands.
---

# Shared record and analysis lifecycle

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { useViewEngine, ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function OrderPage({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ scopeKey, definitionId: 'orders', host });
  return <ViewPage {...binding} record={{ selectable: true }} />;
}
```

`useViewEngine(options)` owns creation, loading and disposal, including React StrictMode. Its required `scopeKey` and `definitionId` identify the lifetime; changing either replaces the engine. Optional local `definition`/`instances`, paired compiler/editor registrations in `extensions`, `limits` and `onDiagnostic` initialize that lifetime. Same-scope host updates preserve edits. Change the React key to explicitly reinitialize other inputs. The hook returns `ViewEngineBinding`: `{ engine: ViewEngine | null, extensions?, error? }`.

`ViewPage` is pure UI: pass the binding, or a caller-owned engine. It never loads or disposes that engine. `ViewPageContent` requires a non-null engine. Both compose navigation, shared writes and the selected `RecordView`, `AnalysisView` or `DashboardView`. `RecordView` and `AnalysisView` render only their own kind. A headless caller creates `new ViewEngine({ definitionId, host, definition?, instances?, filterCompilers?, analysisCompilers?, limits?, onDiagnostic? })`, calls `load()`, then `dispose()` when its scope ends.

### Definitions and saved instances

`ViewDefinition` has `id`, `title`, query-only `sourceId`, shared `fields`, optional `timeZone`, `allowedOperators` and `filterEditors`. Declare at least one capability:

- `record: { rowKey, allowedLayouts, defaultPresentation?, recordActions? }`. `RecordViewDefinition` makes this capability required. Row keys are own-property paths; `allowedLayouts` is a nonempty unique list of `table`/`card`.
- `analysis: AnalysisCapability` authorizes COUNT, scalar ANY, predefined Elements scopes, numeric expressions/functions, field grouping, date units and bounds. An aggregate-only source does not need a record row key or paging functions.

`ViewInstance` is the discriminated union `RecordViewInstance | AnalysisViewInstance | DashboardViewInstance`. Both require nonblank `id`, `definitionId`, `title`, `revision` and a `scope`. `kind: 'record'` uses `RecordViewConfig` (`filters`, `sort`, `pagination`, `presentation`); `kind: 'analysis'` uses `AnalysisViewConfig` described below. Scope is personal or public/system/shared; it is not permission. Create input omits only ID and revision; the service returns both.

`ViewInstanceList` contains the visible instances and `defaultInstanceId: string | null`. Default preference and current selection are independent. The list may mix kinds. Structurally valid but currently unexecutable configurations remain editable with `session.validation`; a broken instance does not prevent healthy siblings from being used.

### Working content, applied results and saves

Snapshots are immutable. `ViewEngineState.version` increases on publication and each session has an `editVersion` for working edits. `RecordSession.queryAttempt` captures the in-flight query; `RecordSession.result` binds successful rows to its config/filter/page/cursor and receivedAt. `AnalysisSession.compilation` contains the immutable compilation of the current working configuration (plan or validation errors), shared by the engine and renderers without recompiling during render. `AnalysisSession.pendingQuery` captures the in-flight plan. Render provenance and business actions must use the applicable result/attempt, never infer query scope from working edits. Renderer and action instance metadata, including an unsaved title, remains current while query configuration stays bound to the executed result. `ViewSession` is discriminated by `kind`; narrow it before accessing record-only or analysis-only state. Shared fields include `baseline`, current working `instance`, `dirty`, `validation`, `writeStatus`, `writeError`, `requiresReload` and optional `conflict`.

Record sessions retain `filterDraft`, `filterBaseline`, `appliedFilter`, `filterPending`, page/cursor, rows, summaries and selection. Editing working filters does not change the applied query or records. `filterPending` means the working filter differs from the applied scope; it does not by itself disable Save. Analysis sessions keep an independent successful `result` with query/schema provenance; later edits or failed runs do not relabel those rows as a new result.

`save(id?)` validates and persists current working content without running a query. Invalid raw input blocks saving, but valid unqueried edits can be saved. A receipt advances the baseline while preserving edits made after submission. `saveAs({ title, scope }, id?)` returns `Promise<string | undefined>`: a created ID when known; creation recovery can outlive the originating selection. Runtime rows, selection, errors and countdowns are never persisted as configuration.

### Commands and result ownership

`engine.analysis(id)` binds `edit(updater)`, `run()`, `refresh()`, `clearSort()`, `setFilterValidity(valid)` and `restore()` to one analysis instance. `edit`/`clearSort`/`restore` do not query; `run` compiles and validates the complete result before publishing. `engine.record(id)` binds `edit(updater)`, `refresh()`, `setPage(page)`, `setPageSize(size)`, `applyFilter()` and `restore()`. Bound commands become invalid after the instance lifetime is replaced. Editing callbacks must be pure and may not reenter engine commands.

`engine.analysis(id).refresh()` requests a safe automatic refresh: it runs only when the current query still matches the successful result, editor input is valid, writes are idle, and no conflict or reload requirement exists. It skips ineligible states without submitting drafts; `run()` remains the explicit execution/retry operation. `AnalysisSession.queryValid` is derived from query compilation, editor validity and resource limits; presentation-only errors do not make the query invalid, though they still block saving.

All session kinds expose `editorEpoch`. Accepting a reviewed remote version advances it and discards local editor buffers; ordinary reload/restore retain their documented non-destructive input behavior. Custom mounted editors should bind commands and reset their local buffers when `(instance.id, editorEpoch)` changes, as the built-in views do. Old validity callbacks are ignored after this reset; old analysis edits and record draft edits are rejected rather than overwriting the accepted remote configuration. Published active and pending-create sessions use the same final validation path. Record admission always checks pagination/layout discriminants and nested presentation structure; missing field or capability references remain recoverable semantic errors. Cancelling an analysis refresh retains the successful result status, allowing subsequent automatic refresh.

All record operations are on `engine.record(id)`: `setFilterDraft(configuration, valid?)`, `setFilterValidity(valid)`, `setFilterMode(mode)`, `applyFilter()`, `setSort(sort)`, `setColumns(columns)`, `setLayout(layout)`, `setCardConfig(card)`, `setPage(index)`, `setPageSize(size)`, `nextPage()`, `setSelection(keys)`, `refresh({ background? }?)`, `retryQuery()` and `refreshSummary()`. The facade no longer exposes direct record commands. Shared operations are `setTitle`, `save`, `saveAs`, `restore`, `reloadInstance`, `renameInstance`, `deleteInstance`, `setDefaultInstance` and `reorderInstances`. Record restore restores the baseline and queries; analysis restore restores its working configuration without running.

### Conflicts, unknown writes and runtime bounds

A real divergence retains the old baseline, local edits and latest remote document in `session.conflict`. Normal Save cannot silently put old content on a newer revision. The UI offers use latest, save a copy, and overwrite when permitted. `useRemoteInstance(review, id?)` and `overwriteInstance(review, id?)` require the exact reviewed conflict snapshot. New local edits or a new remote revision invalidate an old confirmation. Overwrite still uses the reviewed remote revision as CAS. Remote metadata and current permissions remain authoritative.

Unknown write outcomes are separate: after a dispatched timeout, network failure or `UNKNOWN_OUTCOME`, preserve the original operation and reconcile using `reloadInstance`. An uncertain create reuses its original `requestId` and submitted body; changing the request ID can create duplicates. Unknown delete recovery retains its original identity and revision. Default-view preferences, delete receipts and cross-tab transactions remain host responsibilities. The provided memory/browser hosts are reference adapters, not a production authorization boundary.

Default `limits` are load 15,000 ms, query/write 30,000 ms, 4 concurrent queries, 5 retained result sets and 262,144 configuration bytes. Result eviction does not evict working drafts or recovery state. Late reads cannot overwrite a newer request or result scope; cancellation is not a user-facing query failure. Optional `onDiagnostic` receives operation identity, kind, phase, elapsed time and optional error code, without query/row payloads; callback failures are isolated. Verify the host/backend contract and browser flows for your deployment; these APIs alone do not establish production readiness.

## Independent runtime positions

`commands.restore()` restores the local baseline without saving the managed instance. Record restore refreshes its own query; analysis restore does not execute a query. Disposal releases per-position query metadata.

After loading the engine, `engine.openPosition(instance, definition)` creates an independent record or analysis position. Its returned `identity.id` differs for every opening, while `identity.instanceId` retains the saved identity. Read `getSnapshot()`, subscribe with `subscribe(listener)`, and use `commands.refresh()` for records or `commands.run()` for initial analysis execution. Analysis `refresh()` keeps its safe automatic-refresh policy. Opening itself does not query.

Dashboard instances are rejected before a position is registered. The optional third argument accepts `queryPolicy: 'reject' | 'queue'` and `source: ViewSource | ((controller: AbortController) => ViewSource | Promise<ViewSource>)`. Source factories resolve on each query, including analysis and record summaries; observe the controller when performing asynchronous resolution. Dashboard positions use the current host source after `updateHost` without resetting pagination or issuing a query automatically.

Positions use their own definitions and keep independent pagination, selection and results, even when referencing the same saved instance. They do not enter managed instance navigation or consume the managed history-result budget. Call `dispose()` when the containing UI closes; old commands then reject. Position sessions expose `positionId`, which is not persisted. Saving a position through `engine.save(identity.id)` is rejected; edit the original managed instance to persist configuration.

## Dashboard composition

Declare `dashboard: true` on a definition to enable saved `DashboardViewInstance` values. A pure dashboard definition needs no `sourceId`; record/analysis capabilities still require one. Its `config` is `{ schemaVersion: 1, panels, filters }`. A data-reference panel is `{ kind: 'view', id, instanceId, layout: { x, y, w, h } }`: stable panel IDs and integer grid coordinates/sizes. The grid has 12 columns; x/y are nonnegative, w is 1–12, x+w ≤ 12, h is 1–100, and y+h ≤ 10000. References must resolve to record or analysis instances; duplicate references get independent runtime positions.

```ts
const definition = {
  id: 'overview',
  title: 'Overview',
  fields: [],
  dashboard: true as const,
};
const engine = new ViewEngine({
  definitionId: definition.id,
  definition,
  host,
});
await engine.load();
const draftId = engine.createDashboard({
  title: 'Sales overview',
  scope: { type: 'personal' },
});
const dashboard = engine.dashboard(draftId);
dashboard.edit(config => ({
  ...config,
  panels: [
    {
      kind: 'view',
      id: 'orders-panel',
      instanceId: 'saved-orders',
      layout: { x: 0, y: 0, w: 12, h: 18 },
    },
  ],
}));
await engine.save(draftId); // First real create; the host supplies saved identity/revision.
```

`permission.getDefinition()` explicitly grants `createPersonal` / `createShared`; missing grants deny creation. A local dashboard session has `persisted: false` and is excluded from authoritative `instanceIds` until saved. Creating a draft does not write. `save`, `saveAs`, revision conflicts and unknown-create reconciliation use the shared instance service; only the dashboard configuration is saved, never referenced child configurations.

`engine.dashboard(id)` returns a `DashboardRuntime` with stable `getSnapshot` / `subscribe`, `edit`, `setFilter`, `setEditorValidity`, `apply`, `refresh(panelId?)`, `reloadReference(panelId)`, `suspend`, `resume` and `dispose`. The engine owns navigation suspension/resumption and disposal. `DashboardView` renders a caller-owned runtime; it does not own that lifecycle. `ViewPage` integrates it with existing instance navigation and save controls. `RecordContent` reuses the record table/card/actions/pagination from a session, definition and bound commands without a navigation dependency.

`isDisposed` reports whether the runtime has been released. After explicit `dispose()`, a later `engine.dashboard(id)` creates a replacement; call `resume()` to activate it when managing the lifecycle yourself. Runtime notifications ignore unrelated position changes, while permission changes still update editability. Read-only filter drafts and their editor validity stay local to the runtime; they never mark the persisted session dirty or block saving its separate configuration after a permission change. Transformer applicability failures hide only the failed registration; editor render failures show a local retry action and block saving until the binding is repaired.

Dashboard cards use a compact title/action header and disable record row selection. The panel menu exposes data details (source, receipt time and executed filter/analysis context) and original-view navigation; metadata inspection does not query. Active filters have a short count shortcut, while loading, errors and retained old-result warnings remain visible. Standalone record and analysis views keep their existing presentation.

A snapshot separates `config` (draft) from `applied`, with `pending`, `session` (including dirty/write state), `editable`, validation and per-panel snapshots. Query applies global drafts; refresh uses the previous applied snapshot; save does not query. Suspension releases positions/results and reauthorizes retained reference versions on resume. Explicit reference reload accepts the latest saved child configuration. Layout edits preserve position identity and do not query.

Each global item stores `{ id, filters: FilterConfiguration, bindings, excludedPanelIds }`. Every `kind: 'view'` panel needs exactly one binding or an explicit exclusion. A fields binding is `{ panelId, kind: 'fields', fields, semanticCompatibility: true }`; full element paths and SEARCH field lists must all map. A transform binding is `{ panelId, kind: 'transform', name, options? }`; provide a synchronous pure implementation in `ViewEngineOptions.dashboardTransforms`. Its readonly input is `{ expression, source, target, instance, options }`. Invalid/missing conversion blocks the whole affected panel scope, never drops an OR branch. The final scope ANDs the original child filter with all participating global conditions.

Optional `host.dashboard.search({ query, cursor? }, signal?)` returns `{ items: [{ id, definitionId, title, kind }], nextCursor }` (at most 100 candidates per response). Candidates are loaded and authorized again before use. Without search, data-reference add/replace is hidden; content cards can still be added. `host.dashboard.openOriginal({ instanceId, definitionId })` enables source navigation. `extensions.dashboard.transforms[name]` supplies `label`, optional `applicable`, `hasOptions`, and a controlled `Editor` with `value`, `onChange`, `onValidityChange`; execution stays in the core registry. `useViewEngine` captures the paired registries for the access lifetime. Unknown extensions remain visible and cannot be silently rewritten.

The layout uses react-grid-layout for two-dimensional movement and width/height resizing. Editing previews commit only when the gesture finishes; Escape cancels a gesture. Layout undo/redo and cancel affect geometry only. Keyboard handles provide non-drag alternatives; numeric position/size controls are not shown. Narrow containers stack cards without writing desktop coordinates. Layout changes preserve query positions and do not fetch data; original child editing/saving remains outside panels.

### Dashboard limits and compatibility

Defaults in `RuntimeLimits`: `maxDashboardPanels=12`, `maxDashboardFilters=32`, `maxDashboardResultRows=12000`, `maxDashboardResultBytes=16777216`, and `maxDashboardMetadataBytes=127926272` (122 MiB per engine). Retained result rows/bytes count all panels of each dashboard before publication. Metadata admission counts retained configuration/reference JSON bytes across the engine; `scripts/verify-dashboard-budget.mjs` measures 1/6/20 dashboards × 12 panels with repeated/distinct references and 262144-byte child configs. The default is twice the worst measured retained payload rounded up to MiB; it is not a transport or heap-size guarantee.

Data reads share the engine's concurrency budget and a 48-entry FIFO waiting queue; standalone record/analysis calls retain immediate BUSY behavior. Reference loading has independent concurrency 4 and queue 24. Every actual instance/definition/source load has its own load deadline. Queued sessions expose `queryStatus: 'waiting'`; diagnostic queued/started/terminal events report waiting/execution durations without values or records. Each global/merged expression is bounded to depth 32 and 512 nodes. Transport response-size limits remain the host's responsibility.

Stateful/Memory/Local and example HTTP hosts accept `supportedFormats: { record: true, analysis: true, dashboard: 1 }`; omission represents a legacy client. The HTTP adapter sends `X-View-Formats`. All instance response surfaces use the same projection: hidden dashboard defaults return null without changing stored preference, deletes remain replayable, and old-client ordering preserves hidden slots. Unsupported single-instance reads/writes reject before mutation. Deploy host format projection before enabling dashboard creation; keep that projection during client rollback.

Local tests, simulated view-service persistence and read-only Wow queries are separate evidence. Real touch devices, screen readers, business-user walkthroughs, and production-host authorization/rollback admission must be verified in the consuming application.

Action renderers receive optional `isCurrent()`. Check it immediately before an asynchronous write: positions, result snapshots, applied scopes and bulk selections can expire. Applying a different scope unmounts stale action extensions and their dialogs; same-scope refresh failures keep recovery controls available.

Local dashboard drafts appear in a separate unsaved group in navigation and the manager. They remain outside authoritative `instanceIds` and cannot participate in saved-view ordering or defaults. `createDashboard()` requires both creation permission and a host `instance.create` service before creating local state.

Content cards share `id` and `layout`: `{ kind: 'markdown', title, content }`, `{ kind: 'link', title, href, description? }`, or `{ kind: 'image', title, src, alt, caption? }`. Markdown uses CommonMark with a 64 KiB UTF-8 content limit and raw HTML disabled. Links accept HTTP(S), mailto, tel and relative addresses; images accept HTTP(S) and relative addresses. `alt` is a string (empty for decorative images). Images use URLs; no upload service is provided. All cards count toward configuration/panel limits.

Content is edited in a local dialog and committed explicitly; cancel preserves the dashboard draft. Content cards do not resolve sources, create query positions or receive filter bindings/exclusions. Editing content does not query other panels. `DashboardSnapshot.panels` contains only data-reference runtime snapshots; content cards render from `config.panels`.
