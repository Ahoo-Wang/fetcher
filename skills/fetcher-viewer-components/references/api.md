# Fetcher Viewer Components API Reference

## Contents

- [Architecture Overview](#architecture-overview)
  - [Package Imports](#package-imports)
- [FetcherViewer (Main Entry Point)](#fetcherviewer-main-entry-point)
- [Viewer Component](#viewer-component)
- [View Component](#view-component)
- [ViewTable Component](#viewtable-component)
- [View Management](#view-management)
  - [ViewPanel](#viewpanel)
  - [ViewState](#viewstate)
  - [ViewCommandClient](#viewcommandclient)
- [TopBar Components](#topbar-components)
- [Filter System](#filter-system)
  - [FilterPanel](#filterpanel)
  - [EditableFilterPanel](#editablefilterpanel)
  - [ActiveFilter](#activefilter)
  - [filterRegistry](#filterregistry)
  - [useFilterState Hook](#usefilterstate-hook)
  - [Filter Component Examples](#filter-component-examples)
- [Cell Components](#cell-components)
  - [PrimaryKeyCell](#primarykeycell)
  - [CalendarTimeCell](#calendartimecell)
  - [typedCellRender](#typedcellrender)
- [Data Entry Components](#data-entry-components)
  - [RemoteSelect](#remoteselect)
  - [TagInput](#taginput)
  - [NumberRange](#numberrange)
- [Locale Support](#locale-support)
- [Integration with fetcher-react](#integration-with-fetcher-react)
- [Key Dependencies](#key-dependencies)

The viewer package is a React + Ant Design component library for data visualization, filtering, and view management.

## Architecture Overview

The viewer package provides a layered component hierarchy:

```
FetcherViewer (top-level orchestrator, handles data loading + view persistence)
  └── Viewer (layout: sidebar + topbar + content area)
        ├── ViewPanel (sidebar: view list with CRUD)
        │     ├── SaveViewModal
        │     └── ViewManageModal
        ├── TopBar (toolbar with actions and bar items)
        │     ├── FilterBarItem / RefreshDataBarItem / AutoRefreshBarItem
        │     ├── ColumnHeightBarItem / FullscreenBarItem
        │     ├── DataMonitorBarItem / ShareLinkBarItem
        │     └── SaveViewModal
        └── View (filter panel + table + pagination)
              ├── EditableFilterPanel / FilterPanel
              │     ├── AvailableFilterSelect / AvailableFilterSelectModal
              │     └── RemovableTypedFilter → TypedFilter (via filterRegistry)
              └── ViewTable (Ant Design Table with auto column generation)
                    └── Cell renderers (via cellRegistry)
```

### Package Imports

```typescript
import {
  // Main orchestrator
  FetcherViewer,
  type FetcherViewerProps,
  type FetcherViewerRef,
  // Viewer & View
  Viewer,
  type ViewerProps,
  type ViewerRef,
  View,
  type ViewProps,
  type ViewRef,
  type FilterMode,
  // Table
  ViewTable,
  type ViewTableProps,
  type ViewTableRef,
  TableSettingPanel,
  // View management
  ViewPanel,
  SaveViewModal,
  ViewManageModal,
  // TopBar
  TopBar,
  BarItem,
  RefreshDataBarItem,
  AutoRefreshBarItem,
  FilterBarItem,
  FullscreenBarItem,
  ColumnHeightBarItem,
  DataMonitorBarItem,
  ShareLinkBarItem,
  // Filter system
  FilterPanel,
  EditableFilterPanel,
  AvailableFilterSelect,
  RemovableTypedFilter,
  filterRegistry,
  useFilterState,
  TextFilter,
  NumberFilter,
  SelectFilter,
  IdFilter,
  BoolFilter,
  FallbackFilter,
  TypedFilter,
  // Cell components
  TextCell,
  TagCell,
  TagsCell,
  CurrencyCell,
  DateTimeCell,
  CalendarTimeCell,
  ImageCell,
  ImageGroupCell,
  AvatarCell,
  LinkCell,
  PrimaryKeyCell,
  ActionCell,
  ActionsCell,
  cellRegistry,
  typedCellRender,
  // Type constants
  TEXT_CELL_TYPE,
  TAG_CELL_TYPE,
  TAGS_CELL_TYPE,
  CURRENCY_CELL_TYPE,
  DATETIME_CELL_TYPE,
  CALENDAR_CELL_TYPE,
  IMAGE_CELL_TYPE,
  IMAGE_GROUP_CELL_TYPE,
  AVATAR_CELL_TYPE,
  LINK_CELL_TYPE,
  PRIMARY_KEY_CELL_TYPE,
  ACTION_CELL_TYPE,
  ACTIONS_CELL_TYPE,
  // Data entry
  RemoteSelect,
  TagInput,
  NumberRange,
  // Types
  type ViewDefinition,
  type FieldDefinition,
  type ViewState,
  type ViewColumn,
  type TopBarActionItem,
  type BatchActionsConfig,
  type ActiveFilter,
  type AvailableFilterGroup,
} from '@ahoo-wang/fetcher-viewer';
```

---

## FetcherViewer (Main Entry Point)

The top-level orchestrator that loads view definitions, manages views, fetches data, and renders the full viewer.

```tsx
import { FetcherViewer } from '@ahoo-wang/fetcher-viewer';
import type { FetcherViewerRef } from '@ahoo-wang/fetcher-viewer';

const viewerRef = useRef<FetcherViewerRef>(null);

<FetcherViewer<User>
  ref={viewerRef}
  viewerDefinitionId="user-viewer-definition"
  ownerId="(0)"
  tenantId="(0)"
  defaultViewId="default-view-id"
  pagination={{ pageSize: 20, showSizeChanger: true }}
  actionColumn={{
    title: 'Actions',
    dataIndex: 'id',
    actions: record => ({
      primaryAction: {
        data: { value: 'Edit', record, index: 0 },
        attributes: { onClick: () => editUser(record) },
      },
      secondaryActions: [
        {
          data: { value: 'Delete', record, index: 0 },
          attributes: { onClick: () => deleteUser(record), danger: true },
        },
      ],
    }),
  }}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  enableRowSelection={true}
  enhanceDataSource={async data => enrichedData}
  onSwitchView={view => console.log('Switched to:', view.name)}
  primaryAction={{ title: 'Create', onClick: () => createItem() }}
  secondaryActions={[{ title: 'Export', onClick: () => exportData() }]}
  batchActions={{
    enabled: true,
    title: 'Batch',
    actions: [{ title: 'Delete', onClick: rows => batchDelete(rows) }],
  }}
  viewTableSetting={{ title: 'Column Settings' }}
/>;
```

**FetcherViewerRef methods:** `refreshData()`, `clearSelectedRowKeys()`, `getPageQuery()`, `getActiveView()`, `getViewerDefinition()`

Changing `viewerDefinitionId`, `tenantId`, or `ownerId` reinitializes the selected
view and displayed data for the new scope. Omitted tenant/owner IDs use `'(0)'`.
List refreshes match the selected snapshot by context, aggregate name, tenant,
owner, and aggregate ID. A missing entry in the limited display list retains the
selection. Equivalent saved query fields preserve local filters, pagination, and
sorting, including when callers recreate view or definition objects on render.
An empty list keeps the create-view action, including after deleting the last
view or mounting with no views. Creation sends a draft without an ID. After a
create or update command succeeds, FetcherViewer waits for a new versioned
snapshot list response containing the affected ID at or beyond the command's
`aggregateVersion` before querying data or invoking the switch callback. Both
commands explicitly request `Command-Wait-Stage: PROCESSED`. The list reference
is captured when the command completes; a new array containing an older version
of the same ID cannot satisfy this wait. Queries use the snapshot's server-provided
`ViewState`, including its `internalCondition`. Confirmation also matches the
command response's `contextName`, `aggregateName`, `tenantId`, and `aggregateId`,
plus the applicable owner: the component's `ownerId` for PERSONAL views or
`'(shared)'` for SHARED views. Create, update, and delete requests explicitly
supply the component tenant and applicable owner path values; existing request
interceptors still run. A missing target receives a scoped lookup beyond the
display list limit. Retry repeats these reads without resubmitting the command.

An HTTP 200 command response is confirmed only when
`ErrorCodes.isSucceeded(result.errorCode)` is true. A rejected create or update
shows the command's `errorMsg` (or `errorCode` when no message is supplied),
without refreshing for confirmation or invoking the success callback. Transport
failures are also displayed. Failed updates and save-as operations keep the
existing Viewer and draft mounted so users can correct and retry. Empty-state
creation offers "重新加载视图" to resume browsing without repeating the command.
Only the latest submitted create/update response may change confirmation state
or invoke its success callback.

Version `0` is valid. If the command response omits a finite version,
FetcherViewer reports that it cannot confirm the save. The "重新加载视图" action
discards the success callback but keeps data requests suspended until a successful
read rebinds the matching authoritative snapshot. It then resumes browsing
without repeating the command or reporting a confirmed save.

Switching views, accepting a refreshed server view, or changing the page,
filters, or sort hides previous rows until the new query's data and enhancement
are ready. Query results must match the active request object as well as its
view and URL. A same-query reload reuses that request and can keep its current
rows visible while loading. Asynchronous enhancements retain their originating
view and data source.

`refreshData()` and shared refresh events call `useFetchData.reload()`. It only
executes when the current view and data URL match the saved query's owner; it
skips requests while no view is active, including pending save confirmation.
`getPageQuery()` also returns `undefined` during that interval.
Retained references to `reload()` use the current options. Matching reloads still
execute the current paged query and return `Promise<void>`.

**FetcherViewerProps key fields:**

- `viewerDefinitionId: string` - Required. ID of the view definition resource
- `ownerId?: string` - Default `'(0)'`
- `tenantId?: string` - Default `'(0)'`
- `defaultViewId?: string` - Initial view to display; it does not control later user selections. Later selections are persisted locally and supply the query's internal condition.
- `pagination: false | Omit<PaginationProps, ...>` - Required. Pagination config or `false` to disable
- `actionColumn?: ViewTableActionColumn<RecordType>` - Row action column config
- `onClickPrimaryKey?: (id, record) => void` - Primary key click handler
- `enableRowSelection?: boolean` - Enable checkbox row selection
- `enhanceDataSource?: (data) => RecordType[] | Promise<RecordType[]>` - Post-process fetched data
- `onSwitchView?: (view: ViewState) => void` - View switch callback
- `primaryAction?: TopBarActionItem` - Primary action button in TopBar
- `secondaryActions?: TopBarActionItem[]` - Dropdown actions beside primary
- `batchActions?: BatchActionsConfig` - Batch operations for selected rows
- `viewTableSetting?: false | ViewTableSetting` - Column settings panel config

If `enhanceDataSource` rejects, FetcherViewer displays the failure instead of
leaving an unhandled promise rejection. The Viewer stays mounted with its edited
filters, sorting, columns, and page intact. A successful later enhancement clears
the error; stale asynchronous failures do not replace newer results. Empty-view
creation remains available even if enhancement fails while no view is active.

`useViewerViews(definitionId, tenantId, ownerId, target?)` keeps returning
`views: ViewState[] | undefined`, `loading`, `error`, and `execute(target?)`. It queries
`/viewer/view/snapshot/list` and additionally exposes optional
`snapshots?: MaterializedSnapshot<ViewState>[]` containing the version metadata
that backs `views`. The same deleted, definition, tenant, and owner filters apply.
The optional `ViewSnapshotTarget` is `AggregateId & { ownerId: string }`. Each load
keeps the display list limit of 999, then queries a missing target by its full
identity with limit 1 before publishing the combined snapshots. The target lookup
shares the load's cancellation and error state; superseded loads cannot replace
newer results. `execute(target)` supplies the identity from a just-completed
command; no-argument retries use the latest optional hook target. Changing only
that hook target does not start a duplicate load. Snapshot versions remain intact
for the caller's minimum-version confirmation check.

---

## Viewer Component

Layout component with sidebar (ViewPanel), TopBar, and content area. Does not handle data loading or view persistence directly.

```tsx
<Viewer<User>
  ref={viewerRef}
  defaultViews={views}
  defaultView={activeView}
  definition={viewDefinition}
  dataSource={{ list: users, total: 100 }}
  loading={isLoading}
  pagination={{ pageSize: 20 }}
  actionColumn={actionColumn}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  enableRowSelection={true}
  primaryAction={primaryAction}
  secondaryActions={secondaryActions}
  batchActions={batchActions}
  onGetRecordCount={(url, condition) => fetchCount(url, condition)}
  onSwitchView={view => setActiveView(view)}
  onLoadData={(condition, page, pageSize, sorter) =>
    fetchData(condition, page, pageSize, sorter)
  }
  viewTableSetting={{ title: 'Settings' }}
  onCreateView={(view, onSuccess) => createView(view, onSuccess)}
  onUpdateView={(view, onSuccess) => updateView(view, onSuccess)}
  onDeleteView={(view, onSuccess) => deleteView(view, onSuccess)}
/>
```

**ViewerRef methods:** `clearSelectedRowKeys()`, `getActiveView()`, `getCondition()`

`getActiveView(): ViewState | undefined` returns `undefined` after the last view is deleted; the viewer displays an empty state. Switching views, including switches after create/update/delete, clears row selection and batch-action records. Reset restores the saved view and loads its query once.
When `onCreateView` is supplied, the empty state keeps a create-view action and
activates the new view after the callback succeeds.

---

## View Component

Combines filter panel + ViewTable + pagination. Supports controlled and uncontrolled state modes.

```tsx
<View<User>
  ref={viewRef}
  fields={viewDefinition.fields}
  availableFilters={viewDefinition.availableFilters}
  dataSource={{ list: users, total: 100 }}
  showFilter={true}
  filterMode="editable" // 'none' | 'normal' | 'editable'
  defaultColumns={columns}
  defaultPageSize={20}
  defaultTableSize="middle"
  pagination={{ pageSize: 20 }}
  enableRowSelection={true}
  actionColumn={actionColumn}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  onChange={(condition, page, pageSize, sorter) =>
    fetchData(condition, page, pageSize, sorter)
  }
  onSelectedDataChange={data => setSelectedItems(data)}
/>
```

**FilterMode values:** `'none'` (no panel), `'normal'` (read-only FilterPanel), `'editable'` (EditableFilterPanel with add/remove)

**ViewRef methods:** `clearSelectedRowKeys()`, `updateTableSize(size)`, `reset()`, `getCondition()`

`defaultPage` initializes the uncontrolled page (default `1`). `reset()` restores the `default*` values, notifies supplied external state setters in controlled mode, clears selection, and emits one `onChange` with the restored query. `pagination={false}` hides pagination even when row selection remains enabled.
Filter inputs and the table are recreated from the restored props, so both
normal and editable panels display the defaults and the table header restores
the default sort order. The next search or sort action starts from those
restored values; row selection is cleared with one notification.

The exported `useViewState` hook also exposes `setPagination(page: number, pageSize: number): void`. Use it when page and page size change together; it updates both values and emits one `onChange` using those values. Individual `setPage` and `setPageSize` calls each emit their own change.

`externalUpdateCondition(condition, activeFilterValues, filterStates, resetFilters?)`
accepts an optional fourth `ActiveFilter[]` parameter. During reset, the first
argument is the default condition, both Maps are empty, and `resetFilters` is the
complete default filter list. `useViewerState.setCondition` accepts this same
optional parameter and restores those definitions exactly, including omitted
operator/value settings. Normal searches continue to use the existing three
arguments. This supports controlling the condition while managing active filters
inside `useViewState`.

---

## ViewTable Component

Ant Design Table wrapper with automatic column generation from field definitions.

```tsx
<ViewTable<User>
  ref={tableRef}
  fields={viewDefinition.fields}
  columns={viewColumns}
  onColumnsChange={setColumns}
  dataSource={users}
  tableSize="middle"
  enableRowSelection={true}
  actionColumn={actionColumn}
  onSortChanged={sorter => handleSort(sorter)}
  onSelectChange={items => setSelectedItems(items)}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  viewTableSetting={{ title: 'Column Settings' }}
  loading={isLoading}
/>
```

Columns are auto-generated from `FieldDefinition[]` + `ViewColumn[]`. Each field maps to a cell type via `cellRegistry`. Primary key fields render as `PrimaryKeyCell` (clickable link). Action column uses `ActionsCell`.

Primary key names may be nested paths such as `state.id`; row keys resolve that same path to remain stable when records are reordered.

---

## View Management

### ViewPanel

Sidebar component listing personal and shared views with CRUD operations.

```tsx
<ViewPanel
  name="Users"
  views={views}
  activeView={activeView}
  countUrl="/api/users/count"
  onSwitchView={view => switchView(view)}
  onShowViewPanelChange={show => setShowPanel(show)}
  onGetRecordCount={(url, cond) => fetchCount(url, cond)}
  onCreateView={(view, onSuccess) => createView(view, onSuccess)}
  onUpdateView={(view, onSuccess) => updateView(view, onSuccess)}
  onDeleteView={(view, onSuccess) => deleteView(view, onSuccess)}
/>
```

Views are grouped by type: `PERSONAL` (private) and `SHARED` (public). Each group supports create, edit name, and delete via `ViewManageModal` and `SaveViewModal`.

### ViewState

```typescript
interface ViewState {
  id: string;
  name: string;
  definitionId: string;
  type: 'PERSONAL' | 'SHARED';
  source: 'SYSTEM' | 'CUSTOM';
  isDefault: boolean;
  filters: ActiveFilter[];
  columns: ViewColumn[];
  tableSize: 'small' | 'middle' | 'large';
  pageSize: number;
  condition: Condition;
  internalCondition?: Condition; // Merged with condition at query time
  sorter: FieldSort[];
}
```

### ViewCommandClient

Decorator-based client for view CRUD operations (create, edit, delete, recover). Uses Wow CQRS patterns.

```typescript
import { ViewCommandClient } from '@ahoo-wang/fetcher-viewer';
const client = new ViewCommandClient();
await client.createView(type, { body: command });
await client.editView(type, id, { body: command });
await client.defaultDeleteAggregate(id, { body: {} });
```

---

## TopBar Components

Toolbar with built-in bar items and custom action slots.

**Built-in bar items:** `FilterBarItem`, `RefreshDataBarItem`, `ColumnHeightBarItem`, `ShareLinkBarItem`, `DataMonitorBarItem`, `AutoRefreshBarItem`, `FullscreenBarItem`

**TopBar action slots:**

- `primaryAction: TopBarActionItem` - Main action button (e.g., "Create")
- `secondaryActions: TopBarActionItem[]` - Dropdown beside primary action
- `batchActions: BatchActionsConfig` - Dropdown for selected row operations

```typescript
interface TopBarActionItem<RecordType> {
  title: string;
  onClick: (records: RecordType[]) => void;
  render?: (records: RecordType[]) => ReactNode; // Custom render overrides title
  attributes?: Omit<ButtonProps, 'onClick'>;
}

interface BatchActionsConfig<RecordType> {
  enabled: boolean;
  title: string;
  actions: TopBarActionItem<RecordType>[];
}
```

---

## Filter System

### FilterPanel

Read-only display of active filters with search/reset buttons. Each filter renders via `RemovableTypedFilter` → `TypedFilter` (resolved from `filterRegistry`).

```tsx
<FilterPanel
  ref={filterPanelRef}
  filters={activeFilters} // ActiveFilter[]
  onSearch={(condition, activeFilterValues) => handleSearch(condition)}
  resetButton={true}
  searchButton={{ children: 'Search' }}
  row={{ gutter: [8, 8], wrap: true }}
  col={{ xxl: 6, xl: 8, lg: 12, md: 12, sm: 24, xs: 24 }}
/>
```

**FilterPanelRef:** `search()`, `reset()`, `getCondition(): Condition | undefined`

### EditableFilterPanel

Interactive filter panel with add/remove capabilities. Wraps `FilterPanel` + `AvailableFilterSelectModal`.

```tsx
<EditableFilterPanel
  ref={filterPanelRef}
  filters={activeFilters}
  availableFilters={availableFilterGroups}
  onChange={newFilters => setActiveFilters(newFilters)}
  onSearch={(condition, activeFilterValues) => handleSearch(condition)}
  resetButton={false}
/>
```

### ActiveFilter

```typescript
interface ActiveFilter {
  key: Key;
  type: FilterType; // Resolved via filterRegistry
  field: FilterField; // { name, label, type?, format? }
  value?: FilterValueProps;
  operator?: FilterOperatorProps;
  conditionOptions?: ConditionOptions;
  attributes?: any;
  onRemove?: () => void; // Set by EditableFilterPanel for removal
}
```

### filterRegistry

Maps filter type strings to components. Register custom filters with `filterRegistry.register(type, Component)` (throws on duplicate type). Build custom filters on `AssemblyFilter` — it takes `supportedOperators`, `valueInputRender`, converters, and validators, which is exactly how the built-in filters are composed.

| Type Constant   | Value        | Component                              |
| --------------- | ------------ | -------------------------------------- |
| `ID_FILTER`     | `'id'`       | IdFilter                               |
| `TEXT_FILTER`   | `'text'`     | TextFilter                             |
| `NUMBER_FILTER` | `'number'`   | NumberFilter                           |
| `SELECT_FILTER` | `'select'`   | SelectFilter                           |
| `BOOL_FILTER`   | `'bool'`     | BoolFilter                             |
| literal         | `'datetime'` | DateTimeFilter (registered internally) |

Unknown types render `FallbackFilter` (warning alert).

### useFilterState Hook

Manages **single filter** state (operator + value). NOT for managing a list of filters.

```tsx
import { Operator } from '@ahoo-wang/fetcher-wow';

const { operator, value, setOperator, setValue, reset } = useFilterState({
  field: 'username',
  operator: Operator.CONTAINS, // SelectOperator values are uppercase enum strings
  value: '',
  onChange: filterValue => console.log(filterValue?.condition),
});
```

### Filter Component Examples

Each built-in filter supports a fixed `supportedOperators` set (values from the `Operator` enum in `@ahoo-wang/fetcher-wow`, plus viewer-local `ExtendedOperator` additions like `UNDEFINED`; the combined option type is `SelectOperator`):

```tsx
<>
  {/* TextFilter: EQ, NE, CONTAINS, STARTS_WITH, ENDS_WITH, IN, NOT_IN */}
  <TextFilter field={{ name: 'username', label: 'Username' }} />

  {/* NumberFilter: EQ, NE, GT, LT, GTE, LTE, BETWEEN, IN, NOT_IN */}
  <NumberFilter field={{ name: 'age', label: 'Age' }} />

  {/* SelectFilter: IN and NOT_IN */}
  <SelectFilter field={{ name: 'status', label: 'Status' }} />

  {/* IdFilter: ID and IDS; no remote search */}
  <IdFilter field={{ name: 'userId', label: 'User' }} />

  {/* BoolFilter: UNDEFINED, TRUE, FALSE */}
  <BoolFilter field={{ name: 'isActive', label: 'Active' }} />

  {/* Date/time: GT, LT, GTE, LTE, BETWEEN, TODAY, BEFORE_TODAY,
      TOMORROW, THIS_WEEK, NEXT_WEEK, LAST_WEEK, THIS_MONTH, LAST_MONTH,
      RECENT_DAYS, EARLIER_DAYS (no EQ/NE) */}
  <TypedFilter
    type="datetime"
    field={{ name: 'createdAt', label: 'Created At' }}
  />
</>
```

---

## Cell Components

All cells accept `CellProps { data: { value, record, index }, attributes? }`. Auto-resolved by `ViewTable` via `cellRegistry` based on `FieldDefinition.type`.

| Cell Component     | Type Constant           | Value             | Description                       |
| ------------------ | ----------------------- | ----------------- | --------------------------------- |
| `TextCell`         | `TEXT_CELL_TYPE`        | `'text'`          | Plain text with optional ellipsis |
| `TagCell`          | `TAG_CELL_TYPE`         | `'tag'`           | Single tag with color             |
| `TagsCell`         | `TAGS_CELL_TYPE`        | `'tags'`          | Multiple tags                     |
| `CurrencyCell`     | `CURRENCY_CELL_TYPE`    | `'currency'`      | Formatted currency                |
| `DateTimeCell`     | `DATETIME_CELL_TYPE`    | `'datetime'`      | Formatted datetime                |
| `CalendarTimeCell` | `CALENDAR_CELL_TYPE`    | `'calendar-time'` | Relative time (today/yesterday)   |
| `ImageCell`        | `IMAGE_CELL_TYPE`       | `'image'`         | Image with preview                |
| `ImageGroupCell`   | `IMAGE_GROUP_CELL_TYPE` | `'image-group'`   | Image group with badge            |
| `AvatarCell`       | `AVATAR_CELL_TYPE`      | `'avatar'`        | Avatar with initials fallback     |
| `LinkCell`         | `LINK_CELL_TYPE`        | `'link'`          | Clickable link                    |
| `PrimaryKeyCell`   | `PRIMARY_KEY_CELL_TYPE` | `'primary-key'`   | Clickable ID link with copy       |
| `ActionCell`       | `ACTION_CELL_TYPE`      | `'action'`        | Single action button              |
| `ActionsCell`      | `ACTIONS_CELL_TYPE`     | `'actions'`       | Primary + dropdown actions        |

### PrimaryKeyCell

Auto-used for fields with `primaryKey: true` in `FieldDefinition`. Renders as a clickable Ant Design Link with copyable support.

```tsx
<PrimaryKeyCell
  data={{ value: 'user-123', record: user, index: 0 }}
  attributes={{
    onClick: record => navigate(`/users/${record.id}`),
    copyable: true,
  }}
/>
```

### CalendarTimeCell

Relative datetime display using dayjs calendar plugin (e.g., "Today 10:30", "Yesterday 15:45").

```tsx
<CalendarTimeCell
  data={{ value: '2024-01-15T10:30:00Z', record: event, index: 0 }}
  attributes={{
    formats: {
      sameDay: '[Today] HH:mm',
      lastDay: '[Yesterday] HH:mm',
      sameElse: 'YYYY-MM-DD HH:mm:ss',
    },
  }}
/>
```

### typedCellRender

Factory function creating cell renderers from `cellRegistry`.

```tsx
const renderer = typedCellRender('currency', { format: { currency: 'USD' } });
if (renderer) {
  const cell = renderer(1234.56, { id: 1 }, 0);
}
```

Register custom cells: `cellRegistry.register('custom-type', CustomCellComponent)`

---

## Data Entry Components

### RemoteSelect

Debounced search select fetching options from remote API.

```tsx
<RemoteSelect
  search={async query => {
    const res = await fetch(`/api/search?q=${query}`);
    return res.json();
  }}
  debounce={{ delay: 300 }}
  placeholder="Search..."
  onChange={value => console.log(value)}
/>
```

### TagInput

Tag input with serialization support.

```tsx
<>
  <TagInput value={['tag1', 'tag2']} onChange={tags => setTags(tags)} />
  <TagInput<number>
    value={[1, 2]}
    serializer={NumberTagValueItemSerializer}
    onChange={setTags}
  />
</>
```

### NumberRange

Number range input with min/max validation.

```tsx
<NumberRange
  value={[100, 500]}
  min={0}
  max={1000}
  precision={2}
  onChange={setRange}
/>
```

---

## Locale Support

Each `useLocale` call owns independent component-local state (default `zh_CN`). Calling `setLocale` affects only the component reading that hook instance; it does not cascade to children or built-in panels, and the package currently has no global locale provider. Overrides are shallow-merged with the default, so a nested object such as `filterPanel` replaces that entire default section.

```tsx
import { useLocale } from '@ahoo-wang/fetcher-viewer';

function SearchButtonLabel() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() =>
        setLocale({ filterPanel: { searchButtonTitle: 'Search' } })
      }
    >
      {locale.filterPanel?.searchButtonTitle}
    </button>
  );
}
```

---

## Integration with fetcher-react

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';
import { FetcherViewer } from '@ahoo-wang/fetcher-viewer';

function UserPage() {
  return (
    <FetcherViewer<User>
      viewerDefinitionId="user-viewer"
      pagination={{ pageSize: 20 }}
      onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
      primaryAction={{ title: 'Create User', onClick: () => showModal() }}
    />
  );
}
```

---

## Key Dependencies

- `@ahoo-wang/fetcher` - Core HTTP client
- `@ahoo-wang/fetcher-react` - React hooks for data fetching (includes `useFetcher`, `useKeyStorage`)
- `@ahoo-wang/fetcher-wow` - Wow CQRS types (`Condition`, `PagedList`, `PagedQuery`, `FieldSort`)
- `@ahoo-wang/fetcher-storage` - Key/value storage for persistence
- `@ahoo-wang/fetcher-decorator` - Decorator-based API clients (used by `ViewCommandClient`)
- `@ahoo-wang/fetcher-viewer` - This package
- `antd` + `@ant-design/icons` - Ant Design (peer dependency)
