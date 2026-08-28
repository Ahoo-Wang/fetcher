---
title: React and integration skills
description: Choose Fetcher skills for React state, data viewers, CoSec authentication, and Wow CQRS.
pageClass: skills-page
---

# React and integration skills

These skills compose Fetcher into application-level behavior. Invoke the most
specific skill first so the agent loads only the contracts the task needs.

## `$fetcher-react-hooks`

**Use for:** promise and request state, query hooks, cancellation, debounce,
storage hooks, event subscriptions, security context, and Wow hooks.

```text
$fetcher-react-hooks build a debounced search hook with explicit loading,
empty, error, success, and reset states. Ignore stale responses.
```

Continue with the [React reference](../reference/react.md).

## `$fetcher-viewer-components`

**Use for:** `Viewer`, `FetcherViewer`, filters, registries, tables, cells,
saved views, remote selection, locale, and end-to-end data exploration flows.

```text
$fetcher-viewer-components build an order viewer with status filters,
server pagination, saved views, and visible loading, empty, and error states.
```

Use Storybook to review interactive states, then use the
[Viewer reference](../reference/viewer.md) for component contracts.

## `$fetcher-cosec-auth`

**Use for:** `CoSecConfigurer`, JWT storage, device and space attribution,
authorization interceptors, refresh, 401/403 behavior, and logout cleanup.

```text
$fetcher-cosec-auth configure a server-side Fetcher with token refresh,
space attribution, and explicit unauthorized and forbidden handling.
Never expose the credential in a browser bundle.
```

Continue with the [CoSec reference](../reference/cosec.md).

## `$fetcher-wow-cqrs`

**Use for:** command delivery, command waiting streams, snapshot and event
queries, the query DSL, aggregation, attribution paths, generated Wow
clients, and matching React hooks.

```text
$fetcher-wow-cqrs add typed cart commands plus paged and aggregate snapshot
queries. Verify paths and field semantics against the current Wow contract.
```

Continue with the [Wow reference](../reference/wow.md) or the
[Wow CQRS recipe](../recipes/wow-cqrs.md).

## Composition order

When one task spans packages, load skills from infrastructure to UI:

```text
Fetcher request → authentication or Wow client → React hook → Viewer
```

Each layer should keep its own error and cleanup boundary. Do not hide a CoSec
refresh failure inside a generic Viewer empty state.
