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

## Choose the storage environment

Use `IndexedDBViewHost` for persisted browser view configuration. Use `MemoryViewHost` for memory examples and Node services, optionally supplying a shared Map; each host otherwise owns independent memory state. Both hosts manage views, permissions, revisions, create receipts and user ordering, while business records come from a separate source. See [ViewHost](../../reference/view-engine/view-host.md) for options and verification.
