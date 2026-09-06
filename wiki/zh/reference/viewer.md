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

此包有 Fetcher、React、Wow、Storage、Event、Decorator、OpenAPI 和 EventStream peer dependencies。请提供应用需要的 Ant Design App Context。已发布的 root barrel 是 Public API Boundary。[packages/viewer/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/index.ts#L14)

## 组件选择与所有权

| 组件 | 组件负责 | 调用方负责 |
| --- | --- | --- |
| `ViewTable<RecordType>` | Table Column、类型化 Cell、Selection UI | `fields`、`columns`、Row Data、Sort / Selection Callback、Loading 与 Empty/Error Presentation。 |
| `View<RecordType>` | Filter Panel、Pagination、Sort、受控/非受控 View State | Data Loading；受控模式的 External State Value/Callback。 |
| `Viewer<RecordType>` | Active Saved View、Side Panel、Top Bar，以及 `View` 组合 | `PagedList` Data、`onLoadData` 与 Persistence Callback。 |
| `FetcherViewer<RecordType>` | Definition/View/Data Query、Command Client、Default View Persistence 与组合 | Default Fetcher Registration 与 Viewer Backend Contract。 |

`Viewer` 明确不加载 Row，也不远程持久化 View。`FetcherViewer` 使用 Default Fetcher 和内置 Viewer Endpoint。[packages/viewer/src/viewer/Viewer.tsx:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L39) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L69)

## 核心模型与 Callback

`ViewDefinition` 提供 `id`、`name`、类型化 `fields`、`availableFilters`、`dataUrl` 和 `countUrl`。`FieldDefinition` 包含 `name`、`type`、`label`、`primaryKey`、可选 custom `render` 与可选 Ant Design Sorter Configuration。`ViewState` 持久化 View Identity、`PERSONAL`/`SHARED` Type、`SYSTEM`/`CUSTOM` Source、Default Flag、Filter、Column、Table Size、Page Size、Condition、可选 Internal Condition 与 Sorter。[packages/viewer/src/viewer/types.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L15) [packages/viewer/src/viewer/types.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L35)

| `Viewer` 分组 | 必要 / 重要契约 |
| --- | --- |
| 初始 View | `defaultViews`、`defaultView`、`definition`；选择 View 时会补齐缺失 Field。 |
| Row | `dataSource: PagedList<RecordType>` 与 `pagination`（`false` 关闭）；`loading` 可选。 |
| Data Callback | `onLoadData(condition, oneBasedPage, pageSize, sorter?)` 接收 State Change。 |
| View Callback | `onSwitchView(view)` 观察切换。 |
| 持久化 | `onCreateView`、`onUpdateView`、`onDeleteView` 接收 Proposed View 和 `onSuccess(newView)` Continuation；仅在 Remote Success 后调用。 |
| Actions | `onGetRecordCount`、Primary/Secondary/Batch Action、Row Selection、Primary Key Click、Table Setting、Action Column。 |

`ViewerRef` 有 `getCondition`、`getActiveView`、`clearSelectedRowKeys`；`ViewRef` 还包括 `reset`、`updateTableSize`。[packages/viewer/src/viewer/Viewer.tsx:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L34) [packages/viewer/src/view/View.tsx:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L47)

### 精确 Public Component Contract

| 组件 | Required Props | Optional Props / Callback | Ref 与 Default |
| --- | --- | --- | --- |
| `View<RecordType>` | `fields`、`availableFilters`、`dataSource`、`showFilter`、`filterMode`、`defaultColumns`、`defaultPageSize`、`defaultTableSize`、`pagination`、`enableRowSelection` | 所有 `external*` / `externalUpdate*` Controlled Pair；`defaultActiveFilters`、`defaultPage`、`defaultSorter`、`defaultCondition`、`actionColumn`、`loading`、`onChange`、Selection 与 Primary-key Callback | `ViewRef`：Table Reset/Selection 加 `getCondition`、`updateTableSize`、`reset`。Internal Hook Fallback 是 Page `1`、Page Size `10`、Table Size `middle`、`all()`、`[]`；Required Props 在该 Component Boundary 仍然必填。 |
| `Viewer<RecordType>` | `defaultViews`、`defaultView`、`definition`、`dataSource`、`pagination` | `loading`、`onLoadData`、`onSwitchView`、三个 Persistence Callback、Count/Action/Table/Selection/Fullscreen Props | `ViewerRef`：`getCondition`、`getActiveView`、`clearSelectedRowKeys`。它向 Internal `View` 传递 `enableRowSelection ?? true`；这不是必填的 `Viewer` Prop。 |
| `FetcherViewer<RecordType>` | `viewerDefinitionId`、`pagination` | `ownerId`、`tenantId`、`defaultViewId`、Action/Table/Selection Props、`enhanceDataSource`、`onSwitchView` | `FetcherViewerRef`：`refreshData`、`clearSelectedRowKeys`、`getPageQuery`、`getActiveView`、`getViewerDefinition`；`ownerId` / `tenantId` 默认 `'(0)'`。 |

