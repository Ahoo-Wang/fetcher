---
title: 'View 与 Viewer 组合'
description: 'View 与 Viewer 组合 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# View 与 Viewer 组合

View 提供过滤/表格/分页，数据行由你提供；Viewer 增加已保存视图选择和工具栏。服务实现本包远端定义/视图端点时才选择 [FetcherViewer](./fetcher-viewer)。

| 组件                     | 必填参数 / 所有权                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View&lt;RecordType&gt;   | fields、availableFilters、dataSource `{total,list}`、showFilter、filterMode、defaultColumns、defaultPageSize、defaultTableSize、pagination、enableRowSelection。 |
| Viewer&lt;RecordType&gt; | defaultViews/defaultView、definition、dataSource、pagination；行选择默认 true，内部管理可编辑活动视图。                                                          |
| ViewRef                  | clearSelectedRowKeys、updateTableSize、reset、getCondition；ref 为 React 19 prop。                                                                               |
| ViewerRef                | clearSelectedRowKeys、getActiveView、getCondition。                                                                                                              |

View 的 filterMode 为 none/normal/editable；showFilter 控制可见性，filterMode 控制是否存在面板。pagination false 隐藏分页，不截取 dataSource。分页使用 dataSource.total 并调用状态变更回调。`onChange(condition,index,size,sorter?)` / Viewer `onLoadData` 将真实请求交给你。过滤和排序变化回到第 1 页，行选择更新 onSelectedDataChange 和计数。外部状态与 setter 应按 [状态所有权](./models-and-state) 配对。

Viewer 接收 onCreateView/onUpdateView/onDeleteView 和可选成功回调。它将操作转交应用，仅通过完成回调更新内部集合，不自动将视图定义持久化到 localStorage。onSwitchView 通知已选保存状态。DataMonitor 使用 definition.countUrl 和当前 condition，轮询生命周期独立。依赖 context 的工具栏全屏操作需包装在 React FullscreenProvider 中；公开 Fullscreen 是独立按钮，不是 provider。

reset 恢复默认值、重新挂载过滤/表格并清除选中行；仅替换 dataSource 不自动清除选择，刷新需要时调用 ref。字段 render 或应用回调可抛错，组件不是错误边界。浏览器工具栏功能需要 window/document。示例只显示本地传入数据，不发服务请求。

## Props 与 ref 的职责 {#props-and-ref}

| 输入 / 操作  | View                                                                   | Viewer                                                          |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `dataSource` | 必填 `{list,total}`，应已是所需页                                      | 相同；`loading` 是可选展示输入                                  |
| `pagination` | 必填 false 或选项；total 来自 dataSource                               | 相同；组件接管 onChange/onShowSizeChange 连线                   |
| 初始布局     | 必填 defaultColumns/defaultPageSize/defaultTableSize，另有可选初始状态 | 必填 defaultViews/defaultView 和 definition，用于初始化本地状态 |
| 过滤控制     | 必填 showFilter/filterMode；editable 允许增删过滤器                    | 活动视图状态提供过滤面板与可见性                                |
| 受控维度     | 同时提供 `external*` 值与匹配的 `externalUpdate*` 回调                 | 需要此粒度外部控制时直接使用 View                               |
| 加载行       | `onChange(condition,index,size,sorter?)`                               | 同参数的 `onLoadData`                                           |
| ref 读取     | `getCondition()` 读取过滤面板条件                                      | 增加 `getActiveView()`；无保存视图时为 undefined                |
| ref 修改     | clearSelectedRowKeys、updateTableSize、reset                           | clearSelectedRowKeys；数据重载/持久化仍由回调负责               |

以 React 19 prop 传入 `ref`。挂载后读取 ref，并允许过滤面板尚不存在时条件为 undefined。清空选择键不会查询。Reset 恢复默认值并通过变化回调请求对应数据，不是后端回滚。只传受控值而不传更新回调时，修改会落到未使用的内部状态，界面可能表现为冻结。

## 完整示例

