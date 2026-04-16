---
name: fetcher-viewer-components
description: Use Fetcher Viewer UI components for data tables and filtering. Use when users mention table, filter, data display, FilterPanel, cell renderers, Ant Design, or viewer components.
---

# fetcher-viewer-components

Skill for working with the Fetcher Viewer UI components - a React component library for data visualization and filtering built on Ant Design.

## Trigger Conditions

This skill activates when:
- User mentions **table**, **filter**, or **data display** components
- User mentions **Ant Design**, **data viewer**, **FilterPanel**, or cell renderers
- User asks about **React components for data tables**
- User wants **tag input**, **remote search select**, or **number range** inputs
- User references `@ahoo-wang/fetcher-viewer` or `fetcher-viewer`

---

## Core Concepts

### Package

```typescript
import {
  FilterPanel,
  RemoteSelect,
  TagInput,
  NumberRange,
  useFilterState,
  filterRegistry,
  // Filter types
  TextFilter,
  NumberFilter,
  SelectFilter,
  IdFilter,
  BoolFilter,
  DateTimeFilter,
  FallbackFilter,
  // Cell types
  TextCell,
  TagCell,
  TagsCell,
  CurrencyCell,
  DateTimeCell,
  ImageCell,
  AvatarCell,
  LinkCell,
  ActionCell,
  ActionsCell,
  ImageGroupCell,
  // Cell type constants
  TEXT_CELL_TYPE,
  TAG_CELL_TYPE,
  TAGS_CELL_TYPE,
  CURRENCY_CELL_TYPE,
  DATETIME_CELL_TYPE,
  IMAGE_CELL_TYPE,
  AVATAR_CELL_TYPE,
  LINK_CELL_TYPE,
  ACTION_CELL_TYPE,
  ACTIONS_CELL_TYPE,
  IMAGE_GROUP_CELL_TYPE,
} from '@ahoo-wang/fetcher-viewer';

import { zh_CN, en_US } from '@ahoo-wang/fetcher-viewer/locale';
```

### Architecture

The viewer package provides:
- **Filter System**: Dynamic filter panel with registry-based type resolution
- **Data Components**: RemoteSelect, TagInput, NumberRange for data entry
- **Cell Components**: Type-safe table cell renderers for various data types

---

## Filter System

### FilterPanel

Dynamic filter panel that renders filters based on type strings registered in `filterRegistry`.

```tsx
import { FilterPanel, useFilterState, filterRegistry } from '@ahoo-wang/fetcher-viewer';

function MyFilterComponent() {
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();

  return (
    <FilterPanel
      filters={filters}
      onAddFilter={addFilter}
      onRemoveFilter={removeFilter}
      onUpdateFilter={updateFilter}
    />
  );
}
```

### filterRegistry

Maps filter type strings to their corresponding `TypedFilter` components.

**Built-in type mappings:**

| Type String | Component |
|-------------|-----------|
| `'id'` | IdFilter |
| `'text'` | TextFilter |
| `'number'` | NumberFilter |
| `'select'` | SelectFilter |
| `'bool'` | BoolFilter |
| `'dateTime'` | DateTimeFilter |

**Unknown types render `FallbackFilter`** which displays a warning alert.

### Filter Types

#### TextFilter

Text input with various operators (=, !=, contains, startsWith, endsWith).

```tsx
import { TextFilter } from '@ahoo-wang/fetcher-viewer';

<TextFilter
  field={{ name: 'username', label: 'Username' }}
  value={{ field: 'username', operator: 'contains', value: 'john' }}
  onChange={(filter) => console.log(filter)}
/>
```

**Operators:** `eq`, `ne`, `contains`, `startsWith`, `endsWith`, `match`

#### NumberFilter

Number input with comparison operators.

```tsx
import { NumberFilter } from '@ahoo-wang/fetcher-viewer';

<NumberFilter
  field={{ name: 'age', label: 'Age' }}
  value={{ field: 'age', operator: 'gt', value: 18 }}
  onChange={(filter) => console.log(filter)}
/>
```

**Operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`

#### SelectFilter

Dropdown selection filter.

```tsx
import { SelectFilter } from '@ahoo-wang/fetcher-viewer';

<SelectFilter
  field={{ name: 'status', label: 'Status' }}
  value={{ field: 'status', operator: 'eq', value: 'active' }}
  options={[
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]}
  onChange={(filter) => console.log(filter)}
