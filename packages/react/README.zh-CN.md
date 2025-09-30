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

- 🔄 **React Hooks**: 提供 React hooks 与 Fetcher 无缝集成
- 🌐 **TypeScript 支持**: 完整的 TypeScript 支持和全面的类型定义
- 🚀 **现代化**: 使用现代 React 模式和最佳实践构建
- 🧠 **智能缓存**: 内置缓存和自动重新验证
- ⚡ **Promise 状态管理**: 用于管理异步操作和 promise 状态的 hooks

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

## 使用方法

### usePromiseState Hook

`usePromiseState` hook 提供 promise 操作的状态管理，无执行逻辑。

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

### useExecutePromise Hook

`useExecutePromise` hook 管理异步操作，具有自动状态处理。

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

### useFetcher Hook

`useFetcher` hook 提供数据获取功能，具有自动状态管理。

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

### usePromiseState

```typescript
function usePromiseState<R = unknown>(
  options?: UsePromiseStateOptions<R>,
): UsePromiseStateReturn<R>;
```

用于管理 promise 状态的 React hook，无执行逻辑。

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
- `setLoading`: 设置状态为 LOADING
- `setSuccess`: 设置状态为 SUCCESS 并提供结果
- `setError`: 设置状态为 ERROR 并提供错误
- `setIdle`: 设置状态为 IDLE

### useExecutePromise

```typescript
function useExecutePromise<R = unknown>(): UseExecutePromiseReturn<R>;
```

用于管理异步操作的 React hook，具有适当的状态处理。

**返回值:**

包含以下属性的对象：

- `status`: 当前状态
- `loading`: 指示当前是否加载中
- `result`: 结果值
- `error`: 错误值
- `execute`: 执行 promise 提供者的函数
- `reset`: 重置状态到初始值的函数

### useFetcher

```typescript
function useFetcher<R>(options?: UseFetcherOptions): UseFetcherReturn<R>;
```

用于管理异步获取操作的 React hook，具有适当的状态处理。

**参数:**

- `options`: 配置选项
    - `fetcher`: 要使用的自定义获取器实例。默认为默认获取器。

**返回值:**

包含以下属性的对象：

- `status`: 当前状态
- `loading`: 指示当前是否加载中
- `result`: 结果值
- `error`: 错误值
- `exchange`: FetchExchange 对象
- `execute`: 执行获取请求的函数

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
