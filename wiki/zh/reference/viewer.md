---
title: Viewer 参考
description: 使用 React 和 Ant Design 组合过滤器、表格、保存视图与远程 Viewer 工作流。
---

# `@ahoo-wang/fetcher-viewer`

Viewer 是面向可查询数据集的 React + Ant Design 组件系统。请选择所有权与应用匹配的
最高层组件：

| 组件            | 组件负责                              | 应用负责                |
| --------------- | ------------------------------------- | ----------------------- |
| `ViewTable`     | 列、单元格渲染、选择 UI               | 数据、排序回调、列状态  |
| `View`          | 过滤、表格、分页、受控/非受控视图状态 | 数据加载                |
| `Viewer`        | 保存视图切换、顶栏、过滤、表格        | 数据和视图持久化回调    |
| `FetcherViewer` | 定义、视图、数据加载、持久化客户端    | 默认 Fetcher 与后端契约 |

## 安装

```bash
pnpm add react react-dom antd @ant-design/icons dayjs \
  @ahoo-wang/fetcher-viewer
```

同时安装包管理器列出的 Fetcher peer 包。在应用根部提供反馈和浮层所需的 Ant Design
上下文：

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

## 核心模型

`ViewDefinition` 描述字段、可用过滤器和数据/计数 URL。`ViewState` 存储一个个人或
共享视图的过滤器、列、表格密度、分页大小、条件和排序。

```ts
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';
import { all } from '@ahoo-wang/fetcher-wow';

const definition: ViewDefinition = {
  id: 'users',
  name: '用户',
  dataUrl: '/users/list',
  countUrl: '/users/count',
  fields: [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    { name: 'name', label: '姓名', type: 'text', primaryKey: false },
  ],
  availableFilters: [],
};

const defaultView: ViewState = {
  id: 'all-users',
  name: '全部用户',
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

必填属性为 `defaultViews`、`defaultView`、`definition`、`dataSource` 和
`pagination`。`dataSource` 是 `PagedList<RecordType>`；传入 `pagination={false}`
可关闭分页。

| 属性组 | 重要属性                                                               |
| ------ | ---------------------------------------------------------------------- |
| 数据   | `dataSource`、`loading`、`onLoadData`                                  |
| 视图   | `defaultViews`、`defaultView`、`onSwitchView`                          |
| 持久化 | `onCreateView`、`onUpdateView`、`onDeleteView`、`onGetRecordCount`     |
| 表格   | `pagination`、`actionColumn`、`enableRowSelection`、`viewTableSetting` |
| 操作   | `primaryAction`、`secondaryActions`、`batchActions`                    |

`Viewer` 不加载数据，也不持久化视图。回调接收新的条件、从 1 开始的页码、分页大小、
排序或视图变更。持久化回调调用 `onSuccess` 后，再更新 UI。

`ViewerRef` 暴露 `getCondition()`、`getActiveView()` 和
`clearSelectedRowKeys()`。

## `View<RecordType>` 状态

非受控状态使用 `default*` 属性。控制某个维度时，应成对传入对应 `external*` 值和
`externalUpdate*` 回调。可控维度包括过滤器、列、页码、分页大小、表格密度、条件和排序。

`filterMode` 可为 `none`、`normal` 或 `editable`。`onChange` 接收组合后的
`Condition`、页码、分页大小和排序。`ViewRef` 还暴露 `reset()` 和
`updateTableSize()`。

## 输入、过滤器、单元格与注册表

- 输入：`TagInput`、`NumberRange`、`RemoteSelect`、`Fullscreen`。
- 过滤器：ID、文本、数字、选择、布尔、日期时间、类型化、组合和可编辑面板。
- 单元格：文本、主键、链接、头像、图片、图片组、标签、货币、日期时间、日历时间与操作。
- `filterRegistry` 和 `cellRegistry` 按类型解析内置组件；
  `TypedComponentRegistry` 支持应用自定义类型。
- `ViewTable`、`TableSettingPanel` 与顶栏项均为公开导出，可用于低于 `Viewer` 层级的
  自定义组合。

未知过滤器类型渲染 `FallbackFilter`；未知单元格类型回退到文本。自定义类型名必须唯一，
并在首次渲染前注册。

## `FetcherViewer<RecordType>`

`FetcherViewer` 通过默认注册的 Fetcher 和内置 Wow 客户端加载
`viewerDefinitionId`、保存视图、计数与分页数据。挂载前配置
`fetcherRegistrar.default`。

它会显式渲染加载、定义加载失败、缺少定义和缺少视图状态。`FetcherViewerRef` 暴露
`refreshData()`、`clearSelectedRowKeys()`、`getPageQuery()`、`getActiveView()` 和
`getViewerDefinition()`。

内置回退语言为中文。`useLocale()` 暴露局部持有的语言状态，并把自定义值合并到回退值上。

在 [Storybook](https://fetcher.ahoo.me/storybook/) 中体验完整工作流，并继续阅读
[构建数据 Viewer](../recipes/data-viewer.md)。
