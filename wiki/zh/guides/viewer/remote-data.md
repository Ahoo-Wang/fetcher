---
next: false
title: 连接 Viewer 远端行数据
description: 使用应用负责的数据加载、取消和可恢复错误渲染分页 Viewer。
---

# 连接 Viewer 远端行数据

创建一个 React 页面，渲染默认视图、加载数据并响应分页/排序。Viewer 管理展示状态，应用提供数据和持久化回调。

## 1. 准备应用

使用支持 CSS 打包的 React 应用，安装 `@ahoo-wang/fetcher-viewer` 及其声明的 peer 依赖。[包入口](../../reference/viewer/)列出了完整安装契约；React、Ant Design、图标、dayjs 和 Fetcher peers 都必须解析到兼容版本。

本例要求同源应用提供 `POST /users/paged`，接收 `{ condition, pagination: { index, size }, sort }`，返回 JSON `{ list: [{ id, name }], total }`。请实现该路由或将 load 适配至真实服务。这是应用契约，不是 Viewer 创建的端点。后端必须执行授权并验证查询。countUrl 是必填的定义元数据，但本例不会调用它。

## 2. 添加完整页面

保存为 `UsersPage.tsx`，通过现有 React root/路由挂载 `<UsersPage />`：

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { all, type PagedList } from '@ahoo-wang/fetcher-wow';
import {
  Viewer,
  type FieldDefinition,
  type ViewDefinition,
  type ViewState,
  type ViewChangeAction,
} from '@ahoo-wang/fetcher-viewer';

interface User {
  id: string;
  name: string;
}
const fields: FieldDefinition[] = [
  { name: 'id', label: 'ID', type: 'text', primaryKey: true },
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    primaryKey: false,
    sorter: true,
  },
];
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
  definitionId: 'users',
  type: 'PERSONAL',
  source: 'SYSTEM',
  isDefault: true,
  filters: [],
  columns: fields.map(field => ({
    key: field.name,
    name: field.name,
    fixed: field.primaryKey,
    hidden: false,
  })),
  tableSize: 'middle',
  pageSize: 20,
  condition: all(),
  sorter: [],
};
const defaultViews = [defaultView];
const api = new Fetcher();
type QueryArgs = Parameters<ViewChangeAction>;

export function UsersPage() {
  const [data, setData] = useState<PagedList<User>>({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const pending = useRef<AbortController | null>(null);
  const lastQuery = useRef<QueryArgs>([all(), 1, 20, []]);

  const load = useCallback(async (...args: QueryArgs) => {
    lastQuery.current = args;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const [condition, index, size, sorter] = args;
    setLoading(true);
    setError(undefined);
    try {
      const page = await api.post<PagedList<User>>(
        definition.dataUrl,
        {
          signal: controller.signal,
          body: { condition, pagination: { index, size }, sort: sorter },
        },
        { resultExtractor: ResultExtractors.Json },
      );
      if (!controller.signal.aborted) setData(page);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Loading failed');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(...lastQuery.current);
    return () => pending.current?.abort();
  }, [load]);

  return (
    <section aria-label="Users">
      {error && (
        <div role="alert">
          {error}{' '}
          <button onClick={() => void load(...lastQuery.current)}>Retry</button>
        </div>
      )}
      <Viewer<User>
        defaultViews={defaultViews}
        defaultView={defaultView}
        definition={definition}
        dataSource={data}
        loading={loading}
        pagination={{}}
        enableRowSelection
        onLoadData={load}
        onSwitchView={view => {
          void load(view.condition, 1, view.pageSize, view.sorter);
        }}
      />
    </section>
  );
}
```

初始 effect 加载第一页。切换视图通过 `onSwitchView` 按目标视图的条件、页大小和排序重新加载第一页；仅提供 `onLoadData` 不会覆盖视图切换。后续变化通过 onLoadData 提供条件、从 1 开始的页码、大小和 sorter，回调将其转换为应用请求体。新请求取消前一个请求，已取消的响应不能覆盖新数据。卸载时取消活动请求。

## 3. 验证加载、空和失败状态

将应用路由模拟为 `{ list: [{ id: '42', name: 'Ada' }], total: 1 }`，检查可见数据行、选择、排序和发出的查询。返回空 list、零 total 来检查表格空状态。返回 HTTP 错误，检查提示和对最后一次查询的重试。延迟两个响应并快速翻页：应只有当前响应更新表格。本例失败时保留之前的数据行，并在上方显示错误。

再使用超过 20 行且各页内容不同的数据：翻到第 2 页后点击视图面板的 **All users**，确认请求的 `pagination.index` 为 1，且可见数据行重新变为第一页，而不只是页码变化。

JSON 泛型不验证服务端数据；需要时应在应用边界验证不可信响应。本流程的 TypeScript 检查不能替代浏览器交互检查，[Storybook](https://fetcher.ahoo.me/storybook/) 提供组件示例。

## 4. 按需添加过滤与保存视图

初始视图有意不设置过滤器。根据[过滤契约](../../reference/viewer/filters)向 availableFilters 和已保存 filters 添加条目。内置日期时间行为通过注册表的 datetime 解析；`DateTimeFilter` 不是包根的具名导出，不要导入内部文件。

持久化视图变更时提供 onCreateView、onUpdateView、onDeleteView，只有保存成功后才使用服务端确认的视图调用成功回调，否则 UI 应保留现有状态。参见[保存视图生命周期](../../reference/viewer/saved-views)。本例只定义一个系统默认视图，不执行远端视图写入。

## 5. 按契约选择远端组合

只有服务端实现定义接口与 Wow 保存视图契约，并且已设置必要客户端 Fetcher 配置时，才使用 [FetcherViewer](../../reference/viewer/fetcher-viewer)。仅有通用分页端点并不足够。参见[模型与状态](../../reference/viewer/models-and-state)及 [View 与 Viewer](../../reference/viewer/view-and-viewer)了解所有权边界。

[Viewer.tsx:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L57) 说明数据与持久化责任。

## 采用 FetcherViewer 前确认

上面的完整适配器只把业务分页端点接到 `Viewer`。先通过[本地示例](../../examples/viewer.md)验证界面，再替换数据加载。若采用 `FetcherViewer`，还需要兼容的视图定义、Wow 命令和视图快照查询服务；仅有 `POST /users/paged` 不足以运行。

远端行查询发送 `PagedQuery`，把 `internalCondition` 与交互条件组合。租户、所有者和 `definitionId` 必须一致，后端仍需授权。创建/更新视图会等待命令阶段并重新读取快照，只有版本足够新且身份一致才确认；这不是所有查询的读己之写保证，也不代表投影延迟有上界。删除没有相同的版本确认流程。

身份切换时组件会隔离旧界面工作，但已发送的命令不会因此从服务端撤销。请结合[Wow 集成](../integrations/wow.md)、[FetcherViewer 参考](../../reference/viewer/fetcher-viewer.md)与[状态和资源](../../architecture/state-and-resources.md)核对实际部署契约。
