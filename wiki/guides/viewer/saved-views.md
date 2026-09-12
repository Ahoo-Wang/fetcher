---
title: Save and restore view state
description: Implement view mutation callbacks and report success only after the chosen persistence accepts a change.
---

# Save and restore view state

::: warning Maintenance mode (deprecated)
`@ahoo-wang/fetcher-viewer` is deprecated and in maintenance mode: existing functionality is maintained, with no new features. Further data-view development belongs to [`@ahoo-wang/fetcher-view-engine`](../view-engine/index.md); use View Engine for new projects. This page remains a maintenance reference for existing consumers. The packages use different models and APIs, so migration requires adaptation.
:::

## Prerequisites

Start with the [complete local Viewer example](../../examples/viewer.md). It uses React memory as its explicit persistence owner, so you can verify saving without a server. Decide separately whether your application needs reload persistence, user sharing, or server authorization.

## Connect save callbacks

Read `onCreateView`, `onUpdateView`, and `onDeleteView` in `LocalViewer.tsx`. Create assigns an ID with `crypto.randomUUID`, updates the application's `savedViews`, then calls `onSuccess` with the accepted view. Update replaces by ID; delete removes by ID. `Viewer` changes its internal collection through these success callbacks.

The example also exposes `Saved: <name>` so acceptance is observable. Clicking a save button is not itself evidence of durable storage. The application decides when a change has succeeded.

## Verify restoration

1. Apply Active true and Name descending as in [filters](./filters.md).
2. Choose **另存为** (Save as), enter **Active descending**, and confirm. Expect **Saved: Active descending**.
3. Switch to **All users**: Ada, Lin return on page 1.
4. Switch to **Active descending**: Grace, Ada return with the true filter and descending header restored.
5. Reload/remount the local application. The newly saved view disappears because memory is the storage owner.

The saved state includes page size, columns, filters, condition and sorter. Switching starts at page 1 in this example; current page index is not a saved preference.

## Make persistence real when required

Replace a memory callback with your storage/API operation, await acceptance, and only then invoke success with the confirmed view. Preserve the returned server ID when creating. Validate the definition identity and allowed view ownership at your backend. On failure, show an error and do not invoke success; the user must be able to retry or cancel. Do not report a local update as server confirmation.

A localStorage adapter can persist within one browser profile but does not provide server sharing or permissions. `FetcherViewer` provides a separate Wow-backed mutation protocol; adopt it only with [the required remote contracts](./remote-data.md).

## Cleanup and errors

Retire pending application mutations and ignore results belonging to an old identity when the owner changes. Aborting a network request does not undo a server mutation. Component-memory persistence needs no external listener cleanup; storage subscriptions and shared buses do. Keep failure messages visible rather than invoking the success callback just to close a dialog.

See [saved-view reference](../../reference/viewer/saved-views.md), [storage integration](../integrations/storage-and-events.md), and [state ownership](../../architecture/state-and-resources.md).
