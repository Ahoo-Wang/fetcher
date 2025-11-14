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
  - [useKeyStorage Hook](#usekeystorage-hook)
  - [useImmerKeyStorage Hook](#useimmerkeystorage-hook)
  - [Wow 查询 Hooks](#wow-查询-hooks)
  - [useListQuery Hook](#uselistquery-hook)
  - [usePagedQuery Hook](#usepagedquery-hook)
  - [useSingleQuery Hook](#usesinglequery-hook)
  - [useCountQuery Hook](#usecountquery-hook)
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

`useImmerKeyStorage` hook 通过集成 Immer 的 `produce` 函数扩展了 `useKeyStorage`，允许开发者以不可变的方式对存储值进行"可变"更新。它为复杂对象更新提供了直观的 API，同时保持自动存储同步。

```typescript jsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useImmerKeyStorage } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const prefsStorage = new KeyStorage<{ theme: string; volume: number; notifications: boolean }>({
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
const MyComponent = () => {
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
      <p>音量: {settings.volume}</p>
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

#### 高级用法

```typescript jsx
// 批量更新
const updateMultipleSettings = () => {
  updateSettings(draft => {
    draft.volume = 75;
    draft.muted = false;
    // 根据需要添加更多属性
  });
};

// 条件更新
const toggleFeature = (feature: string) => {
  updatePrefs(draft => {
    if (draft) {
      if (feature === 'notifications') {
        draft.notifications = !draft.notifications;
      } else if (feature === 'theme') {
        draft.theme = draft.theme === 'light' ? 'dark' : 'light';
      }
    }
  });
};

// 返回新值而不是修改 draft
const resetToSpecificValues = () => {
  updateSettings(() => ({ volume: 30, muted: true }));
};
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
