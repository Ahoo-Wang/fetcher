---
title: Make pagination and sorting change rows
description: Apply the requested condition and sort before slicing a one-based page.
---

# Make pagination and sorting change rows

::: warning Maintenance mode (deprecated)
`@ahoo-wang/fetcher-viewer` is deprecated and in maintenance mode: existing functionality is maintained, with no new features. Further data-view development belongs to [`@ahoo-wang/fetcher-view-engine`](../view-engine/index.md); use View Engine for new projects. This page remains a maintenance reference for existing consumers. The packages use different models and APIs, so migration requires adaptation.
:::

## Prerequisites

Start with [local rows](./local-data.md) and the complete [LocalViewer implementation](../../examples/viewer.md). Its four users and page size of two make page changes visible. Use this working adapter before replacing its calculation with a server request.

## Follow the callback to the data source

In `LocalViewer.tsx`, `onLoadData={load}` receives the condition, one-based page index, page size, and optional sorter. `load` passes those values to `queryUsers` and updates React's `data` state. `Viewer` then receives that state as `dataSource`.

Read the `queryUsers` function in the maintained example: it starts with all matching users, checks that sort fields are supported, sorts a fresh array by Name, and returns `list: rows.slice((page - 1) * size, page * size)` with `total: rows.length`. Total is the count after filtering, before slicing. Sorting only the current page would produce incorrect ordering across pages.

## Verify the result

1. At the untouched initial state, page 1 shows Ada, Lin. Select page 2: Grace, Zoe appear.
2. Return to page 1 and click Name once. Ascending order shows Ada, Grace on page 1.
3. Click Name again. Descending order shows Zoe, Lin on page 1.
4. Change pages again and confirm the remaining sorted users, not the original unsorted slice, are displayed.

The example's page-size selector is intentionally disabled so these checks remain deterministic. To enable page-size changes, remove that UI restriction and continue honoring the callback's size in the same adapter; do not hard-code two in later requests.

## Failures and cleanup

Unsupported sort fields or multiple sort fields produce a visible error and empty table in this sample. Only enable controls your adapter understands. For remote data, send the same condition/page/sort together and replace rows only from the current request; abort or ignore stale responses after rapid page changes. An HTTP failure should render an error rather than silently claiming an empty successful result.

View switching resets to page 1 in this example; the saved view stores page size, not current page index. Local calculation owns no pending network resource. Refer to [remote data](./remote-data.md) when a request is introduced.

See [table contracts](../../reference/viewer/tables-and-cells.md), [query sorting and pagination](../../reference/wow/query-options.md), and [resource ownership](../../architecture/state-and-resources.md).
