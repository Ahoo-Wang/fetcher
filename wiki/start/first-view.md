---
title: Your first data view
description: Build a local Ant Design Viewer table on the 5.x line; its successor lives in the Wow repository.
---

# Your first data view

::: warning 5.x only (frozen)
This page applies to the 5.x line only (npm 5.1.x, branch [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)). `@ahoo-wang/fetcher-viewer` is frozen there: existing functionality is maintained, with no new features. It is superseded by `@ahoo-wang/wow-view-engine` in the Wow repository ([`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript), [wow.ahoo.me](https://wow.ahoo.me)), which is not published yet. The two use different models and APIs, so migration requires adaptation.
:::

Fetcher main ships no data-view component. Until the Wow view engine publishes, existing consumers build tables with the 5.x Ant Design Viewer below; a new table can also compose [React request state](../guides/react/index.md) with the table component your application already uses.

## Ant Design Viewer path

Start with the [complete local Viewer example](../examples/viewer). It supplies a consumer installation, one complete component, the React entry and a run command. No server, authentication setup or Storybook fixtures are needed.

Follow its five actions: inspect the first page, change pages, sort Name, filter Active, then save and switch views. The row results change because the example application calculates the data and supplies it to Viewer.

| Piece                                  | Owner                           |
| -------------------------------------- | ------------------------------- |
| Fields and available filters           | Application's `ViewDefinition`  |
| Page/condition/sort interaction        | Viewer calls the application    |
| Filtered, sorted, paged rows and total | Application's local calculation |
| Saved settings and success callback    | Application's in-memory state   |
| Permanent storage and access control   | Your application and backend    |

Use the linked example's Storybook entry and browser check on the `5.x` branch to verify the same behavior. It is the single executable source for this page; refreshing loses saved views. The optional server data monitor is outside this local example.

A single table may only need `View`. Use `Viewer` for a collection of views with application-owned loading and saving. Consider `FetcherViewer` only when your service implements its expected protocol; see the [FetcherViewer reference](../reference/viewer/fetcher-viewer.md).
