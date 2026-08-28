# `@ahoo-wang/fetcher-viewer`

面向过滤器、表格、保存视图和远程数据工作流的 React + Ant Design 组件。应用自己
负责加载与持久化时从 `Viewer` 开始；只有对接匹配的 Viewer 后端契约时才使用
`FetcherViewer`。

## 安装

```bash
pnpm add react react-dom antd @ant-design/icons dayjs \
  @ahoo-wang/fetcher-viewer
```

安装包管理器报告的 Fetcher peer 包，并使用 Ant Design `ConfigProvider` 与 `App`
包裹应用。

## 示例

```tsx
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';
import { all } from '@ahoo-wang/fetcher-wow';

const definition: ViewDefinition = {
  id: 'users',
  name: '用户',
  dataUrl: '/users/list',
  countUrl: '/users/count',
  fields: [{ name: 'id', label: 'ID', type: 'text', primaryKey: true }],
  availableFilters: [],
};

const view: ViewState = {
  id: 'all',
  name: '全部用户',
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

## 核心能力

- 类型化输入、过滤面板与应用可扩展注册表。
- 丰富单元格、行操作、选择、排序与列设置。
- 受控或非受控的过滤、列、分页与排序状态。
- 个人/共享保存视图 UI 和顶栏操作。
- 通过 `Viewer` 回调由应用负责数据与持久化。
- `FetcherViewer` 加载、后端持久化、刷新与 ref 控制。

## 文档

- [构建数据 Viewer](https://fetcher.ahoo.me/zh/recipes/data-viewer)
- [Viewer 参考](https://fetcher.ahoo.me/zh/reference/viewer)
- [交互式 Viewer 工作流](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)
