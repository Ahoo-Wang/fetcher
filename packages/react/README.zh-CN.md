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

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

## 使用方法

### useFetcher Hook

`useFetcher` hook 提供了一种在 React 组件中获取数据的便捷方式，具有自动管理加载、错误和结果状态的功能。

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute, cancel } = useFetcher({
    url: '/api/users',
    method: 'GET'
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      <button onClick={execute}>刷新</button>
      <button onClick={cancel}>取消</button>
    </div>
  );
};
```

### 手动执行

要手动控制获取数据的时机，请将 `immediate` 选项设置为 `false`：

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute } = useFetcher({
    url: '/api/users',
    method: 'POST',
    body: JSON.stringify({ name: 'John' })
  }, { immediate: false });

  const handleSubmit = async () => {
    await execute();
  };

  if (loading) return <div>提交中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
};
```

### 自定义依赖项

您可以指定依赖项，当它们发生变化时会触发重新获取：

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const UserProfile = ({ userId }: { userId: string }) => {
  const { loading, error, result } = useFetcher({
    url: `/api/users/${userId}`,
    method: 'GET'
  }, { deps: [userId] });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h1>{result?.name}</h1>
      <p>{result?.email}</p>
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
function useFetcher<R>(
  request: FetchRequest,
  options?: UseFetcherOptions,
): UseFetcherResult<R>;
```

提供数据获取功能并自动管理状态的 React hook。

**参数:**

- `request`: 获取数据的请求配置
- `options`: 获取数据操作的配置选项
    - `deps`: 获取数据操作的依赖项列表。提供时，当这些值中的任何一个发生变化时，hook 将重新获取数据。
    - `immediate`: 获取数据操作是否应在组件挂载时立即执行。默认为 `true`。
    - `fetcher`: 要使用的自定义获取器实例。默认为默认获取器。

**返回值:**

包含以下属性的对象：

- `loading`: 指示获取数据操作当前是否正在进行中
- `exchange`: 代表正在进行的获取数据操作的 FetchExchange 对象
- `result`: 获取数据操作返回的数据
- `error`: 获取数据操作期间发生的任何错误
- `execute`: 手动触发获取数据操作的函数
- `cancel`: 取消正在进行的获取数据操作的函数

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
