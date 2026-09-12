---
title: '模型与状态所有权'
description: '模型与状态所有权 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# 模型与状态所有权

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../../guides/view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

ViewDefinition 描述数据端点的字段和可用过滤器，ViewState 描述该定义的一种已保存布局。根包模型为 `ViewDefinition`/`ViewState`，不相关的 view-engine 包不属于本 API。

| 模型                          | 必填含义                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ViewDefinition                | id/name、fields、availableFilters、dataUrl/countUrl；URL 供远端集成使用，View 不自动请求。                                                                                      |
| FieldDefinition               | name（点分路径）、label、type、primaryKey；可选 render(value,record,index)、sorter、attributes。                                                                                |
| ViewState                     | id/name/definitionId、type PERSONAL/SHARED、source SYSTEM/CUSTOM、isDefault、filters、columns、tableSize、pageSize、condition、sorter；internalCondition 可选，由远端加载组合。 |
| ViewColumn                    | key/name、fixed/hidden，可选 width/sortOrder；通过 name 引用 FieldDefinition。                                                                                                  |
| ActionItem / TopBarActionItem | title、onClick(records)，可选 render(records) 与 Button attributes。                                                                                                            |
| ViewMutationAction            | `(view, onSuccess?) => void`，以回调表示完成，不是等待 Promise 的契约。                                                                                                         |

## 状态 Hook

`useActiveViewState` 初始化本地状态：page 1、pageSize 10、tableSize middle、condition all()、sorter []，columns/activeFilters 必填。setter 对列表/条目及 condition 浅复制，reset 恢复默认值。后续 default prop 变化不是自动受控更新。

`useViewState` 增加 `external*` 值和对应 `externalUpdate*` 回调；两者独立用 nullish coalescing 选择，要真正控制一个维度必须同时提供。只给外部值而没有 setter 时，界面受控但修改写入未被使用的内部状态。setCondition/setSorter 重置到第 1 页并调用 onChange；setPagination 为页码/大小只发一次变更；列/表格密度变化不请求数据。reset 更新所有外部维度，并以默认值调用一次 onChange。

`useViewerState` 额外维护 activeView、保存视图、showFilter/showViewPanel（均默认 true），以及与选中基线比较的 viewChanged。切换视图重置到第 1 页并恢复各字段；定义中新出现的字段追加为可见 180px 列。reset 返回基线 ViewState。setViews 管理内部列表，构造默认值不是完全受控的保存视图库。

`mapToTableRecord` 克隆行并设置 key，优先显式主键路径、已有 key、行索引；空输入返回 []。刷新场景应提供稳定真实主键。`deepEqual` 处理基本值、数组、日期、正则和可枚举对象键，不是支持循环的任意对象比较器。`format` 顺序替换 `%@`，缺参数用空文本。工具不请求或持久化数据。

## 定义字段与保存布局 {#definition-fields}

定义是一个 viewer 的可用结构，保存视图选择并排列其中内容。应让保存视图的 `definitionId` 匹配 `definition.id`；本地模型不在运行时强制校验此关系。远端创建/更新的身份检查是 FetcherViewer 的特定职责。

| 字段                                      | 含义与约束                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `definition.fields`                       | 声明列元数据；`name` 是点分数据路径，`type` 选择单元格渲染器，`primaryKey` 指定行键。         |
| `definition.availableFilters`             | 分组的可选过滤器目录；保存视图的 `filters` 包含选中的 ActiveFilter 实例与初始 UI 值。         |
| `definition.dataUrl` / `countUrl`         | 模型要求的字符串。View 不请求它们；FetcherViewer 使用 dataUrl，监控/计数控件可使用 countUrl。 |
| `view.columns`                            | 有序名称/键及必填 fixed/hidden 标记；可选 width 为字符串，sortOrder 使用 Ant Design 值。      |
| `view.condition` / `sorter`               | 当前旧式 Wow 查询值；`filters` 还保存 UI 配置，有效条件生成前原始值就可以存在。               |
| `view.internalCondition?`                 | 远端加载器通过 AND 合并的额外条件，不是客户端权限边界。                                       |
| `view.pageSize` / `tableSize`             | 保存的分页大小 / 视觉密度；ViewState 本身无运行时默认值，状态 Hook 默认值见下文。             |
| `view.type` / `source` / `isDefault`      | PERSONAL/SHARED、SYSTEM/CUSTOM 和默认选择标记；用于视图分类，不是认证声明。                   |
| `FieldDefinition.sorter?`                 | 布尔值、多重排序优先级对象或 null；表格报告排序变化，数据所有者执行排序。                     |
| `FieldDefinition.attributes?` / `render?` | 透传列属性 / 自定义渲染器；可以覆盖生成的渲染设置，回调属于应用代码。                         |

