---
title: Render local rows in a Viewer
description: Build a backend-free table with a complete definition, initial view, and application-owned data.
---

# Render local rows in a Viewer

## Prerequisites

Use [the complete local Viewer example](../../examples/viewer.md), which includes the consumer installation, entry file, and maintained `LocalViewer.tsx`. It runs in React with Viewer peers and does not need a Wow server. Leave the bell-shaped data monitor disabled: that separate feature needs a real count endpoint.

## Mount the maintained implementation

Follow the example's **Run in your application** steps and mount `<LocalViewer />`. For repository verification, select **Docs → Local Viewer → Local Data** in Storybook. The play function performs interactions automatically; reload the story or use the consumer app to inspect an untouched initial state.

The source has three inputs with different responsibilities:

| Input             | Role in the example                                                              |
| ----------------- | -------------------------------------------------------------------------------- |
| `ViewDefinition`  | Names ID, Name and Active fields and the available Active filter                 |
| `ViewState`       | Chooses visible columns, initial condition, sorting, page size and view identity |
| `PagedList<User>` | Supplies the currently calculated rows and total to `dataSource`                 |

The field marked `primaryKey` supplies stable row identity. Keep `definitionId` aligned between the initial view and definition. `dataUrl` and `countUrl` are required metadata; local data loading and count callbacks calculate in memory and do not fetch them.

## Verify displayed rows

At the initial state, page 1 contains Ada and Lin, while total is four and page size is two. Page 2 contains Grace and Zoe. The source's `queryUsers` filters the full dataset, sorts it, then slices it; `Viewer` does not automatically transform rows passed to `dataSource`.

For a single view without a saved-view collection, choose `View`. Choose `Viewer` here because subsequent tasks include switching and saving views. Neither component creates a remote data source merely because the definition has URLs.

## Failures and cleanup

The example catches unsupported local filter/sort inputs, displays an alert, and clears rows. It intentionally implements only the displayed controls; do not treat it as a general Wow query evaluator. The local rows and saved views live in component memory and disappear on unmount. No data-request controller is needed for synchronous local calculations; remote adapters need their own cancellation.

Continue with [pagination and sorting](./pagination-and-sorting.md), [models and state](../../reference/viewer/models-and-state.md), and [View/Viewer ownership](../../architecture/state-and-resources.md).
