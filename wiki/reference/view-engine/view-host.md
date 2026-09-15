---
title: ViewHost and service boundaries
description: Definition, instance, preference, permission and query-source responsibilities.
---

# ViewHost and service boundaries

`ViewHost` is an application composition facade. Optional services/methods enable capabilities independently; `resolveSource` is required. It does not prescribe one REST controller or URL layout. Reads take an options object, writes take a context and resolve to a `WriteObservation`; the helper functions and contract types below are exported from the core entry.

| Service      | Method                                                                                 | Result / responsibility                                                                                |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `definition` | `load(definitionId, { readFence?, signal? })`                                          | `Promise<ViewDefinition>`                                                                              |
| `instance`   | `list(definitionId, { query?, cursor?, limit?, readFence?, signal? })`                 | `Promise<Page<ViewInstanceSummary>>`: one catalog page `{ items, nextCursor, total? }` of metadata     |
| `instance`   | `load(instanceId, { readFence?, signal? })`                                            | `Promise<ViewInstance>`; the only read that returns configuration                                      |
| `instance`   | `create(input, { requestId, signal?, definitionRevision? })`                           | `WriteObservation<ViewInstance>`; input omits `id` and `revision`                                      |
| `instance`   | `save(instance, { requestId, signal?, definitionRevision? })`                          | `WriteObservation<ViewInstance>` with the authoritative revision                                       |
| `instance`   | `rename(instanceId, title, expectedRevision, { requestId, signal? })`                  | `WriteObservation<ViewInstance>`                                                                       |
| `instance`   | `delete(instanceId, expectedRevision, { requestId, signal? })`                         | `WriteObservation<ViewDeleteReceipt>`: `{ id, revision }` only                                         |
| `preference` | `load(definitionId, { readFence?, signal? })`                                          | `Promise<PreferenceState>`: `{ revision, order, defaultInstanceId, effectiveDefaultInstanceId }`       |
| `preference` | `saveOrder(definitionId, { scopeInstanceIds, orderedInstanceIds }, precondition, ctx)` | `WriteObservation<PreferenceState>`; refills only the scoped slots of the current user's order         |
| `preference` | `saveDefault(definitionId, instanceId \| null, precondition, ctx)`                     | `WriteObservation<PreferenceState>`; `null` disables automatic selection                               |
| `permission` | `getInstance(summary)`                                                                 | Synchronous `ViewInstancePermissions` for a `ViewInstanceSummary`                                      |
| `permission` | `getDefinition()`                                                                      | Synchronous `{ reorder?, setDefault?, createPersonal?, createShared? }`; a missing grant means unknown |
| `permission` | `subscribe(listener)`                                                                  | Notify grant changes; returns an unsubscribe function                                                  |
| `operation`  | `reconcile({ resource, definitionId, requestId, targetId? }, { readFence?, signal? })` | Read-only `WriteObservation<unknown>` of an earlier write; never replays it                            |
| host         | `resolveSource(sourceId)`                                                              | A `ViewSource` or Promise of one; record paging or analysis aggregate                                  |

## Reads and the catalog

`engine.load()` reads the definition, the first catalog page and the personal preference independently. `state.status` reflects definition readiness only; `state.catalog { status, error, nextCursor, total, summaries }` and `state.preference { status, error, revision }` carry their own states, so a failed catalog or preference read leaves opened sessions intact. `ViewInstanceSummary` (`summaryOf(instance)`) is `{ id, definitionId, kind, title, scope, revision }` without configuration; opening an instance point-loads it through `instance.load`. `engine.loadMoreInstances()` appends the next page and `engine.loadSavedInstance(id)` reads an instance without opening it. A local `ViewEngineOptions.instances` array replaces every host catalog and preference read.

A stale catalog cursor rejects with `CURSOR_EXPIRED`; reload the first page. `readFence` is an opaque token returned by a `committed` write with `visibility: 'pending'`; pass it back unchanged to the same service so the read settles after that write. Read failures reject with a `ViewServiceError` and keep the caller's current state.

## Writes and uncertainty

Services enforce identities, ownership, permissions and revisions. The engine rechecks UI grants but cannot authenticate a backend request. System view rename/delete remain forbidden. `save` and `rename` values must preserve the instance identity and return the server's configuration/revision.

Every write carries `WriteContext { requestId, signal? }`; `create` and `save` accept `ConfigurationWriteContext.definitionRevision`, rejected with `DEFINITION_CHANGED` when the configuration was designed against an older definition. The result is one of four observations: `committed` (`value`, `revision`, `visibility: 'visible'` or `'pending'` with a `readFence`), `committed_pending_receipt` (`targetId`, `revision`, `issue`), `unknown` (`issue`) and `rejected` (`issue { code, message }`). Expected failures are returned as `rejected` observations, not thrown; a rejected promise after dispatch only means the observation did not complete and is treated as unknown. Build observations with `committedWrite`, `rejectedWrite` and `unknownWrite`; validate inbound ones with `readWriteObservation`.

A logical create retains its `requestId` across uncertain retries. The service must deduplicate that ID, replay the stored receipt for the same body and reject reuse with a different body as `CONFLICT`. A UI cancellation or navigation does not establish whether a write committed. `operation.reconcile` reads the stored receipt without replaying; `reloadInstance` replays an unknown create through `instance.create` with the same key and body.

