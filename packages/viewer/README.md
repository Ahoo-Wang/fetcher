# `@ahoo-wang/fetcher-viewer`

React and Ant Design components for filters, tables, saved views, and remote
data workflows. Start with `Viewer` when the application owns loading and
persistence; use `FetcherViewer` only for the matching Viewer backend contract.

## Install

```bash
pnpm add react react-dom antd @ant-design/icons dayjs \
  @ahoo-wang/fetcher-viewer
```

Install the Fetcher peer packages reported by your package manager. Wrap the
application in Ant Design `ConfigProvider` and `App`.

## Example

```tsx
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';
import { all } from '@ahoo-wang/fetcher-wow';

const definition: ViewDefinition = {
  id: 'users',
  name: 'Users',
  dataUrl: '/users/list',
  countUrl: '/users/count',
  fields: [{ name: 'id', label: 'ID', type: 'text', primaryKey: true }],
  availableFilters: [],
};

const view: ViewState = {
  id: 'all',
  name: 'All users',
  definitionId: 'users',
  type: 'PERSONAL',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns: [{ name: 'id', key: 'id', fixed: true, hidden: false }],
  tableSize: 'middle',
  pageSize: 20,
  condition: all(),
  sorter: [],
};

export function Users() {
  return (
    <Viewer
      defaultViews={[view]}
      defaultView={view}
      definition={definition}
      dataSource={{ list: [{ id: 'u-42' }], total: 1 }}
      pagination={{ showSizeChanger: true }}
      onLoadData={(condition, page, size) =>
        console.log({ condition, page, size })
      }
    />
  );
}
```

## Core capabilities

- Typed inputs, filter panels, and application-extensible registries.
- Rich cells, row actions, selection, sorting, and column settings.
- Controlled or uncontrolled filter, column, pagination, and sort state.
- Personal/shared saved-view UI and top-bar actions.
- `Viewer` callbacks for application-owned data and persistence.
- `FetcherViewer` loading, backend persistence, refresh, and ref controls.

## Documentation

- [Build a data viewer](https://fetcher.ahoo.me/recipes/data-viewer)
- [Viewer reference](https://fetcher.ahoo.me/reference/viewer)
- [Interactive Viewer workflows](https://fetcher.ahoo.me/storybook/)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
