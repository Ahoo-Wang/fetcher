# `@ahoo-wang/fetcher-react`

面向 Fetcher 请求、查询状态、存储、事件与 CoSec 安全的 React Hooks。组件需要持有异步状态和取消行为时使用。

## 安装

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

按导入的集成安装对应 peer 包：EventBus、Storage 或 CoSec。

> **Wow 查询 Hook 已迁出。** `useSingleQuery`、`useListQuery`、`usePagedQuery`、
> `useCountQuery`、`useListStreamQuery` 等 Wow Hook 已迁往
> [Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript) 的
> `@ahoo-wang/wow-react`，版本跟随 Wow。数据监控 Hook（`useDataMonitor`、
> `DataMonitorService`）随 `@ahoo-wang/fetcher-viewer` 一起退役。
> `@ahoo-wang/wow-react` 自 Wow 9.2.0 起已发布到 npm，自 Wow 9.2.1 起兼容
> fetcher 6。升级时先切换到 `@ahoo-wang/wow-react`（9.2.1 及以上），再升级
> fetcher；文档见 [wow.ahoo.me](https://wow.ahoo.me)。5.x 版本线（`5.x` 分支，
> npm 上的 5.1.x）继续为存量用户提供 `@ahoo-wang/fetcher-react` 里的 Wow Hook
> 与数据监控 Hook。

## 示例

查询放在你自己的状态里；内容变化时 Hook 执行它，并取消被替换的请求。

```tsx
import { useState } from 'react';
import { useQuery } from '@ahoo-wang/fetcher-react';

export function UserSearch() {
  const [query, setQuery] = useState({ keyword: '' });
  const { loading, result, error } = useQuery({
    query,
    execute: (query, abortController) =>
      api.searchUsers(query, abortController),
  });

  return (
    <section>
      <input
        value={query.keyword}
        onChange={e => setQuery({ keyword: e.target.value })}
      />
      {loading && <p>搜索中…</p>}
      {error && <p role="alert">搜索失败</p>}
      {result?.map(user => (
        <p key={user.id}>{user.name}</p>
      ))}
    </section>
  );
}
```

`execute` 从不 reject：它 resolve 为本次请求结束时的状态；被新请求、`abort()`、
`reset()` 或卸载取消时为 `idle`。

```tsx
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

export function SaveButton({ user }: { user: User }) {
  const { loading, execute } = useFetcher<User>({
    resultExtractor: ResultExtractors.Json,
  });

  const save = async () => {
    const { status, error } = await execute({
      url: `/api/users/${user.id}`,
      method: 'PUT',
      body: user,
    });
    if (status === 'success') toast('已保存');
    else if (status === 'error') toast(error.message);
  };

  return (
    <button disabled={loading} onClick={() => void save()}>
      保存
    </button>
  );
}
```

## 按任务选择 Hook

- 异步核心：Promise 状态、可取消的执行、受控查询、防抖值与防抖回调、最新引用。
- Fetcher：请求执行、JSON 查询、防抖请求与防抖查询。
- API 对象：从返回 Promise 的方法派生 execute/query Hooks。
- 状态：类型化 KeyStorage 与事件总线订阅。
- CoSec：安全 Provider、用户状态与路由守卫。

## 文档

- [React 数据流](https://fetcher.ahoo.me/zh/guides/react/)
- [React 参考](https://fetcher.ahoo.me/zh/reference/react)
- [交互式 Hook Story](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)

### 子路径入口

核心 Hook（`useExecutePromise`、`useQuery`、`useDebouncedQuery` 等）也可从 ESM
子路径 `@ahoo-wang/fetcher-react/core` 导入，Fetcher Hook（`useFetcher`、
`useFetcherQuery` 及其防抖版本）也可从 `@ahoo-wang/fetcher-react/fetcher` 导入。
两者都不加载安全、存储与事件总线集成。根入口与它们共用模块，不同入口的 Hook 可以
混用；`pnpm test:package` 在构建产物上验证这一点，并包含在 `build` 中。
