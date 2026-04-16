# @ahoo-wang/fetcher-viewer

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-viewer.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-viewer)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-viewer.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-viewer.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-viewer)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-viewer)](https://www.npmjs.com/package/@ahoo-wang/fetcher-viewer)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-Interactive%20Docs-FF4785)](https://fetcher.ahoo.me/?path=/docs/viewer-introduction--docs)

A comprehensive React component library for data visualization and filtering, built on top of Ant Design and the Fetcher ecosystem. Provides reusable UI components for building rich data-driven applications with advanced filtering capabilities.

## ✨ Features

- **🔍 Advanced Filtering System**: Complete filter panel with dynamic filter types, operators, and state management
- **📊 Data Components**: Remote search select, tag input, number range inputs
- **🎨 Ant Design Integration**: Seamless integration with Ant Design components
- **🔧 TypeScript First**: Full TypeScript support with comprehensive type definitions
- **⚡ Performance Optimized**: Debounced search, efficient rendering, and optimized state management
- **🧪 Well Tested**: Comprehensive test coverage with Vitest and React Testing Library

## 📦 Installation

```bash
# Using npm
npm install @ahoo-wang/fetcher-viewer

# Using yarn
yarn add @ahoo-wang/fetcher-viewer

# Using pnpm
pnpm add @ahoo-wang/fetcher-viewer
```

## 🚀 Quick Start

```tsx
import {
  RemoteSelect,
  TagInput,
  NumberRange,
  FilterPanel,
} from '@ahoo-wang/fetcher-viewer';
import { useFilterState } from '@ahoo-wang/fetcher-viewer';

// Basic usage
function App() {
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();

  return (
    <div>
      {/* Remote search select */}
      <RemoteSelect
        search={async query => {
          const response = await fetch(`/api/search?q=${query}`);
          return response.json();
        }}
        placeholder="Search for items..."
      />

      {/* Tag input */}
      <TagInput value={['tag1', 'tag2']} onChange={tags => console.log(tags)} />

      {/* Number range */}
      <NumberRange value={[100, 500]} onChange={range => console.log(range)} />

      {/* Advanced filter panel */}
      <FilterPanel
        filters={filters}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onUpdateFilter={updateFilter}
      />
    </div>
  );
}
```

## 📚 API Reference

### Components

#### RemoteSelect

A debounced search select component that fetches options from a remote API.

```tsx
import { RemoteSelect } from '@ahoo-wang/fetcher-viewer';

<RemoteSelect
  search={async (query: string) => {
    // Return array of options
    return [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
    ];
  }}
  debounce={{ delay: 300 }}
  placeholder="Search..."
  onChange={value => console.log(value)}
/>;
```

**Props:**

- `search: (query: string) => Promise<RemoteSelectOption[]>` - Search function
- `debounce?: UseDebouncedCallbackOptions` - Debounce configuration
- `...SelectProps` - All Ant Design Select props

#### TagInput

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
- `...SelectProps` - Additional Ant Design Select props

#### NumberRange

A number range input component with min/max validation.

```tsx
import { NumberRange } from '@ahoo-wang/fetcher-viewer';

<NumberRange
  value={[100, 500]}
  min={0}
  max={1000}
  precision={2}
  placeholder={['Min', 'Max']}
  onChange={range => console.log(range)}
/>;
```

**Props:**

- `value?: number | NumberRangeValue` - Current range value
- `min?: number` - Minimum allowed value
- `max?: number` - Maximum allowed value
- `precision?: number` - Decimal precision
- `placeholder?: string[]` - Input placeholders
- `onChange?: (value: NumberRangeValue) => void` - Change handler

### Filter System

#### FilterPanel

A comprehensive filter panel with dynamic filter management. The panel uses `TypedFilter` components registered in the `filterRegistry` to render filters based on their type string.

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

**How Filter Resolution Works:**

The `filterRegistry` maps filter type strings to their corresponding `TypedFilter` components:

- `'id'` - IdFilter
- `'text'` - TextFilter
- `'number'` - NumberFilter
- `'select'` - SelectFilter
- `'bool'` - BoolFilter
- `'dateTime'` - DateTimeFilter

When a filter with an unknown type is encountered, `FallbackFilter` is rendered instead, displaying a warning message.

#### FallbackFilter

Rendered when a filter type is not registered in the `filterRegistry`. It displays a warning alert indicating the unsupported filter type.

```tsx
import { FallbackFilter } from '@ahoo-wang/fetcher-viewer';

// FallbackFilter automatically displays for unknown filter types
// e.g., when a filter with type: 'customType' is used but no handler is registered
```

#### useFilterState Hook

State management hook for filter operations.

```tsx
import { useFilterState } from '@ahoo-wang/fetcher-viewer';

const {
  filters, // Current filters array
  addFilter, // Add new filter
  removeFilter, // Remove filter
  updateFilter, // Update filter
  clearFilters, // Clear all filters
  getFilterValue, // Get filter value
  setFilterValue, // Set filter value
  resetFilters, // Reset to initial state
} = useFilterState(initialFilters);
```

#### Filter Types

The library provides several built-in filter types:

- **TextFilter**: Text input with various operators (=, !=, contains, etc.)
- **NumberFilter**: Number input with comparison operators
- **SelectFilter**: Dropdown selection filter
- **IdFilter**: ID-based filter
- **BoolFilter**: Boolean filter with true/false operators
- **DateTimeFilter**: Date/time filter with date-specific operators

#### Custom Filters

Create custom filter components by implementing the `FilterProps` interface:

```tsx
import { FilterProps, FilterValue } from '@ahoo-wang/fetcher-viewer';

function CustomFilter({ field, onChange, value }: FilterProps) {
  return (
    <div>
      <label>{field.label}</label>
      <input
        value={value?.value || ''}
        onChange={e =>
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
```

### Cell Components

The library provides various cell components for rendering different data types in tables. All cell components accept a `CellProps` structure with `data` (containing `value`, `record`, and `index`) and optional `attributes`.

#### TextCell

Renders plain text with optional ellipsis truncation.

```tsx
import { TextCell, TEXT_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<TextCell
  data={{ value: 'Hello', record: { id: 1 }, index: 0 }}
  attributes={{ ellipsis: true }}
/>
```

#### TagCell

Renders a single tag with customizable color.

```tsx
import { TagCell, TAG_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<TagCell
  data={{ value: 'urgent', record: { id: 1 }, index: 0 }}
  attributes={{ color: 'red' }}
/>
```

#### TagsCell

Renders multiple tags with customizable color.

```tsx
import { TagsCell, TAGS_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<TagsCell
  data={{ value: ['urgent', 'high'], record: { id: 1 }, index: 0 }}
  attributes={{ color: 'blue' }}
/>
```

#### ActionCell

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

#### ActionsCell

Renders multiple actions with a primary action and a dropdown menu for secondary actions.

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
        }
      ]
    },
    record: item,
    index: 0
  }}
  attributes={{
    onClick: (actionKey, record) => console.log(actionKey, record)
  }}
