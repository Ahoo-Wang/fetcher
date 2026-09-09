---
title: Save and manage views
description: Separate component configuration, service writes, user preferences and runtime state.
---

# Save and manage views

## Persist instance configuration

A saved record instance contains `config.filters`, `sort`, `pagination` and `presentation`. Filters store component attributes. The current page/cursor, rows, selection, loading state, errors, refresh countdown and expanded state are runtime state.

Editing a filter does not query. Query applies it; Save persists the applied configuration. Valid display-only editor properties or an added unset control may be saved without changing the query. Pending query-affecting values require Query or Undo before Save. Reopening should restore component configuration and execute records through the source; it should not deserialize cached records as the current result.

## Connect only the services you implement

`ViewHost.definition` loads shared metadata; `instance` loads/lists/saves/creates/renames/deletes instances; `preference.saveOrder` stores the current user's order; `permission` supplies a policy projection and change notifications. `resolveSource` remains the local bridge to business query clients. See [signatures and responses](../../reference/view-engine/view-host.md).

Return the authoritative saved instance and updated `revision` from save/create/rename. Enforce ownership, grants and revisions on the service side; UI capability checks are not authorization. Creation receives `ViewCreateContext.requestId` for idempotent recovery. Read signals can be cancelled; a cancelled UI lifetime cannot prove that a write was rolled back.

## Scope and permissions

The UI has two groups: personal views and public views. Public system views carry a System label and cannot be renamed or deleted. Public shared views depend on policy. Name editing starts after the edit icon; management also supports deletion and order changes. Reordering is the current user's preference, including their ordering of public views.

Load permissions before exposing synchronous getters. Publish policy changes through `permission.subscribe`, or replace the host/update its callbacks within the same scope. Changing the user or tenant requires a new `scopeKey`.

## Develop against LocalStorageViewHost

`LocalStorageViewHost` is an executable development service fixture. It models shared content, personal ownership, user order, revisions and create receipts. It requires explicit `storage`, a shared exclusive `lock`, trusted `serviceKey` and `scopeKey`, a definition and initial instance list. It stores view configuration; the record source is still separate.

Use **开发验证 → 本地视图恢复** to save, reload and inspect recovery. The public-package five-extension example also supports `persistViews`. Browser storage is editable by its user and is not production authorization. HTTP adapters under `packages/view-engine/dev` are experiments, not public package exports or a fixed REST endpoint specification.

Verify **Record View → 视图管理**, **扩展接入 → 公共包** and the standalone service verification scripts described in [ViewHost](../../reference/view-engine/view-host.md).