[完整本地示例](./index)把定义、ViewState、查询回调与持久化确认串联起来。

## 完整示例

```tsx
import { useActiveViewState } from '@ahoo-wang/fetcher-viewer';
export function PageControls() {
  const state = useActiveViewState({
    defaultColumns: [],
    defaultActiveFilters: [],
  });
  return (
    <section>
      <button onClick={() => state.setPage(state.page + 1)}>
        Page {state.page}
      </button>
      <button onClick={state.reset}>Reset</button>
    </section>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

## 定义与保存视图契约 {#model-contracts}

### ViewDefinition {#api-ViewDefinition}

```ts
export interface ViewDefinition {
  id: string;
  name: string;
  fields: FieldDefinition[];
  availableFilters: AvailableFilterGroup[];
  dataUrl: string;
  countUrl: string;
}
```

[packages/viewer/src/viewer/types.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L15)

### FieldDefinition {#api-FieldDefinition}

```ts
export interface FieldDefinition
  extends NamedCapable, TypeCapable, AttributesCapable {
  label: string;
  primaryKey: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?:
    | boolean
    | {
        multiple: number;
      }
    | null;
}
```

[packages/viewer/src/viewer/types.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L24)

### ViewType {#api-ViewType}

```ts
export type ViewType = 'PERSONAL' | 'SHARED';
```

[packages/viewer/src/viewer/types.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L32)

### ViewSource {#api-ViewSource}

```ts
export type ViewSource = 'SYSTEM' | 'CUSTOM';
```

[packages/viewer/src/viewer/types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L33)

### ViewState {#api-ViewState}

```ts
export interface ViewState {
  id: string;
  name: string;
  definitionId: string;
  type: ViewType;
  source: ViewSource;
  isDefault: boolean;
  filters: ActiveFilter[];
  columns: ViewColumn[];
  tableSize: SizeType;
  pageSize: number;
  condition: Condition;
  internalCondition?: Condition;
  sorter: FieldSort[];
}
```

[packages/viewer/src/viewer/types.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L35)

### ViewColumn {#api-ViewColumn}

```ts
export interface ViewColumn extends NamedCapable, KeyCapable {
  fixed: boolean;
  hidden: boolean;
  width?: string;
  sortOrder?: SortOrder;
}
```

[packages/viewer/src/viewer/types.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L51)

## 应用操作与持久化 {#action-contracts}

### ViewMutationAction {#api-ViewMutationAction}

```ts
export type ViewMutationAction = (
  view: ViewState,
  onSuccess?: (newView: ViewState) => void,
) => void;
```

[packages/viewer/src/viewer/types.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L65)

### ViewMutationActionsCapable {#api-ViewMutationActionsCapable}

```ts
export interface ViewMutationActionsCapable {
  onCreateView?: ViewMutationAction;
  onUpdateView?: ViewMutationAction;
  onDeleteView?: ViewMutationAction;
}
```

[packages/viewer/src/viewer/types.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L86)

### GetRecordCountAction {#api-GetRecordCountAction}

```ts
export type GetRecordCountAction = (
  countUrl: string,
  condition: Condition,
) => Promise<number>;
```

[packages/viewer/src/viewer/types.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L60)

### GetRecordCountActionCapable {#api-GetRecordCountActionCapable}

```ts
export interface GetRecordCountActionCapable {
  onGetRecordCount?: GetRecordCountAction;
}
```

[packages/viewer/src/viewer/types.ts:82](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L82)

### TopBarActionItem {#api-TopBarActionItem}

```ts
export interface TopBarActionItem<RecordType> extends ActionItem<RecordType> {}
```

[packages/viewer/src/viewer/types.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L58)

### BatchActionsConfig {#api-BatchActionsConfig}

```ts
export interface BatchActionsConfig<RecordType> {
  enabled: boolean;
  title: string;
  actions: TopBarActionItem<RecordType>[];
}
```

[packages/viewer/src/viewer/types.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L70)

### TopbarActionsCapable {#api-TopbarActionsCapable}

```ts
export interface TopbarActionsCapable<RecordType> {
  primaryAction?: TopBarActionItem<RecordType>;
  secondaryActions?: TopBarActionItem<RecordType>[];
  batchActions?: BatchActionsConfig<RecordType>;
}
```

[packages/viewer/src/viewer/types.ts:76](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L76)

## 状态 Hook 与受控维度 {#state-contracts}

### useActiveViewState {#api-useActiveViewState}

```ts
export function useActiveViewState(
  options: UseActiveViewStateOptions,
): UseActiveViewStateReturn;
```

实现默认值: `defaultPage = 1`; `defaultPageSize = 10`; `defaultTableSize = 'middle'`; `defaultCondition = DEFAULT_CONDITION`; `defaultSorter = []`.

[packages/viewer/src/hooks/useActiveViewState.ts:43](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useActiveViewState.ts#L43)

### DEFAULT_CONDITION {#api-DEFAULT_CONDITION}

```ts
declare const DEFAULT_CONDITION: Condition<string>;
```

[packages/viewer/src/hooks/useActiveViewState.ts:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useActiveViewState.ts#L8)

### UseActiveViewStateOptions {#api-UseActiveViewStateOptions}

```ts
export interface UseActiveViewStateOptions {
  defaultColumns: ViewColumn[];
  defaultActiveFilters: ActiveFilter[];
  defaultCondition?: Condition;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSorter?: FieldSort[];
  defaultTableSize?: SizeType;
}
```

[packages/viewer/src/hooks/useActiveViewState.ts:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useActiveViewState.ts#L10)

### UseActiveViewStateReturn {#api-UseActiveViewStateReturn}

```ts
export interface UseActiveViewStateReturn {
  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;
  condition: Condition;
  setCondition: (condition: Condition) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sorter: FieldSort[];
  setSorter: (sorter: FieldSort[]) => void;
  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;
  reset: () => void;
}
```

[packages/viewer/src/hooks/useActiveViewState.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useActiveViewState.ts#L22)

### useViewState {#api-useViewState}

```ts
export function useViewState(options: UseViewStateOptions): UseViewStateReturn;
```

实现默认值: `defaultPage = DEFAULT_PAGE`; `defaultPageSize = DEFAULT_PAGE_SIZE`.

[packages/viewer/src/view/hooks/useViewState.ts:219](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L219)

### ViewChangeAction {#api-ViewChangeAction}

```ts
export type ViewChangeAction = (
  condition: Condition,
  index: number,
  size: number,
  sorter?: FieldSort[],
) => void;
```

[packages/viewer/src/view/hooks/useViewState.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L32)

### UseViewStateOptions {#api-UseViewStateOptions}

::: details 展开完整字段与成员

```ts
export interface UseViewStateOptions {
  defaultColumns: ViewColumn[];
  externalColumns?: ViewColumn[];
  externalUpdateColumns?: (columns: ViewColumn[]) => void;
  defaultActiveFilters?: ActiveFilter[];
  externalActiveFilters?: ActiveFilter[];
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;
  defaultPage?: number;
  externalPage?: number;
  externalUpdatePage?: (page: number) => void;
  defaultPageSize: number;
  externalPageSize?: number;
  externalUpdatePageSize?: (pageSize: number) => void;
  defaultCondition?: Condition;
  externalCondition?: Condition;
  externalUpdateCondition?: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
    filterStates: Map<Key, FilterState>,
    resetFilters?: ActiveFilter[],
  ) => void;
  defaultSorter?: FieldSort[];
  externalSorter?: FieldSort[];
  externalUpdateSorter?: (sorter: FieldSort[]) => void;
  defaultTableSize: SizeType;
  externalTableSize?: SizeType;
  externalUpdateTableSize?: (size: SizeType) => void;
  onChange?: ViewChangeAction;
}
```

:::

[packages/viewer/src/view/hooks/useViewState.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L65)

### UseViewStateReturn {#api-UseViewStateReturn}

::: details 展开完整字段与成员

```ts
export interface UseViewStateReturn {
  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  setPagination: (page: number, pageSize: number) => void;
  condition: Condition;
  setCondition: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
    filterStates: Map<Key, FilterState>,
  ) => void;
  sorter: FieldSort[];
  setSorter: (sorter: FieldSort[]) => void;
  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;
  selectedCount: number;
  updateSelectedCount: (count: number) => void;
  reset: () => void;
}
```

:::

[packages/viewer/src/view/hooks/useViewState.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L127)

### useViewerState {#api-useViewerState}

```ts
export function useViewerState(
  options: UseViewerStateOptions,
): UseViewerStateReturn;
```

实现默认值: `defaultShowFilter = true`; `defaultShowViewPanel = true`.

[packages/viewer/src/viewer/hooks/useViewerState.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/hooks/useViewerState.ts#L77)

### UseViewerStateOptions {#api-UseViewerStateOptions}

```ts
export interface UseViewerStateOptions {
  views: ViewState[];
  defaultView: ViewState;
  definition: ViewDefinition;
  defaultShowFilter?: boolean;
  defaultShowViewPanel?: boolean;
}
```

[packages/viewer/src/viewer/hooks/useViewerState.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/hooks/useViewerState.ts#L33)

### UseViewerStateReturn {#api-UseViewerStateReturn}

::: details 展开完整字段与成员

```ts
export interface UseViewerStateReturn {
  activeView: ViewState;
  showFilter: boolean;
  setShowFilter: (showFilter: boolean) => void;
  showViewPanel: boolean;
  setShowViewPanel: (showViewPanel: boolean) => void;
  viewChanged: boolean;
  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;
  condition: Condition;
  setCondition: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
    filterStates: Map<Key, FilterState>,
    resetFilters?: ActiveFilter[],
  ) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sorter: FieldSort[];
  setSorter: (sorter: FieldSort[]) => void;
  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;
  views: ViewState[];
  setViews: (views: ViewState[]) => void;
  onSwitchView: (view: ViewState) => void;
  reset: () => ViewState;
}
```

:::

[packages/viewer/src/viewer/hooks/useViewerState.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/hooks/useViewerState.ts#L41)

## 展示类型与工具 {#utility-contracts}

### Optional {#api-Optional}

```ts
export type Optional<T = any> = T | undefined;
```

[packages/viewer/src/types.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L19)

### DataSourceCapable {#api-DataSourceCapable}

```ts
export interface DataSourceCapable<RecordType = any> {
  list: RecordType[];
  total: number;
}
```

[packages/viewer/src/types.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L21)

### StyleCapable {#api-StyleCapable}

```ts
export interface StyleCapable {
  style?: React.CSSProperties;
  className?: string;
}
```

[packages/viewer/src/types.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L26)

### AttributesCapable {#api-AttributesCapable}

```ts
export interface AttributesCapable<Attributes = any> {
  attributes?: Attributes;
}
```

[packages/viewer/src/types.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L31)

### PrimaryKeyClickHandlerCapable {#api-PrimaryKeyClickHandlerCapable}

```ts
export interface PrimaryKeyClickHandlerCapable<RecordType = any> {
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
}
```

[packages/viewer/src/types.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L35)

### ViewTableSetting {#api-ViewTableSetting}

```ts
export interface ViewTableSetting {
  title?: string;
}
```

[packages/viewer/src/types.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L39)

### ViewTableSettingCapable {#api-ViewTableSettingCapable}

```ts
export interface ViewTableSettingCapable {
  viewTableSetting?: false | ViewTableSetting;
}
```

[packages/viewer/src/types.ts:43](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L43)

### TableSizeCapable {#api-TableSizeCapable}

```ts
export interface TableSizeCapable {
  tableSize?: SizeType;
}
```

[packages/viewer/src/types.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L47)

### KeyCapable {#api-KeyCapable}

```ts
export interface KeyCapable {
  key: Key;
}
```

[packages/viewer/src/types.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L51)

### ReducerActionCapable {#api-ReducerActionCapable}

```ts
export interface ReducerActionCapable<TYPE = any> {
  type: TYPE;
  payload: any;
}
```

[packages/viewer/src/types.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L55)

### TableRecordType {#api-TableRecordType}

```ts
export type TableRecordType<RecordType> = RecordType & KeyCapable;
```

[packages/viewer/src/types.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L60)

### ActionItem {#api-ActionItem}

```ts
export interface ActionItem<RecordType> extends AttributesCapable<
  Omit<ButtonProps, 'onClick'>
