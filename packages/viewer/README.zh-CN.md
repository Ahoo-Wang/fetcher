# @ahoo-wang/fetcher-viewer

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-viewer.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-viewer)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-viewer.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-viewer.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-viewer)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-viewer)](https://www.npmjs.com/package/@ahoo-wang/fetcher-viewer)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-Interactive%20Docs-FF4785)](https://fetcher.ahoo.me/?path=/docs/viewer-introduction--docs)

一个全面的 React 组件库，用于数据可视化和过滤，基于 Ant Design 和 Fetcher 生态系统。提供可重用的 UI 组件，用于构建具有高级过滤功能的数据驱动应用程序。

## ✨ 特性

- **🔍 高级过滤系统**: 完整的过滤面板，支持动态过滤器类型、操作符和状态管理
- **📊 数据组件**: 远程搜索选择器、标签输入、数字范围输入
- **🎨 Ant Design 集成**: 与 Ant Design 组件无缝集成
- **🔧 TypeScript 优先**: 完整的 TypeScript 支持和全面的类型定义
- **⚡ 性能优化**: 防抖搜索、高效渲染和优化的状态管理
- **🧪 完善的测试**: 使用 Vitest 和 React Testing Library 的全面测试覆盖

## 📦 安装

```bash
# 使用 npm
npm install @ahoo-wang/fetcher-viewer

# 使用 yarn
yarn add @ahoo-wang/fetcher-viewer

# 使用 pnpm
pnpm add @ahoo-wang/fetcher-viewer
```

## 🚀 快速开始

```tsx
import {
  RemoteSelect,
  TagInput,
  NumberRange,
  FilterPanel,
} from '@ahoo-wang/fetcher-viewer';
import { useFilterState } from '@ahoo-wang/fetcher-viewer';

// 基本用法
function App() {
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();

  return (
    <div>
      {/* 远程搜索选择器 */}
      <RemoteSelect
        search={async query => {
          const response = await fetch(`/api/search?q=${query}`);
          return response.json();
        }}
        placeholder="搜索项目..."
      />

      {/* 标签输入 */}
      <TagInput value={['tag1', 'tag2']} onChange={tags => console.log(tags)} />

      {/* 数字范围 */}
      <NumberRange value={[100, 500]} onChange={range => console.log(range)} />

      {/* 高级过滤面板 */}
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

## 📚 API 参考

### 组件

#### RemoteSelect

一个防抖搜索选择组件，从远程 API 获取选项。

```tsx
import { RemoteSelect } from '@ahoo-wang/fetcher-viewer';

<RemoteSelect
  search={async (query: string) => {
    // 返回选项数组
    return [
      { label: '选项 1', value: '1' },
      { label: '选项 2', value: '2' },
    ];
  }}
  debounce={{ delay: 300 }}
  placeholder="搜索..."
  onChange={value => console.log(value)}
/>;
```

**属性：**

- `search: (query: string) => Promise<RemoteSelectOption[]>` - 搜索函数
- `debounce?: UseDebouncedCallbackOptions` - 防抖配置
- `...SelectProps` - 所有 Ant Design Select 属性

#### TagInput

支持不同值类型序列化的标签输入组件。

```tsx
import { TagInput, StringTagValueItemSerializer, NumberTagValueItemSerializer } from '@ahoo-wang/fetcher-viewer';

// 字符串标签
<TagInput
  value={['tag1', 'tag2']}
  onChange={(tags) => console.log(tags)}
/>

// 数字标签
<TagInput<number>
  value={[1, 2, 3]}
  serializer={NumberTagValueItemSerializer}
  onChange={(tags) => console.log(tags)}
/>
```

**属性：**

- `value?: ValueItemType[]` - 当前标签值
- `serializer?: TagValueItemSerializer` - 值序列化器
- `onChange?: (value: ValueItemType[]) => void` - 变更处理器
- `...SelectProps` - 其他 Ant Design Select 属性

#### NumberRange

带有最小/最大值验证的数字范围输入组件。

```tsx
import { NumberRange } from '@ahoo-wang/fetcher-viewer';

<NumberRange
  value={[100, 500]}
  min={0}
  max={1000}
  precision={2}
  placeholder={['最小值', '最大值']}
  onChange={range => console.log(range)}
/>;
```

**属性：**

- `value?: number | NumberRangeValue` - 当前范围值
- `min?: number` - 允许的最小值
- `max?: number` - 允许的最大值
- `precision?: number` - 小数精度
- `placeholder?: string[]` - 输入占位符
- `onChange?: (value: NumberRangeValue) => void` - 变更处理器

### 过滤系统

#### FilterPanel

具有动态过滤器管理的综合过滤面板。

```tsx
import { FilterPanel, useFilterState } from '@ahoo-wang/fetcher-viewer';

function MyFilterComponent() {
  const { filters, addFilter, removeFilter, updateFilter } = useFilterState();

  return (
    <FilterPanel
      filters={filters}
      availableFilters={[
        { name: 'name', label: '名称', type: 'text' },
        { name: 'age', label: '年龄', type: 'number' },
        { name: 'status', label: '状态', type: 'select' },
      ]}
      onAddFilter={addFilter}
      onRemoveFilter={removeFilter}
      onUpdateFilter={updateFilter}
    />
  );
}
```

#### useFilterState Hook

过滤器操作的状态管理 hook。

```tsx
import { useFilterState } from '@ahoo-wang/fetcher-viewer';

const {
  filters, // 当前过滤器数组
  addFilter, // 添加新过滤器
  removeFilter, // 移除过滤器
  updateFilter, // 更新过滤器
  clearFilters, // 清除所有过滤器
  getFilterValue, // 获取过滤器值
  setFilterValue, // 设置过滤器值
  resetFilters, // 重置到初始状态
} = useFilterState(initialFilters);
```

#### 过滤器类型

库提供了几种内置过滤器类型：

- **TextFilter**: 文本输入，支持各种操作符（=、!=、包含等）
- **NumberFilter**: 数字输入，支持比较操作符
- **SelectFilter**: 下拉选择过滤器
- **IdFilter**: 基于 ID 的过滤器
- **AssemblyFilter**: 组合多个条件的复合过滤器

#### 自定义过滤器

通过实现 `FilterProps` 接口创建自定义过滤器组件：

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

## 🎨 主题和样式

组件继承 Ant Design 的主题系统。您可以使用 Ant Design 的主题配置自定义外观：

```tsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={
    {
      /* 您的主题配置 */
    }
  }
>
  <RemoteSelect search={searchFunction} />
</ConfigProvider>;
```

## 🌐 国际化

过滤系统支持多种语言。目前支持的语言环境：

- **英语**（默认）
- **中文**（`zh_CN`）

```tsx
import { FilterPanel } from '@ahoo-wang/fetcher-viewer';
import { zh_CN } from '@ahoo-wang/fetcher-viewer/locale';

<FilterPanel
  locale={zh_CN}
  // ... 其他属性
/>;
```

## 🧪 测试

库包含全面的测试。使用以下命令运行测试：

```bash
# 运行所有测试
npm test

# 运行带覆盖率的测试
npm run test:coverage

# 在 UI 模式下运行测试
npm run test:ui
```

## 📖 示例

### 带过滤器的基本数据表格

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
        availableFilters={FILTER_CONFIG}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onUpdateFilter={updateFilter}
      />

      <Table dataSource={data} loading={loading} columns={COLUMNS} />
    </div>
  );
}
```

### 高级搜索组件

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
        placeholder="搜索项目..."
        value={selectedItems}
        onChange={setSelectedItems}
      />

      <TagInput
        placeholder="添加标签..."
        value={selectedTags}
        onChange={setSelectedTags}
      />
    </div>
  );
}
```

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](../../CONTRIBUTING.md)了解详情。

1. Fork 此仓库
2. 创建您的功能分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 Apache License 2.0 许可证 - 查看 [LICENSE](../../LICENSE) 文件了解详情。

## 🙏 致谢

- [Ant Design](https://ant.design/) - UI 组件库
- [Fetcher](https://github.com/Ahoo-Wang/fetcher) - HTTP 客户端生态系统
- [React](https://reactjs.org/) - UI 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全

## 📞 支持

- 📖 [文档](https://github.com/Ahoo-Wang/fetcher/tree/master/packages/viewer)
- 🐛 [问题](https://github.com/Ahoo-Wang/fetcher/issues)