/>
```

**Operators:** `eq`, `ne`, `in`, `notIn`

#### IdFilter

ID-based filter with remote search support.

```tsx
import { IdFilter } from '@ahoo-wang/fetcher-viewer';

<IdFilter
  field={{ name: 'userId', label: 'User' }}
  value={{ field: 'userId', operator: 'eq', value: 'user-123' }}
  onSearch={async (query) => {
    const response = await fetch(`/api/users/search?q=${query}`);
    return response.json();
  }}
  onChange={(filter) => console.log(filter)}
/>
```

**Operators:** `eq`, `ne`, `in`, `notIn`

#### BoolFilter

Boolean filter with true/false operators.

```tsx
import { BoolFilter } from '@ahoo-wang/fetcher-viewer';

<BoolFilter
  field={{ name: 'isActive', label: 'Active' }}
  value={{ field: 'isActive', operator: 'eq', value: true }}
  onChange={(filter) => console.log(filter)}
/>
```

**Operators:** `isTrue`, `isFalse`

#### DateTimeFilter

Date/time filter with date-specific operators.

```tsx
import { DateTimeFilter } from '@ahoo-wang/fetcher-viewer';

<DateTimeFilter
  field={{ name: 'createdAt', label: 'Created At' }}
  value={{ field: 'createdAt', operator: 'eq', value: '2024-01-15T10:30:00Z' }}
  onChange={(filter) => console.log(filter)}
/>
```

**Operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`

### useFilterState Hook

State management hook for filter operations.

```tsx
import { useFilterState } from '@ahoo-wang/fetcher-viewer';

const {
  filters,        // Filter[] - Current filters array
  addFilter,      // (filter: Filter) => void - Add new filter
  removeFilter,   // (index: number) => void - Remove filter
  updateFilter,   // (index: number, filter: Filter) => void - Update filter
  clearFilters,   // () => void - Clear all filters
  getFilterValue, // (field: string) => any - Get filter value by field
  setFilterValue,  // (field: string, value: any) => void - Set filter value
  resetFilters,   // () => void - Reset to initial state
} = useFilterState(initialFilters);
```

**Usage:**

```tsx
function DataTable() {
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState([]);

  const handleSearch = async () => {
    const query = buildQueryFromFilters(filters);
    const response = await fetch(`/api/data?${query}`);
    const data = await response.json();
    setData(data);
  };

  useEffect(() => {
    handleSearch();
  }, [filters]);

  return (
    <FilterPanel
      filters={filters}
      onAddFilter={addFilter}
      onRemoveFilter={removeFilter}
      onUpdateFilter={updateFilter}
    />
  );
}
```

### Custom Filters

Create custom filter components by implementing the `FilterProps` interface.

```tsx
import { FilterProps, FilterValue } from '@ahoo-wang/fetcher-viewer';

function CustomFilter({ field, onChange, value }: FilterProps) {
  return (
    <div>
      <label>{field.label}</label>
      <input
        value={value?.value || ''}
        onChange={(e) =>
          onChange?.({
            field: field.name,
            operator: 'eq',
            value: e.target.value,
          })
        }
      />
    </div>
  );
}

// Register in filterRegistry
filterRegistry.register('custom', CustomFilter);
```

---

## Cell Components

All cell components accept `CellProps` with `data` (containing `value`, `record`, `index`) and optional `attributes`.

### TextCell

Renders plain text with optional ellipsis truncation.

```tsx
import { TextCell, TEXT_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<TextCell
  data={{ value: 'Hello World', record: { id: 1 }, index: 0 }}
  attributes={{ ellipsis: true }}
/>
```

### TagCell

Renders a single tag with customizable color.

```tsx
import { TagCell, TAG_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<TagCell
  data={{ value: 'urgent', record: { id: 1 }, index: 0 }}
  attributes={{ color: 'red' }}
/>
```

### TagsCell

Renders multiple tags with customizable color.

```tsx
import { TagsCell, TAGS_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<TagsCell
  data={{ value: ['urgent', 'high', 'review'], record: { id: 1 }, index: 0 }}
  attributes={{ color: 'blue' }}
/>
```

### CurrencyCell

Renders formatted currency values.

