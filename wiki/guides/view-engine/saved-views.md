---
title: Save and manage views
description: Separate component configuration, service writes, user preferences and runtime state.
---

# Save and manage views

## Persist instance configuration

A saved record instance contains `config.filters`, `sort`, `pagination` and `presentation`. Filters store component attributes. The current page/cursor, rows, selection, loading state, errors, refresh countdown and expanded state are runtime state.

Editing does not query. Query applies filters; Save independently validates and persists current working configuration. Valid unqueried edits can be saved; invalid raw input must be corrected. Saving leaves the current results unchanged; reopening restores saved configuration and executes it through the source.

## Connect only the services you implement

`ViewHost.definition` loads shared metadata; `instance` lists catalog pages of summaries, point-loads, saves, creates, renames and deletes instances; `preference.load` reads the current user's order and default, `saveOrder` stores their order and optional `saveDefault` stores their default; `permission` supplies synchronous grants and change notifications; optional `operation.reconcile` reads the receipt of an earlier write. `resolveSource` remains the local bridge to business query clients. See [signatures and responses](../../reference/view-engine/view-host.md).

Save/create/rename resolve to a `WriteObservation` whose committed value is the authoritative instance with its new `revision`; expected failures are `rejected` observations with a `ViewServiceError` code. Enforce ownership, grants and revisions on the service side; UI capability checks are not authorization. Every write receives a `requestId`, which creation keeps across uncertain retries for idempotent recovery. Read signals can be cancelled; a cancelled UI lifetime cannot prove that a write was rolled back.

## Scope and permissions

The UI has two groups: personal views and public views. Public system views carry a System label and cannot be renamed or deleted. Public shared views depend on policy. Name editing starts after the edit icon; management also supports deletion, order changes and, when `saveDefault` exists, setting or clearing the default.

```ts
if (engine.canSetDefaultInstance()) {
  await engine.setDefaultInstance('my-view');
  await engine.setDefaultInstance(null);
}
```

`my-view` must be an ID in the current instance list. Any visible personal, shared or system view may be set without edit permission. The preference is scoped by user and definition. Setting or clearing it does not switch the selected view, query records, or save or discard unsaved drafts; null means no automatic selection on the next entry. Reordering is separate and never changes the default. If the default instance is deleted, the stored preference is untouched and `effectiveDefaultInstanceId` becomes null; the service never chooses a replacement, and the engine's post-delete selection is local. Explicit null and another user's still-visible personal instance with the same ID stay unchanged.

Grants are read synchronously through `permission.getInstance(summary)` and `permission.getDefinition()`; the engine never fetches them. Publish policy changes through `permission.subscribe` (`publishPermissions()` on the built-in hosts), or replace the host/update its callbacks within the same scope. Changing the user or tenant requires a new `scopeKey`.

## Choose the storage environment

Use `IndexedDBViewHost` for persisted browser view configuration. Use `MemoryViewHost` for memory examples and Node services, optionally supplying a shared Map; each host otherwise owns independent memory state. Both hosts implement the same paged catalog, per-user preference document with `absent`/`matches` preconditions and explicit-null default rules, while business records come from a separate source. See [ViewHost](../../reference/view-engine/view-host.md) for options and verification.

Deletion resolves to a `{ id, revision }` receipt; the default marker follows the preference document rather than the delete, and existing view drafts are preserved without a full reload.

Conflict recovery requires an explicit reviewed decision: use the latest version, save a copy, or overwrite against the reviewed revision. Unknown create recovery retains its original request ID. See [engine recovery](../../reference/view-engine/engine.md).
