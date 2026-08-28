---
title: Viewer 参考
description: 组合类型化过滤器、表格、保存视图与 Fetcher 驱动的 Viewer Flow。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-viewer`

`@ahoo-wang/fetcher-viewer` 是 React + Ant Design 数据视图系统。它适用于类型化 Field Definition、Filter、Column、保存 View 与 Table Flow；它不是通用数据 Fetch Cache。请选择仍持有所需行为的最高层组件。

## 安装

```bash
pnpm add react react-dom antd @ant-design/icons dayjs \
  @ahoo-wang/fetcher-viewer
```

此包有 Fetcher、React、Wow、Storage、Event、Decorator、OpenAPI 和 EventStream peer dependencies。请提供应用需要的 Ant Design App Context。已发布的 root barrel 是 Public API Boundary。[index:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/index.ts#L14)

## 组件选择与所有权

| 组件 | 组件负责 | 调用方负责 |
| --- | --- | --- |
| `ViewTable<RecordType>` | Table Column、类型化 Cell、Selection UI | `fields`、`columns`、Row Data、Sort / Selection Callback、Loading 与 Empty/Error Presentation。 |
| `View<RecordType>` | Filter Panel、Pagination、Sort、受控/非受控 View State | Data Loading；受控模式的 External State Value/Callback。 |
| `Viewer<RecordType>` | Active Saved View、Side Panel、Top Bar，以及 `View` 组合 | `PagedList` Data、`onLoadData` 与 Persistence Callback。 |
| `FetcherViewer<RecordType>` | Definition/View/Data Query、Command Client、Default View Persistence 与组合 | Default Fetcher Registration 与 Viewer Backend Contract。 |

`Viewer` 明确不加载 Row，也不远程持久化 View。`FetcherViewer` 使用 Default Fetcher 和内置 Viewer Endpoint。[Viewer:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L39) [FetcherViewer:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L48)

## 核心模型与 Callback

`ViewDefinition` 提供 `id`、`name`、类型化 `fields`、`availableFilters`、`dataUrl` 和 `countUrl`。`FieldDefinition` 包含 `name`、`type`、`label`、`primaryKey`、可选 custom `render` 与可选 Ant Design Sorter Configuration。`ViewState` 持久化 View Identity、`PERSONAL`/`SHARED` Type、`SYSTEM`/`CUSTOM` Source、Default Flag、Filter、Column、Table Size、Page Size、Condition、可选 Internal Condition 与 Sorter。[types:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L15) [types:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L35)

| `Viewer` 分组 | 必要 / 重要契约 |
| --- | --- |
| 初始 View | `defaultViews`、`defaultView`、`definition`；选择 View 时会补齐缺失 Field。 |
| Row | `dataSource: PagedList<RecordType>` 与 `pagination`（`false` 关闭）；`loading` 可选。 |
| Data Callback | `onLoadData(condition, oneBasedPage, pageSize, sorter?)` 接收 State Change。 |
| View Callback | `onSwitchView(view)` 观察切换。 |
| 持久化 | `onCreateView`、`onUpdateView`、`onDeleteView` 接收 Proposed View 和 `onSuccess(newView)` Continuation；仅在 Remote Success 后调用。 |
| Actions | `onGetRecordCount`、Primary/Secondary/Batch Action、Row Selection、Primary Key Click、Table Setting、Action Column。 |

`ViewerRef` 有 `getCondition`、`getActiveView`、`clearSelectedRowKeys`；`ViewRef` 还包括 `reset`、`updateTableSize`。[Viewer:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L34) [View:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L47)

```tsx
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import type { PagedList } from '@ahoo-wang/fetcher-wow';
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';

type UserRow = { id: string; name: string };

export function UsersViewer(props: {
  definition: ViewDefinition;
  views: ViewState[];
  activeView: ViewState;
  data: PagedList<UserRow>;
}) {
  return <Viewer<UserRow>
    defaultViews={props.views}
    defaultView={props.activeView}
    definition={props.definition}
    dataSource={props.data}
    pagination={{ showSizeChanger: false }}
    enableRowSelection={false}
    onLoadData={(condition, page, size, sorter) => {
      void loadUsers(condition, page, size, sorter);
    }}
  />;
}

