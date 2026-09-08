---
next: false
title: 清理 React 异步工作
description: 把取消接到实际操作，并区分 abort、reset 与防抖调度取消。
---

# 清理 React 异步工作

## 前提

先运行[完整 React 示例](../../examples/react.md)。慢请求夹具提供 2000 ms 的取消窗口，play 验证等待超过该时长以检查晚到结果。使用自定义 Promise 时，实际操作必须接受控制器；状态保护本身不能停止外部工作。

## 将真正的取消路径交给 Hook

`useFetcher` 将自己拥有的控制器传给 Fetcher 请求。改用 `useExecutePromise` 时，需要自行转发 signal：

```tsx
const work = useExecutePromise<string>();
const load = () =>
  work.execute(async controller => {
    const response = await fetch('/api/message', { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  });
```

从 `@ahoo-wang/fetcher-react` 导入 `useExecutePromise`，把这些语句放到组件内部。将 `load` 绑定到 Load、`work.abort` 绑定到 Cancel，并按[完整请求组件](../../examples/react.md)展示 `work.loading`、`work.error` 和 `work.result`。这个替代操作需要 `GET /api/message` 返回纯文本；仓库夹具没有该端点。

## 选择正确的清理动作

| 动作                    | 行为                                    | 用途                     |
| ----------------------- | --------------------------------------- | ------------------------ |
| `abort()`               | 使活动执行失效并取消，回到 idle         | 停止活动操作             |
| `reset()`               | 将状态设为 idle，不使活动工作失效或取消 | 清空已结束操作的展示状态 |
| 防抖 Hook 的 `cancel()` | 移除等待中的调度                        | 阻止排队调用             |
| 组件卸载                | 清理 Hook 拥有的执行与防抖计时器        | 结束组件工作             |

新执行会取消前一个操作，请求序号与挂载检查阻止旧执行写入状态。忽略控制器的自定义 Promise 仍可能在外部完成。防抖请求的 Stop 按钮需要同时 cancel 与 abort。重新尝试要启动新执行或创建新控制器。

## 验证取消，不只是屏幕已清空

启动慢请求并取消，等待超过 2000 ms，应保持 idle。再次启动，在完成前卸载组件，检查替换后的页面不受旧结果影响。活动请求期间调用 reset 不是等价测试，因为该请求随后仍可能发布成功状态。

根据 `propagateError` 选择在状态或 Promise 边界处理失败。原生 AbortError 取消会回到 idle，不要为它构造成功数据。Hook 之外创建的计时器和监听器需要另外清理。SSR 身份与共享客户端隔离仍由应用负责。

参阅 [Promise 生命周期](../../reference/react/promise-and-query-state.md)、[HTTP 取消](../http/cancellation.md)与[状态和资源](../../architecture/state-and-resources.md)。
