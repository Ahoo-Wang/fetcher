---
title: Your first data view
description: Run a local Viewer and understand where data and saved state belong.
---

# Your first data view

Start with the [complete local Viewer example](../examples/viewer). It supplies a consumer installation, one complete component, the React entry and a run command. No server, authentication setup or Storybook fixtures are needed.

Follow its five actions: inspect the first page, change pages, sort Name, filter Active, then save and switch views. The row results change because the example application calculates the data and supplies it to Viewer.

| Piece                                  | Owner                           |
| -------------------------------------- | ------------------------------- |
| Fields and available filters           | Application's `ViewDefinition`  |
| Page/condition/sort interaction        | Viewer calls the application    |
| Filtered, sorted, paged rows and total | Application's local calculation |
| Saved settings and success callback    | Application's in-memory state   |
| Permanent storage and access control   | Your application and backend    |

Use the linked example's Storybook entry and browser check to verify the same behavior in this repository. It is the single executable source for this page; refreshing loses saved views. The optional server data monitor is outside this local example.

A single table may only need `View`. Use `Viewer` for a collection of views with application-owned loading and saving. Consider `FetcherViewer` only when your service implements its expected protocol; see [integration decisions](../architecture/integration-decisions).