```tsx
import { View } from '@ahoo-wang/fetcher-viewer';
import type { FieldDefinition, ViewColumn } from '@ahoo-wang/fetcher-viewer';
interface User {
  id: string;
  name: string;
}
const fields: FieldDefinition[] = [
  { name: 'id', label: 'ID', type: 'text', primaryKey: true },
  { name: 'name', label: 'Name', type: 'text', primaryKey: false },
];
const columns: ViewColumn[] = fields.map(field => ({
  name: field.name,
  key: field.name,
  fixed: false,
  hidden: false,
}));
export function Users() {
  return (
    <View<User>
      fields={fields}
      availableFilters={[]}
      dataSource={{ list: [{ id: '1', name: 'Ada' }], total: 1 }}
      showFilter={false}
      filterMode="none"
      defaultColumns={columns}
      defaultPageSize={10}
      defaultTableSize="middle"
      pagination={false}
      enableRowSelection={false}
    />
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### View {#api-View}

```ts
export function View<RecordType>(
  options: ViewProps<RecordType>,
): React.JSX.Element;
```

[packages/viewer/src/view/View.tsx:212](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L212)

### ViewRef {#api-ViewRef}

```ts
export interface ViewRef extends ViewTableRef, FilterPanelConditionCapableRef {
  updateTableSize: (size: SizeType) => void;
  reset: () => void;
}
```

[packages/viewer/src/view/View.tsx:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L47)

### FilterMode {#api-FilterMode}

```ts
export type FilterMode = 'none' | 'normal' | 'editable';
```

[packages/viewer/src/view/View.tsx:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L66)

### ViewProps {#api-ViewProps}

::: details 展开完整字段与成员

```ts
export interface ViewProps<RecordType>
  extends
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    RefAttributes<ViewRef> {
  fields: FieldDefinition[];
  availableFilters: AvailableFilterGroup[];
  dataSource: PagedList<RecordType>;
  showFilter: boolean;
  filterMode: FilterMode;
  defaultActiveFilters?: ActiveFilter[];
  externalActiveFilters?: ActiveFilter[];
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;
  defaultColumns: ViewColumn[];
  externalColumns?: ViewColumn[];
  externalUpdateColumns?: (columns: ViewColumn[]) => void;
  defaultPage?: number;
  externalPage?: number;
  externalUpdatePage?: (page: number) => void;
  defaultPageSize: number;
  externalPageSize?: number;
  externalUpdatePageSize?: (pageSize: number) => void;
  defaultTableSize: SizeType;
  externalTableSize?: SizeType;
  externalUpdateTableSize?: (size: SizeType) => void;
  defaultSorter?: FieldSort[];
  externalSorter?: FieldSort[];
  externalUpdateSorter?: (sorter: FieldSort[]) => void;
  defaultCondition?: Condition;
  externalCondition?: Condition;
  externalUpdateCondition?: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
    filterStates: Map<Key, FilterState>,
    resetFilters?: ActiveFilter[],
  ) => void;
  actionColumn?: ViewTableActionColumn<RecordType>;
  pagination:
    false | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  enableRowSelection: boolean;
  loading?: boolean;
  onChange?: ViewChangeAction;
  onSelectedDataChange?: (data: RecordType[]) => void;
}
```

:::

[packages/viewer/src/view/View.tsx:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L106)

### Viewer {#api-Viewer}

```ts
export function Viewer<RecordType = any>(
  options: ViewerProps<RecordType>,
): React.JSX.Element;
```

[packages/viewer/src/viewer/Viewer.tsx:74](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L74)

### ViewerRef {#api-ViewerRef}

```ts
export interface ViewerRef extends FilterPanelConditionCapableRef {
  clearSelectedRowKeys: () => void;
  getActiveView: () => ViewState | undefined;
}
```

[packages/viewer/src/viewer/Viewer.tsx:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L36)

### ViewerProps {#api-ViewerProps}

::: details 展开完整字段与成员

```ts
export interface ViewerProps<RecordType>
  extends
    ViewTableSettingCapable,
    GetRecordCountActionCapable,
    ViewMutationActionsCapable,
    RefAttributes<ViewerRef>,
    TopbarActionsCapable<RecordType> {
  defaultViews: ViewState[];
  defaultView: ViewState;
  definition: ViewDefinition;
  dataSource: PagedList<RecordType>;
  pagination:
    false | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;
  loading?: boolean;
  onLoadData?: ViewChangeAction;
  onSwitchView?: (view: ViewState) => void;
  fullscreenTarget?: React.RefObject<HTMLElement | null>;
}
```

:::

[packages/viewer/src/viewer/Viewer.tsx:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L41)

## 相关专题

[模型与状态所有权](./models-and-state) · [已保存视图面板与持久化回调](./saved-views) · [FetcherViewer 远端集成](./fetcher-viewer) · [过滤器与可编辑面板](./filters) · [表格、列与单元格](./tables-and-cells) · [注册表、输入与全屏按钮](./registries-and-inputs) · [工具栏、刷新与本地化](./toolbar-and-locale)
