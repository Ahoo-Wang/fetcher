---
title: 构建数据 Viewer
description: 将字段定义、筛选、列、视图、数据加载和远程定义组合为 Viewer 工作流。
---

# 构建数据 Viewer

应用已经拥有数据加载和视图持久化时，从 `Viewer` 开始。只有后端实现 Viewer Definition 与 Wow View 契约时，才使用 `FetcherViewer`。

## 安装 Peer

```bash
pnpm add @ahoo-wang/fetcher-viewer @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage antd @ant-design/icons dayjs react react-dom
```

包管理器会报告当前版本仍缺少的 Fetcher Peer Package。

## 定义字段与视图

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

## 渲染数据

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

用户修改视图后，`Viewer` 会发出 Condition、从 1 开始的 Page Index、Page Size 和 Sort。它不加载数据，也不持久化视图；在应用边界实现 `onLoadData`、`onCreateView`、`onUpdateView` 和 `onDeleteView`。

## 增加筛选

通过明确的 Field/Component 定义填充 `availableFilters`。内置 Component 包含 Text、ID、Number、Select、Boolean 和 DateTime。未知 Component 名称会渲染 `FallbackFilter`，不会静默失败。

## 远程 Viewer

`FetcherViewer` 通过配置的客户端加载 `ViewDefinition`、保存的视图、数量和分页数据：

```tsx
<FetcherViewer<User>
  viewerDefinitionId="users"
  tenantId="tenant-demo"
  ownerId="user-42"
  pagination={{ pageSize: 20 }}
  enableRowSelection
/>
```

它公开刷新、清空选择、读取当前 Page Query、活动视图和 Definition 的 Ref 方法。渲染前配置默认 Fetcher 和后端所需端点。

## 用户可见状态

加载 Definition/View/Data 时展示 Loading；`list` 为空时展示 Empty；请求失败时展示可恢复 Error。Storybook 使用确定性 Fixture 演示筛选、表格、视图、分页与远程加载：[打开交互示例](https://fetcher.ahoo.me/storybook/)。
