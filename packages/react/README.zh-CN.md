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

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
