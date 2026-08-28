---
title: React 参考
description: 在 React 中持有 Fetcher、查询、存储、事件、鉴权与 Wow 状态。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-react`

`@ahoo-wang/fetcher-react` 将 Fetcher 生态操作绑定到 React State。它适用于组件持有的异步任务、Query State、CoSec Context、Storage、Event 和 Wow Query Shape；它不是 Fetcher Provider，也不是 Cache/Query Client 的替代品。

## 安装与 Fetcher 来源

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

只为实际使用的集成安装 peer 包：`@ahoo-wang/fetcher-wow`、`@ahoo-wang/fetcher-cosec`、`@ahoo-wang/fetcher-storage`、`@ahoo-wang/fetcher-eventbus` 或 `@ahoo-wang/fetcher-eventstream`。

此包**没有 Fetcher Provider**。`useFetcher` 可接收 `fetcher`；未传入时会通过 `getFetcher` 解析 `fetcherRegistrar.default`。请在渲染前配置 core registrar，或传入在 render 外创建 / 以 `useMemo` 固定的 Fetcher Instance。[useFetcher:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L37) [useFetcher:162](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L162)

`SecurityProvider` 不同：它为子树持有基于 `TokenStorage` 的 Security Context。[SecurityContext:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L49) [SecurityContext:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L107)

## 选择公开 Hook

| 需求 | 公开 API | 执行与所有权 |
| --- | --- | --- |
| 自行设置 `idle` / `loading` / `success` / `error` | `usePromiseState` | 只管理 State；不会启动 Promise。 |
| 一个可取消的 Promise Supplier | `useExecutePromise` | 调用 `execute(supplier)`；Hook 持有 Controller 与 Result State。 |
| Query Object 加任意 Executor | `useQuery`、`useQueryState` | `autoExecute` 默认 `true`；mount 和 `setQuery` 都可能执行。 |
| 完整 `FetchRequest` | `useFetcher` | 调用 `execute(request)`；可传 `fetcher`，否则用 registrar default。 |
| 将 Query State 作为 JSON POST Body | `useFetcherQuery` | 需要 `url`；POST Query，默认 `JsonResultExtractor`。 |
| 延迟 Callback、Query、Fetcher 或 Fetcher Query | `useDebouncedCallback`、`useDebouncedQuery`、`useDebouncedFetcher`、`useDebouncedFetcherQuery` | 使用 `run`、`cancel`、`isPending`，而不是 `execute`。 |
| 浏览器全屏 State | `useFullscreen`、`FullscreenProvider`、`useFullscreenContext` | 持有全屏事件订阅；Target 默认 `document.documentElement`。 |
| CoSec 登录 State / 路由保护 | `SecurityProvider`、`useSecurityContext`、`useSecurity`、`RouteGuard`、`RefreshableRouteGuard` | Provider 持有 Context；直接调用 Hook 只持有本组件订阅。 |
| 类型化 Storage 或 EventBus 订阅 | `useKeyStorage`、`useImmerKeyStorage`、`useEventSubscription` | 传入稳定 Storage/Bus Object，并按组件生命周期清理。 |
| 数据计数监控 | `useDataMonitor`、`useDataMonitorEventBus`、`DataMonitorService` | Hook 按 `viewId` 启停 module-level monitor；卸载时会禁用已启用监控。 |
| Wow Query Result Shape | `useSingleQuery`、`useListQuery`、`usePagedQuery`、`useCountQuery`、`useListStreamQuery` | 提供 Executor；Result 依次为 `R`、`R[]`、`PagedList<R>`、`number` 或 SSE `ReadableStream`。 |
| Wow POST Query | `useFetcherSingleQuery`、`useFetcherListQuery`、`useFetcherPagedQuery`、`useFetcherCountQuery`、`useFetcherListStreamQuery` | 增加 Endpoint `url`；这些 Hook 特化 `useFetcherQuery`。 |
| Notification Center | package root 中没有 API | `notification/` 未从已发布 root entry re-export；不要导入 `src` Internal。 [index:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts#L14) |

Root barrel 是 Public Boundary；只有它 re-export 的分组受支持。[index:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts#L14)

## Promise 与 Query 契约

所有执行类 Hook 都暴露 `status`、`loading`、`result`、`error`、`reset`、`abort`；`useFetcher` 额外暴露最近一次 `exchange`。`PromiseStatus` 为 `idle`、`loading`、`success` 或 `error`。[usePromiseState:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/usePromiseState.ts#L22) [useFetcher:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcher.ts#L47)

`useExecutePromise` 会为每次执行提供 `AbortController`，在下一次执行前中止前一个由它持有的操作，只接受最新 Request ID，并在 unmount cleanup 中中止。`AbortError` 会使 State 回到 idle。Rejection 会写入 `error`；只有 `propagateError: true` 才会继续抛出，默认值为 `false`。[useExecutePromise:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L27) [useExecutePromise:244](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L244) [useExecutePromise:307](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L307)

`useQuery` / `useFetcherQuery` 将 Query 保留在 Ref 中：`getQuery()` 可以为 `undefined`；`setQuery(query)` 存储它，并在 `autoExecute` 为 true 时执行。传入的 `query` 优先于 `initialQuery`。内容相等的受控 Query 会去重，而改变 Executor 或 `autoExecute` 仍会生效。[useQueryState:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L18) [useQueryState:113](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useQueryState.ts#L113) [useFetcherQuery:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/fetcher/useFetcherQuery.ts#L125)

```tsx
import { useCallback } from 'react';
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

