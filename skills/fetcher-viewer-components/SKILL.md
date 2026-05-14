---
name: fetcher-viewer-components
description: >
  Fetcher Viewer UI components for data tables, filtering, and view management with Ant Design. Covers FetcherViewer (main orchestrator), ViewTable, Viewer, FilterPanel, EditableFilterPanel, view management (ViewPanel, SaveViewModal, ViewManageModal), TopBar components (RefreshDataBarItem, AutoRefreshBarItem, FilterBarItem, FullscreenBarItem, ColumnHeightBarItem), cell renderers (DefaultCell, EnumCell, CalendarTimeCell, PrimaryKeyCell), filter registry, and column configuration.
  Use for: data table, filter, data display, viewer, FilterPanel, FilterViewer, view management, CQRS viewer, Wow viewer, primary action, batch action, row selection, column settings, Ant Design table.
---

# fetcher-viewer-components

Skill for working with the Fetcher Viewer UI components - a React + Ant Design component library for data visualization, filtering, and view management.

## Trigger Conditions

This skill activates when:

- User mentions **FetcherViewer**, **ViewTable**, **Viewer**, **View**, or **FilterPanel**
- User mentions **table**, **filter**, **data display**, or **view management** components
- User mentions **Ant Design**, **data viewer**, **cell renderers**, or **TopBar**
- User asks about **React components for data tables** with CQRS/Wow integration
- User wants **tag input**, **remote search select**, or **number range** inputs
- User references `@ahoo-wang/fetcher-viewer` or `fetcher-viewer`

---

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
  DateTimeFilter,
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

import { zh_CN } from '@ahoo-wang/fetcher-viewer/locale';
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
    actions: (record) => ({
      primaryAction: { data: { value: 'Edit', record, index: 0 }, attributes: { onClick: () => editUser(record) } },
      secondaryActions: [{ data: { value: 'Delete', record, index: 0 }, attributes: { onClick: () => deleteUser(record), danger: true } }],
    }),
  }}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  enableRowSelection={true}
  enhanceDataSource={async (data) => enrichedData}
  onSwitchView={(view) => console.log('Switched to:', view.name)}
  primaryAction={{ title: 'Create', onClick: () => createItem() }}
  secondaryActions={[{ title: 'Export', onClick: () => exportData() }]}
  batchActions={{ enabled: true, title: 'Batch', actions: [{ title: 'Delete', onClick: (rows) => batchDelete(rows) }] }}
  viewTableSetting={{ title: 'Column Settings' }}
/>
```

**FetcherViewerRef methods:** `refreshData()`, `clearSelectedRowKeys()`, `getPageQuery()`, `getActiveView()`, `getViewerDefinition()`

**FetcherViewerProps key fields:**

- `viewerDefinitionId: string` - Required. ID of the view definition resource
- `ownerId?: string` - Default `'(0)'`
- `tenantId?: string` - Default `'(0)'`
- `defaultViewId?: string` - Initial view to display
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
  onSwitchView={(view) => setActiveView(view)}
  onLoadData={(condition, page, pageSize, sorter) => fetchData(condition, page, pageSize, sorter)}
  viewTableSetting={{ title: 'Settings' }}
  onCreateView={(view, onSuccess) => createView(view, onSuccess)}
  onUpdateView={(view, onSuccess) => updateView(view, onSuccess)}
  onDeleteView={(view, onSuccess) => deleteView(view, onSuccess)}
/>
```

**ViewerRef methods:** `clearSelectedRowKeys()`, `getActiveView()`, `getCondition()`

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
  filterMode="editable"  // 'none' | 'normal' | 'editable'
  defaultColumns={columns}
  defaultPageSize={20}
  defaultTableSize="middle"
  enableRowSelection={true}
  actionColumn={actionColumn}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  onChange={(condition, page, pageSize, sorter) => fetchData(...)}
  onSelectedDataChange={(data) => setSelectedItems(data)}
/>
```

**FilterMode values:** `'none'` (no panel), `'normal'` (read-only FilterPanel), `'editable'` (EditableFilterPanel with add/remove)

**ViewRef methods:** `clearSelectedRowKeys()`, `updateTableSize(size)`, `reset()`, `getCondition()`

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
  onSortChanged={(sorter) => handleSort(sorter)}
  onSelectChange={(items) => setSelectedItems(items)}
  onClickPrimaryKey={(id, record) => navigate(`/users/${id}`)}
  viewTableSetting={{ title: 'Column Settings' }}
  loading={isLoading}
/>
```

Columns are auto-generated from `FieldDefinition[]` + `ViewColumn[]`. Each field maps to a cell type via `cellRegistry`. Primary key fields render as `PrimaryKeyCell` (clickable link). Action column uses `ActionsCell`.

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
  onSwitchView={(view) => switchView(view)}
  onShowViewPanelChange={(show) => setShowPanel(show)}
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
  render?: (records: RecordType[]) => ReactNode;  // Custom render overrides title
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
  filters={activeFilters}  // ActiveFilter[]
  onSearch={(condition, activeFilterValues) => handleSearch(condition)}
  resetButton={true}
  searchButton={{ children: 'Search' }}
  row={{ gutter: [8, 8], wrap: true }}
  col={{ xxl: 6, xl: 8, lg: 12, md: 12, sm: 24, xs: 24 }}
