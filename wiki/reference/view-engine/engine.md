---
title: ViewEngine lifecycle and commands
description: Own engine lifetimes, read immutable snapshots and issue scoped commands.
---

# ViewEngine lifecycle and commands

## Ownership

`new ViewEngine({ definitionId, host, definition?, instances?, filterCompilers? })` creates a headless runtime. Call `await engine.load()` and eventually `engine.dispose()`. React applications usually let `ViewPage` own this lifecycle. Reusing a disposed engine is invalid.

`getSnapshot()` returns a cached immutable `ViewEngineState`; `subscribe(listener)` returns an unsubscribe function. State has status/error/definition, instance IDs, selected ID and per-instance sessions. `getCapabilitiesSnapshot()` exposes immutable permission/capability projections through the same subscription. Do not mutate snapshots.

## Session state

| Field                                                           | Meaning                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `baseline`, `instance`, `dirty`                                 | Saved baseline, current instance and save difference                      |
| `filterDraft`, `filterBaseline`, `filterPending`, `filterValid` | Editing tree, applied tree, query-affecting difference and local validity |
| `appliedFilter`                                                 | Compiled expression, or null when query scope is invalid                  |
| `rows`, `total`, `page`, `cursor`, `nextCursor`                 | Current record result and navigation                                      |
| `queryStatus`, `refreshing`, `queryError`                       | Read state; background refresh can retain rows                            |
| `pageSummary`, `allSummary`                                     | Independently tracked summary scopes                                      |
| `writeStatus`, `writeError`, `requiresReload`                   | Write progress, failure and reconciliation requirement                    |
| `selectedRowKeys`                                               | Selection within loaded records                                           |

## Commands

Unless specified otherwise, optional `id` selects an instance; omission uses the current selection. Async actions return `Promise<void>` and failures must be handled by the caller.

| Command                                                                                           | Effect                                                                            |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `selectInstance(id)`                                                                              | Navigate and load its records                                                     |
| `setFilterDraft(draft, id?, valid?)`, `setFilterValidity(valid, id?)`, `setFilterMode(mode, id?)` | Edit without querying                                                             |
| `applyFilter(expression?, id?)`                                                                   | Compile/apply and query; supplied expressions are checked against component state |
| `setSort(sort, id?)`, `setPage(index, id?)`, `setPageSize(size, id?)`, `nextPage(id?)`            | Apply record navigation/query changes                                             |
| `setColumns(columns, id?)`                                                                        | Change presentation; changed summary metrics may request aggregates               |
| `setSelection(keys, id?)`, `setTitle(title, id?)`                                                 | Change local selection or title state                                             |
| `refresh(id?, { background? })`                                                                   | Query current applied scope                                                       |
| `refreshSummary(id?)`                                                                             | Retry aggregate scope separately                                                  |
| `save(id?)`, `saveAs({ title, scope }, id?)`                                                      | Persist through host services                                                     |
| `renameInstance(title, id?)`, `deleteInstance(id?)`, `reorderInstances(ids)`                      | Manage service-owned views/preferences                                            |
| `restore(id?)`                                                                                    | Restore the saved local baseline and query                                        |
| `reloadInstance(id?)`, `canReloadInstance(id?)`                                                   | Reload/reconcile an instance from the host                                        |
| `getPermissions(id?)`, `canReorderInstances()`                                                    | Check current action policy                                                       |
| `updateHost(host)`                                                                                | Replace same-scope callbacks/policy while retaining sessions                      |
| `dispose()`                                                                                       | End subscriptions and cancel owned reads                                          |

Do not create an extra engine-level transport protocol. Use the provided source's QueryApi methods, forward AbortController, and keep write authorization and persistence in ViewHost services. Query cancellation and stale-response rejection preserve ownership; they cannot undo completed business writes.