type SearchQuery = { term: string };
type SearchResult = { items: Array<{ id: string; title: string }> };

export function Search() {
  const search = useFetcherQuery<SearchQuery, SearchResult>({
    url: '/api/search',
    initialQuery: { term: '' },
    autoExecute: false,
  });
  const submit = useCallback(() => void search.execute(), [search]);

  return (
    <form onSubmit={event => { event.preventDefault(); submit(); }}>
      <input onChange={event => search.setQuery({ term: event.target.value })} />
      <button disabled={search.loading}>搜索</button>
      {search.error && <p role="alert">搜索失败</p>}
      {search.result?.items.map(item => <p key={item.id}>{item.title}</p>)}
    </form>
  );
}
```

Hook 而非组件持有 Request Cancellation。组件仍持有何时调用 `abort()`、成功空列表是否有业务含义，以及 Loading/Error/Retry UI。若 Callback 或显式 Fetcher 的 Identity 不应改变请求语义，请保持它们稳定。

## Debounce 与 Fullscreen

`useDebouncedCallback` 需要正数 `delay`；默认 `leading: false`、`trailing: true`，两者都设为 `false` 会抛错。Pending Timer 在 unmount 时取消。Debounced Query 变体会关闭 inner Query 的 auto-execution；仅当调用方要求 `autoExecute` 时，再在 mount 和 `setQuery` 后调用 `run()`。`cancel()` 取消 Timer；`abort()` 取消已经启动的 Request。[useDebouncedCallback:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L19) [useDebouncedCallback:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedCallback.ts#L87) [useDebouncedQuery:139](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/debounced/useDebouncedQuery.ts#L139)

`useFullscreen` 追踪浏览器 `fullscreenchange` Event，返回 `fullscreen`、`getTarget`、`enter`、`exit`、`toggle`；直接传入的 Target 优先于配置的 Ref，再优先于 document root fallback。`FullscreenProvider` 提供同一个 Return Value，并且只在它自己提供 Target 时才用 `<div>` 包裹 Children。[useFullscreen:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/useFullscreen.ts#L24) [FullscreenContext:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L28)

## CoSec、Monitor 与 Wow

`SecurityProvider` 需要 `tokenStorage`；在它之外调用 `useSecurityContext()` 会抛错。`signIn` 接收 `CompositeToken` 或 async supplier，通过 `TokenStorage.signIn` 持久化后运行 `onSignIn`；`signOut` 删除 Storage Key 后运行 `onSignOut`。不要在 render 中创建 Token Storage。[SecurityContext:146](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L146) [useSecurity:150](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/useSecurity.ts#L150)

`useDataMonitor` 需要 `viewId`、`countUrl`、`viewName`、`condition` 和 Notification Settings。它会在 Condition 或 Notification 改变时更新已启用 Monitor，并在 unmount 时禁用当前 `viewId`。`useDataMonitorEventBus` 返回带名字的 `subscribe` / `unsubscribe`；订阅无需继续时应取消订阅。[useDataMonitor:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L9) [useDataMonitor:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L61) [useDataMonitorEventBus:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitorEventBus.ts#L18)

非 Fetcher Wow Hook 只是 type-specialized `useQuery`，并不知道 Endpoint。Projection 或 Partial Result 请声明返回 Row Type，不能声明为完整 Aggregate。Streaming 变体返回 `ReadableStream<JsonServerSentEvent<R>>`；除中止替换 Request 外，还要在 Effect Cleanup 中消费/取消其 Reader。[usePagedQuery:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/wow/usePagedQuery.ts#L32) [useListStreamQuery:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/wow/useListStreamQuery.ts#L32) [useFetcherListStreamQuery:175](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/wow/fetcher/useFetcherListStreamQuery.ts#L175)

## 故障定位

| 现象 | 检查项 |
| --- | --- |
| 首次渲染就发起请求 | `autoExecute` 默认是 `true`；用户触发任务请设为 `false`。 |
| 旧 Result 看似覆盖新 Result | 不要用单独的 State Write 绕过 Hook；同一操作只能由一个 Hook 持有。 |
| Debounce cancel 没有停止 HTTP | `cancel()` 只清除尚未执行的 Timer；`run()` 已启动 Request 后调用 `abort()`。 |
| `useSecurityContext` 抛错 | 确保在带稳定 `TokenStorage` 的 `SecurityProvider` 之下渲染。 |
| Fullscreen Target 不正确 | 用 `target` 传 Ref，或把 Target 传给 `enter` / `toggle`。 |
| 无法导入 notifications | Root barrel 排除了 `notification`；请使用受支持的 Public Integration，不要走 Internal Path。 |

## 源码与可运行场景

- 公共导出：[packages/react/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/index.ts#L14)
- Promise 与 Fetcher 场景：[Async State](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-async-state--success)、[Fetcher success](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-fetcher--get-success)、[debounced request](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-fetcher--debounced-request)
- Wow Result Shape 场景：[single、list、paged、count、stream](https://fetcher.ahoo.me/storybook/?path=/story/react-hooks-wow-queries--single)

继续阅读 [React 数据流](../learn/react-data-flow.md)。
