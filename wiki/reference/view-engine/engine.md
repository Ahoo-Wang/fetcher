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
  return <ViewPage {...binding} selectable />;
}
```

`useViewEngine(options)` owns creation, loading and disposal, including React StrictMode. Its required `scopeKey` and `definitionId` identify the lifetime; changing either replaces the engine. Optional local `definition`/`instances`, paired compiler/editor registrations in `extensions`, `limits` and `onDiagnostic` initialize that lifetime. Same-scope host updates preserve edits. Change the React key to explicitly reinitialize other inputs. The hook returns `ViewEngineBinding`: `{ engine: ViewEngine | null, extensions?, error? }`.

`ViewPage` is pure UI: pass the binding, or a caller-owned engine. It never loads or disposes that engine. `ViewPageContent` requires a non-null engine. Both compose navigation, shared writes and the selected `RecordView` or `AnalysisView`. `RecordView` and `AnalysisView` render only their own kind. A headless caller creates `new ViewEngine({ definitionId, host, definition?, instances?, filterCompilers?, analysisCompilers?, limits?, onDiagnostic? })`, calls `load()`, then `dispose()` when its scope ends.

### Definitions and saved instances

`ViewDefinition` has `id`, `title`, `sourceId`, shared `fields`, optional `timeZone`, `allowedOperators` and `filterEditors`. Declare at least one capability:

- `record: { rowKey, allowedLayouts, defaultPresentation?, recordActions? }`. `RecordViewDefinition` makes this capability required. Row keys are own-property paths; `allowedLayouts` is a nonempty unique list of `table`/`card`.
- `analysis: AnalysisCapability` authorizes COUNT, scalar ANY, predefined Elements scopes, numeric expressions/functions, field grouping, date units and bounds. An aggregate-only source does not need a record row key or paging functions.

`ViewInstance` is the discriminated union `RecordViewInstance | AnalysisViewInstance`. Both require nonblank `id`, `definitionId`, `title`, `revision` and a `scope`. `kind: 'record'` uses `RecordViewConfig` (`filters`, `sort`, `pagination`, `presentation`); `kind: 'analysis'` uses `AnalysisViewConfig` described below. Scope is personal or public/system/shared; it is not permission. Create input omits only ID and revision; the service returns both.

`ViewInstanceList` contains the visible instances and `defaultInstanceId: string | null`. Default preference and current selection are independent. The list may mix kinds. Structurally valid but currently unexecutable configurations remain editable with `session.validation`; a broken instance does not prevent healthy siblings from being used.

### Working content, applied results and saves

Snapshots are immutable. `ViewEngineState.version` increases on publication and each session has an `editVersion` for working edits. `RecordSession.queryAttempt` captures the in-flight query; `RecordSession.result` binds successful rows to its config/filter/page/cursor and receivedAt. `AnalysisSession.compilation` contains the immutable compilation of the current working configuration (plan or validation errors), shared by the engine and renderers without recompiling during render. `AnalysisSession.pendingQuery` captures the in-flight plan. Render provenance and business actions must use the applicable result/attempt, never infer query scope from working edits. Renderer and action instance metadata, including an unsaved title, remains current while query configuration stays bound to the executed result. `ViewSession` is discriminated by `kind`; narrow it before accessing record-only or analysis-only state. Shared fields include `baseline`, current working `instance`, `dirty`, `validation`, `writeStatus`, `writeError`, `requiresReload` and optional `conflict`.

Record sessions retain `filterDraft`, `filterBaseline`, `appliedFilter`, `filterPending`, page/cursor, rows, summaries and selection. Editing working filters does not change the applied query or records. `filterPending` means the working filter differs from the applied scope; it does not by itself disable Save. Analysis sessions keep an independent successful `result` with query/schema provenance; later edits or failed runs do not relabel those rows as a new result.

`save(id?)` validates and persists current working content without running a query. Invalid raw input blocks saving, but valid unqueried edits can be saved. A receipt advances the baseline while preserving edits made after submission. `saveAs({ title, scope }, id?)` returns `Promise<string | undefined>`: a created ID when known; creation recovery can outlive the originating selection. Runtime rows, selection, errors and countdowns are never persisted as configuration.

### Commands and result ownership

`engine.analysis(id)` binds `edit(updater)`, `run()`, `refresh()`, `clearSort()`, `setFilterValidity(valid)` and `restore()` to one analysis instance. `edit`/`clearSort`/`restore` do not query; `run` compiles and validates the complete result before publishing. `engine.record(id)` binds `edit(updater)`, `refresh()`, `setPage(page)`, `setPageSize(size)`, `applyFilter()` and `restore()`. Bound commands become invalid after the instance lifetime is replaced. Editing callbacks must be pure and may not reenter engine commands.

`engine.analysis(id).refresh()` requests a safe automatic refresh: it runs only when the current query still matches the successful result, editor input is valid, writes are idle, and no conflict or reload requirement exists. It skips ineligible states without submitting drafts; `run()` remains the explicit execution/retry operation. `AnalysisSession.queryValid` is derived from query compilation, editor validity and resource limits; presentation-only errors do not make the query invalid, though they still block saving.

Both session kinds expose `editorEpoch`. Accepting a reviewed remote version advances it and discards local editor buffers; ordinary reload/restore retain their documented non-destructive input behavior. Custom mounted editors should bind commands and reset their local buffers when `(instance.id, editorEpoch)` changes, as the built-in views do. Old validity callbacks are ignored after this reset; old analysis edits and record draft edits are rejected rather than overwriting the accepted remote configuration. Published active and pending-create sessions use the same final validation path. Record admission always checks pagination/layout discriminants and nested presentation structure; missing field or capability references remain recoverable semantic errors. Cancelling an analysis refresh retains the successful result status, allowing subsequent automatic refresh.

All record operations are on `engine.record(id)`: `setFilterDraft(configuration, valid?)`, `setFilterValidity(valid)`, `setFilterMode(mode)`, `applyFilter()`, `setSort(sort)`, `setColumns(columns)`, `setLayout(layout)`, `setCardConfig(card)`, `setPage(index)`, `setPageSize(size)`, `nextPage()`, `setSelection(keys)`, `refresh({ background? }?)`, `retryQuery()` and `refreshSummary()`. The facade no longer exposes direct record commands. Shared operations are `setTitle`, `save`, `saveAs`, `restore`, `reloadInstance`, `renameInstance`, `deleteInstance`, `setDefaultInstance` and `reorderInstances`. Record restore restores the baseline and queries; analysis restore restores its working configuration without running.

### Conflicts, unknown writes and runtime bounds

A real divergence retains the old baseline, local edits and latest remote document in `session.conflict`. Normal Save cannot silently put old content on a newer revision. The UI offers use latest, save a copy, and overwrite when permitted. `useRemoteInstance(review, id?)` and `overwriteInstance(review, id?)` require the exact reviewed conflict snapshot. New local edits or a new remote revision invalidate an old confirmation. Overwrite still uses the reviewed remote revision as CAS. Remote metadata and current permissions remain authoritative.

Unknown write outcomes are separate: after a dispatched timeout, network failure or `UNKNOWN_OUTCOME`, preserve the original operation and reconcile using `reloadInstance`. An uncertain create reuses its original `requestId` and submitted body; changing the request ID can create duplicates. Unknown delete recovery retains its original identity and revision. Default-view preferences, delete receipts and cross-tab transactions remain host responsibilities. The provided memory/browser hosts are reference adapters, not a production authorization boundary.

Default `limits` are load 15,000 ms, query/write 30,000 ms, 4 concurrent queries, 5 retained result sets and 262,144 configuration bytes. Result eviction does not evict working drafts or recovery state. Late reads cannot overwrite a newer request or result scope; cancellation is not a user-facing query failure. Optional `onDiagnostic` receives operation identity, kind, phase, elapsed time and optional error code, without query/row payloads; callback failures are isolated. Verify the host/backend contract and browser flows for your deployment; these APIs alone do not establish production readiness.