/>
```

#### AvatarCell

Renders an avatar image or initials fallback.

```tsx
import { AvatarCell, AVATAR_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

// With image URL
<AvatarCell
  data={{
    value: 'https://example.com/avatar.jpg',
    record: { id: 1, name: 'John' },
    index: 0
  }}
  attributes={{ size: 40 }}
/>

// With initials fallback
<AvatarCell
  data={{
    value: 'John Doe',
    record: { id: 1, name: 'John Doe' },
    index: 0
  }}
  attributes={{ size: 40, style: { backgroundColor: '#1890ff' } }}
/>
```

#### CurrencyCell

Renders formatted currency values.

```tsx
import { CurrencyCell, CURRENCY_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<CurrencyCell
  data={{
    value: 1234.56,
    record: { id: 1, amount: 1234.56 },
    index: 0
  }}
  attributes={{
    format: { currency: 'USD', locale: 'en-US', decimals: 2 },
    style: { fontWeight: 'bold' }
  }}
/>
```

#### DateTimeCell

Renders formatted datetime values with customizable format.

```tsx
import { DateTimeCell, DATETIME_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<DateTimeCell
  data={{
    value: '2024-01-15T10:30:00Z',
    record: { id: 1, createdAt: '2024-01-15T10:30:00Z' },
    index: 0
  }}
  attributes={{
    format: 'YYYY-MM-DD HH:mm:ss'
  }}
/>
```

#### ImageCell

Renders an image with preview support.

```tsx
import { ImageCell, IMAGE_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<ImageCell
  data={{
    value: 'https://example.com/image.jpg',
    record: { id: 1, image: 'https://example.com/image.jpg' },
    index: 0
  }}
  attributes={{ width: 80, height: 80, preview: true }}
/>
```

#### ImageGroupCell

Renders a group of images with badge count and preview support.

```tsx
import { ImageGroupCell, IMAGE_GROUP_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<ImageGroupCell
  data={{
    value: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    record: { id: 1, images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'] },
    index: 0
  }}
  attributes={{ width: 80, height: 80, preview: true }}
/>
```

#### LinkCell

Renders a clickable link with email auto-detection.

```tsx
import { LinkCell, LINK_CELL_TYPE } from '@ahoo-wang/fetcher-viewer';

<LinkCell
  data={{
    value: 'Visit Website',
    record: { id: 1, url: 'https://example.com' },
    index: 0
  }}
  attributes={{ href: 'https://example.com', target: '_blank' }}
/>
```

## 🎨 Theming & Styling

The components inherit Ant Design's theming system. You can customize the appearance using Ant Design's theme configuration:

```tsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={
    {
      /* your theme config */
    }
  }
>
  <RemoteSelect search={searchFunction} />
</ConfigProvider>;
```

## 🌐 Internationalization

The filter system supports multiple languages. Currently supported locales:

- **English** (default)
- **Chinese** (`zh_CN`)

```tsx
import { FilterPanel } from '@ahoo-wang/fetcher-viewer';
import { zh_CN } from '@ahoo-wang/fetcher-viewer/locale';

<FilterPanel
  locale={zh_CN}
  // ... other props
/>;
```

## 🧪 Testing

The library includes comprehensive tests. Run tests with:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## 📖 Examples

### Basic Data Table with Filters

```tsx
import React, { useState, useEffect } from 'react';
import {
  FilterPanel,
  useFilterState,
  RemoteSelect,
} from '@ahoo-wang/fetcher-viewer';
import { Table } from 'antd';

function DataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = buildQueryFromFilters(filters);
      const response = await fetch(`/api/data?${query}`);
      const result = await response.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <FilterPanel
        filters={filters}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onUpdateFilter={updateFilter}
      />

      <Table dataSource={data} loading={loading} columns={COLUMNS} />
    </div>
  );
}
```

### Advanced Search Component

```tsx
import { RemoteSelect, TagInput } from '@ahoo-wang/fetcher-viewer';

function AdvancedSearch() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  return (
    <div className="search-container">
      <RemoteSelect
        search={async query => {
          const response = await api.search(query);
          return response.map(item => ({
            label: item.name,
            value: item.id,
          }));
        }}
        mode="multiple"
        placeholder="Search items..."
        value={selectedItems}
        onChange={setSelectedItems}
      />

      <TagInput
        placeholder="Add tags..."
        value={selectedTags}
        onChange={setSelectedTags}
      />
    </div>
  );
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- [Ant Design](https://ant.design/) - UI component library
- [Fetcher](https://github.com/Ahoo-Wang/fetcher) - HTTP client ecosystem
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 📞 Support

- 📖 [Documentation](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/viewer)
- 🐛 [Issues](https://github.com/Ahoo-Wang/fetcher/issues)