> {
  title: string;
  onClick: (records: RecordType[]) => void;
  render?: (records: RecordType[]) => React.ReactNode;
}
```

[packages/viewer/src/types.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L62)

### SaveViewMethod {#api-SaveViewMethod}

```ts
export type SaveViewMethod = 'Update' | 'SaveAs';
```

[packages/viewer/src/types.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/types.ts#L70)

### deepEqual {#api-deepEqual}

```ts
export function deepEqual(left: any, right: any): boolean;
```

[packages/viewer/src/utils.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/utils.ts#L34)

### mapToTableRecord {#api-mapToTableRecord}

```ts
export function mapToTableRecord<RecordType = any>(
  dataSource: RecordType[] | undefined,
  primaryKey?: string,
): TableRecordType<RecordType>[];
```

[packages/viewer/src/utils.ts:112](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/utils.ts#L112)

### format {#api-format}

```ts
export function format(str: string, ...args: any[]): string;
```

[packages/viewer/src/utils.ts:137](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/utils.ts#L137)

## 相关专题

[View 与 Viewer 组合](./view-and-viewer) · [已保存视图面板与持久化回调](./saved-views) · [FetcherViewer 远端集成](./fetcher-viewer) · [过滤器与可编辑面板](./filters) · [表格、列与单元格](./tables-and-cells) · [注册表、输入与全屏按钮](./registries-and-inputs) · [工具栏、刷新与本地化](./toolbar-and-locale)
