# @ahoo-wang/fetcher-react

🚀 **强大的 React 数据获取库** - 无缝集成 HTTP 请求与 React hooks，具备自动状态管理、竞态条件保护和 TypeScript 支持。非常适合需要强大数据获取能力的现代 React 应用程序。

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-react.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-react)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)
[![Storybook](https://img.shields.io/badge/Storybook-交互式文档-FF4785)](https://fetcher.ahoo.me/?path=/docs/react-introduction--docs)

## 功能特性

- 🚀 **数据获取**: 完整的 HTTP 客户端与 React hooks 集成
- 🔄 **Promise 状态管理**: 高级异步操作处理，具有竞态条件保护
- 🛡️ **类型安全**: 完整的 TypeScript 支持和全面的类型定义
- ⚡ **性能优化**: 使用 useMemo、useCallback 和智能依赖管理进行优化
- 🎯 **选项灵活性**: 支持静态选项和动态选项供应商
- 🔧 **开发者体验**: 内置加载状态、错误处理和自动重新渲染
- 📊 **高级查询 Hooks**: 专门用于列表、分页、单个、计数和流查询的 hooks，具有状态管理功能

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [使用方法](#使用方法)
  - [useFetcher Hook](#usefetcher-hook)
  - [防抖 Hooks](#防抖-hooks)
    - [useDebouncedCallback](#usedebouncedcallback)
    - [useDebouncedExecutePromise](#usedebouncedexecutepromise)
    - [useDebouncedFetcher](#usedebouncedfetcher)
  - [useExecutePromise Hook](#useexecutepromise-hook)
  - [usePromiseState Hook](#usepromisestate-hook)
  - [useRequestId Hook](#userequestid-hook)
  - [useLatest Hook](#uselatest-hook)
- [useRefs Hook](#userefs-hook)
- [useEventSubscription Hook](#useeventsubscription-hook)
- [useKeyStorage Hook](#usekeystorage-hook)
  - [useImmerKeyStorage Hook](#useimmerkeystorage-hook)
  - [Wow 查询 Hooks](#wow-查询-hooks)
  - [useListQuery Hook](#uselistquery-hook)
  - [usePagedQuery Hook](#usepagedquery-hook)
  - [useSingleQuery Hook](#usesinglequery-hook)
  - [useCountQuery Hook](#usecountquery-hook)
  - [useFetcherCountQuery Hook](#usefetchercountquery-hook)
  - [useFetcherPagedQuery Hook](#usefetcherpagedquery-hook)
  - [useListStreamQuery Hook](#useliststreamquery-hook)
- [最佳实践](#最佳实践)
- [API 参考](#api-参考)
- [许可证](#许可证)

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

### 要求

- React 16.8+ (hooks 支持)
- TypeScript 4.0+ (完整类型安全)

## 快速开始

只需几行代码即可开始使用 `@ahoo-wang/fetcher-react`：

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function App() {
  const { loading, result, error, execute } = useFetcher();

  return (
    <div>
      <button onClick={() => execute({ url: '/api/data', method: 'GET' })}>
        获取数据
      </button>
      {loading && <p>加载中...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {error && <p>错误: {error.message}</p>}
    </div>
  );
}
```

## 使用方法

### useFetcher Hook

`useFetcher` hook 提供完整的数据获取功能，具有自动状态管理、竞态条件保护和灵活的配置选项。

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute } = useFetcher<string>();

  const handleFetch = () => {
    execute({ url: '/api/users', method: 'GET' });
};
```

### useImmerKeyStorage Hook

🚀 **Immer 驱动的不可变状态管理** - `useImmerKeyStorage` hook 通过集成 Immer 的 `produce` 函数扩展了 `useKeyStorage`，允许开发者以直观的"可变"方式更新存储值，同时在底层保持不可变性。非常适合复杂对象的操作，具有自动存储同步功能。

#### 主要优势

- **直观的变更语法**: 编写看起来可变的代码，但产生不可变更新
- **深度对象支持**: 轻松处理嵌套对象和数组
- **类型安全**: 完整的 TypeScript 支持和编译时错误检查
- **性能优化**: 利用 Immer 的结构共享和最小化重渲染
- **自动同步**: 变更自动持久化到存储并跨组件同步

#### 使用场景

在需要以下情况时选择 `useImmerKeyStorage` 而不是 `useKeyStorage`：

- 更新嵌套对象属性
- 执行复杂的数组操作（push、splice 等）
- 原子性地进行多个相关变更
- 处理深度嵌套的数据结构

```typescript jsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useImmerKeyStorage } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const prefsStorage = new KeyStorage<{
    theme: string;
    volume: number;
    notifications: boolean;
    shortcuts: { [key: string]: string };
  }>({
    key: 'user-prefs'
  });

  // 不使用默认值 - 可能为 null
  const [prefs, updatePrefs, clearPrefs] = useImmerKeyStorage(prefsStorage);

  return (
    <div>
      <p>主题: {prefs?.theme || '默认'}</p>
      <button onClick={() => updatePrefs(draft => { draft.theme = 'dark'; })}>
        切换到深色主题
      </button>
      <button onClick={() => updatePrefs(draft => { draft.volume += 10; })}>
        增加音量
      </button>
      <button onClick={clearPrefs}>
        清除偏好设置
      </button>
    </div>
  );
};
```

#### 使用默认值

```typescript jsx
const AudioControls = () => {
  const settingsStorage = new KeyStorage<{ volume: number; muted: boolean }>({
    key: 'audio-settings'
  });

  // 使用默认值 - 保证不为 null
  const [settings, updateSettings, resetSettings] = useImmerKeyStorage(
    settingsStorage,
    { volume: 50, muted: false }
  );

  return (
    <div>
      <p>音量: {settings.volume}%</p>
      <button onClick={() => updateSettings(draft => {
        draft.volume = Math.min(100, draft.volume + 10);
        draft.muted = false;
      })}>
        增加音量
      </button>
      <button onClick={() => updateSettings(draft => { draft.muted = !draft.muted; })}>
        切换静音
      </button>
      <button onClick={resetSettings}>
        重置为默认值
      </button>
    </div>
  );
};
```

#### 高级用法模式

##### 批量更新

```typescript jsx
const updateUserProfile = () => {
  updatePrefs(draft => {
    draft.theme = 'dark';
    draft.notifications = true;
    draft.volume = 75;
  });
};
```

##### 数组操作

```typescript jsx
const todoStorage = new KeyStorage<{
  todos: Array<{ id: number; text: string; done: boolean }>;
}>({
  key: 'todos',
});

const [state, updateState] = useImmerKeyStorage(todoStorage, { todos: [] });

// 添加新待办事项
const addTodo = (text: string) => {
  updateState(draft => {
    draft.todos.push({
      id: Date.now(),
      text,
      done: false,
    });
  });
};

// 切换待办事项状态
const toggleTodo = (id: number) => {
  updateState(draft => {
    const todo = draft.todos.find(t => t.id === id);
    if (todo) {
      todo.done = !todo.done;
    }
  });
};

// 清除已完成的待办事项
const clearCompleted = () => {
  updateState(draft => {
    draft.todos = draft.todos.filter(todo => !todo.done);
  });
};
```

##### 嵌套对象更新

```typescript jsx
const configStorage = new KeyStorage<{
  ui: { theme: string; language: string };
  features: { [key: string]: boolean };
}>({
  key: 'app-config',
});

const [config, updateConfig] = useImmerKeyStorage(configStorage, {
  ui: { theme: 'light', language: 'zh' },
  features: {},
});

// 更新嵌套属性
const updateTheme = (theme: string) => {
  updateConfig(draft => {
    draft.ui.theme = theme;
  });
};

const toggleFeature = (feature: string) => {
  updateConfig(draft => {
    draft.features[feature] = !draft.features[feature];
  });
};
```

##### 带验证的条件更新

```typescript jsx
const updateVolume = (newVolume: number) => {
  updateSettings(draft => {
    if (newVolume >= 0 && newVolume <= 100) {
      draft.volume = newVolume;
      draft.muted = false; // 音量改变时取消静音
    }
  });
};
```

##### 返回新值

```typescript jsx
// 替换整个状态
const resetToFactorySettings = () => {
  updateSettings(() => ({ volume: 50, muted: false }));
};

// 计算更新
const setMaxVolume = () => {
  updateSettings(draft => ({ ...draft, volume: 100, muted: false }));
};
```

##### 错误处理

```typescript jsx
const safeUpdate = (updater: (draft: any) => void) => {
  try {
    updatePrefs(updater);
  } catch (error) {
    console.error('更新偏好设置失败:', error);
    // 适当处理错误
  }
};
```

#### 最佳实践

##### ✅ 推荐做法

- 用于复杂对象更新和数组操作
- 利用 Immer 的 draft 变更编写可读代码
- 在单个更新调用中组合多个相关变更
- 对保证非空状态使用默认值
- 在更新函数中适当处理错误

##### ❌ 避免做法

- 不要直接用赋值修改 draft 参数（`draft = newValue`）
- 不要在更新函数中执行副作用
- 不要依赖对象比较的引用相等性
- 不要用于简单的原始值更新（应使用 `useKeyStorage`）

##### 性能提示

- 将相关更新批量处理以最小化存储操作
- 当新状态依赖于之前状态时使用函数式更新
- 如果更新函数经常重新创建，考虑使用 `useCallback`
- 如果处理非常大的对象，请分析更新性能

##### TypeScript 集成

```typescript jsx
// 为更好的安全性定义严格类型
type UserPreferences = {
  theme: 'light' | 'dark' | 'auto';
  volume: number; // 0-100
  notifications: boolean;
  shortcuts: Record<string, string>;
};

const prefsStorage = new KeyStorage<UserPreferences>({
  key: 'user-prefs',
});

// TypeScript 将捕获无效更新
const [prefs, updatePrefs] = useImmerKeyStorage(prefsStorage);

// 这将导致 TypeScript 错误：
// updatePrefs(draft => { draft.theme = 'invalid'; });
```

## Wow 查询 Hooks

Wow 查询 Hooks 提供高级数据查询功能，具有内置的状态管理，用于条件、投影、排序、分页和限制。这些 hooks 专为与 `@ahoo-wang/fetcher-wow` 包配合使用而设计，用于复杂的查询操作。

### useListQuery Hook

`useListQuery` hook 管理列表查询，具有条件、投影、排序和限制的状态管理。

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition, setLimit } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    execute: async (listQuery) => {
      // Your list fetching logic here
      return fetchListData(listQuery);
    },
  });

  const handleSearch = (searchTerm: string) => {
    setCondition({ name: { $regex: searchTerm } });
    execute();
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} placeholder="搜索..." />
      <ul>
        {result?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### usePagedQuery Hook

`usePagedQuery` hook 管理分页查询，具有条件、投影、分页和排序的状态管理。

```typescript jsx
import { usePagedQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition, setPagination } = usePagedQuery({
    initialQuery: {
      condition: {},
      pagination: { index: 1, size: 10 },
      projection: {},
      sort: []
    },
    execute: async (pagedQuery) => {
      // Your paged fetching logic here
      return fetchPagedData(pagedQuery);
    },
  });

  const handlePageChange = (page: number) => {
    setPagination({ index: page, size: 10 });
    execute();
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.list?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
      <button onClick={() => handlePageChange(result?.pagination?.index! - 1)} disabled={result?.pagination?.index === 1}>
        上一页
      </button>
      <button onClick={() => handlePageChange(result?.pagination?.index! + 1)}>
        下一页
      </button>
    </div>
  );
};
```

### useSingleQuery Hook

`useSingleQuery` hook 管理单个查询，具有条件、投影和排序的状态管理。

```typescript jsx
import { useSingleQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useSingleQuery({
    initialQuery: { condition: {}, projection: {}, sort: [] },
    execute: async (singleQuery) => {
      // 您的单个获取逻辑
      return fetchSingleData(singleQuery);
    },
  });

  const handleFetchUser = (userId: string) => {
    setCondition({ id: userId });
    execute();
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={() => handleFetchUser('123')}>获取用户</button>
      {result && <p>用户: {result.name}</p>}
    </div>
  );
};
```

### useCountQuery Hook

`useCountQuery` hook 管理计数查询，具有条件的状态管理。

```typescript jsx
import { useCountQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useCountQuery({
    initialQuery: {},
    execute: async (condition) => {
      // 您的计数获取逻辑
      return fetchCount(condition);
    },
  });

  const handleCountActive = () => {
    setCondition({ status: 'active' });
    execute();
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCountActive}>计数活跃项目</button>
      <p>总数: {result}</p>
    </div>
  );
};
```

### useFetcherCountQuery Hook

`useFetcherCountQuery` hook 是使用 Fetcher 库执行计数查询的专用 React hook。它专为需要检索匹配特定条件的记录数量的场景而设计，返回表示计数的数字。

```typescript jsx
import { useFetcherCountQuery } from '@ahoo-wang/fetcher-react';
import { all } from '@ahoo-wang/fetcher-wow';

function UserCountComponent() {
  const { data: count, loading, error, execute } = useFetcherCountQuery({
    url: '/api/users/count',
    initialQuery: all(),
    autoExecute: true,
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <div>活跃用户总数: {count}</div>
      <button onClick={execute}>刷新计数</button>
    </div>
  );
}
```

#### 自动执行示例

```typescript jsx
import { useFetcherCountQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { data: count, loading, error, execute } = useFetcherCountQuery({
    url: '/api/users/count',
    initialQuery: { status: 'active' },
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <p>活跃用户总数: {count}</p>
    </div>
  );
};
```

### useFetcherPagedQuery Hook

`useFetcherPagedQuery` hook 是使用 Fetcher 库执行分页查询的专用 React hook。它专为需要检索匹配查询条件的分页数据的场景而设计，返回包含当前页面项目以及分页元数据的 PagedList。

```typescript jsx
import { useFetcherPagedQuery } from '@ahoo-wang/fetcher-react';
import { pagedQuery, contains, pagination, desc } from '@ahoo-wang/fetcher-wow';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserListComponent() {
  const {
    data: pagedList,
    loading,
    error,
    execute,
    setQuery,
    getQuery
  } = useFetcherPagedQuery<User, keyof User>({
    url: '/api/users/paged',
    initialQuery: pagedQuery({
      condition: contains('name', 'John'),
      sort: [desc('createdAt')],
      pagination: pagination({ index: 1, size: 10 })
    }),
    autoExecute: true,
  });

  const goToPage = (page: number) => {
    const currentQuery = getQuery();
    setQuery({
      ...currentQuery,
      pagination: { ...currentQuery.pagination, index: page }
    });
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>用户</h2>
      <ul>
        {pagedList.list.map(user => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
      <div>
        <span>总数: {pagedList.total} 用户</span>
        <button onClick={() => goToPage(1)} disabled={pagedList.pagination.index === 1}>
          第一页
        </button>
        <button onClick={() => goToPage(pagedList.pagination.index - 1)} disabled={pagedList.pagination.index === 1}>
          上一页
        </button>
        <span>第 {pagedList.pagination.index} 页</span>
        <button onClick={() => goToPage(pagedList.pagination.index + 1)}>
          下一页
        </button>
      </div>
    </div>
  );
}
```

#### 自动执行示例

```typescript jsx
import { useFetcherPagedQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { data: pagedList, loading, error, execute } = useFetcherPagedQuery({
    url: '/api/products/paged',
    initialQuery: {
      condition: { category: 'electronics' },
      pagination: { index: 1, size: 20 },
      projection: {},
      sort: []
    },
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>产品</h2>
      <div>总数: {pagedList.total}</div>
      <ul>
        {pagedList.list.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### useListStreamQuery Hook

`useListStreamQuery` hook 管理列表流查询，返回服务器发送事件的 readable stream。

```typescript jsx
import { useListStreamQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListStreamQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 100 },
    execute: async (listQuery) => {
      // 您的流获取逻辑
      return fetchListStream(listQuery);
    },
  });

  useEffect(() => {
    if (result) {
      const reader = result.getReader();
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            console.log('接收到:', value);
            // 处理流事件
          }
        } catch (error) {
          console.error('流错误:', error);
        }
      };
      readStream();
    }
  }, [result]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={execute}>开始流</button>
    </div>
  );
};
```

## 最佳实践

### 性能优化

- 谨慎使用 `autoExecute: true`，避免在挂载时进行不必要的请求
- 当启用 `autoExecute` 时，使用 `setQuery` 更新查询以触发自动重新执行
- 在 `execute` 函数中记忆化昂贵的计算

### 错误处理

- 始终在组件中处理加载和错误状态
- 使用自定义错误类型以更好地分类错误
- 为瞬时故障实现重试逻辑

### 类型安全

- 为查询参数和结果定义严格的接口
- 在整个应用程序中一致使用泛型类型
- 启用严格 TypeScript 模式以获得最大安全性

### 状态管理

- 与全局状态管理结合使用（Redux、Zustand）以处理复杂应用
- 使用 `useKeyStorage` 进行持久化的客户端数据存储
- 实现乐观更新以改善用户体验

## API 参考

### 防抖 Hooks

#### useDebouncedCallback

```typescript
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T>;
```

一个 React hook，为回调函数提供防抖版本，支持前缘/后缘执行选项。

**类型参数:**

- `T`: 回调函数的类型

**参数:**

- `callback`: 要防抖的函数
- `options`: 配置对象
  - `delay`: 执行前的延迟毫秒数（必需，正数）
  - `leading?`: 第一次调用时立即执行（默认: false）
  - `trailing?`: 最后一次调用后延迟执行（默认: true）

**返回:**

包含以下内容的对象：

- `run`: 使用参数执行防抖回调的函数
- `cancel`: 取消任何待处理防抖执行的函数
- `isPending`: 返回布尔值表示防抖执行当前是否待处理的函数

#### useDebouncedExecutePromise

```typescript
function useDebouncedExecutePromise<R = unknown, E = FetcherError>(
  options: UseDebouncedExecutePromiseOptions<R, E>,
): UseDebouncedExecutePromiseReturn<R, E>;
```

将 Promise 执行与防抖功能相结合。

**类型参数:**

- `R`: Promise 结果的类型（默认为 unknown）
- `E`: 错误的类型（默认为 FetcherError）

**参数:**

- `options`: 包含 Promise 执行选项和防抖设置的配置对象
  - `debounce`: 防抖配置（delay、leading、trailing）
  - `UseExecutePromiseOptions` 的所有选项

**返回:**

包含以下内容的对象：

- `loading`: 布尔值，表示 Promise 当前是否正在执行
- `result`: Promise 的解析值
- `error`: 执行期间发生的任何错误
- `status`: 当前执行状态
- `run`: 使用提供的参数执行防抖 Promise 的函数
- `cancel`: 取消任何待处理防抖执行的函数
- `isPending`: 布尔值，表示防抖调用是否待处理
- `reset`: 将 hook 状态重置为初始值的函数

#### useDebouncedFetcher

```typescript
function useDebouncedFetcher<R, E = FetcherError>(
  options: UseDebouncedFetcherOptions<R, E>,
): UseDebouncedFetcherReturn<R, E>;
```

专门的 hook，将 HTTP 获取与防抖相结合。

**类型参数:**

- `R`: 获取结果的类型
- `E`: 错误的类型（默认为 FetcherError）

**参数:**

- `options`: 扩展 `UseFetcherOptions` 和 `DebounceCapable` 的配置对象
  - HTTP 请求选项（method、headers、timeout 等）
  - `debounce`: 防抖配置（delay、leading、trailing）

**返回:**

包含以下内容的对象：

- `loading`: 布尔值，表示获取当前是否正在执行
- `result`: 获取的解析值
- `error`: 执行期间发生的任何错误
- `status`: 当前执行状态
- `exchange`: 表示正在进行的获取操作的 FetchExchange 对象
- `run`: 使用请求参数执行防抖获取的函数
- `cancel`: 取消任何待处理防抖执行的函数
- `isPending`: 布尔值，表示防抖调用是否待处理

### useFetcher

```typescript
function useFetcher<R = unknown, E = unknown>(
  options?: UseFetcherOptions<R, E> | UseFetcherOptionsSupplier<R, E>,
): UseFetcherReturn<R, E>;
```

用于管理异步获取操作的 React hook，具有适当的状态处理、竞态条件保护和灵活的配置。

**类型参数:**

- `R`: 结果的类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 配置选项或供应商函数
  - `fetcher`: 要使用的自定义获取器实例。默认为默认获取器。
  - `initialStatus`: 初始状态，默认为 IDLE
  - `onSuccess`: 成功时调用的回调
  - `onError`: 错误时调用的回调

**返回值:**

包含以下属性的对象：

- `status`: 当前状态 (IDLE, LOADING, SUCCESS, ERROR)
- `loading`: 指示当前是否加载中
- `result`: 结果值
- `error`: 错误值
- `exchange`: 表示正在进行的获取操作的 FetchExchange 对象
- `execute`: 执行获取请求的函数

### useExecutePromise

```typescript
function useExecutePromise<R = unknown, E = unknown>(
  options?: UseExecutePromiseOptions<R, E>,
): UseExecutePromiseReturn<R, E>;
```

用于管理异步操作的 React hook，具有适当的状态处理、竞态条件保护和 promise 状态选项。

**类型参数:**

- `R`: 结果的类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 配置选项
  - `initialStatus`: 初始状态，默认为 IDLE
  - `onSuccess`: 成功时调用的回调
  - `onError`: 错误时调用的回调

**返回值:**

包含以下属性的对象：

- `status`: 当前状态 (IDLE, LOADING, SUCCESS, ERROR)
- `loading`: 指示当前是否加载中
- `result`: 结果值
- `error`: 错误值
- `execute`: 执行 promise supplier 或 promise 的函数
- `reset`: 重置状态到初始值的函数

### usePromiseState

```typescript
function usePromiseState<R = unknown, E = unknown>(
  options?: UsePromiseStateOptions<R, E> | UsePromiseStateOptionsSupplier<R, E>,
): UsePromiseStateReturn<R, E>;
```

用于管理 promise 状态的 React hook，无执行逻辑。支持静态选项和动态选项供应商。

**类型参数:**

- `R`: 结果的类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 配置选项或供应商函数
  - `initialStatus`: 初始状态，默认为 IDLE
  - `onSuccess`: 成功时调用的回调（可以是异步的）
  - `onError`: 错误时调用的回调（可以是异步的）

**返回值:**

包含以下属性的对象：

- `status`: 当前状态 (IDLE, LOADING, SUCCESS, ERROR)
- `loading`: 指示当前是否加载中
- `result`: 结果值
- `error`: 错误值
- `setLoading`: 设置状态为 LOADING
- `setSuccess`: 设置状态为 SUCCESS 并提供结果
- `setError`: 设置状态为 ERROR 并提供错误
- `setIdle`: 设置状态为 IDLE

### useRequestId

```typescript
function useRequestId(): UseRequestIdReturn;
```

用于管理请求ID和竞态条件保护的 React hook。

**返回值:**

包含以下属性的对象：

- `generate`: 生成新请求ID并获取当前ID
- `current`: 获取当前请求ID而不生成新ID
- `isLatest`: 检查给定请求ID是否为最新
- `invalidate`: 使当前请求ID失效（标记为过时）
- `reset`: 重置请求ID计数器

### useLatest

```typescript
function useLatest<T>(value: T): { current: T };
```

返回包含最新值的 ref 对象的 React hook，用于在异步回调中访问当前值。

**类型参数:**

- `T`: 值的类型

**参数:**

- `value`: 要跟踪的值

**返回值:**

包含 `current` 属性（包含最新值）的 ref 对象

### useRefs

```typescript
function useRefs<T>(): UseRefsReturn<T>;
```

React hook，用于使用 Map-like 接口管理多个 refs，允许通过键动态注册和检索 refs。

**类型参数:**

- `T`: ref 实例的类型（例如 HTMLElement）

**返回值:**

实现 `UseRefsReturn<T>` 的对象，具有：

- `register(key: RefKey): (instance: T | null) => void` - 返回用于注册/注销 ref 的回调
- `get(key: RefKey): T | undefined` - 通过键获取 ref
- `set(key: RefKey, value: T): void` - 设置 ref 值
- `has(key: RefKey): boolean` - 检查键是否存在
- `delete(key: RefKey): boolean` - 通过键删除 ref
- `clear(): void` - 清空所有 refs
- `size: number` - refs 数量
- `keys(): IterableIterator<RefKey>` - 键的迭代器
- `values(): IterableIterator<T>` - 值的迭代器
- `entries(): IterableIterator<[RefKey, T]>` - 条目的迭代器
- `Symbol.iterator`: for...of 循环的迭代器

**相关类型:**

- `RefKey = string | number | symbol`
- `UseRefsReturn<T> extends Iterable<[RefKey, T]>`

### useEventSubscription Hook

`useEventSubscription` hook 为类型化事件总线提供了 React 接口。它自动管理订阅生命周期，同时提供手动控制功能以增加灵活性。

```typescript jsx
import { useEventSubscription } from '@ahoo-wang/fetcher-react';
import { eventBus } from './eventBus';

function MyComponent() {
  const { subscribe, unsubscribe } = useEventSubscription({
    bus: eventBus,
    handler: {
      name: 'myEvent',
      handle: (event) => {
        console.log('收到事件:', event);
      }
    }
  });

  // hook 在组件挂载时自动订阅，在卸载时自动取消订阅
  // 如需要，您也可以手动控制订阅
  const handleToggleSubscription = () => {
    if (someCondition) {
      subscribe();
    } else {
      unsubscribe();
    }
  };

  return <div>我的组件</div>;
}
```

关键特性:

- **自动生命周期管理**: 在组件挂载时自动订阅，在卸载时自动取消订阅
- **手动控制**: 提供 `subscribe` 和 `unsubscribe` 函数以进行额外控制
- **类型安全**: 完全支持 TypeScript，具有泛型事件类型
- **错误处理**: 对失败的订阅尝试记录警告
- **事件总线集成**: 与 `@ahoo-wang/fetcher-eventbus` TypedEventBus 实例无缝配合

### useKeyStorage

```typescript jsx
function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void];
```

为 KeyStorage 实例提供状态管理的 React hook。

**参数:**

- `keyStorage`: 要订阅和管理的 KeyStorage 实例

**返回值:**

- 包含当前存储值和更新函数的元组

### useImmerKeyStorage

```typescript
// 不使用默认值 - 可能返回 null
function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [
  T | null,
  (updater: (draft: T | null) => T | null | void) => void,
  () => void,
];

// 使用默认值 - 保证非空
function useImmerKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (updater: (draft: T) => T | null | void) => void, () => void];
```

为 KeyStorage 实例提供 Immer 驱动的不可变状态管理的 React hook。通过集成 Immer 的 `produce` 函数扩展 `useKeyStorage`，允许直观的"可变"更新存储值，同时保持不可变性。

**类型参数:**

- `T`: 存储值的数据类型

**参数:**

- `keyStorage`: 要订阅和管理的 KeyStorage 实例。应该是稳定的引用（useRef、memo 或模块级实例）
- `defaultValue` _(可选)_: 当存储为空时使用的默认值。提供时，hook 保证返回的值永远不会为 null

**返回值:**

包含以下元素的元组：

- **当前值**: `T | null`（无默认值时）或 `T`（有默认值时）
- **更新函数**: `(updater: (draft: T | null) => T | null | void) => void` - Immer 驱动的更新函数
- **清除函数**: `() => void` - 删除存储值的函数

**更新函数:**

更新函数接收一个可以直接变更的 `draft` 参数。Immer 将从这些变更中产生不可变更新。更新函数也可以直接返回新值或 `null` 来清除存储。

**示例:**

```typescript
// 基本对象更新
const [user, updateUser] = useImmerKeyStorage(userStorage);
updateUser(draft => {
  if (draft) {
    draft.name = 'John';
    draft.age = 30;
  }
});

// 数组操作
const [todos, updateTodos] = useImmerKeyStorage(todosStorage, []);
updateTodos(draft => {
  draft.push({ id: 1, text: '新待办事项', done: false });
});

// 返回新值
updateTodos(() => [{ id: 1, text: '重置待办事项', done: false }]);

// 清除存储
updateTodos(() => null);
```

### useListQuery

```typescript
function useListQuery<R, FIELDS extends string = string, E = FetcherError>(
  options: UseListQueryOptions<R, FIELDS, E>,
): UseListQueryReturn<R, FIELDS, E>;
```

用于管理列表查询的 React hook，具有条件、投影、排序和限制的状态管理。

**类型参数:**

- `R`: 列表中结果项的类型
- `FIELDS`: 用于条件和投影的字段类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 包含 initialQuery 和 list 函数的配置选项
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含 promise 状态、execute 函数以及条件、投影、排序和限制设置器的对象。

### usePagedQuery

```typescript
function usePagedQuery<R, FIELDS extends string = string, E = unknown>(
  options: UsePagedQueryOptions<R, FIELDS, E>,
): UsePagedQueryReturn<R, FIELDS, E>;
```

用于管理分页查询的 React hook，具有条件、投影、分页和排序的状态管理。

**类型参数:**

- `R`: 分页列表中结果项的类型
- `FIELDS`: 用于条件和投影的字段类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 包含 initialQuery 和 query 函数的配置选项
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含 promise 状态、execute 函数以及条件、投影、分页和排序设置器的对象。

### useSingleQuery

```typescript
function useSingleQuery<R, FIELDS extends string = string, E = unknown>(
  options: UseSingleQueryOptions<R, FIELDS, E>,
): UseSingleQueryReturn<R, FIELDS, E>;
```

用于管理单个查询的 React hook，具有条件、投影和排序的状态管理。

**类型参数:**

- `R`: 结果的类型
- `FIELDS`: 用于条件和投影的字段类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 包含 initialQuery 和 query 函数的配置选项
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含 promise 状态、execute 函数以及条件、投影和排序设置器的对象。

### useCountQuery

```typescript
function useCountQuery<FIELDS extends string = string, E = FetcherError>(
  options: UseCountQueryOptions<FIELDS, E>,
): UseCountQueryReturn<FIELDS, E>;
```

用于管理计数查询的 React hook，具有条件的状态管理。

**类型参数:**

- `FIELDS`: 用于条件的字段类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 包含 initialQuery 和 execute 函数的配置选项
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含 promise 状态、execute 函数以及条件设置器的对象。

### useFetcherCountQuery

```typescript
function useFetcherCountQuery<FIELDS extends string = string, E = FetcherError>(
  options: UseFetcherCountQueryOptions<FIELDS, E>,
): UseFetcherCountQueryReturn<FIELDS, E>;
```

使用 Fetcher 库执行计数查询的 React hook。它包装了 useFetcherQuery hook 并专门用于计数操作，返回表示计数的数字。

**类型参数:**

- `FIELDS`: 可在条件中使用的字段的字符串联合类型
- `E`: 可能抛出的错误类型（默认为 `FetcherError`）

**参数:**

- `options`: 计数查询的配置选项，包括条件、fetcher 实例和其他查询设置
  - `url`: 从中获取计数的 URL
  - `initialQuery`: 计数查询的初始条件
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含查询结果（作为数字的计数）、加载状态、错误状态和实用函数的对象。

### useFetcherPagedQuery

```typescript
function useFetcherPagedQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseFetcherPagedQueryOptions<R, FIELDS, E>,
): UseFetcherPagedQueryReturn<R, FIELDS, E>;
```

使用 Fetcher 库执行分页查询的 React hook。它包装了 useFetcherQuery hook 并专门用于分页操作，返回包含项目和分页元数据的 PagedList。

**类型参数:**

- `R`: 分页列表中每个项目包含的资源或实体的类型
- `FIELDS`: 可在分页查询中使用的字段的字符串联合类型
- `E`: 可能抛出的错误类型（默认为 `FetcherError`）

**参数:**

- `options`: 分页查询的配置选项，包括分页查询参数、fetcher 实例和其他查询设置
  - `url`: 从中获取分页数据的 URL
  - `initialQuery`: 初始分页查询配置
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含查询结果（包含项目和分页信息的 PagedList）、加载状态、错误状态和实用函数的对象。

### useListStreamQuery

```typescript
function useListStreamQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseListStreamQueryOptions<R, FIELDS, E>,
): UseListStreamQueryReturn<R, FIELDS, E>;
```

用于管理列表流查询的 React hook，具有条件、投影、排序和限制的状态管理。返回 JSON 服务器发送事件的 readable stream。

**类型参数:**

- `R`: 流事件中结果项的类型
- `FIELDS`: 用于条件和投影的字段类型
- `E`: 错误的类型（默认为 `FetcherError`）

**参数:**

- `options`: 包含 initialQuery 和 listStream 函数的配置选项
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 false）

**返回值:**

包含 promise 状态、execute 函数以及条件、投影、排序和限制设置器的对象。

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
