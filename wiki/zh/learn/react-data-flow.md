---
title: React 数据流
description: 让执行、结果和取消跟随组件生命周期。
---

# React 数据流

页面需要回答：是否开始、是否加载、得到什么、哪里失败，以及谁负责取消。Fetcher React 将这些问题表达为组件状态。

## 从显式执行开始

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

## 请求与组件的生命周期

状态包含 idle、loading、success、error。新的执行会取消前一个控制器，请求 ID 防止旧结果覆盖新状态；卸载时执行清理。只有把 controller.signal 传给真实网络操作，取消才会作用到该网络请求。

默认拒绝更新 error/status，不再次抛出；propagateError 打开后，调用者也必须处理 Promise 拒绝。回调失败不会替换原操作的状态。详情见 [Promise 与 Query 状态](../reference/react/promise-and-query-state.md)。

## 根据页面输入选择 Hook

| 页面需求           | 入口                       |
| ------------------ | -------------------------- |
| 点击后执行异步函数 | useExecutePromise          |
| 用 Fetcher 发请求  | useFetcher                 |
| 查询条件变化后执行 | useQuery / useFetcherQuery |
| 输入防抖           | debounce 专题中的对应 Hook |
| Wow 查询结果       | Wow 专用查询 Hooks         |

详见 [Fetcher Hooks](../reference/react/fetcher-hooks.md)、[防抖](../reference/react/debounce.md)与 [Wow 集成](../reference/react/wow.md)。不要在每个页面另写一套过期结果保护。

## 确定共享状态边界

这些 Hooks 不提供全局服务端缓存、缓存失效或跨组件请求去重。需要这些策略时由应用明确选择并组合；不要把组件局部结果当作缓存一致性保证。