/>
```

**FilterPanelRef:** `search()`, `reset()`, `getCondition(): Condition`

### EditableFilterPanel

Interactive filter panel with add/remove capabilities. Wraps `FilterPanel` + `AvailableFilterSelectModal`.

```tsx
<EditableFilterPanel
  ref={filterPanelRef}
  filters={activeFilters}
  availableFilters={availableFilterGroups}
  onChange={(newFilters) => setActiveFilters(newFilters)}
  onSearch={(condition, activeFilterValues) => handleSearch(condition)}
  resetButton={false}
/>
```

### ActiveFilter

```typescript
interface ActiveFilter {
  key: Key;
  type: FilterType;           // Resolved via filterRegistry
  field: FilterField;         // { name, label, type?, format? }
  value?: FilterValueProps;
  operator?: FilterOperatorProps;
  conditionOptions?: ConditionOptions;
  attributes?: any;
  onRemove?: () => void;      // Set by EditableFilterPanel for removal
}
```

### filterRegistry

Maps filter type strings to components. Register custom filters with `filterRegistry.register(type, Component)`.

| Type Constant | Value         | Component      |
| ------------- | ------------- | -------------- |
| `ID_FILTER`   | `'id'`        | IdFilter       |
| `TEXT_FILTER`  | `'text'`      | TextFilter     |
| `NUMBER_FILTER` | `'number'`   | NumberFilter   |
| `SELECT_FILTER` | `'select'`  | SelectFilter   |
| `BOOL_FILTER` | `'bool'`      | BoolFilter     |
| `DATE_TIME_FILTER_NAME` | `'datetime'` | DateTimeFilter |

Unknown types render `FallbackFilter` (warning alert).

### useFilterState Hook

Manages **single filter** state (operator + value). NOT for managing a list of filters.

```tsx
const { operator, value, setOperator, setValue, reset } = useFilterState({
  field: 'username',
  operator: 'contains',
  value: '',
  onChange: (filterValue) => console.log(filterValue?.condition),
});
```

### Filter Component Examples

```tsx
// TextFilter - operators: eq, ne, contains, startsWith, endsWith, match
<TextFilter field={{ name: 'username', label: 'Username' }} />

// NumberFilter - operators: eq, ne, gt, gte, lt, lte, between
<NumberFilter field={{ name: 'age', label: 'Age' }} />

// SelectFilter - operators: eq, ne, in, notIn
<SelectFilter field={{ name: 'status', label: 'Status' }} />

// IdFilter - operators: eq, ne, in, notIn (with remote search)
<IdFilter field={{ name: 'userId', label: 'User' }} />

// BoolFilter - operators: isTrue, isFalse
<BoolFilter field={{ name: 'isActive', label: 'Active' }} />

// DateTimeFilter - operators: eq, ne, gt, gte, lt, lte, between
<DateTimeFilter field={{ name: 'createdAt', label: 'Created At' }} />
```

---

## Cell Components

All cells accept `CellProps { data: { value, record, index }, attributes? }`. Auto-resolved by `ViewTable` via `cellRegistry` based on `FieldDefinition.type`.

| Cell Component | Type Constant | Value | Description |
|---|---|---|---|
| `TextCell` | `TEXT_CELL_TYPE` | `'text'` | Plain text with optional ellipsis |
| `TagCell` | `TAG_CELL_TYPE` | `'tag'` | Single tag with color |
| `TagsCell` | `TAGS_CELL_TYPE` | `'tags'` | Multiple tags |
| `CurrencyCell` | `CURRENCY_CELL_TYPE` | `'currency'` | Formatted currency |
| `DateTimeCell` | `DATETIME_CELL_TYPE` | `'datetime'` | Formatted datetime |
| `CalendarTimeCell` | `CALENDAR_CELL_TYPE` | `'calendar-time'` | Relative time (today/yesterday) |
| `ImageCell` | `IMAGE_CELL_TYPE` | `'image'` | Image with preview |
| `ImageGroupCell` | `IMAGE_GROUP_CELL_TYPE` | `'image-group'` | Image group with badge |
| `AvatarCell` | `AVATAR_CELL_TYPE` | `'avatar'` | Avatar with initials fallback |
| `LinkCell` | `LINK_CELL_TYPE` | `'link'` | Clickable link |
| `PrimaryKeyCell` | `PRIMARY_KEY_CELL_TYPE` | `'primary-key'` | Clickable ID link with copy |
| `ActionCell` | `ACTION_CELL_TYPE` | `'action'` | Single action button |
| `ActionsCell` | `ACTIONS_CELL_TYPE` | `'actions'` | Primary + dropdown actions |

### PrimaryKeyCell

Auto-used for fields with `primaryKey: true` in `FieldDefinition`. Renders as a clickable Ant Design Link with copyable support.

```tsx
<PrimaryKeyCell
  data={{ value: 'user-123', record: user, index: 0 }}
  attributes={{ onClick: (record) => navigate(`/users/${record.id}`), copyable: true }}
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
  search={async (query) => { const res = await fetch(`/api/search?q=${query}`); return res.json(); }}
  debounce={{ delay: 300 }}
  placeholder="Search..."
  onChange={(value) => console.log(value)}
/>
```

### TagInput

Tag input with serialization support.

```tsx
<TagInput value={['tag1', 'tag2']} onChange={(tags) => setTags(tags)} />
<TagInput<number> value={[1, 2]} serializer={NumberTagValueItemSerializer} onChange={setTags} />
```

### NumberRange

Number range input with min/max validation.

```tsx
<NumberRange value={[100, 500]} min={0} max={1000} precision={2} onChange={setRange} />
```

---

## Locale Support

```tsx
import { zh_CN } from '@ahoo-wang/fetcher-viewer/locale';
// zh_CN provides Chinese labels for filter panel, view panel, etc.
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
