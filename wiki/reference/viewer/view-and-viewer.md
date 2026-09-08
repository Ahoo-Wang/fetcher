---
title: 'View and Viewer composition'
description: 'View and Viewer composition — @ahoo-wang/fetcher-viewer 5.0.0'
---

# View and Viewer composition

Choose View for a filter/table/pagination surface with supplied rows. Choose Viewer to add saved-view selection and a top toolbar. Choose [FetcherViewer](./fetcher-viewer) only when the service implements the package's remote definition/view endpoints.

| Component                | Required props / ownership                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| View&lt;RecordType&gt;   | fields, availableFilters, dataSource `{total,list}`, showFilter, filterMode, defaultColumns, defaultPageSize, defaultTableSize, pagination and enableRowSelection. |
| Viewer&lt;RecordType&gt; | defaultViews/defaultView, definition, dataSource and pagination; row selection defaults true. It manages editable active-view state.                               |
| ViewRef                  | clearSelectedRowKeys, updateTableSize, reset, getCondition; ref is a React 19 prop.                                                                                |
| ViewerRef                | clearSelectedRowKeys, getActiveView, getCondition.                                                                                                                 |

View's filterMode is none/normal/editable. showFilter controls visibility, while filterMode chooses whether a panel exists. pagination false hides pagination; it does not truncate dataSource. Normal page controls use the dataSource total and call the state change callback. `onChange(condition,index,size,sorter?)` / Viewer `onLoadData` delegate actual fetching to you. Filters and sorter changes reset page to 1; table selection updates onSelectedDataChange and count. External state props and callbacks must be paired as described in [state ownership](./models-and-state).

Viewer receives `onCreateView`, `onUpdateView`, `onDeleteView` with optional success callbacks. It forwards actions to the application and only updates its local collection through those completion callbacks; it has no built-in local-storage persistence for view definitions. `onSwitchView` reports selected saved state. DataMonitor configuration uses definition.countUrl and current condition; the monitoring service has its own polling lifecycle. Wrap context-dependent toolbar fullscreen actions in React FullscreenProvider; the exported Fullscreen component is a standalone button, not a provider.

A reset restores view defaults, remounts filters/table and clears selected rows. Merely replacing dataSource does not automatically clear selection; call the ref when your refresh requires it. Fields' render callbacks and application callbacks may throw; this component is not an error boundary. Browser-dependent toolbar features require window/document. The example renders supplied local data only; it makes no service request.

## Complete example

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

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./index#public-symbols). Runtime defaults and failure behavior are described above.

### View {#api-View}

```ts
export function View<RecordType>({
  ref,
  fields,
  availableFilters,
  dataSource,
  actionColumn,
  showFilter,
  filterMode,
  pagination,
  enableRowSelection,
  viewTableSetting,
  onClickPrimaryKey,
  onSelectedDataChange,
  loading,
  ...viewState
}: ViewProps<RecordType>): React.JSX.Element;
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

[packages/viewer/src/view/View.tsx:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L106)

### Viewer {#api-Viewer}

```ts
export function Viewer<RecordType = any>({
  ...props
}: ViewerProps<RecordType>): React.JSX.Element;
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

[packages/viewer/src/viewer/Viewer.tsx:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L41)

## Related topics

[Models and state ownership](./models-and-state) · [Saved-view panels and persistence callbacks](./saved-views) · [FetcherViewer remote integration](./fetcher-viewer) · [Filters and editable panels](./filters) · [Tables, columns and cells](./tables-and-cells) · [Registries, inputs and fullscreen button](./registries-and-inputs) · [Toolbar, refresh and locale](./toolbar-and-locale)