Preference writes use a precondition instead of an instance revision: `{ type: 'absent' }` while `PreferenceState.revision` is null and `{ type: 'matches', revision }` afterwards (`preconditionFor(revision)`). A mismatch rejects with `REVISION_CONFLICT`. `saveOrder` is a slot reorder: `applyOrderChange` refills only the scoped slots, IDs outside the scope keep their positions, every scoped ID must be visible, and no other user's order changes. Instance writes use revision CAS; these are separate concurrency semantics.

A delete receipt is `{ id, revision }` and says nothing about the personal default. The engine then selects the first listed instance locally, clears `state.defaultInstanceId` when it pointed at the deleted instance, and never writes the preference. Deleting an instance that is not visible in the caller's scope rejects with `NOT_FOUND`; replaying the same `requestId` returns the stored receipt.

`ViewServiceError(code, message)` distinguishes INVALID_ARGUMENT, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, REVISION_CONFLICT, DEFINITION_CHANGED, PRECONDITION_REQUIRED, CURSOR_EXPIRED, CORRUPT_STATE, UNAVAILABLE and UNKNOWN_OUTCOME. These are service categories, not a public HTTP status mapping.

After save, rename or delete is dispatched, an `unknown` or `committed_pending_receipt` observation, a rejected promise or a timeout marks `requiresReload` and blocks unrelated writes to that instance while preserving local edits. Save and rename require a successful `reloadInstance()` to obtain the authoritative revision. A `rejected` observation surfaces its message as `writeError`, keeps the draft and leaves `requiresReload` false. An uncertain create can replay its original request ID; an uncertain delete can replay the same ID and revision. `getCapabilitiesSnapshot().instances[id].retryDelete` exposes that exception for subscribed UI controls.

## Permissions

The engine never fetches permissions. The host or application loads, caches and orders them, then exposes synchronous `getInstance(summary)` and `getDefinition()` and notifies through `subscribe`. Loading does not await a policy; an unavailable policy only limits management actions. `canSetDefaultInstance()` and `canReorderInstances()` require the matching preference write port and either no `getDefinition` or an explicit `true` grant. Notify subsequent changes or replace the host with `updateHost`; mutating an invisible closure does not notify React. Changing the user or tenant requires a new `scopeKey`.

## Browser persistence and in-process services

Use `IndexedDBViewHost` from `/react` for browser persistence and `MemoryViewHost` from the core entry for memory examples and Node HTTP fixtures. They share permission, revision, create-receipt, user-isolation, catalog and preference rules; storage uses native IndexedDB transactions or a Map respectively.

Required options: `serviceKey`, `scopeKey`, `definition`, `instances: ViewInstance[]`, `resolveSource`. Optional `defaultInstanceId` (null or a seed instance ID) is the starting view for users without a preference document. Optional policy callbacks: `instancePermissions(summary)`, `canReorder`, `canSetDefault`, `definitionPermissions`; call `host.publishPermissions()` whenever their answers change. The browser host additionally accepts `databaseName` (default `fve-view-state`); the memory host accepts `store?: Map<string, string | null>`. Memory hosts share state only when explicitly given the same Map.

```ts
import { IndexedDBViewHost } from '@ahoo-wang/fetcher-view-engine/react';

const host = new IndexedDBViewHost({
  serviceKey: 'demo-service',
  scopeKey: 'user-a',
  definition,
  instances,
  defaultInstanceId: null,
  resolveSource,
});
```

Browser reads, CAS and writes use one readwrite transaction. Success follows commit; failure and cancellation roll back. `reset()` atomically clears the service/definition's user views, preferences and receipts. Business records remain a separate query source. In-memory transactions complete read, validation and update in one synchronous JS call stack.

`list` supports a title-substring `query`, `limit` 1–200 (default 50) and opaque cursors that expire when the query or the user's preference revision changed. Writes resolve to `rejected` observations for FORBIDDEN, REVISION_CONFLICT, NOT_FOUND, INVALID_ARGUMENT, CONFLICT and DEFINITION_CHANGED; a blank `requestId` rejects the promise with INVALID_ARGUMENT. Storage failures resolve writes to `rejected` UNAVAILABLE and reject reads with UNAVAILABLE; corrupt stored JSON rejects reads with CORRUPT_STATE. Receipts survive host reconstruction over the same store.

`saveDefault` stores a preference scoped to the current user and definition. It accepts any currently visible personal, shared or system instance without requiring edit permission, or `null`; null leaves the next entry without automatic selection. Setting a default does not select it or query records, and later ordering changes do not change it. `preference.load` resolves `effectiveDefaultInstanceId` against the caller's current visibility on every read: a stored default that is no longer visible resolves to null, the host never chooses a replacement, and an explicit null stays null. Before the first preference write `revision` is null and the stored default is the host's `defaultInstanceId`.

After building, run `pnpm verify:view-engine` for packed-package, HTTP, cross-tab CAS, cancellation, reset and real-page checks. Client storage and development services are not production authorization boundaries.

Reload does not automatically overwrite a remote content divergence. Inspect `session.conflict` and explicitly use the remote version or confirm overwrite with the reviewed snapshot. Dispatched write deadlines remain unknown outcomes; read deadlines are independently retryable. See [lifecycle and limits](./engine.md).
