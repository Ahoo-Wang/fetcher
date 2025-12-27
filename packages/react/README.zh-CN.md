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
- 🏗️ **API Hooks 生成**: 从 API 对象自动生成类型安全的 React hooks
- 📊 **高级查询 Hooks**: 专门用于列表、分页、单个、计数和流查询的 hooks，具有状态管理功能

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [使用方法](#使用方法)
  - [API Hooks](#api-hooks)
  - [核心 Hooks](#核心-hooks)
    - [useExecutePromise](#useexecutepromise)
    - [usePromiseState](#usepromisestate)
    - [useRequestId](#userequestid-hook)
    - [useLatest](#uselatest-hook)
    - [useRefs](#userefs-hook)
    - [useQuery](#usequery-hook)
    - [useQueryState](#usequerystate-hook)
    - [useMounted](#usemounted-hook)
    - [useForceUpdate](#useforceupdate-hook)
    - [防抖 Hooks](#防抖-hooks)
      - [useDebouncedCallback](#usedebouncedcallback)
      - [useDebouncedExecutePromise](#usedebouncedexecutepromise)
      - [useDebouncedQuery](#usedebouncedquery)
  - [Fetcher Hooks](#fetcher-hooks)
    - [useFetcher](#usefetcher-hook)
    - [useFetcherQuery](#usefetcherquery-hook)
    - [防抖 Fetcher Hooks](#防抖-fetcher-hooks)
      - [useDebouncedFetcher](#usedebouncedfetcher)
      - [useDebouncedFetcherQuery](#usedebouncedfetcherquery)
  - [存储 Hooks](#存储-hooks)
    - [useKeyStorage](#usekeystorage-hook)
    - [useImmerKeyStorage](#useimmerkeystorage-hook)
  - [事件 Hooks](#事件-hooks)
    - [useEventSubscription](#useeventsubscription-hook)
  - [CoSec 安全 Hooks](#cosec-安全-hooks)
    - [useSecurity](#usesecurity-hook)
    - [SecurityProvider](#securityprovider)
    - [useSecurityContext](#usesecuritycontext-hook)
    - [RouteGuard](#routeguard)
  - [Wow 查询 Hooks](#wow-查询-hooks)
    - [基础查询 Hooks](#基础查询-hooks)
      - [useListQuery](#uselistquery-hook)
      - [usePagedQuery](#usepagedquery-hook)
      - [useSingleQuery](#usesinglequery-hook)
      - [useCountQuery](#usecountquery-hook)
      - [useListStreamQuery](#useliststreamquery-hook)
    - [Fetcher 查询 Hooks](#fetcher-查询-hooks)
      - [useFetcherListQuery](#usefetcherlistquery-hook)
      - [useFetcherPagedQuery](#usefetcherpagedquery-hook)
      - [useFetcherSingleQuery](#usefetchersinglequery-hook)
      - [useFetcherCountQuery](#usefetchercountquery-hook)
      - [useFetcherListStreamQuery](#usefetcherliststreamquery-hook)
- [最佳实践](#最佳实践)
- [API 参考](#api-参考)
- [许可证](#许可证)

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

### 要求

- React 19.0+ (hooks 支持)
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

### API Hooks

#### createExecuteApiHooks

🚀 **自动类型安全 API Hooks 生成** - 从 API 对象自动生成完全类型化的 React hooks，具有自动方法发现、类方法支持和高级执行控制。

`createExecuteApiHooks` 函数自动发现 API 对象中的所有函数方法（包括类实例的原型链），并使用命名模式 `use{首字母大写的方法名}` 创建相应的 React hooks。每个生成的 hook 都提供完整的状态管理、错误处理，并支持具有类型安全参数访问的自定义执行回调。

**主要特性：**

- **自动方法发现**：遍历对象属性和原型链
- **类型安全 Hook 生成**：参数和返回类型的完整 TypeScript 推断
- **类方法支持**：处理静态方法和具有 `this` 绑定的类实例
- **执行控制**：`onBeforeExecute` 回调用于参数检查/修改和中止控制器访问
- **自定义错误类型**：支持指定超出默认 `FetcherError` 的错误类型

```typescript jsx
import { createExecuteApiHooks } from '@ahoo-wang/fetcher-react';
import { api, get, post, patch, path, body, autoGeneratedError } from '@ahoo-wang/fetcher-decorator';

// 使用装饰器定义您的 API 服务
import { api, get, post, patch, path, body, autoGeneratedError } from '@ahoo-wang/fetcher-decorator';

@api('/users')
class UserApi {
  @get('/{id}')
  getUser(@path('id') id: string): Promise<User> {
    throw autoGeneratedError(id);
  }

  @post('')
  createUser(@body() data: { name: string; email: string }): Promise<User> {
    throw autoGeneratedError(data);
  }

  @patch('/{id}')
  updateUser(@path('id') id: string, @body() updates: Partial<User>): Promise<User> {
    throw autoGeneratedError(id, updates);
  }
}

const userApi = new UserApi();

// 生成类型安全的 hooks
const apiHooks = createExecuteApiHooks({ api: userApi });

function UserComponent() {
  // Hooks 自动生成，具有正确的类型
  const { loading: getLoading, result: user, error: getError, execute: getUser } = apiHooks.useGetUser();
  const { loading: createLoading, result: createdUser, error: createError, execute: createUser } = apiHooks.useCreateUser({
    onBeforeExecute: (abortController, args) => {
      // args 完全类型化为 [data: { name: string; email: string }]
      const [data] = args;
      // 如果需要，可以就地修改参数
      data.email = data.email.toLowerCase();
      // 访问中止控制器以进行自定义取消
      abortController.signal.addEventListener('abort', () => {
        console.log('用户创建已取消');
      });
    },
  });

  const handleFetchUser = (userId: string) => {
    getUser(userId); // 完全类型化 - 仅接受字符串参数
  };

  const handleCreateUser = (userData: { name: string; email: string }) => {
    createUser(userData); // 完全类型化 - 仅接受正确的数据形状
  };

  return (
    <div>
      <button onClick={() => handleFetchUser('123')}>
        获取用户
      </button>
      {getLoading && <div>正在加载用户...</div>}
      {getError && <div>错误: {getError.message}</div>}
      {user && <div>用户: {user.name}</div>}

      <button onClick={() => handleCreateUser({ name: 'John', email: 'john@example.com' })}>
        创建用户
      </button>
      {createLoading && <div>正在创建用户...</div>}
      {createError && <div>错误: {createError.message}</div>}
      {createdUser && <div>已创建: {createdUser.name}</div>}
    </div>
  );
}
```

**自定义错误类型：**

```typescript jsx
import { createExecuteApiHooks } from '@ahoo-wang/fetcher-react';

// 定义自定义错误类型
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

// 使用自定义错误类型生成 hooks
@api('/data')
class DataApi {
  @get('/{id}')
  getData(@path('id') id: string): Promise<Data> {
    throw autoGeneratedError(id);
  }
}

const apiHooks = createExecuteApiHooks<
  { getData: (id: string) => Promise<Data> },
  ApiError
>({
  api: new DataApi(),
  errorType: ApiError,
});

function MyComponent() {
  const { error, execute } = apiHooks.useGetData();

  // error 现在类型化为 ApiError | undefined
  if (error) {
    console.log('状态码:', error.statusCode); // TypeScript 知道 statusCode
  }
}
```

**具有类方法的高级用法：**

```typescript jsx
import { createExecuteApiHooks } from '@ahoo-wang/fetcher-react';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // 静态方法示例
  static async healthCheck(): Promise<{ status: string }> {
    const response = await fetch('/api/health');
    return response.json();
  }
}

const apiClient = new ApiClient('/api');
const apiHooks = createExecuteApiHooks({ api: apiClient });

// 生成的 hooks: useGet, usePost
// 静态方法也会被发现: useHealthCheck

function ApiComponent() {
  const { execute: getData } = apiHooks.useGet();
  const { execute: postData } = apiHooks.usePost();
  const { execute: healthCheck } = apiHooks.useHealthCheck();

  return (
    <div>
      <button onClick={() => getData('/users')}>获取用户</button>
      <button onClick={() => postData('/users', { name: '新用户' })}>创建用户</button>
      <button onClick={() => healthCheck()}>健康检查</button>
    </div>
  );
}
```

#### createQueryApiHooks

🚀 **自动类型安全查询 API Hooks 生成** - 从 API 对象自动生成完全类型化的 React 查询 hooks，具有自动查询状态管理、自动执行和高级执行控制。

`createQueryApiHooks` 函数自动发现 API 对象中的查询方法，并创建相应的扩展 `useQuery` 的 React hooks。每个生成的 hook 都提供自动查询参数管理、状态管理和对具有类型安全查询访问的自定义执行回调的支持。

**主要特性：**

- **自动方法发现**：遍历对象属性和原型链
- **类型安全查询 Hooks**：查询参数和返回类型的完整 TypeScript 推断
- **查询状态管理**：内置 `setQuery` 和 `getQuery` 进行参数管理
- **自动执行**：查询参数更改时可选的自动执行
- **执行控制**：`onBeforeExecute` 回调用于查询检查/修改和中止控制器访问
- **自定义错误类型**：支持指定超出默认 `FetcherError` 的错误类型

```typescript jsx
import { createQueryApiHooks } from '@ahoo-wang/fetcher-react';
import { api, get, post, patch, path, body, autoGeneratedError } from '@ahoo-wang/fetcher-decorator';

// 使用装饰器定义您的 API 服务
@api('/users')
class UserApi {
  @get('')
  getUsers(query: UserListQuery, attributes?: Record<string, any>): Promise<User[]> {
    throw autoGeneratedError(query, attributes);
  }

  @get('/{id}')
  getUser(query: { id: string }, attributes?: Record<string, any>): Promise<User> {
    throw autoGeneratedError(query, attributes);
  }

  @post('')
  createUser(query: { name: string; email: string }, attributes?: Record<string, any>): Promise<User> {
    throw autoGeneratedError(query, attributes);
  }
}

const apiHooks = createQueryApiHooks({ api: new UserApi() });

function UserListComponent() {
  const { loading, result, error, execute, setQuery, getQuery } = apiHooks.useGetUsers({
    initialQuery: { page: 1, limit: 10 },
    autoExecute: true,
    onBeforeExecute: (abortController, query) => {
      // query 是完全类型化的 UserListQuery
      console.log('正在执行查询:', query);
      // 如果需要，可以就地修改查询参数
      query.page = Math.max(1, query.page);
    },
  });

  const handlePageChange = (page: number) => {
    // 自动更新查询并触发执行（如果 autoExecute: true）
    setQuery({ ...getQuery(), page });
  };

  if (loading) return <div>正在加载...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={() => handlePageChange(2)}>转到第2页</button>
      {result?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

function UserDetailComponent() {
  const { result: user, execute } = apiHooks.useGetUser({
    initialQuery: { id: '123' },
  });

  return (
    <div>
      <button onClick={execute}>加载用户</button>
      {user && <div>用户: {user.name}</div>}
    </div>
  );
}
```

**自定义错误类型：**

```typescript jsx
import { createQueryApiHooks } from '@ahoo-wang/fetcher-react';

// 定义自定义错误类型
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

// 使用自定义错误类型生成查询 hooks
@api('/data')
class DataApi {
  @get('/{id}')
  getData(
    query: { id: string },
    attributes?: Record<string, any>,
  ): Promise<Data> {
    throw autoGeneratedError(query, attributes);
  }
}

const apiHooks = createQueryApiHooks<
  {
    getData: (
      query: { id: string },
      attributes?: Record<string, any>,
    ) => Promise<Data>;
  },
  ApiError
>({
  api: new DataApi(),
  errorType: ApiError,
});

function MyComponent() {
  const { error, execute } = apiHooks.useGetData();

  // error 现在类型化为 ApiError | undefined
  if (error) {
    console.log('状态码:', error.statusCode); // TypeScript 知道 statusCode
  }
}
```

**高级用法与手动查询管理：**

```typescript jsx
import { createQueryApiHooks } from '@ahoo-wang/fetcher-react';

const apiHooks = createQueryApiHooks({ api: userApi });

function SearchComponent() {
  const { loading, result, setQuery, getQuery } = apiHooks.useGetUsers({
    initialQuery: { search: '', page: 1 },
    autoExecute: false, // 手动执行控制
  });

  const handleSearch = (searchTerm: string) => {
    // 更新查询而不自动执行
    setQuery({ search: searchTerm, page: 1 });
  };

  const handleSearchSubmit = () => {
    // 使用当前查询手动执行
    apiHooks.useGetUsers().execute();
  };

  const currentQuery = getQuery(); // 访问当前查询参数

  return (
    <div>
      <input
        value={currentQuery.search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜索用户..."
      />
      <button onClick={handleSearchSubmit} disabled={loading}>
        {loading ? '搜索中...' : '搜索'}
      </button>
      {result?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 核心 Hooks

#### useExecutePromise

`useExecutePromise` hook 用于管理异步操作，具有自动状态处理、竞态条件保护和 Promise 状态选项。它包含用于取消操作的自动 AbortController 支持。

```typescript jsx
import { useExecutePromise } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, result, error, execute, reset, abort } = useExecutePromise<string>({
    onAbort: () => {
      console.log('操作已被中止');
    }
  });

  const fetchData = async () => {
    const response = await fetch('/api/data');
    return response.text();
  };

  const handleFetch = () => {
    execute(fetchData); // 使用 Promise 供应商
  };

  const handleDirectPromise = () => {
    const promise = fetch('/api/data').then(res => res.text());
    execute(promise); // 使用直接 Promise
  };

  const handleAbort = () => {
    abort(); // 手动中止当前操作
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  return (
    <div>
      <button onClick={handleFetch}>使用供应商获取</button>
      <button onClick={handleDirectPromise}>使用 Promise 获取</button>
      <button onClick={handleAbort} disabled={!loading}>中止</button>
      <button onClick={reset}>重置</button>
      {result && <p>{result}</p>}
    </div>
  );
};
```

##### 中止控制器支持

该 hook 会为每个操作自动创建一个 AbortController，并提供管理取消的方法：

- **自动清理**: 组件卸载时操作会自动中止
- **手动中止**: 使用 `abort()` 方法中止正在进行的操作
- **onAbort 回调**: 配置在操作中止时触发的回调（手动或自动）
- **AbortController 访问**: AbortController 会传递给 Promise 供应商以进行高级取消处理

#### usePromiseState

`usePromiseState` hook 提供 Promise 操作的状态管理，无执行逻辑。支持静态选项和动态选项供应商。

```typescript jsx
import { usePromiseState, PromiseStatus } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { status, loading, result, error, setSuccess, setError, setIdle } = usePromiseState<string>();

  const handleSuccess = () => setSuccess('数据已加载');
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

##### 使用选项供应商的 usePromiseState

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

#### useRequestId

`useRequestId` hook 提供请求 ID 管理，用于防止异步操作中的竞态条件。

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

#### useLatest

`useLatest` hook 返回包含最新值的 ref 对象，用于在异步回调中访问当前值。

```typescript jsx
import { useLatest } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const [count, setCount] = useState(0);
  const latestCount = useLatest(count);

  const handleAsync = async () => {
    await someAsyncOperation();
    console.log('最新计数:', latestCount.current); // 始终是最新的
  };

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
      <button onClick={handleAsync}>异步日志</button>
    </div>
  );
};
```

#### useRefs

`useRefs` hook 提供 Map-like 接口用于动态管理多个 React refs。它允许通过键注册、检索和管理 refs，并在组件卸载时自动清理。

```typescript jsx
import { useRefs } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const refs = useRefs<HTMLDivElement>();

  const handleFocus = (key: string) => {
    const element = refs.get(key);
    element?.focus();
  };

  return (
    <div>
      <div ref={refs.register('first')} tabIndex={0}>第一个元素</div>
      <div ref={refs.register('second')} tabIndex={0}>第二个元素</div>
      <button onClick={() => handleFocus('first')}>聚焦第一个</button>
      <button onClick={() => handleFocus('second')}>聚焦第二个</button>
    </div>
  );
};
```

主要特性:

- **动态注册**: 使用字符串、数字或符号键注册 refs
- **Map-like API**: 完整的 Map 接口，包括 get、set、has、delete 等
- **自动清理**: 组件卸载时清除 refs
- **类型安全**: 完整的 TypeScript 支持 ref 类型

#### useQuery

`useQuery` hook 提供完整的查询基础异步操作管理解决方案，具有自动状态管理和执行控制。

```typescript jsx
import { useQuery } from '@ahoo-wang/fetcher-react';

interface UserQuery {
  id: string;
}

interface User {
  id: string;
  name: string;
}

function UserComponent() {
  const { loading, result, error, execute, setQuery } = useQuery<UserQuery, User>({
    initialQuery: { id: '1' },
    execute: async (query) => {
      const response = await fetch(`/api/users/${query.id}`);
      return response.json();
    },
    autoExecute: true,
  });

  const handleUserChange = (userId: string) => {
    setQuery({ id: userId }); // 如果 autoExecute 为 true 会自动执行
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  return (
    <div>
      <button onClick={() => handleUserChange('2')}>加载用户 2</button>
      {result && <p>用户: {result.name}</p>}
    </div>
  );
}
```

#### useQueryState

`useQueryState` hook 提供查询参数的状态管理，具有自动执行功能。

```typescript jsx
import { useQueryState } from '@ahoo-wang/fetcher-react';

interface UserQuery {
  id: string;
  name?: string;
}

function UserComponent() {
  const executeQuery = async (query: UserQuery) => {
    // 执行查询逻辑
    console.log('执行查询:', query);
  };

  const { getQuery, setQuery } = useQueryState<UserQuery>({
    initialQuery: { id: '1' },
    autoExecute: true,
    execute: executeQuery,
  });

  const handleQueryChange = (newQuery: UserQuery) => {
    setQuery(newQuery); // 如果 autoExecute 为 true 会自动执行
  };

  const currentQuery = getQuery(); // 获取当前查询参数

  return (
    <div>
      <button onClick={() => handleQueryChange({ id: '2', name: 'John' })}>
        更新查询
      </button>
    </div>
  );
}
```

#### useMounted

`useMounted` hook 提供检查组件是否仍挂载的方法，用于避免在卸载组件上更新状态。

```typescript jsx
import { useMounted } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const isMounted = useMounted();

  const handleAsyncOperation = async () => {
    const result = await someAsyncOperation();

    // 检查组件是否仍挂载后再更新状态
    if (isMounted()) {
      setData(result);
    }
  };

  return (
    <div>
      <button onClick={handleAsyncOperation}>执行异步操作</button>
    </div>
  );
};
```

#### useForceUpdate

`useForceUpdate` hook 提供强制组件重新渲染的方法，用于在需要基于外部变化触发渲染时使用。

```typescript jsx
import { useForceUpdate } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const forceUpdate = useForceUpdate();

  const handleExternalChange = () => {
    // 执行不会触发重新渲染的外部操作
    updateExternalState();

    // 强制组件重新渲染以反映变化
    forceUpdate();
  };

  return (
    <div>
      <button onClick={handleExternalChange}>强制更新</button>
    </div>
  );
};
```

### 防抖 Hooks

🚀 **React 应用的高级防抖** - 强大的 hooks，将防抖与异步操作结合，为 API 调用、用户交互和 Promise 执行提供无缝的速率限制。

#### useDebouncedCallback

React hook，为任何回调函数提供防抖版本，支持前缘/后缘执行选项。

```typescript jsx
import { useDebouncedCallback } from '@ahoo-wang/fetcher-react';

const SearchComponent = () => {
  const { run: debouncedSearch, cancel, isPending } = useDebouncedCallback(
    async (query: string) => {
      const response = await fetch(`/api/search?q=${query}`);
      const results = await response.json();
      console.log('搜索结果:', results);
    },
    { delay: 300 }
  );

  const handleSearch = (query: string) => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      cancel(); // 取消任何待处理的搜索
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="搜索..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending() && <div>搜索中...</div>}
    </div>
  );
};
```

**配置选项:**

- `delay`: 执行前的延迟毫秒数（必需，正数）
- `leading`: 第一次调用时立即执行（默认：false）
- `trailing`: 最后一次调用后延迟执行（默认：true）

#### useDebouncedExecutePromise

将 Promise 执行与防抖功能结合，适用于 API 调用和异步操作。

```typescript jsx
import { useDebouncedExecutePromise } from '@ahoo-wang/fetcher-react';

const DataFetcher = () => {
  const { loading, result, error, run } = useDebouncedExecutePromise({
    debounce: { delay: 300 },
  });

  const handleLoadUser = (userId: string) => {
    run(async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    });
  };

  return (
    <div>
      <button onClick={() => handleLoadUser('user123')}>
        加载用户
      </button>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {result && <div>用户: {result.name}</div>}
    </div>
  );
};
```

#### useDebouncedQuery

将通用查询执行与防抖结合，适用于自定义查询操作，您希望根据查询参数防抖执行。

```typescript jsx
import { useDebouncedQuery } from '@ahoo-wang/fetcher-react';

interface SearchQuery {
  keyword: string;
  limit: number;
  filters?: { category?: string };
}

interface SearchResult {
  items: Array<{ id: string; title: string }>;
  total: number;
}

const SearchComponent = () => {
  const {
    loading,
    result,
    error,
    run,
    cancel,
    isPending,
    setQuery,
    getQuery,
  } = useDebouncedQuery<SearchQuery, SearchResult>({
    initialQuery: { keyword: '', limit: 10 },
    execute: async (query) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify(query),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    debounce: { delay: 300 }, // 防抖 300ms
    autoExecute: false, // 挂载时不执行
  });

  const handleSearch = (keyword: string) => {
    setQuery({ keyword, limit: 10 }); // 如果 autoExecute 为 true，这将触发防抖执行
  };

  const handleManualSearch = () => {
    run(); // 使用当前查询手动防抖执行
  };

  const handleCancel = () => {
    cancel(); // 取消任何待处理的防抖执行
  };

  if (loading) return <div>搜索中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜索..."
      />
      <button onClick={handleManualSearch} disabled={isPending()}>
        {isPending() ? '搜索中...' : '搜索'}
      </button>
      <button onClick={handleCancel}>取消</button>
      {result && (
        <div>
          找到 {result.total} 项:
          {result.items.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**主要特性:**

- **查询状态管理**: 使用 `setQuery` 和 `getQuery` 自动查询参数处理
- **防抖执行**: 在快速查询更改期间防止过多操作
- **自动执行**: 可选的在查询参数更改时自动执行
- **手动控制**: `run()` 用于手动执行，`cancel()` 用于取消
- **待处理状态**: `isPending()` 检查防抖调用是否排队
- **自定义执行**: 灵活的 execute 函数用于任何查询操作

### Fetcher Hooks

#### useFetcher

`useFetcher` hook 提供完整的数据获取功能，具有自动状态管理、竞态条件保护和灵活的配置选项。它包含从 `useExecutePromise` 继承的内置 AbortController 支持。

```typescript jsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { loading, error, result, execute, abort } = useFetcher<string>({
    onAbort: () => {
      console.log('获取操作已被中止');
    }
  });

  const handleFetch = () => {
    execute({ url: '/api/users', method: 'GET' });
  };

  const handleAbort = () => {
    abort(); // 取消当前获取操作
  };
```

#### 自动执行示例

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    list: async (listQuery) => fetchListData(listQuery),
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行
  // 您仍然可以使用 execute() 手动触发或更新条件

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

#### useFetcherQuery

`useFetcherQuery` hook 提供构建与 Fetcher 库集成的专用查询 hooks 的基础。

```typescript jsx
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { data, loading, error, execute } = useFetcherQuery({
    url: '/api/data',
    initialQuery: { /* 查询参数 */ },
    execute: async (query) => {
      // 自定义执行逻辑
      return fetchData(query);
    },
    autoExecute: true,
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
```

### 防抖 Fetcher Hooks

#### useDebouncedFetcher

专门的 hook，将 HTTP 获取与防抖结合，基于核心 fetcher 库构建。

```typescript jsx
import { useDebouncedFetcher } from '@ahoo-wang/fetcher-react';

const SearchInput = () => {
  const [query, setQuery] = useState('');
  const { loading, result, error, run } = useDebouncedFetcher({
    debounce: { delay: 300 },
    onSuccess: (data) => {
      setSearchResults(data.results);
    }
  });

  const handleChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      run({
        url: '/api/search',
        method: 'GET',
        params: { q: value }
      });
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索..."
      />
      {loading && <div>搜索中...</div>}
      {error && <div>错误: {error.message}</div>}
      {result && <SearchResults data={result} />}
    </div>
  );
};
```

**防抖策略:**

- **前缘**: 第一次调用时立即执行，然后对后续调用进行防抖
- **后缘**: 最后一次调用后延迟执行（默认行为）
- **前缘 + 后缘**: 立即执行，如果再次调用则在延迟后再次执行

#### useDebouncedFetcherQuery

将基于查询的 HTTP 获取与防抖结合，非常适合搜索输入和动态查询场景，您希望根据查询参数防抖 API 调用。

```typescript jsx
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';

interface SearchQuery {
  keyword: string;
  limit: number;
  filters?: { category?: string };
}

interface SearchResult {
  items: Array<{ id: string; title: string }>;
  total: number;
}

const SearchComponent = () => {
  const {
    loading,
    result,
    error,
    run,
    cancel,
    isPending,
    setQuery,
    getQuery,
  } = useDebouncedFetcherQuery<SearchQuery, SearchResult>({
    url: '/api/search',
    initialQuery: { keyword: '', limit: 10 },
    debounce: { delay: 300 }, // 防抖 300ms
    autoExecute: false, // 挂载时不执行
  });

  const handleSearch = (keyword: string) => {
    setQuery({ keyword, limit: 10 }); // 如果 autoExecute 为 true，这将触发防抖执行
  };

  const handleManualSearch = () => {
    run(); // 使用当前查询手动防抖执行
  };

  const handleCancel = () => {
    cancel(); // 取消任何待处理的防抖执行
  };

  if (loading) return <div>搜索中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜索..."
      />
      <button onClick={handleManualSearch} disabled={isPending()}>
        {isPending() ? '搜索中...' : '搜索'}
      </button>
      <button onClick={handleCancel}>取消</button>
      {result && (
        <div>
          找到 {result.total} 项:
          {result.items.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**主要特性:**

- **查询状态管理**: 使用 `setQuery` 和 `getQuery` 自动查询参数处理
- **防抖执行**: 在快速用户输入期间防止过多 API 调用
- **自动执行**: 可选的在查询参数更改时自动执行
- **手动控制**: `run()` 用于手动执行，`cancel()` 用于取消
- **待处理状态**: `isPending()` 检查防抖调用是否排队

### 存储 Hooks

#### useKeyStorage

`useKeyStorage` hook 为 KeyStorage 实例提供响应式状态管理。它订阅存储更改并返回当前值以及设置器函数。可选择接受默认值以在存储为空时使用。

```typescript jsx
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useKeyStorage } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({ key: 'my-key' });

  // 不使用默认值 - 可能为 null
  const [value, setValue] = useKeyStorage(keyStorage);

  return (
    <div>
      <p>当前值: {value || '无存储值'}</p>
      <button onClick={() => setValue('new value')}>
        更新值
      </button>
    </div>
  );
};
```

#### 使用默认值

```typescript jsx
const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({ key: 'theme' });

  // 使用默认值 - 保证不为 null
  const [theme, setTheme] = useKeyStorage(keyStorage, 'light');

  return (
    <div className={theme}>
      <p>当前主题: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        切换主题
      </button>
    </div>
  );
};
```

#### 更多示例

```typescript jsx
// 处理不同类型的值
const numberStorage = new KeyStorage<number>({ key: 'counter' });
const [count, setCount] = useKeyStorage(numberStorage, 0); // 默认为 0

// 处理对象
interface User {
  id: string;
  name: string;
}

const userStorage = new KeyStorage<User>({ key: 'current-user' });
const [user, setUser] = useKeyStorage(userStorage, { id: '', name: '访客' });

// 复杂状态管理
const settingsStorage = new KeyStorage<{ volume: number; muted: boolean }>({
  key: 'audio-settings',
});
const [settings, setSettings] = useKeyStorage(settingsStorage, {
  volume: 50,
  muted: false,
});

// 更新特定属性
const updateVolume = (newVolume: number) => {
  setSettings({ ...settings, volume: newVolume });
};
```

### useImmerKeyStorage

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

### 事件 Hooks

#### useEventSubscription

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

### CoSec 安全 Hooks

🛡️ **企业安全集成** - 强大的 React hooks，用于使用 CoSec 令牌管理认证状态，提供与企业安全系统的无缝集成和自动令牌生命周期管理。

#### useSecurity

`useSecurity` hook 使用 CoSec 令牌提供对认证状态和操作的响应式访问。它与 TokenStorage 集成以持久化令牌，并在令牌更改时响应式更新状态。

```typescript jsx
import { useSecurity } from '@ahoo-wang/fetcher-react';
import { tokenStorage } from './tokenStorage';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const { currentUser, authenticated, signIn, signOut } = useSecurity(tokenStorage, {
    onSignIn: () => {
      // 登录成功后重定向到仪表板
      navigate('/dashboard');
    },
    onSignOut: () => {
      // 登出后重定向到登录页面
      navigate('/login');
    }
  });

  const handleSignIn = async () => {
    // 直接令牌
    await signIn(compositeToken);

    // 或异步函数
    await signIn(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      return response.json();
    });
  };

  if (!authenticated) {
    return <button onClick={handleSignIn}>登录</button>;
  }

  return (
    <div>
      <p>欢迎, {currentUser.sub}!</p>
      <button onClick={signOut}>登出</button>
    </div>
  );
}
```

**关键特性:**

- **响应式认证状态**: 当令牌更改时自动更新
- **灵活的登录方法**: 支持直接令牌和异步令牌提供者
- **生命周期回调**: 可配置的登录和登出事件回调
- **类型安全**: 完全支持 TypeScript，具有 CoSec JWT 负载类型
- **令牌持久化**: 与 TokenStorage 集成以实现跨会话持久化

#### SecurityProvider

`SecurityProvider` 组件包装您的应用程序以通过 React 上下文提供认证上下文。它在内部使用 `useSecurity` hook，并通过 `useSecurityContext` hook 使认证状态可用于所有子组件。

```tsx
import { SecurityProvider } from '@ahoo-wang/fetcher-react';
import { tokenStorage } from './tokenStorage';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <SecurityProvider
      tokenStorage={tokenStorage}
      onSignIn={() => navigate('/dashboard')}
      onSignOut={() => navigate('/login')}
    >
      <MyApp />
    </SecurityProvider>
  );
}
```

**配置选项:**

- `tokenStorage`: 用于管理认证令牌的 TokenStorage 实例
- `onSignIn`: 登录成功时调用的回调函数
- `onSignOut`: 登出时调用的回调函数
- `children`: 将有权访问安全上下文的子组件

#### useSecurityContext

`useSecurityContext` hook 在被 `SecurityProvider` 包装的组件中提供对认证状态和方法的访问。它通过 React 上下文提供与 `useSecurity` 相同的接口。

```tsx
import { useSecurityContext } from '@ahoo-wang/fetcher-react';

function UserProfile() {
  const { currentUser, authenticated, signOut } = useSecurityContext();

  if (!authenticated) {
    return <div>请登录</div>;
  }

  return (
    <div>
      <p>欢迎, {currentUser.sub}!</p>
      <button onClick={signOut}>登出</button>
    </div>
  );
}
```

**上下文优势:**

- **消除属性钻取**: 无需传递属性即可访问认证状态
- **组件隔离**: 无论组件树深度如何，组件都可以访问认证状态
- **集中式状态**: 应用程序中认证的单一真实来源
- **自动重新渲染**: 当认证状态更改时，组件自动重新渲染

### Wow 查询 Hooks

Wow 查询 Hooks 提供高级数据查询功能，具有内置的状态管理，用于条件、投影、排序、分页和限制。这些 hooks 专为与 `@ahoo-wang/fetcher-wow` 包配合使用而设计，用于复杂的查询操作。

#### 基础查询 Hooks

##### useListQuery

`useListQuery` hook 管理列表查询，具有条件、投影、排序和限制的状态管理。

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition, setLimit } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    execute: async (listQuery) => {
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

##### 自动执行示例

```typescript jsx
import { useListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
    execute: async (listQuery) => fetchListData(listQuery),
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行
  // 您仍然可以使用 execute() 手动触发或更新条件

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

##### usePagedQuery

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

###### 自动执行示例

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
    execute: async (pagedQuery) => fetchPagedData(pagedQuery),
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <ul>
        {result?.list?.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
      <button onClick={() => setPagination({ index: result?.pagination?.index! - 1, size: 10 })} disabled={result?.pagination?.index === 1}>
        上一页
      </button>
      <button onClick={() => setPagination({ index: result?.pagination?.index! + 1, size: 10 })}>
        下一页
      </button>
    </div>
  );
};
```

##### useSingleQuery

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

###### 自动执行示例

```typescript jsx
import { useSingleQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useSingleQuery({
    initialQuery: { condition: {}, projection: {}, sort: [] },
    execute: async (singleQuery) => fetchSingleData(singleQuery),
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {result && <p>用户: {result.name}</p>}
    </div>
  );
};
```

##### useCountQuery

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

###### 自动执行示例

```typescript jsx
import { useCountQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useCountQuery({
    initialQuery: {},
    execute: async (condition) => fetchCount(condition),
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <p>总数: {result}</p>
    </div>
  );
};
```

##### useListStreamQuery

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

###### 自动执行示例

```typescript jsx
import { useListStreamQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result, loading, error, execute, setCondition } = useListStreamQuery({
    initialQuery: { condition: {}, projection: {}, sort: [], limit: 100 },
    execute: async (listQuery) => fetchListStream(listQuery),
    autoExecute: true, // 组件挂载时自动执行
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

  // 流将在组件挂载时自动启动

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {/* 流已自动启动 */}
    </div>
  );
};
```

#### Fetcher 查询 Hooks

##### useFetcherCountQuery

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

###### 自动执行示例

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

##### useFetcherPagedQuery

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

###### 自动执行示例

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

##### useFetcherListQuery

`useFetcherListQuery` hook 是使用 Fetcher 库执行列表查询的专用 React hook。它专为获取项目列表而设计，支持通过 ListQuery 类型进行过滤、排序和分页，返回结果数组。

```typescript jsx
import { useFetcherListQuery } from '@ahoo-wang/fetcher-react';
import { listQuery, contains, desc } from '@ahoo-wang/fetcher-wow';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function UserListComponent() {
  const {
    loading,
    result: users,
    error,
    execute,
    setQuery,
    getQuery,
  } = useFetcherListQuery<User, keyof User>({
    url: '/api/users/list',
    initialQuery: listQuery({
      condition: contains('name', 'John'),
      sort: [desc('createdAt')],
      limit: 10,
    }),
    autoExecute: true,
  });

  const loadMore = () => {
    const currentQuery = getQuery();
    setQuery({
      ...currentQuery,
      limit: (currentQuery.limit || 10) + 10,
    });
  };

  if (loading) return <div>正在加载用户...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>用户 ({users?.length || 0})</h2>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
      <button onClick={loadMore}>加载更多</button>
      <button onClick={execute}>刷新列表</button>
    </div>
  );
}
```

###### 自动执行示例

```typescript jsx
import { useFetcherListQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result: products, loading, error, execute } = useFetcherListQuery({
    url: '/api/products/list',
    initialQuery: {
      condition: { category: 'electronics' },
      projection: {},
      sort: [],
      limit: 20
    },
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>产品</h2>
      <ul>
        {products?.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

##### useFetcherListStreamQuery

`useFetcherListStreamQuery` hook 是使用 Fetcher 库通过服务器发送事件执行列表流查询的专用 React hook。它专为需要检索匹配列表查询条件的数据流场景而设计，返回 JSON 服务器发送事件的 ReadableStream，用于实时数据流式传输。

```typescript jsx
import { useFetcherListStreamQuery } from '@ahoo-wang/fetcher-react';
import { listQuery, contains } from '@ahoo-wang/fetcher-wow';
import { JsonServerSentEvent } from '@ahoo-wang/fetcher-eventstream';
import { useEffect, useRef } from 'react';

interface User {
  id: number;
  name: string;
}

function UserStreamComponent() {
  const { data: stream, loading, error, execute } = useFetcherListStreamQuery<User, 'id' | 'name'>({
    url: '/api/users/stream',
    initialQuery: listQuery({
      condition: contains('name', 'John'),
      limit: 10,
    }),
    autoExecute: true,
  });

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stream) {
      const reader = stream.getReader();
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // 处理 JsonServerSentEvent<User>
            const newUser = value.data;
            if (messagesRef.current) {
              const div = document.createElement('div');
              div.textContent = `新用户: ${newUser.name}`;
              messagesRef.current.appendChild(div);
            }
          }
        } catch (err) {
          console.error('流错误:', err);
        }
      };
      readStream();
    }
  }, [stream]);

  if (loading) return <div>正在加载流...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <div ref={messagesRef}></div>
      <button onClick={execute}>重新启动流</button>
    </div>
  );
}
```

###### 自动执行示例

```typescript jsx
import { useFetcherListStreamQuery } from '@ahoo-wang/fetcher-react';
import { useEffect, useRef } from 'react';

const MyComponent = () => {
  const { data: stream, loading, error, execute } = useFetcherListStreamQuery({
    url: '/api/notifications/stream',
    initialQuery: {
      condition: { type: 'important' },
      limit: 50
    },
    autoExecute: true, // 组件挂载时自动执行
  });

  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stream) {
      const reader = stream.getReader();
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const notification = value.data;
            if (notificationsRef.current) {
              const notificationDiv = document.createElement('div');
              notificationDiv.textContent = `通知: ${notification.message}`;
              notificationsRef.current.appendChild(notificationDiv);
            }
          }
        } catch (err) {
          console.error('流处理错误:', err);
        }
      };
      processStream();
    }
  }, [stream]);

  // 流将在组件挂载时自动启动

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>实时通知</h2>
      <div ref={notificationsRef}></div>
    </div>
  );
};
```

##### useFetcherSingleQuery

`useFetcherSingleQuery` hook 是使用 Fetcher 库执行单个项目查询的专用 React hook。它专为获取单个项目而设计，支持通过 SingleQuery 类型进行过滤和排序，返回单个结果项目。

```typescript jsx
import { useFetcherSingleQuery } from '@ahoo-wang/fetcher-react';
import { singleQuery, eq } from '@ahoo-wang/fetcher-wow';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function UserProfileComponent({ userId }: { userId: string }) {
  const {
    loading,
    result: user,
    error,
    execute,
  } = useFetcherSingleQuery<User, keyof User>({
    url: `/api/users/${userId}`,
    initialQuery: singleQuery({
      condition: eq('id', userId),
    }),
    autoExecute: true,
  });

  if (loading) return <div>正在加载用户...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!user) return <div>未找到用户</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>邮箱: {user.email}</p>
      <p>创建时间: {user.createdAt}</p>
      <button onClick={execute}>刷新</button>
    </div>
  );
}
```

###### 自动执行示例

```typescript jsx
import { useFetcherSingleQuery } from '@ahoo-wang/fetcher-react';

const MyComponent = () => {
  const { result: product, loading, error, execute } = useFetcherSingleQuery({
    url: '/api/products/featured',
    initialQuery: {
      condition: { featured: true },
      projection: {},
      sort: []
    },
    autoExecute: true, // 组件挂载时自动执行
  });

  // 查询将在组件挂载时自动执行

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!product) return <div>未找到产品</div>;

  return (
    <div>
      <h2>特色产品</h2>
      <div>{product.name}</div>
      <div>{product.description}</div>
    </div>
  );
};
```

## 最佳实践

### 性能优化

- 使用 `autoExecute: false` 来控制查询的执行时机
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

## 🚀 高级使用示例

### 自定义 Hook 组合

通过组合多个 fetcher-react hooks 创建可重用的 hooks：

```typescript jsx
import { useFetcher, usePromiseState, useLatest } from '@ahoo-wang/fetcher-react';
import { useCallback, useEffect } from 'react';

function useUserProfile(userId: string) {
  const latestUserId = useLatest(userId);
  const { loading, result: profile, error, execute } = useFetcher();

  const fetchProfile = useCallback(() => {
    execute({
      url: `/api/users/${latestUserId.current}`,
      method: 'GET'
    });
  }, [execute, latestUserId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

// 使用
function UserProfile({ userId }: { userId: string }) {
  const { profile, loading, error, refetch } = useUserProfile(userId);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>{profile?.name}</h2>
      <button onClick={refetch}>刷新</button>
    </div>
  );
}
```

### 错误边界集成

与 React 错误边界集成以获得更好的错误处理：

```typescript jsx
import { Component, ErrorInfo, ReactNode } from 'react';

class FetchErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
  > {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('获取错误边界捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>出现问题。</div>;
    }

    return this.props.children;
  }
}

// 与 hooks 一起使用
function DataComponent() {
  const { result, loading, error, execute } = useFetcher();

  // 错误将被边界捕获（如果抛出）
  if (error) {
    throw error;
  }

  return (
    <div>
      {loading ? '加载中...' : JSON.stringify(result)}
    </div>
  );
}

// 包装使用 fetcher hooks 的组件
function App() {
  return (
    <FetchErrorBoundary fallback={<div>加载数据失败</div>}>
      <DataComponent />
    </FetchErrorBoundary>
  );
}
```

### Suspense 集成

与 React Suspense 一起使用以获得更好的加载状态：

```typescript jsx
import { Suspense, useState } from 'react';
import { useFetcher } from '@ahoo-wang/fetcher-react';

// 创建抛出 Promise 的资源
function createDataResource<T>(promise: Promise<T>) {
  let status = 'pending';
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (data) => {
      status = 'success';
      result = data;
    },
    (err) => {
      status = 'error';
      error = err;
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw error;
      } else {
        return result;
      }
    }
  };
}

function DataComponent({ resource }: { resource: any }) {
  const data = resource.read(); // 如果待处理将抛出
  return <div>{JSON.stringify(data)}</div>;
}

function App() {
  const [resource, setResource] = useState<any>(null);

  const handleFetch = () => {
    const { execute } = useFetcher();
    const promise = execute({ url: '/api/data', method: 'GET' });
    setResource(createDataResource(promise));
  };

  return (
    <div>
      <button onClick={handleFetch}>获取数据</button>
      <Suspense fallback={<div>加载中...</div>}>
        {resource && <DataComponent resource={resource} />}
      </Suspense>
    </div>
  );
}
```

### 性能优化模式

优化性能的高级模式：

```typescript jsx
import { useMemo, useCallback, useRef } from 'react';
import { useListQuery } from '@ahoo-wang/fetcher-react';

function OptimizedDataTable({ filters, sortBy }) {
  // 记忆化查询配置以防止不必要的重新执行
  const queryConfig = useMemo(() => ({
    condition: filters,
    sort: [{ field: sortBy, order: 'asc' }],
    limit: 50
  }), [filters, sortBy]);

  const { result, loading, execute, setCondition } = useListQuery({
    initialQuery: queryConfig,
    execute: useCallback(async (query) => {
      // 防抖 API 调用
      await new Promise(resolve => setTimeout(resolve, 300));
      return fetchData(query);
    }, []),
    autoExecute: true
  });

  // 使用 ref 跟踪最新过滤器而不引起重新渲染
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  });

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      setCondition({ ...filtersRef.current, search: searchTerm });
    }, 500),
    [setCondition]
  );

  return (
    <div>
      <input
        onChange={(e) => debouncedSearch(e.target.value)}
        placeholder="搜索..."
      />
      {loading ? '加载中...' : (
        <table>
          <tbody>
            {result?.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// 防抖工具
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### 真实世界集成示例

显示与流行库集成的完整示例：

#### 与 React Query (TanStack Query) 集成

```typescript jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFetcher } from '@ahoo-wang/fetcher-react';

function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { execute } = useFetcher();
      const result = await execute({
        url: `/api/users/${userId}`,
        method: 'GET'
      });
      return result;
    }
  });
}

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useUserData(userId);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return <div>欢迎, {data.name}!</div>;
}
```

#### 与 Redux Toolkit 集成

```typescript jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useFetcher } from '@ahoo-wang/fetcher-react';

const fetchUserData = createAsyncThunk(
  'user/fetchData',
  async (userId: string) => {
    const { execute } = useFetcher();
    return await execute({
      url: `/api/users/${userId}`,
      method: 'GET'
    });
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

function UserComponent({ userId }: { userId: string }) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserData(userId));
  }, [userId, dispatch]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return <div>{data?.name}</div>;
}
```

#### 与 Zustand 集成

```typescript jsx
import { create } from 'zustand';
import { useFetcher } from '@ahoo-wang/fetcher-react';

interface UserStore {
  user: any;
  loading: boolean;
  error: string | null;
  fetchUser: (userId: string) => Promise<void>;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { execute } = useFetcher();
      const user = await execute({
        url: `/api/users/${userId}`,
        method: 'GET'
      });
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

function UserComponent({ userId }: { userId: string }) {
  const { user, loading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return <div>{user?.name}</div>;
}
```

### 测试模式

Hooks 的综合测试示例：

```typescript jsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetcher, useListQuery } from '@ahoo-wang/fetcher-react';

// 模拟 fetcher
jest.mock('@ahoo-wang/fetcher', () => ({
  Fetcher: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

describe('useFetcher', () => {
  it('应处理成功的获取', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockFetcher = { request: jest.fn().mockResolvedValue(mockData) };

    const { result } = renderHook(() => useFetcher({ fetcher: mockFetcher }));

    act(() => {
      result.current.execute({ url: '/api/test', method: 'GET' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });

  it('应处理获取错误', async () => {
    const mockError = new Error('网络错误');
    const mockFetcher = { request: jest.fn().mockRejectedValue(mockError) };

    const { result } = renderHook(() => useFetcher({ fetcher: mockFetcher }));

    act(() => {
      result.current.execute({ url: '/api/test', method: 'GET' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.result).toBe(null);
    });
  });
});

describe('useListQuery', () => {
  it('应管理查询状态', async () => {
    const mockData = [{ id: 1, name: 'Item 1' }];
    const mockExecute = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useListQuery({
        initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
        execute: mockExecute,
      }),
    );

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result).toEqual(mockData);
    });

    expect(mockExecute).toHaveBeenCalledWith({
      condition: {},
      projection: {},
      sort: [],
      limit: 10,
    });
  });

  it('应更新条件', () => {
    const { result } = renderHook(() =>
      useListQuery({
        initialQuery: { condition: {}, projection: {}, sort: [], limit: 10 },
        execute: jest.fn(),
      }),
    );

    act(() => {
      result.current.setCondition({ status: 'active' });
    });

    expect(result.current.condition).toEqual({ status: 'active' });
  });
});
```

## API 参考

### 防抖 Hooks

#### useDebouncedCallback

```typescript
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebouncedCallbackOptions,
): UseDebouncedCallbackReturn<T>;
```

为回调函数提供防抖版本的 React hook，支持前缘/后缘执行选项。

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

#### useDebouncedFetcherQuery

```typescript
function useDebouncedFetcherQuery<Q, R, E = FetcherError>(
  options: UseDebouncedFetcherQueryOptions<Q, R, E>,
): UseDebouncedFetcherQueryReturn<Q, R, E>;
```

将基于查询的 HTTP 获取与防抖相结合，非常适合搜索输入和动态查询场景，您希望根据查询参数防抖 API 调用。

**类型参数:**

- `Q`: 查询参数的类型
- `R`: 获取结果的类型
- `E`: 错误的类型（默认为 FetcherError）

**参数:**

- `options`: 扩展 `UseFetcherQueryOptions` 和 `DebounceCapable` 的配置对象
  - `url`: API 端点 URL（必需）
  - `initialQuery`: 初始查询参数（必需）
  - `autoExecute?`: 查询参数更改时是否自动执行
  - `debounce`: 防抖配置（delay、leading、trailing）
  - HTTP 请求选项（method、headers、timeout 等）

**返回:**

包含以下内容的对象：

- `loading`: 布尔值，表示获取当前是否正在执行
- `result`: 获取的解析值
- `error`: 执行期间发生的任何错误
- `status`: 当前执行状态
- `reset`: 重置获取器状态的函数
- `abort`: 中止当前操作的函数
- `getQuery`: 获取当前查询参数的函数
- `setQuery`: 更新查询参数的函数
- `run`: 使用当前查询执行防抖获取的函数
- `cancel`: 取消任何待处理防抖执行的函数
- `isPending`: 返回布尔值表示防抖执行当前是否待处理的函数

#### useDebouncedQuery

```typescript
function useDebouncedQuery<Q, R, E = FetcherError>(
  options: UseDebouncedQueryOptions<Q, R, E>,
): UseDebouncedQueryReturn<Q, R, E>;
```

将通用查询执行与防抖相结合，非常适合自定义查询操作，您希望根据查询参数防抖执行。

**类型参数:**

- `Q`: 查询参数的类型
- `R`: 结果的类型
- `E`: 错误的类型（默认为 FetcherError）

**参数:**

- `options`: 扩展 `UseQueryOptions` 和 `DebounceCapable` 的配置对象
  - `initialQuery`: 初始查询参数（必需）
  - `execute`: 使用参数执行查询的函数
  - `autoExecute?`: 挂载时或查询参数更改时是否自动执行
  - `debounce`: 防抖配置（delay、leading、trailing）
  - 所有来自 `UseExecutePromiseOptions` 的选项

**返回:**

包含以下内容的对象：

- `loading`: 布尔值，表示查询当前是否正在执行
- `result`: 查询的解析值
- `error`: 执行期间发生的任何错误
- `status`: 当前执行状态
- `reset`: 重置查询状态的函数
- `abort`: 中止当前操作的函数
- `getQuery`: 获取当前查询参数的函数
- `setQuery`: 更新查询参数的函数
- `run`: 使用当前参数执行防抖查询的函数
- `cancel`: 取消任何待处理防抖执行的函数
- `isPending`: 返回布尔值表示防抖执行当前是否待处理的函数

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

### useQuery

```typescript
function useQuery<Q, R, E = FetcherError>(
  options: UseQueryOptions<Q, R, E>,
): UseQueryReturn<Q, R, E>;
```

用于管理基于查询的异步操作的 React hook，具有自动状态管理和执行控制。

**类型参数:**

- `Q`: 查询参数的类型
- `R`: 结果值的类型
- `E`: 错误值的类型（默认为 FetcherError）

**参数:**

- `options`: 查询的配置选项
  - `initialQuery`: 初始查询参数
  - `execute`: 使用给定参数和可选属性执行查询的函数
  - `autoExecute?`: 是否在挂载和查询更改时自动执行查询
  - 所有来自 `UseExecutePromiseOptions` 的选项

**返回值:**

包含查询状态和控制函数的对象：

- `loading`: 布尔值，指示查询当前是否正在执行
- `result`: 查询的解析值
- `error`: 执行期间发生的任何错误
- `status`: 当前执行状态
- `execute`: 使用当前参数执行查询的函数
- `reset`: 重置 Promise 状态的函数
- `abort`: 中止当前操作的函数
- `getQuery`: 检索当前查询参数的函数
- `setQuery`: 更新查询参数的函数

### useQueryState

```typescript
function useQueryState<Q>(
  options: UseQueryStateOptions<Q>,
): UseQueryStateReturn<Q>;
```

用于管理查询状态的 React hook，具有自动执行功能。

**类型参数:**

- `Q`: 查询参数的类型

**参数:**

- `options`: hook 的配置选项
  - `initialQuery`: 要存储和管理的初始查询参数
  - `autoExecute?`: 是否在查询更改时或组件挂载时自动执行
  - `execute`: 使用当前查询参数执行的函数

**返回值:**

包含以下内容的对象：

- `getQuery`: 检索当前查询参数的函数
- `setQuery`: 更新查询参数的函数。如果 autoExecute 为 true 会触发执行

### useMounted

```typescript
function useMounted(): () => boolean;
```

返回检查组件是否仍挂载的函数的 React hook。

**返回值:**

当组件仍挂载时返回 `true`，否则返回 `false` 的函数。

### useForceUpdate

```typescript
function useForceUpdate(): () => void;
```

返回强制组件重新渲染的函数的 React hook。

**返回值:**

调用时强制组件重新渲染的函数。

### useEventSubscription

```typescript
function useEventSubscription<EVENT = unknown>(
  options: UseEventSubscriptionOptions<EVENT>,
): UseEventSubscriptionReturn;
```

为类型化事件总线提供 React 接口的 hook。自动管理订阅生命周期，同时提供手动控制功能。

**类型参数:**

- `EVENT`: 事件总线处理的事件类型（默认为 unknown）

**参数:**

- `options`: 订阅的配置选项
  - `bus`: 要订阅的 TypedEventBus 实例
  - `handler`: 具有名称和处理方法的事件处理函数

**返回值:**

包含以下内容的对象：

- `subscribe`: 手动订阅事件总线的函数（返回布尔值成功状态）
- `unsubscribe`: 手动取消订阅事件总线的函数（返回布尔值成功状态）

**相关类型:**

- `UseEventSubscriptionOptions<EVENT>`: 具有 bus 和 handler 属性的配置接口
- `UseEventSubscriptionReturn`: 具有 subscribe 和 unsubscribe 方法的返回接口

### useKeyStorage

```typescript
// 不使用默认值 - 可能返回 null
function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
): [T | null, (value: T) => void];

// 使用默认值 - 保证非空
function useKeyStorage<T>(
  keyStorage: KeyStorage<T>,
  defaultValue: T,
): [T, (value: T) => void];
```

为 KeyStorage 实例提供响应式状态管理的 React hook。订阅存储更改并返回当前值以及设置器函数。可选择接受默认值以在存储为空时使用。

**类型参数:**

- `T`: 存储在键存储中的值的类型

**参数:**

- `keyStorage`: 要订阅和管理的 KeyStorage 实例。应该是稳定引用（useRef、memo 或模块级实例）
- `defaultValue` _(可选)_: 当存储为空时使用的默认值。提供时，hook 保证返回的值永远不会为 null

**返回值:**

- **不使用默认值**: `[T | null, (value: T) => void]` - 元组，其中第一个元素在存储为空时可能为 null
- **使用默认值**: `[T, (value: T) => void]` - 元组，其中第一个元素保证不为 null（存储的值或默认值）

**示例:**

```typescript
// 不使用默认值
const [value, setValue] = useKeyStorage(keyStorage);
// value: string | null

// 使用默认值
const [theme, setTheme] = useKeyStorage(themeStorage, 'light');
// theme: string (永不为 null)
```

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

- `T`: 存储在键存储中的值的类型

**参数:**

- `keyStorage`: 要订阅和管理的 KeyStorage 实例。应该是稳定引用（useRef、memo 或模块级实例）
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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

**返回值:**

包含查询结果（包含项目和分页信息的 PagedList）、加载状态、错误状态和实用函数的对象。

### useFetcherListQuery

```typescript
function useFetcherListQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseFetcherListQueryOptions<R, FIELDS, E>,
): UseFetcherListQueryReturn<R, FIELDS, E>;
```

使用 fetcher 库在 wow 框架中执行列表查询的 React hook。它包装了 useFetcherQuery hook 并专门用于列表操作，返回结果数组，支持过滤、排序和分页。

**类型参数:**

- `R`: 结果数组中单个项目的类型（例如，User、Product）
- `FIELDS`: 列表查询中可用于过滤、排序和分页的字段
- `E`: 可能抛出的错误类型（默认为 `FetcherError`）

**参数:**

- `options`: 列表查询的配置选项，包括列表查询参数、fetcher 实例和其他查询设置
  - `url`: 从中获取列表数据的 URL
  - `initialQuery`: 初始列表查询配置
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

**返回值:**

包含查询结果（项目数组）、加载状态、错误状态和实用函数的对象。

### useFetcherListStreamQuery

```typescript
function useFetcherListStreamQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseFetcherListStreamQueryOptions<R, FIELDS, E>,
): UseFetcherListStreamQueryReturn<R, FIELDS, E>;
```

使用 Fetcher 库通过服务器发送事件执行列表流查询的 React hook。它包装了 useFetcherQuery hook 并专门用于流式操作，返回 JSON 服务器发送事件的 ReadableStream，用于实时数据流式传输。

**类型参数:**

- `R`: 流中每个事件包含的资源或实体的类型
- `FIELDS`: 列表查询中可用于过滤、排序和分页的字段
- `E`: 可能抛出的错误类型（默认为 `FetcherError`）

**参数:**

- `options`: 列表流查询的配置选项，包括列表查询参数、fetcher 实例和其他查询设置
  - `url`: 从中获取流数据的 URL
  - `initialQuery`: 初始列表查询配置
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

**返回值:**

包含查询结果（JSON 服务器发送事件的 ReadableStream）、加载状态、错误状态和实用函数的对象。

### useFetcherSingleQuery

```typescript
function useFetcherSingleQuery<
  R,
  FIELDS extends string = string,
  E = FetcherError,
>(
  options: UseFetcherSingleQueryOptions<R, FIELDS, E>,
): UseFetcherSingleQueryReturn<R, FIELDS, E>;
```

使用 fetcher 库在 wow 框架中执行单个项目查询的 React hook。它包装了 useFetcherQuery hook 并专门用于单个项目操作，返回单个结果项目，支持过滤和排序。

**类型参数:**

- `R`: 结果项目的类型（例如，User、Product）
- `FIELDS`: 单个查询中可用于过滤和排序的字段
- `E`: 可能抛出的错误类型（默认为 `FetcherError`）

**参数:**

- `options`: 单个查询的配置选项，包括单个查询参数、fetcher 实例和其他查询设置
  - `url`: 从中获取单个项目的 URL
  - `initialQuery`: 初始单个查询配置
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

**返回值:**

包含查询结果（单个项目）、加载状态、错误状态和实用函数的对象。

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
  - `autoExecute`: 是否在组件挂载时自动执行查询（默认为 true）

**返回值:**

包含 promise 状态、execute 函数以及条件、投影、排序和限制设置器的对象。

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
