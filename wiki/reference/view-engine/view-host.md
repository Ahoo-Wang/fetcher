---
title: ViewHost and service boundaries
description: Definition, instance, preference, permission and query-source responsibilities.
---

# ViewHost and service boundaries

`ViewHost` is an application composition facade. Optional services/methods enable capabilities independently; `resolveSource` is required. It does not prescribe one REST controller or URL layout.

| Service      | Method                                         | Result / responsibility                                                       |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `definition` | `load(definitionId, signal?)`                  | `Promise<ViewDefinition>`                                                     |
| `instance`   | `list(definitionId, signal?)`                  | `Promise<ViewInstanceList>`                                                   |
| `instance`   | `load(instanceId, signal?)`                    | `Promise<ViewInstance>`                                                       |
| `instance`   | `create(instanceWithoutIdOrRevision, context)` | Authoritative created instance; context carries requestId and optional signal |
| `instance`   | `save(instance)`                               | Saved instance with authoritative revision                                    |
| `instance`   | `rename(instanceId, title, revision?)`         | Renamed instance                                                              |
| `instance`   | `delete(instanceId, revision?)`                | `Promise<void>`                                                               |
| `preference` | `saveOrder(definitionId, instanceIds)`         | Persist the current user's ordering                                           |
| `preference` | `saveDefault(definitionId, instanceId)`        | Persist the current user's default; `instanceId` is `string \| null`          |
| `permission` | `getInstance(instance)`                        | Synchronous `ViewInstancePermissions`                                         |
| `permission` | `getDefinition()`                              | Synchronous `{ reorder }` projection                                          |
| `permission` | `load(definitionId, signal?)`                  | Initialize getters; resolve a `ViewPermissionSnapshot`                        |
| `permission` | `refresh(signal?)`, `subscribe(listener)`      | Refresh grants; return an unsubscribe function from subscribe                 |
| host         | `resolveSource(sourceId)`                      | A `RecordQuerySource` or Promise of one                                       |

Engine loading awaits `permission.load`, falling back to `permission.refresh` when load is absent. Permission initialization failure prevents ready state. A getter must be pure and expose the initialized policy. Notify subsequent changes or replace the host; mutating an invisible closure does not notify React.

## Writes and uncertainty

Services enforce identities, ownership, permissions and revisions. The engine rechecks UI grants but cannot authenticate a backend request. System view rename/delete remain forbidden. `save` and `rename` responses must preserve the instance identity and return the server's configuration/revision.

A logical create retains `ViewCreateContext.requestId` across uncertain retries. The service must deduplicate that ID and reject reuse with a different body. A UI cancellation or navigation does not establish whether a write committed. Use the authoritative receipt/reload behavior rather than repeating a new create blindly.

`ViewServiceError(code, message)` distinguishes INVALID_ARGUMENT, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, REVISION_CONFLICT, PRECONDITION_REQUIRED, CORRUPT_STATE, UNAVAILABLE and UNKNOWN_OUTCOME. These are service categories, not a public HTTP status mapping.

After save, rename or delete is dispatched, UNKNOWN_OUTCOME, UNAVAILABLE and unclassified exceptions mark `requiresReload` and block unrelated writes to that instance while preserving local edits. Save and rename require a successful `reloadInstance()` to obtain the authoritative revision. A missing or inaccessible instance keeps the recovery error and edits. Hosts must report definitive rejections with the corresponding `ViewServiceError` code. An uncertain create can replay its original request ID; an uncertain delete can replay the same ID and revision. `getCapabilitiesSnapshot().instances[id].retryDelete` exposes that exception for subscribed UI controls.

## Browser persistence and in-process services

Use `IndexedDBViewHost` from `/react` for browser persistence and `MemoryViewHost` from the core entry for memory examples and Node HTTP fixtures. They share permission, revision, create-receipt, user-isolation, ordering and default-view rules; storage uses native IndexedDB transactions or a Map respectively.

Required options: `serviceKey`, `scopeKey`, `definition`, `instances`, `resolveSource`. Optional policy callbacks: `instancePermissions`, `canReorder`, `permissionsRevision`. The browser host additionally accepts `databaseName` (default `fve-view-state`); the memory host accepts `store?: Map<string, string | null>`. Memory hosts share state only when explicitly given the same Map.

```ts
import { IndexedDBViewHost } from '@ahoo-wang/fetcher-view-engine/react';

const host = new IndexedDBViewHost({
  serviceKey: 'demo-service',
  scopeKey: 'user-a',
  definition,
  instances,
  resolveSource,
});
```

Browser reads, CAS and writes use one readwrite transaction. Success follows commit; failure and cancellation roll back. `reset()` atomically clears the service/definition's user views, ordering and receipts. Business records remain a separate query source. In-memory transactions complete read, validation and update in one synchronous JS call stack.

`saveDefault` stores a preference scoped to the current user and definition. It accepts any currently visible personal, shared or system instance without requiring edit permission, or `null`; null leaves the next entry without automatic selection. Setting a default does not select it or query records, and later ordering changes do not change it. When a default instance is deleted, the host transaction updates every affected user's default to the first remaining instance in that user's visible order, or null. Explicit null and another user's still-visible personal instance with the same ID remain unchanged. A user first seen after that deletion seeds a default resolved against their actual visibility. Deleting an inaccessible personal instance is still a scoped no-op.

After building, run `pnpm verify:view-engine` for packed-package, HTTP, cross-tab CAS, cancellation, reset and real-page checks. Client storage and development services are not production authorization boundaries.
