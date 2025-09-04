# @ahoo-wang/fetcher-react

[Fetcher](https://github.com/Ahoo-Wang/fetcher) HTTP 客户端的 React 集成。提供 React Hooks，实现无缝的数据获取，自动重新渲染和加载状态管理。

## 功能特性

- 🔄 数据变化时自动重新渲染
- ⚡ 加载状态管理
- ❌ 错误处理
- 📡 AbortController 集成，支持请求取消
- 🎣 易用的 React Hooks API
- 📦 轻量级且类型安全

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

## 使用方法

### 基础用法

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function UserList() {
  const { data: users, loading, error } = useFetcher<User[]>({
    url: '/api/users',
    method: 'GET'
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!users) return <div>未找到用户</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 手动执行

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, execute } = useFetcher<User>(
    { url: `/api/users/${userId}` },
    { autoExecute: false }
  );

  useEffect(() => {
    if (userId) {
      execute();
    }
  }, [userId]);

  // ... 渲染逻辑
}
```

### 动态请求

```tsx
import { useFetcher } from '@ahoo-wang/fetcher-react';

function UserSearch({ searchTerm }: { searchTerm: string }) {
  const { data: users, loading, error } = useFetcher<User[]>(
    (signal) => ({
      url: '/api/users/search',
      method: 'POST',
      body: { term: searchTerm },
      signal
    }),
    { deps: [searchTerm] }
  );

  // ... 渲染逻辑
}
```

### 使用自定义 Fetcher 实例

```tsx
import { createFetcher } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

const customFetcher = createFetcher({
  baseURL: 'https://api.example.com'
});

function Component() {
  const { data, loading, error } = useFetcher(
    { url: '/endpoint' },
    { fetcher: customFetcher }
  );

  // ... 渲染逻辑
}
```

## API

### `useFetcher<DataType>(request, options)`

用于发起 HTTP 请求的 React Hook。

#### 参数

- `request`: [FetchRequest](https://github.com/Ahoo-Wang/fetcher#fetchrequest) 对象或返回请求对象的函数
- `options`: 配置选项
    - `autoExecute` (boolean, 默认: `true`): 是否自动执行请求
    - `deps` (any[], 默认: `[]`): 触发重新获取的依赖项
    - `fetcher` (Fetcher, 可选): 使用的自定义 Fetcher 实例

#### 返回值

包含以下属性的对象：

- `loading` (boolean): 请求是否正在进行中
- `data` (DataType | undefined): 请求成功时的响应数据
- `error` (Error | undefined): 请求期间发生的任何错误
- `response` (FetchResponse | undefined): 原始响应对象
- `execute` (() => Promise<FetchResponse | undefined>): 手动触发请求的函数

## 许可证

[Apache 2.0](../../LICENSE)