declare function loadUsers(...args: unknown[]): Promise<void>;
```

## State 与保存 View 持久化

`View` 支持非受控 `default*` State，以及受控 `external*` / 对应 `externalUpdate*` Pair，覆盖 Filter、Column、Page、Page Size、Table Size、Condition 与 Sorter。`filterMode` 可为 `none`、`normal`、`editable`；`onChange` 接收 Compose 后的 Condition、从 1 开始的 Page、Page Size、Sorter。默认值为 Page `1`、Page Size `10`、Table Size `middle`、`all()` Condition 和空 Sorter。[View:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L66) [View:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L106) [useViewState:171](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L171)

受控 Pair 必须完整：只提供 External Value 而没有 Update Callback，会使调用方无法持有 Next State。在 `Viewer` 层，成功的 Create/Update/Delete Continuation 会更新 Local View Collection；Persistence Action 失败时应让旧的可见 State 继续可用，并在调用方持有的 Action Flow 中显示 Error。[Viewer:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L127)

`FetcherViewer` 将最近一次选中的 Default View ID 保存在 module-scope `KeyStorage`，Key 为 `fetcher-viewer-local-default-view-id`；未提供 Storage 时 `KeyStorage` 默认使用 Browser Storage。选择优先级固定为显式 `defaultViewId`、Local Stored ID、`isDefault` View、第一条 View。[FetcherViewer:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L72) [FetcherViewer:358](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L358) [KeyStorage:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L47)

## Filter、Cell、Input 与 Registry

公开 Built-in 包括 `TagInput`、`NumberRange`、`RemoteSelect`、`Fullscreen`；Filter 包括 `TypedFilter`、`AssemblyFilter`、ID、Text、Number、Select、Boolean、Date/Time 及其 Panel；Cell 包括 Text、Primary Key、Link、Avatar、Image、Image Group、Tag(s)、Currency、Date/Time、Calendar Time、Action(s)。`RemoteSelect` 默认使用 300 ms Trailing Debounce、`uniqueKey: 'value'`，并合并 Remote、Initial、Additional Option。[RemoteSelect:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L29) [RemoteSelect:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L59)

`filterRegistry` 预装 `id`、`text`、`number`、`select`、`bool`、`datetime`；未知 `TypedFilter` 使用 `FallbackFilter`。`cellRegistry` 包含文档列出的 Cell Type；`typedCellRender` 遇到未注册 Type 返回 `undefined`。[filterRegistry:73](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/filterRegistry.ts#L73) [TypedFilter:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L30) [cellRegistry:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/cellRegistry.ts#L67) [TypedCell:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TypedCell.tsx#L117)

自定义 Type 必须在首次 render 前注册一次，并保持 Identifier 稳定，因为服务端 View Definition 可能持久化它。Duplicate `register` 会抛错；开发期注册前请 `has` 检查，不能在 Component Render 中清空 Shared Registry。[componentRegistry:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L37) [componentRegistry:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L98)

```tsx
import type { CellProps } from '@ahoo-wang/fetcher-viewer';
import { cellRegistry } from '@ahoo-wang/fetcher-viewer';

function ScoreCell({ data }: CellProps) {
  return <strong>{String(data.value)}</strong>;
}

if (!cellRegistry.has('score')) cellRegistry.register('score', ScoreCell);
```

## FetcherViewer Data Flow 与失败边界

`FetcherViewer` 加载 Definition、Saved View，再用 `definition.dataUrl` 发起 Paged POST Query；它会组合 View 的 `internalCondition` 与可见 Condition，并接收可选 async `enhanceDataSource`。它通过 Ref 暴露 `refreshData`、`clearSelectedRowKeys`、`getPageQuery`、`getActiveView`、`getViewerDefinition`。[useFetchData:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L27) [FetcherViewer:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L40)

| State | 所有者与行为 |
| --- | --- |
| `ViewTable` / `View` / `Viewer` Loading | 调用方传入 `loading`；调用方持有 Transport Error 与 Retry UI。 |
| Empty Row | 这三层的 Data Source 都由调用方持有；请渲染业务自身的 Empty Semantics。 |
| `FetcherViewer` Loading | Definition 或 View Loading 时渲染 Spinner。 |
| Definition Error / Missing Definition / No Views | `FetcherViewer` 渲染内置 Message。 |
| `FetcherViewer` Data Request Error | 内部 Fetch Hook 会返回 Error，但 `FetcherViewer` 自身不渲染它；若产品需要 Error UI，应观察或包裹该 Flow。 |

挂载前必须配置 Default Fetcher。默认 `ownerId` 和 `tenantId` 都是 `'(0)'`；改变它们会改变远程 View Query。[FetcherViewer:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L81) [FetcherViewer:286](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L286)

## 故障定位与场景

| 现象 | 检查项 |
| --- | --- |
| 自定义 Filter/Cell 缺失 | 首次 render 前按 Field 的精确 `type` 注册；`TypedFilter` 会 fallback，`typedCellRender` 返回 `undefined`。 |
| View 看似忽略 External State | 同时提供 `external*` 与对应 `externalUpdate*`；不要意外混用所有权。 |
| Saved View 在持久化前出现 | 只在 Remote Operation 成功后调用 Mutation Continuation。 |
| Default View 不符合预期 | 依次检查 `defaultViewId`、Local `fetcher-viewer-local-default-view-id`、`isDefault`、Source Order。 |
| FetcherViewer 始终不可用 | 检查 Default Fetcher Registration、Definition Endpoint、Views Endpoint、`viewerDefinitionId`。 |
| 需要 Data-Error Retry Button | 使用 `Viewer` / `View` 并持有 Fetch Error，或在 `FetcherViewer` 外添加 Product-Level Handling；它只自行渲染 Definition Error。 |

- 完整 Caller-Owned Viewer Flow：[success](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--complete-flow)、[empty](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--empty-result)、[caller error and retry](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--caller-owned-error-and-retry)
- FetcherViewer Flow：[remote success](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--remote-success)、[definition error](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--definition-request-error)、[imperative methods](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--imperative-methods)
- Component Gallery：[filters](https://fetcher.ahoo.me/storybook/?path=/story/viewer-filters--typed-gallery)、[cells](https://fetcher.ahoo.me/storybook/?path=/story/viewer-tables-cells--gallery)、[inputs](https://fetcher.ahoo.me/storybook/?path=/story/viewer-inputs--remote-loading-and-success)

继续阅读 [构建数据 Viewer](../recipes/data-viewer.md)。