```tsx
import { CurrencyCell, CURRENCY_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<CurrencyCell
  data={{ value: 1234.56, record: { id: 1 }, index: 0 }}
  attributes={{
    format: { currency: 'USD', locale: 'en-US', decimals: 2 },
    style: { fontWeight: 'bold' }
  }}
/>
```

### DateTimeCell

Renders formatted datetime values.

```tsx
import { DateTimeCell, DATETIME_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<DateTimeCell
  data={{ value: '2024-01-15T10:30:00Z', record: { id: 1 }, index: 0 }}
  attributes={{ format: 'YYYY-MM-DD HH:mm:ss' }}
/>
```

### ImageCell

Renders an image with preview support.

```tsx
import { ImageCell, IMAGE_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<ImageCell
  data={{ value: 'https://example.com/image.jpg', record: { id: 1 }, index: 0 }}
  attributes={{ width: 80, height: 80, preview: true }}
/>
```

### ImageGroupCell

Renders a group of images with badge count and preview support.

```tsx
import { ImageGroupCell, IMAGE_GROUP_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<ImageGroupCell
  data={{
    value: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
    record: { id: 1 },
    index: 0
  }}
  attributes={{ width: 80, height: 80, preview: true }}
/>
```

### AvatarCell

Renders an avatar image or initials fallback.

```tsx
import { AvatarCell, AVATAR_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

// With image URL
<AvatarCell
  data={{ value: 'https://example.com/avatar.jpg', record: { id: 1, name: 'John' }, index: 0 }}
  attributes={{ size: 40 }}
/>

// With initials fallback (value is name string)
<AvatarCell
  data={{ value: 'John Doe', record: { id: 1 }, index: 0 }}
  attributes={{ size: 40, style: { backgroundColor: '#1890ff' } }}
/>
```

### LinkCell

Renders a clickable link with email auto-detection.

```tsx
import { LinkCell, LINK_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<LinkCell
  data={{ value: 'Visit Website', record: { id: 1 }, index: 0 }}
  attributes={{ href: 'https://example.com', target: '_blank' }}
/>
```

### ActionCell

Renders a clickable action button. The `onClick` handler receives the full record.

```tsx
import { ActionCell, ACTION_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<ActionCell
  data={{
    value: 'Edit',
    record: { id: 1, name: 'Item' },
    index: 0
  }}
  attributes={{
    onClick: (record) => console.log('Edit:', record),
    danger: true
  }}
/>
```

### ActionsCell

Renders multiple actions with a primary action and dropdown menu for secondary actions.

```tsx
import { ActionsCell, ACTIONS_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<ActionsCell
  data={{
    value: {
      primaryAction: {
        data: { value: 'Edit', record: item, index: 0 },
        attributes: { onClick: () => editItem(item.id) }
      },
      moreActionTitle: 'More',
      secondaryActions: [
        {
          data: { value: 'Delete', record: item, index: 0 },
          attributes: { onClick: () => deleteItem(item.id), danger: true }
        },
        {
          data: { value: 'Duplicate', record: item, index: 0 },
          attributes: { onClick: () => duplicateItem(item.id) }
        }
      ]
    },
    record: item,
    index: 0
  }}
/>
```

---

## Data Entry Components

### RemoteSelect

A debounced search select component that fetches options from a remote API.

```tsx
import { RemoteSelect } from '@ahoo-wang/fetcher-viewer';

<RemoteSelect
  search={async (query: string) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  }}
  debounce={{ delay: 300 }}
  placeholder="Search for items..."
  onChange={(value) => console.log(value)}
/>
```

**Props:**
- `search: (query: string) => Promise<RemoteSelectOption[]>` - Search function
- `debounce?: UseDebouncedCallbackOptions` - Debounce configuration
- Supports all Ant Design Select props

### TagInput

A tag input component with serialization support for different value types.

```tsx
import { TagInput, StringTagValueItemSerializer, NumberTagValueItemSerializer } from '@ahoo-wang/fetcher-viewer';

// String tags
<TagInput
  value={['tag1', 'tag2']}
  onChange={(tags) => console.log(tags)}
/>

// Number tags
<TagInput<number>
  value={[1, 2, 3]}
  serializer={NumberTagValueItemSerializer}
  onChange={(tags) => console.log(tags)}
/>
```

**Props:**
- `value?: ValueItemType[]` - Current tag values
- `serializer?: TagValueItemSerializer` - Value serializer
- `onChange?: (value: ValueItemType[]) => void` - Change handler

