---
title: React 参考
description: 在 React 中管理 Fetcher 请求、查询、存储、事件与鉴权状态。
---

# `@ahoo-wang/fetcher-react`

React 包把 Fetcher 原语连接到组件状态。它的 Hook 会防止过期结果覆盖新结果，在替换
请求或卸载时中止请求，并暴露明确的 loading、result、error 和 reset 控制。

## 安装

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

导入某项集成时，还需安装对应 peer 包，例如 `fetcher-storage`、`fetcher-eventbus`、
`fetcher-wow` 或 `fetcher-cosec`。

## 请求与查询

```tsx
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

interface SearchQuery {
  term: string;
}

interface SearchResult {
  items: Array<{ id: string; title: string }>;
}

function Search() {
  const { loading, result, error, setQuery, execute } = useFetcherQuery<
    SearchQuery,
    SearchResult
  >({
    url: '/api/search',
    initialQuery: { term: '' },
    autoExecute: false,
  });

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        void execute();
      }}
    >
      <input onChange={event => setQuery({ term: event.target.value })} />
      <button disabled={loading}>搜索</button>
      {error && <p role="alert">搜索失败</p>}
      <ul>
        {result?.items.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </form>
  );
}
```

`useFetcher` 执行完整 `FetchRequest`；`useFetcherQuery` 针对 JSON POST 查询特化，
并持有查询状态。防抖变体会延迟快速变化的任务，同时保留取消行为。

## Hook 家族

| 家族       | 主要 API                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------- |
| 异步状态   | `useExecutePromise`、`usePromiseState`、`useQuery`、`useQueryState`                      |
| Fetcher    | `useFetcher`、`useFetcherQuery`、防抖变体                                                |
| API 对象   | `createExecuteApiHooks`、`createQueryApiHooks`                                           |
| 存储与事件 | `useKeyStorage`、`useImmerKeyStorage`、`useEventSubscription`                            |
| Wow        | `useSingleQuery`、`useListQuery`、`usePagedQuery`、`useCountQuery`、`useListStreamQuery` |
| CoSec      | `SecurityProvider`、`useSecurity`、`RouteGuard`、`RefreshableRouteGuard`                 |
| 监控       | `useDataMonitor`、`useDataMonitorEventBus`、`DataMonitorService`                         |

## 状态与所有权

每个请求只保留一个 Hook 所有者。显式渲染加载、空、失败和成功状态。用户操作取消任务时
调用 `abort()`；自动清理作为最后防线。

`createExecuteApiHooks()` 与 `createQueryApiHooks()` 会从 API 对象中返回 Promise 的
方法派生命名 Hook。共享服务已定义请求边界时使用它们；不要只为一次请求额外制造抽象。

继续阅读 [React 数据流](../learn/react-data-flow.md)。
