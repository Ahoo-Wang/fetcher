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

## IndexedDBViewHost

Use IndexedDBViewHost for browser persistence. Required: serviceKey, scopeKey, definition, instances, resolveSource. Optional: databaseName (default fve-view-state), legacyStorage (one-time import only when the database has no record). Reset stores a null tombstone to prevent legacy resurrection. Success is returned only after commit; cancellation and failure roll back. Policy options match LocalStorageViewHost.

LocalStorageViewHost still accepts synchronous storage and lock ports; the storage must be coherent under that lock. Native localStorage plus Web Locks is not a cross-tab transaction. Reload all old tabs when switching persistence implementations to avoid mixing stores.

```ts
import { IndexedDBViewHost } from '@ahoo-wang/fetcher-view-engine/react';

const host = new IndexedDBViewHost({
  serviceKey: 'demo-service:tenant-a',
  scopeKey: 'user-a',
  definition,
  instances,
  resolveSource,
  legacyStorage: localStorage, // Optional one-time import of existing view state
});
```

This is a browser development fixture for restoration, isolation, revisions and atomic writes. `reset()` resets its test service state. It does not persist business records or provide trusted production authorization.

With the workspace built and Storybook running on port 6006, run `node packages/view-engine/scripts/verify-view-host.mjs` for the local service/browser recovery checks; use `pnpm verify:view-engine` for the combined package, service and browser acceptance entry point. HTTP fixture files under `dev` remain outside the published package.
