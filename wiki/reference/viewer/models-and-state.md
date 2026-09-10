---
title: 'Models and state ownership'
description: 'Models and state ownership — @ahoo-wang/fetcher-viewer 5.0.0'
---

# Models and state ownership

::: warning Maintenance mode (deprecated)
`@ahoo-wang/fetcher-viewer` is deprecated and in maintenance mode: existing functionality is maintained, with no new features. Further data-view development belongs to [`@ahoo-wang/fetcher-view-engine`](../../guides/view-engine/index.md); use View Engine for new projects. This page remains a maintenance reference for existing consumers. The packages use different models and APIs, so migration requires adaptation.
:::

A ViewDefinition describes the fields and available filters for a data endpoint; ViewState describes one saved arrangement of that definition. The root package's model is `ViewDefinition`/`ViewState`; an unrelated view-engine package is not part of this API.

| Model                         | Required meaning                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ViewDefinition                | id/name, fields, availableFilters, dataUrl and countUrl; URLs are used by remote integrations, not automatically by View.                                                                                      |
| FieldDefinition               | name (dotted data path), label, type, primaryKey; optional render(value,record,index), sorter and attributes.                                                                                                  |
| ViewState                     | id/name/definitionId, type PERSONAL or SHARED, source SYSTEM or CUSTOM, isDefault, filters, columns, tableSize, pageSize, condition and sorter. Optional internalCondition is combined by remote data loading. |
| ViewColumn                    | key/name, fixed/hidden, optional width and sortOrder; presentation references a FieldDefinition by name.                                                                                                       |
| ActionItem / TopBarActionItem | title, onClick(records), optional render(records) and Button attributes.                                                                                                                                       |
| ViewMutationAction            | `(view, onSuccess?) => void`; completion is callback-based, not an awaited Promise contract.                                                                                                                   |

## State hooks

`useActiveViewState` initializes local state: page 1, pageSize 10, tableSize middle, condition all(), sorter []. Columns/activeFilters are required. Setters shallow-copy lists/items and condition; reset restores defaults. Later default-prop changes are not automatically controlled state updates.

`useViewState` composes that state with `external*` values and matching `externalUpdate*` callbacks. External values and setters are selected independently with nullish coalescing: provide both to implement a genuinely controlled dimension. A value without its external setter remains visually controlled while mutations write unused internal state. setCondition/setSorter reset page to 1 and invoke onChange; setPagination emits one change for page and size. Column/table-size changes do not fetch data. reset updates each external dimension and calls onChange once with defaults.

`useViewerState` additionally tracks activeView, saved views, showFilter/showViewPanel (both default true), and viewChanged against the selected baseline. Switching view resets page to 1 and restores view fields; missing definition fields are appended as visible 180px columns. reset returns the baseline ViewState. setViews manages its internal list; constructor defaults are not a fully controlled saved-view store.

`mapToTableRecord` returns cloned rows with key chosen from explicit primary-key path, existing key, then row index; empty input returns []. Prefer a real stable primary key across refreshes. `deepEqual` handles primitives, arrays, dates, regexps and enumerable object keys; it is not a cycle-safe arbitrary-object comparator. `format` substitutes each `%@` sequentially, using empty text for missing arguments. These utilities neither fetch nor persist data.

## Definition fields versus a saved arrangement {#definition-fields}

A definition is the available schema for one viewer. A saved view selects and arranges it. Give the saved view `definitionId` matching `definition.id`; this local model does not enforce that relationship at runtime. Identity validation during remote create/update belongs specifically to FetcherViewer.

| Field                                     | Meaning and constraints                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `definition.fields`                       | Declares column metadata. `name` is a dotted data path, `type` selects a cell renderer, `primaryKey` identifies row keys.              |
| `definition.availableFilters`             | Catalog grouped for filter selection; the saved view's `filters` contains the chosen ActiveFilter instances and initial UI values.     |
| `definition.dataUrl` / `countUrl`         | Required strings in the model. View never calls them; FetcherViewer uses dataUrl, monitoring/count controls can use countUrl.          |
| `view.columns`                            | Ordered names/keys with required fixed/hidden flags; optional width is a string and sortOrder uses Ant Design values.                  |
| `view.condition` / `sorter`               | Current legacy Wow query values. `filters` stores UI configuration as well; a raw value can exist before a valid condition does.       |
| `view.internalCondition?`                 | Additional constraint ANDed by the remote loader. It is not a client-enforced permission boundary.                                     |
| `view.pageSize` / `tableSize`             | Saved page size / visual density; no runtime defaults in ViewState itself. State-hook defaults are documented separately below.        |
| `view.type` / `source` / `isDefault`      | PERSONAL/SHARED, SYSTEM/CUSTOM and default-selection flag. These classify views; they are not authentication claims.                   |
| `FieldDefinition.sorter?`                 | Boolean, multiple-sort priority object or null; the table reports sort changes and the data owner applies sorting.                     |
| `FieldDefinition.attributes?` / `render?` | Pass-through column attributes / custom renderer. They can override generated rendering settings; treat callbacks as application code. |

Use the complete [local example](./index) to see a definition, ViewState, query callback and persistence acknowledgement together.

## Complete example

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

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

## Definition and saved-view contracts {#model-contracts}

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

## Application actions and persistence {#action-contracts}

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

## State hooks and controlled dimensions {#state-contracts}

### useActiveViewState {#api-useActiveViewState}

```ts
export function useActiveViewState(
  options: UseActiveViewStateOptions,
): UseActiveViewStateReturn;
```

Implementation defaults: `defaultPage = 1`; `defaultPageSize = 10`; `defaultTableSize = 'middle'`; `defaultCondition = DEFAULT_CONDITION`; `defaultSorter = []`.

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

Implementation defaults: `defaultPage = DEFAULT_PAGE`; `defaultPageSize = DEFAULT_PAGE_SIZE`.

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

::: details Expand all fields and members

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

::: details Expand all fields and members

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

Implementation defaults: `defaultShowFilter = true`; `defaultShowViewPanel = true`.

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

::: details Expand all fields and members

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

## Presentation types and utilities {#utility-contracts}

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

## Related topics

[View and Viewer composition](./view-and-viewer) · [Saved-view panels and persistence callbacks](./saved-views) · [FetcherViewer remote integration](./fetcher-viewer) · [Filters and editable panels](./filters) · [Tables, columns and cells](./tables-and-cells) · [Registries, inputs and fullscreen button](./registries-and-inputs) · [Toolbar, refresh and locale](./toolbar-and-locale)
