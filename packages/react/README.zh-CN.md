# @ahoo-wang/fetcher-react

Fetcher 生态的 React 集成包。提供 React Hooks 和组件，实现无缝的数据获取，支持自动重新渲染和加载状态。

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-react.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-react)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

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
  - [useExecutePromise Hook](#useexecutepromise-hook)
  - [usePromiseState Hook](#usepromisestate-hook)
  - [useRequestId Hook](#userequestid-hook)
  - [useLatest Hook](#uselatest-hook)
  - [useKeyStorage Hook](#usekeystorage-hook)
  - [Wow 查询 Hooks](#wow-查询-hooks)
    - [useListQuery Hook](#uselistquery-hook)
    - [usePagedQuery Hook](#usepagedquery-hook)
    - [useSingleQuery Hook](#usesinglequery-hook)
    - [useCountQuery Hook](#usecountquery-hook)
    - [useListStreamQuery Hook](#useliststreamquery-hook)
- [API 参考](#api-参考)
- [许可证](#许可证)

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

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

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <button onClick={handleFetch}>获取数据</button>
    </div>
  );
};
```

### useExecutePromise Hook

`useExecutePromise` hook 管理异步操作，具有自动状态处理、竞态条件保护和 promise 状态选项支持。

```typescript jsx
import { useExecutePromise } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, result, error, execute, reset } = useExecutePromise<string>();

  const fetchData = async () => {
    const response = await fetch('/api/data');
    return response.text();
  };

  const handleFetch = () => {
    execute(fetchData); // 使用 promise supplier
  };

  const handleDirectPromise = () => {
    const promise = fetch('/api/data').then(res => res.text());
    execute(promise); // 使用直接 promise
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  return (
    <div>
      <button onClick={handleFetch}>使用 Supplier 获取</button>
      <button onClick={handleDirectPromise}>使用 Promise 获取</button>
      <button onClick={reset}>重置</button>
      {result && <p>{result}</p>}
    </div>
  );
};
```

### usePromiseState Hook

`usePromiseState` hook 提供 promise 操作的状态管理，无执行逻辑。支持静态选项和动态选项供应商。

```typescript jsx
import { usePromiseState, PromiseStatus } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { status, loading, result, error, setSuccess, setError, setIdle } = usePromiseState<string>();

  const handleSuccess = () => setSuccess('数据加载成功');
  const handleError = () => setError(new Error('加载失败'));

  return (
    <div>
      <button onClick={handleSuccess}>设置成功</button>
      <button onClick={handleError}>设置错误</button>
      <button onClick={setIdle}>重置</button>
      <p>状态: {status}</p>
      {loading && <p>加载中...</p>}
      {result && <p>结果: {result}</p>}
      {error && <p>错误: {error.message}</p>}
    </div>
  );
};
```

#### usePromiseState with Options Supplier

```typescript jsx
import { usePromiseState, PromiseStatus } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  // 使用选项供应商进行动态配置
  const optionsSupplier = () => ({
    initialStatus: PromiseStatus.IDLE,
    onSuccess: async (result: string) => {
      await saveToAnalytics(result);
      console.log('成功:', result);
    },
    onError: async (error) => {
      await logErrorToServer(error);
      console.error('错误:', error);
    },
  });

  const { setSuccess, setError } = usePromiseState<string>(optionsSupplier);

  return (
    <div>
      <button onClick={() => setSuccess('动态成功!')}>设置成功</button>
      <button onClick={() => setError(new Error('动态错误!'))}>设置错误</button>
    </div>
  );
};
```

### useRequestId Hook

`useRequestId` hook 提供请求ID管理，用于防止异步操作中的竞态条件。

```typescript jsx
import { useRequestId } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { generate, isLatest, invalidate } = useRequestId();

  const handleFetch = async () => {
    const requestId = generate();

    try {
      const result = await fetchData();

      if (isLatest(requestId)) {
        setData(result);
      }
    } catch (error) {
      if (isLatest(requestId)) {
        setError(error);
      }
    }
  };

  return (
    <div>
      <button onClick={handleFetch}>获取数据</button>
      <button onClick={invalidate}>取消进行中</button>
    </div>
  );
};
```

### useLatest Hook

`useLatest` hook 返回包含最新值的 ref 对象，用于在异步回调中访问当前值。

```typescript jsx
import { useLatest } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const [count, setCount] = useState(0);
  const latestCount = useLatest(count);

  const handleAsync = async () => {
    await someAsyncOperation();
    console.log('最新计数:', latestCount.current); // 始终是最新值
  };

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>递增</button>
      <button onClick={handleAsync}>异步记录</button>
    </div>
  );
};
```

### useKeyStorage Hook

`useKeyStorage` hook 为 KeyStorage 实例提供状态管理。它订阅存储变化并返回当前值以及设置值的函数。

```typescript jsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({
    key: 'my-key',
  });

  const [value, setValue] = useKeyStorage(keyStorage);

  return (
    <div>
      <p>当前值 :{value}
      </p>
      < button
        onClick={() => setValue('new value')}>
        更新值
      < /button>
    < /div>
  );
};
```

### 更多示例

```typescript jsx
// 处理不同类型的值
const numberStorage = new KeyStorage<number>({ key: 'counter' });
const [count, setCount] = useKeyStorage(numberStorage);

// 处理对象
interface User {
  id: string;
  name: string;
}

const userStorage = new KeyStorage<User>({ key: 'current-user' });
const [user, setUser] = useKeyStorage(userStorage);
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
    list: async (listQuery) => {
      // 您的列表获取逻辑
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
    query: async (pagedQuery) => {
      // 您的分页获取逻辑
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
        {result?.data?.map((item, index) => (
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
    query: async (singleQuery) => {
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
    initialCondition: {},
    count: async (condition) => {
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
    listStream: async (listQuery) => {
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

## API 参考

### useFetcher

```typescript
function useFetcher<R = unknown, E = unknown>(
  options?: UseFetcherOptions<R, E> | UseFetcherOptionsSupplier<R, E>,
): UseFetcherReturn<R, E>;
```

用于管理异步获取操作的 React hook，具有适当的状态处理、竞态条件保护和灵活的配置。

**类型参数:**

- `R`: 结果的类型
- `E`: 错误的类型（默认为 `unknown`）

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
- `E`: 错误的类型（默认为 `unknown`）

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
- `E`: 错误的类型（默认为 `unknown`）

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
function useListQuery<R, FIELDS extends string = string, E = unknown>(
  options: UseListQueryOptions<R, FIELDS, E>,
): UseListQueryReturn<R, FIELDS, E>;
```

用于管理列表查询的 React hook，具有条件、投影、排序和限制的状态管理。

**类型参数:**

- `R`: 列表中结果项的类型
- `FIELDS`: 用于条件和投影的字段类型
- `E`: 错误的类型（默认为 `unknown`）

**参数:**

- `options`: 包含 initialQuery 和 list 函数的配置选项

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
- `E`: 错误的类型（默认为 `unknown`）

**参数:**

- `options`: 包含 initialQuery 和 query 函数的配置选项

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
- `E`: 错误的类型（默认为 `unknown`）

**参数:**

- `options`: 包含 initialQuery 和 query 函数的配置选项

**返回值:**

包含 promise 状态、execute 函数以及条件、投影和排序设置器的对象。

### useCountQuery

```typescript
function useCountQuery<FIELDS extends string = string, E = unknown>(
  options: UseCountQueryOptions<FIELDS, E>,
): UseCountQueryReturn<FIELDS, E>;
```

用于管理计数查询的 React hook，具有条件的状态管理。

**类型参数:**

- `FIELDS`: 用于条件的字段类型
- `E`: 错误的类型（默认为 `unknown`）

**参数:**

- `options`: 包含 initialCondition 和 count 函数的配置选项

**返回值:**

包含 promise 状态、execute 函数以及条件设置器的对象。

### useListStreamQuery

```typescript
function useListStreamQuery<R, FIELDS extends string = string, E = unknown>(
  options: UseListStreamQueryOptions<R, FIELDS, E>,
): UseListStreamQueryReturn<R, FIELDS, E>;
```

用于管理列表流查询的 React hook，具有条件、投影、排序和限制的状态管理。返回 JSON 服务器发送事件的 readable stream。

**类型参数:**

- `R`: 流事件中结果项的类型
- `FIELDS`: 用于条件和投影的字段类型
- `E`: 错误的类型（默认为 `unknown`）

**参数:**

- `options`: 包含 initialQuery 和 listStream 函数的配置选项

**返回值:**

包含 promise 状态、execute 函数以及条件、投影、排序和限制设置器的对象。

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