### NumberRange

A number range input component with min/max validation.

```tsx
import { NumberRange } from '@ahoo-wang/fetcher-viewer';

<NumberRange
  value={[100, 500]}
  min={0}
  max={1000}
  precision={2}
  placeholder={['Min', 'Max']}
  onChange={(range) => console.log(range)}
/>
```

**Props:**
- `value?: number | NumberRangeValue` - Current range value
- `min?: number` - Minimum allowed value
- `max?: number` - Maximum allowed value
- `precision?: number` - Decimal precision
- `placeholder?: string[]` - Input placeholders
- `onChange?: (value: NumberRangeValue) => void` - Change handler

---

## Locale Support

The filter system supports multiple languages.

### Available Locales

- **English** (default) - `en_US`
- **Chinese** - `zh_CN`

### Usage

```tsx
import { FilterPanel } from '@ahoo-wang/fetcher-viewer';
import { zh_CN } from '@ahoo-wang/fetcher-viewer/locale';

<FilterPanel
  locale={zh_CN}
  filters={filters}
  onAddFilter={addFilter}
  onRemoveFilter={removeFilter}
  onUpdateFilter={updateFilter}
/>
```

---

## Integration with fetcher-react-hooks

Combine with `@ahoo-wang/fetcher-react-hooks` for reactive data fetching.

```tsx
import { FilterPanel, useFilterState } from '@ahoo-wang/fetcher-viewer';
import { useFetcher } from '@ahoo-wang/fetcher-react-hooks';

function DataTable() {
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();
  const { data, loading, error, execute } = useFetcher();

  useEffect(() => {
    const query = buildQueryFromFilters(filters);
    execute({ path: `/api/data?${query}` });
  }, [filters]);

  return (
    <>
      <FilterPanel
        filters={filters}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onUpdateFilter={updateFilter}
      />
      {/* Render data with cell components */}
    </>
  );
}
```

---

## Example: Complete Data Table with Filters

```tsx
import React, { useState, useEffect } from 'react';
import {
  FilterPanel,
  useFilterState,
  RemoteSelect,
  TextCell,
  TagCell,
  CurrencyCell,
  DateTimeCell,
  ActionCell,
  ACTIONS_CELL_TYPE,
} from '@ahoo-wang/fetcher-viewer';
import { useFetcher } from '@ahoo-wang/fetcher-react-hooks';
import { Table, Space, Button } from 'antd';
import { zh_CN } from '@ahoo-wang/fetcher-viewer/locale';

const COLUMNS = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    render: (value, record, index) => (
      <TextCell data={{ value, record, index }} attributes={{ ellipsis: true }} />
    ),
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    render: (value, record, index) => (
      <TagCell data={{ value, record, index }} attributes={{ color: 'blue' }} />
    ),
  },
  {
    key: 'amount',
    title: 'Amount',
    dataIndex: 'amount',
    render: (value, record, index) => (
      <CurrencyCell
        data={{ value, record, index }}
        attributes={{ format: { currency: 'USD', locale: 'en-US' } }}
      />
    ),
  },
  {
    key: 'createdAt',
    title: 'Created',
    dataIndex: 'createdAt',
    render: (value, record, index) => (
      <DateTimeCell data={{ value, record, index }} attributes={{ format: 'YYYY-MM-DD' }} />
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    render: (_, record, index) => (
      <ActionCell
        data={{ value: 'Edit', record, index }}
        attributes={{ onClick: () => handleEdit(record) }}
      />
    ),
  },
];

function DataTable() {
  const [data, setData] = useState([]);
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();
  const { execute, loading } = useFetcher();

  useEffect(() => {
    const query = buildQueryFromFilters(filters);
    execute({ path: `/api/data?${query}` }).then((res) => setData(res.data));
  }, [filters]);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <FilterPanel
        locale={zh_CN}
        filters={filters}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onUpdateFilter={updateFilter}
      />
      <Table dataSource={data} loading={loading} columns={COLUMNS} />
    </Space>
  );
}
```

---

## Key Dependencies

- `@ahoo-wang/fetcher` - Core HTTP client
- `@ahoo-wang/fetcher-react-hooks` - React hooks for data fetching
- `@ahoo-wang/fetcher-viewer` - Viewer components package
- `antd` - Ant Design component library (peer dependency)