导出的 `useRefreshDataEventBus(subscriberId?)` 返回共享 Broadcast `bus`、`publish(subscriberId?)`、`subscribe(handler, subscriberId?)`。一个 Hook Instance 只 Prefix/Track 自己成功注册的 Handler Name；Unmount 或 Subscriber-ID Change 时 Cleanup 只移除这些 Name，不会移除共享相同 ID 的另一 Instance Handler。Component-scoped Handler 应从 Effect 中订阅；不要假设存在 Manual Unsubscribe API。[packages/viewer/src/hooks/useRefreshDataEventBus.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L15) [packages/viewer/src/hooks/useRefreshDataEventBus.ts:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L36) [packages/viewer/src/hooks/useRefreshDataEventBus.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L71)

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

`View` 支持非受控 `default*` State，以及受控 `external*` / 对应 `externalUpdate*` Pair，覆盖 Filter、Column、Page、Page Size、Table Size、Condition 与 Sorter。`filterMode` 可为 `none`、`normal`、`editable`；`onChange` 接收 Compose 后的 Condition、从 1 开始的 Page、Page Size、Sorter。默认值为 Page `1`、Page Size `10`、Table Size `middle`、`all()` Condition 和空 Sorter。[packages/viewer/src/view/View.tsx:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L66) [packages/viewer/src/view/View.tsx:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L106) [packages/viewer/src/view/hooks/useViewState.ts:171](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L171)

受控 Pair 必须完整：只提供 External Value 而没有 Update Callback，会使调用方无法持有 Next State。在 `Viewer` 层，成功的 Create/Update/Delete Continuation 会更新 Local View Collection；Persistence Action 失败时应让旧的可见 State 继续可用，并在调用方持有的 Action Flow 中显示 Error。[packages/viewer/src/viewer/Viewer.tsx:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L127)

`FetcherViewer` 将最近选中的视图 ID 保存在模块级 `KeyStorage`，键名为 `fetcher-viewer-local-default-view-id`。首次选择依次使用显式 `defaultViewId`、本地保存的 ID、`isDefault` 视图和第一条视图。后续重新加载视图时保留用户选择，并将选中 ID 绑定到服务端返回的新视图对象。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L97) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:587](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L587)

创建和更新请求使用 `PROCESSED` 命令阶段，并等待快照的 `version` 达到返回的 `aggregateVersion`。确认还会匹配命令结果中的租户、聚合身份以及预期所有者；其他租户或所有者下的较新快照不能确认此次保存。后端需提供已有的快照列表接口及其 `version`、`state` 字段。若命令未返回有效目标版本，组件会提示无法确认保存结果，并允许重新加载视图恢复浏览；恢复操作不重发命令，也不调用保存成功回调。 快照确认前会用 `ErrorCodes.isSucceeded` 检查业务结果；失败时显示命令错误，不调用成功回调。保存仍待确认时，`refreshData` 和对应刷新事件不会重发上一视图的查询。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:430](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L430)

更新命令返回业务失败时，`Viewer` 保持挂载，保留草稿中的筛选、排序和列配置，用户可以纠正后再次保存。创建失败时仍可重新加载视图恢复浏览，不重发命令，也不调用成功回调。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:211](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L211) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:536](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L536)

## Filter、Cell、Input 与 Registry

公开 Built-in 包括 `TagInput`、`NumberRange`、`RemoteSelect`、`Fullscreen`；Filter 包括 `TypedFilter`、`AssemblyFilter`、ID、Text、Number、Select、Boolean、Date/Time 及其 Panel；Cell 包括 Text、Primary Key、Link、Avatar、Image、Image Group、Tag(s)、Currency、Date/Time、Calendar Time、Action(s)。`RemoteSelect` 默认使用 300 ms Trailing Debounce、`uniqueKey: 'value'`，并合并 Remote、Initial、Additional Option。[packages/viewer/src/components/RemoteSelect.tsx:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L29) [packages/viewer/src/components/RemoteSelect.tsx:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L59)

