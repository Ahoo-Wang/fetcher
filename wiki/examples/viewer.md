---
title: Local Viewer example
description: Filter, sort, page and save a local data view with application-owned state.
---

# Local Viewer example

::: warning Maintenance mode (deprecated)
`@ahoo-wang/fetcher-viewer` is deprecated and in maintenance mode: existing functionality is maintained, with no new features. Further data-view development belongs to [`@ahoo-wang/fetcher-view-engine`](../guides/view-engine/index.md); use View Engine for new projects. This page remains a maintenance reference for existing consumers. The packages use different models and APIs, so migration requires adaptation.
:::

This browser example uses four users and no backend. The application filters and sorts the full dataset, then slices the requested page. `Viewer` receives the resulting `{ list, total }`; it does not transform the supplied rows for you.

## Run in your application

Use a current Node release supported by the Vite scaffolder (Node 22.12+ is a suitable baseline). The Fetcher libraries declare Node >=18.20.8; that is not a promise that the current Vite tooling runs on Node 18. This recipe uses React 19 and Ant Design 6.

```bash
pnpm create vite local-viewer --template react-ts
cd local-viewer
pnpm install
pnpm add @ahoo-wang/fetcher@5.0.0 @ahoo-wang/fetcher-viewer@5.0.0 \
  @ahoo-wang/fetcher-react@5.0.0 @ahoo-wang/fetcher-wow@5.0.0 \
  @ahoo-wang/fetcher-decorator@5.0.0 @ahoo-wang/fetcher-eventstream@5.0.0 \
  @ahoo-wang/fetcher-eventbus@5.0.0 @ahoo-wang/fetcher-storage@5.0.0 \
  @ahoo-wang/fetcher-openapi@5.0.0 @ahoo-wang/fetcher-cosec@5.0.0 \
  react@^19.2.8 react-dom@^19.2.8 antd@^6.6.3 \
  @ant-design/icons@^6.3.4 dayjs@^1.11.23
```

This explicitly includes the complete declared Viewer peer graph, including CoSec through `fetcher-react`. Installing those packages does not require a Wow or CoSec server for this local example. Direct dependencies such as `immer`, `dequal` and `reflect-metadata` are installed transitively. Do not copy the repository's `workspace:` or `catalog:` specifiers into a consumer project.

Create `src/LocalViewer.tsx` with the entire file below. It includes the data, definition, saved views and application component; no Storybook fixture is required.

<<< @/../stories/docs/LocalViewer.tsx

Replace `src/main.tsx` with this complete entry. The scaffold's `index.html` already provides `<div id="root"></div>`; the default demo CSS is not imported.

```tsx
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import { LocalViewer } from './LocalViewer';

createRoot(document.getElementById('root')!).render(<LocalViewer />);
```

```bash
pnpm dev
```

Open the local URL printed by Vite. `LocalViewer` supplies Ant Design's `App` and `FullscreenProvider` itself.

## Observe the result

1. The first page contains **Ada, Lin**. Page **2** contains **Grace, Zoe**.
2. Return to page **1**. Click the **Name** header once: **Ada, Grace**. Click it again: **Zoe, Lin** (descending).
3. In **Active**, select **是** (true), then **搜索** (Search). Only **Grace, Ada** remain, in descending order. **否** selects inactive users; **未设置** removes this filter when you search again.
4. Click **另存为** (Save as), name the view **Active descending**, and confirm. The application displays **Saved: Active descending**.
5. Select **All users** in the left panel: **Ada, Lin** return. Select **Active descending**: **Grace, Ada**, the true filter and descending header are restored. View switching returns to page 1; page size is saved, page index is not.

The example implements only the Active boolean filter and Name ascending/descending sorting. Unexpected conditions or sort fields produce a visible error and an empty table. Extend the local calculation only when adding matching UI capabilities; it is not a general Wow query interpreter.

## State and backend boundary

The application owns `savedViews` in React memory and invokes each mutation's success callback after accepting the change. Viewer then updates its internal view collection. Refreshing or unmounting the application loses these saved views. For durable saving, await your storage/API operation before calling success, and display failures without reporting success.

`dataUrl` and `countUrl` are required definition metadata. Normal data loading and the view-count callback here use local functions. The toolbar also exposes server-oriented data monitoring: leave the bell monitor disabled in this example, because its count polling needs a real compatible endpoint. There is no local monitor service or backend in this sample.

For remote rows, replace the application calculation with a request and pass the returned `PagedList` to `dataSource`. Authentication, authorization, error handling and durable storage remain application/server responsibilities. Choose [View, Viewer or FetcherViewer](../architecture/integration-decisions) based on the protocol you actually have.

## Run and verify in this repository

Repository development requires Node >=20.20.2 and pnpm 10.34.5. From the repository root:

```bash
pnpm install
pnpm storybook
```

Open [Docs → Local Viewer → Local Data](http://localhost:6006/?path=/story/docs-local-viewer--local-data) and perform the actions above manually. Reload the story to return to its initial state. Automated interactions run separately in the regression story.

Run the same browser checks headlessly:

```bash
pnpm exec vitest run --project=storybook stories/docs/LocalViewer.test.stories.tsx
```

The checks assert table row collections and order, filtered results, and restored saved settings. Callback text is only an additional save confirmation, not a substitute for verifying the displayed rows.
