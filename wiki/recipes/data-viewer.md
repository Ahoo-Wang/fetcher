---
title: Build a Data Viewer
description: Compose field definitions, filters, columns, views, data loading, and remote definitions into a Viewer workflow.
---

# Build a Data Viewer

Start with `Viewer` when your application already owns data loading and view persistence. Use `FetcherViewer` only when the backend implements its Viewer-definition and Wow view contracts.

## Install peers

```bash
pnpm add @ahoo-wang/fetcher-viewer @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage antd @ant-design/icons dayjs react react-dom
```

Your package manager reports any additional Fetcher peer packages required by the selected version.

## Define fields and a view

```tsx
import type {
  FieldDefinition,
  ViewColumn,
  ViewDefinition,
  ViewState,
} from '@ahoo-wang/fetcher-viewer';
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import { all, type PagedList } from '@ahoo-wang/fetcher-wow';

interface User {
  id: string;
  name: string;
  status: 'ACTIVE' | 'DISABLED';
}

const fields: FieldDefinition[] = [
  { name: 'id', label: 'ID', type: 'text', primaryKey: true },
  { name: 'name', label: 'Name', type: 'text', primaryKey: false },
  { name: 'status', label: 'Status', type: 'text', primaryKey: false },
];

const columns: ViewColumn[] = fields.map(field => ({
  key: field.name,
  name: field.name,
  fixed: field.primaryKey,
  hidden: false,
}));

const definition: ViewDefinition = {
  id: 'users',
  name: 'Users',
  fields,
  availableFilters: [],
  dataUrl: '/users/paged',
  countUrl: '/users/count',
};

const defaultView: ViewState = {
  id: 'default',
  name: 'All users',
  definitionId: definition.id,
  type: 'PERSONAL',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns,
  tableSize: 'middle',
  pageSize: 20,
  condition: all(),
  sorter: [],
};
```

## Render data

```tsx
const dataSource: PagedList<User> = {
  list: [{ id: '42', name: 'Ada', status: 'ACTIVE' }],
  total: 1,
};

<Viewer<User>
  defaultViews={[defaultView]}
  defaultView={defaultView}
  definition={definition}
  dataSource={dataSource}
  pagination={{ pageSize: 20 }}
  enableRowSelection
  onLoadData={(condition, page, size, sorter) => {
    console.log({ condition, page, size, sorter });
  }}
/>;
```

`Viewer` emits condition, one-based page index, page size, and sort when the user changes the view. It does not fetch data or persist views; implement `onLoadData`, `onCreateView`, `onUpdateView`, and `onDeleteView` at your application boundary.

## Add filters

Populate `availableFilters` with explicit field/component definitions. Built-in components include text, ID, number, select, boolean, and datetime filters. Unknown component names render `FallbackFilter` instead of failing silently.

## Remote Viewer

`FetcherViewer` loads a `ViewDefinition`, saved views, counts, and paged data from its configured clients:

```tsx
<FetcherViewer<User>
  viewerDefinitionId="users"
  tenantId="tenant-demo"
  ownerId="user-42"
  pagination={{ pageSize: 20 }}
  enableRowSelection
/>
```

It exposes ref methods for refresh, clearing selection, current page query, active view, and definition. Configure the default Fetcher and required backend endpoints before rendering it.

## User-visible states

Show loading while definitions/views/data load, an empty state when `list` is empty, and a recoverable error when requests fail. Storybook demonstrates filters, tables, views, pagination, and remote loading with deterministic fixtures: [open interactive examples](https://fetcher.ahoo.me/storybook/).