`filterRegistry` 预装 `id`、`text`、`number`、`select`、`bool`、`datetime`；未知 `TypedFilter` 使用 `FallbackFilter`。`cellRegistry` 包含文档列出的 Cell Type；`typedCellRender` 遇到未注册 Type 返回 `undefined`。[packages/viewer/src/filter/filterRegistry.ts:73](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/filterRegistry.ts#L73) [packages/viewer/src/filter/TypedFilter.tsx:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L30) [packages/viewer/src/table/cell/cellRegistry.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/cellRegistry.ts#L67) [packages/viewer/src/table/cell/TypedCell.tsx:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TypedCell.tsx#L117)

自定义 Type 必须在首次 render 前注册一次，并保持 Identifier 稳定，因为服务端 View Definition 可能持久化它。Duplicate `register` 会抛错；开发期注册前请 `has` 检查，不能在 Component Render 中清空 Shared Registry。[packages/viewer/src/registry/componentRegistry.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L37) [packages/viewer/src/registry/componentRegistry.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L98)

```tsx
import type { CellProps } from '@ahoo-wang/fetcher-viewer';
import { cellRegistry } from '@ahoo-wang/fetcher-viewer';

function ScoreCell({ data }: CellProps) {
  return <strong>{String(data.value)}</strong>;
}

if (!cellRegistry.has('score')) cellRegistry.register('score', ScoreCell);
```

## FetcherViewer Data Flow 与失败边界

`FetcherViewer` 加载 Definition、Saved View，再用 `definition.dataUrl` 发起 Paged POST Query；它会组合 View 的 `internalCondition` 与可见 Condition，并接收可选 async `enhanceDataSource`。它通过 Ref 暴露 `refreshData`、`clearSelectedRowKeys`、`getPageQuery`、`getActiveView`、`getViewerDefinition`。[packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L47) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L61)

| State | 所有者与行为 |
| --- | --- |
| `ViewTable` / `View` / `Viewer` Loading | 调用方传入 `loading`；调用方持有 Transport Error 与 Retry UI。 |
| Empty Row | 这三层的 Data Source 都由调用方持有；请渲染业务自身的 Empty Semantics。 |
| `FetcherViewer` Loading | 加载视图定义或保存的视图时显示 Spinner。 |
| 视图或查询变更 | 切换视图、分页、筛选或排序后，在当前请求返回前隐藏旧数据；刷新同一查询时可以保留已有结果。[packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:144](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L144) |
| Definition Error | 渲染内置的视图定义加载错误。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:493](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L493) |
| Missing Definition（Empty Result） | 渲染 `未找到视图定义`。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:501](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L501) |
| No Saved Views（Empty Result） | 显示 `未找到视图`，并提供 `创建视图` 操作；删除最后一个视图后也可继续创建。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:507](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L507) |
| Views Error | 创建或更新成功后，刷新失败、暂未查到视图或快照版本仍落后于命令返回版本时保留重试操作；重试只加载快照，不重复提交命令。其他首次加载视图的错误没有独立错误界面。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:430](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L430) |
| Data Request Error | 数据 Hook 返回错误，`FetcherViewer` 不提供独立的数据请求错误界面。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:224](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L224) |
| `enhanceDataSource` Rejection | Effect 捕获拒绝并通过 alert 显示 `处理视图数据失败`，同时保持 Viewer 挂载，保留编辑中的筛选、排序、列配置和分页；成功增强后清除错误，被替换 Effect 的晚到结果会被忽略。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:259](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L259) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:542](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L542) |

挂载前必须配置默认 Fetcher。`ownerId` 和 `tenantId` 默认均为 `'(0)'`；修改视图定义、租户或所有者会重新挂载内容，并加载对应范围。[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:102](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L102) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:118](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L118)

## 故障定位与场景

| 现象 | 检查项 |
| --- | --- |
| 自定义 Filter/Cell 缺失 | 首次 render 前按 Field 的精确 `type` 注册；`TypedFilter` 会 fallback，`typedCellRender` 返回 `undefined`。 |
| View 看似忽略 External State | 同时提供 `external*` 与对应 `externalUpdate*`；不要意外混用所有权。 |
| Saved View 在持久化前出现 | 只在 Remote Operation 成功后调用 Mutation Continuation。 |
| Default View 不符合预期 | 依次检查 `defaultViewId`、Local `fetcher-viewer-local-default-view-id`、`isDefault`、Source Order。 |
| FetcherViewer 始终不可用 | 检查 Default Fetcher Registration、Definition Endpoint、Views Endpoint、`viewerDefinitionId`。 |
| 需要自定义视图或数据错误界面 | 需要控制首次加载视图或数据请求的错误与重试时，可用公开的 `useViewerDefinition`、`useViewerViews`、`useFetchData` 组合 `Viewer`。`FetcherViewer` 已提供增强失败提示。 |

- 完整 Caller-Owned Viewer Flow：[success](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--complete-flow)、[empty](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--empty-result)、[caller error and retry](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--caller-owned-error-and-retry)
- FetcherViewer Flow：[remote success](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--remote-success)、[definition error](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--definition-request-error)、[imperative methods](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--imperative-methods)
- Component Gallery：[filters](https://fetcher.ahoo.me/storybook/?path=/story/viewer-filters--typed-gallery)、[cells](https://fetcher.ahoo.me/storybook/?path=/story/viewer-tables-cells--gallery)、[inputs](https://fetcher.ahoo.me/storybook/?path=/story/viewer-inputs--remote-loading-and-success)

继续阅读 [构建数据 Viewer](../recipes/data-viewer.md)。
