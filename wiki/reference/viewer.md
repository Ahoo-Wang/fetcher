---
title: Viewer reference
description: Compose filters, tables, saved views, and remote Viewer workflows with React and Ant Design.
---

# `@ahoo-wang/fetcher-viewer`

Viewer is a React and Ant Design component system for queryable data sets. Pick
the highest-level component whose ownership matches your application:

| Component       | Owns                                                           | Your application owns                |
| --------------- | -------------------------------------------------------------- | ------------------------------------ |
| `ViewTable`     | Columns, cell rendering, selection UI                          | Data, sort callbacks, column state   |
| `View`          | Filters, table, pagination, controlled/uncontrolled view state | Data loading                         |
| `Viewer`        | Saved-view switching, top bar, filters, table                  | Data and view persistence callbacks  |
| `FetcherViewer` | Definition, views, data loading, persistence clients           | Default Fetcher and backend contract |

## Install

```bash
pnpm add react react-dom antd @ant-design/icons dayjs \
  @ahoo-wang/fetcher-viewer
```

Install the Fetcher peer packages listed by your package manager. At the
application root, provide the Ant Design contexts used by feedback and overlays:

```tsx
import { App, ConfigProvider } from 'antd';

root.render(
  <ConfigProvider>
    <App>
      <ProductViewer />
    </App>
  </ConfigProvider>,
);
```

## Core model

`ViewDefinition` describes fields, available filters, and data/count URLs.
`ViewState` stores filters, columns, table size, page size, condition, and sort
order for one personal or shared view.

```ts
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';
import { all } from '@ahoo-wang/fetcher-wow';

const definition: ViewDefinition = {
  id: 'users',
  name: 'Users',
  dataUrl: '/users/list',
  countUrl: '/users/count',
  fields: [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    { name: 'name', label: 'Name', type: 'text', primaryKey: false },
  ],
  availableFilters: [],
};

const defaultView: ViewState = {
  id: 'all-users',
  name: 'All users',
  definitionId: definition.id,
  type: 'PERSONAL',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns: [
    { name: 'id', key: 'id', fixed: true, hidden: false },
    { name: 'name', key: 'name', fixed: false, hidden: false },
  ],
  tableSize: 'middle',
  pageSize: 20,
  condition: all(),
  sorter: [],
};
```

## `Viewer<RecordType>`

Required props are `defaultViews`, `defaultView`, `definition`, `dataSource`,
and `pagination`. `dataSource` is a `PagedList<RecordType>`. Pass
`pagination={false}` to disable pagination.

| Prop group  | Important props                                                        |
| ----------- | ---------------------------------------------------------------------- |
| Data        | `dataSource`, `loading`, `onLoadData`                                  |
| Views       | `defaultViews`, `defaultView`, `onSwitchView`                          |
| Persistence | `onCreateView`, `onUpdateView`, `onDeleteView`, `onGetRecordCount`     |
| Table       | `pagination`, `actionColumn`, `enableRowSelection`, `viewTableSetting` |
| Actions     | `primaryAction`, `secondaryActions`, `batchActions`                    |

`Viewer` does not fetch data or persist views. Its callbacks receive the next
condition, one-based page, page size, sorter, or view mutation. Only update the
UI after a persistence callback invokes its `onSuccess` continuation.

`ViewerRef` exposes `getCondition()`, `getActiveView()`, and
`clearSelectedRowKeys()`.

## `View<RecordType>` state

Use `default*` props for uncontrolled state. For each controlled dimension,
pass the matching `external*` value and `externalUpdate*` callback together.
Controlled dimensions include filters, columns, page, page size, table size,
condition, and sorter.

`filterMode` is `none`, `normal`, or `editable`. `onChange` receives the
composed `Condition`, page, page size, and sorters. `ViewRef` also exposes
`reset()` and `updateTableSize()`.

## Inputs, filters, cells, and registries

- Inputs: `TagInput`, `NumberRange`, `RemoteSelect`, and `Fullscreen`.
- Filters: ID, text, number, select, boolean, date/time, typed, assembly, and
  editable panels.
- Cells: text, primary key, link, avatar, image, image group, tag(s), currency,
  date/time, calendar time, and action(s).
- `filterRegistry` and `cellRegistry` resolve built-ins by type;
  `TypedComponentRegistry` supports application-defined types.
- `ViewTable`, `TableSettingPanel`, and top-bar items are public for custom
  composition below `Viewer`.

Unknown filter types render `FallbackFilter`; unknown cell types fall back to
text. Keep custom type names unique and register them before the first render.

## `FetcherViewer<RecordType>`

`FetcherViewer` loads a `viewerDefinitionId`, its saved views, counts, and paged
data through the default registered Fetcher and built-in Wow clients. Configure
`fetcherRegistrar.default` before mounting it.

It renders explicit loading, definition error, missing definition, and missing
views states. `FetcherViewerRef` exposes `refreshData()`,
`clearSelectedRowKeys()`, `getPageQuery()`, `getActiveView()`, and
`getViewerDefinition()`.

The built-in fallback locale is Chinese. `useLocale()` exposes a locally owned
locale state and merges custom values over that fallback.

Try the complete workflows in [Storybook](https://fetcher.ahoo.me/storybook/)
and follow [Build a data viewer](../recipes/data-viewer.md).
