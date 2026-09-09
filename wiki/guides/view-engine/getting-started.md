---
title: Start a record page
description: Run the local example and connect ViewDefinition, ViewInstance, ViewHost and ViewPage.
---

# Start a record page

## Run the current checkout

This branch's view-engine package is not yet available from the public npm registry. Repository examples are the reproducible entry point; use the local archive procedure in the [complete example](../../examples/view-engine.md) for a separate application.

```bash
pnpm install
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm storybook
```

Open **View Engine → 快速开始 → 第一个数据视图 · 查询、排序与分页**. Change Amount to `200`: the rows stay unchanged until you press Enter or Query, then only `ORDER-002` remains. Clear the applied condition value to restore the full result, then try paging and sorting. The entire component is in [the complete example](../../examples/view-engine.md).

## Connect four responsibilities

| Part             | Provide                                             | Owns                                                           |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `ViewDefinition` | `id`, `sourceId`, `rowKey`, fields and capabilities | Shared metadata                                                |
| `ViewInstance`   | Identity, scope and `config`                        | One saved filter/column/sort/page-size configuration           |
| `ViewHost`       | Services plus `resolveSource(sourceId)`             | Metadata, persistence, permissions and the local source bridge |
| `ViewPage`       | `scopeKey`, `definitionId`, host                    | Engine creation, loading, subscriptions and disposal           |

For local metadata, pass `definition` and `instances: { instances, defaultInstanceId }` directly to `ViewPage`. A query-only host is enough to display the page. Saving, creation, deletion and reordering appear according to the supplied methods and permissions.

```tsx
import { ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

// host is your application-provided ViewHost.
<ViewPage
  scopeKey="tenant:user:access"
  definitionId="orders"
  host={host}
  selectable
/>;
```

`scopeKey` is a stable access identity. Change it when user, tenant or authorization scope changes; it is not a server authorization credential. `[scopeKey, definitionId]` owns the engine lifetime. Replacing host callbacks within that scope preserves sessions. Local metadata props initialize that lifetime; change the React key when you intentionally want a fresh initialization.

Use `ViewPageContent` for navigation around a caller-owned engine, or `RecordView` for only the current record view. A caller-owned engine requires `load()` and `dispose()`; do not create it on every render. See [engine ownership](../../reference/view-engine/engine.md).

## Style once

Import the compiled CSS once. Consumers do not need Tailwind or React Compiler build plugins. Wrap the page in `.fve-root` with `data-theme="light"` or `data-theme="dark"` for an explicit theme. Otherwise it follows inherited `color-scheme`. See [components and theme](../../reference/view-engine/components.md).
