---
title: Filter the displayed data
description: Connect an available filter, saved filter configuration, and an application query evaluator.
---

# Filter the displayed data

::: warning 5.x only (frozen)
This page applies to the 5.x line only (npm 5.1.x, branch [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)). `@ahoo-wang/fetcher-viewer` is frozen there: existing functionality is maintained, with no new features. It is superseded by `@ahoo-wang/wow-view-engine` in the Wow repository ([`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript), [wow.ahoo.me](https://wow.ahoo.me)), which is not published yet. The two use different models and APIs, so migration requires adaptation.
:::

## Prerequisites

Run the [local Viewer example](../../examples/viewer.md). It provides an Active boolean filter and a deliberately limited local evaluator. Do not add unsupported operators to the UI without extending the evaluator or moving evaluation to a compatible server.

## Connect the three filter inputs

Read `definition.availableFilters`, `initialView.filters`, and `filterUsers` in `LocalViewer.tsx`. The definition makes a filter available under the User group with component `bool`. The view includes the Active filter with type `bool` and field `active`. The evaluator accepts ALL, TRUE, or FALSE for that field and rejects other conditions.

A registered control builds a condition; it does not search the supplied rows itself. `onLoadData` receives the resulting condition and the application applies it. The example's count callback also calls `filterUsers`, so displayed counts and rows use the same supported semantics.

## Apply and verify the condition

1. Begin with all four users and no sorting, then choose **是** (true) in **Active** and press **搜索** (Search).
2. The matching rows are Ada and Grace; total is two. If descending Name sorting is already active, their order is Grace, Ada.
3. Choose **否** (false), then Search: Lin and Zoe match, with order determined by the current sorter.
4. Choose **未设置** (unset), then Search: all users return. Unset means the filter is removed, not `active === false`.

For a new field, define its field metadata and supported filter entry, add the desired control to the view, and implement exactly the condition operators that control emits. Check actual condition values through the callback while developing. Built-in datetime selection is registry-based under `datetime`; `DateTimeFilter` is not a root named export.

## Failures and cleanup

Unsupported conditions intentionally produce an alert and empty rows instead of silently evaluating as match-all. Do not use the local evaluator as a generic Wow DSL engine. On a remote server, validate allowed fields and operators and enforce authorization there; a client condition is not access control. Keep the bell monitor disabled without a backend count endpoint. Local filters need no manual subscription cleanup; external data requests and listeners belong to the application.

Continue with [saving filters in a view](./saved-views.md), [filter reference](../../reference/viewer/filters.md), and [integration boundaries](../../architecture/integration-decisions.md).
