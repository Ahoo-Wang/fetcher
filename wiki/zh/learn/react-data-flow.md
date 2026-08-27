---
title: React 数据流
description: 将异步工作建模为明确的 React 加载、结果、错误、取消与查询状态。
---

# React 数据流

Fetcher React Hooks 让异步状态保持显式。它们不会附加缓存或全局请求策略。

## Promise 状态

`PromiseStatus` 包含 `idle`、`loading`、`success`、`error` 四个值。`usePromiseState` 管理状态转换，`useExecutePromise` 增加执行与取消。

```tsx
import { useExecutePromise } from '@ahoo-wang/fetcher-react';

function UserButton() {
  const { status, loading, result, error, execute, abort, reset } =
    useExecutePromise<string>();

  return (
    <section>
      <button
        disabled={loading}
        onClick={() =>
          execute(async controller => {
            const response = await fetch('/api/user', {
              signal: controller.signal,
            });
            return response.text();
          })
        }
      >
        Load user
      </button>
      <button onClick={abort}>Cancel</button>
      <button onClick={reset}>Reset</button>
      <output>{error ? String(error) : (result ?? status)}</output>
    </section>
  );
}
```

开始新执行时会取消上一个 Controller。Request ID 防止旧结果覆盖最新状态，卸载清理会阻止后续状态更新。

## 错误行为

默认情况下，Promise 被拒绝后只更新 `error` 和 `status`，不会再次抛出。只有事件处理器也必须捕获异常时，才设置 `propagateError: true`。`onSuccess`、`onError`、`onAbort` 回调自身失败时会记录日志，但不会替换操作状态。

## 查询状态

`useQuery` 增加 `getQuery`、`setQuery`、可选校验和 `autoExecute`。`useFetcherQuery` 将查询绑定到 Fetcher 请求。Wow 契约应使用对应 Wow Hooks，不要手工重建响应与端点协议。

## 防抖

`useDebouncedCallback` 返回 `run`、`cancel`、`isPending`。`leading` 与 `trailing` 至少启用一个。`useDebouncedExecutePromise` 和 `useDebouncedQuery` 将相同行为与异步状态组合。

## 何时不应使用这些 Hooks

非 React 模块直接调用 Fetcher。需要标准化缓存键、后台刷新、Mutation 失效或共享请求去重时，应使用专门的服务端状态缓存；这些 Hooks 有意不提供上述策略。
