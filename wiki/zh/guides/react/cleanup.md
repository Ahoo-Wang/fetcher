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

| 动作                           | 行为                                                | 用途                     |
| ------------------------------ | --------------------------------------------------- | ------------------------ |
| `abort()`                      | 中止活动执行并回到 idle；已完成的结果保留           | 停止活动操作             |
| `reset()`                      | 中止活动执行（如有）并回到 idle，同时清除结果和错误 | 重新开始，例如关闭表单时 |
| 防抖回调的 `cancel()`          | 移除等待中的调度                                    | 阻止排队调用             |
| 防抖查询：改回查询或 `flush()` | 改回查询会丢弃等待中的变化；`flush()` 立即应用它    | 丢弃或应用输入的变化     |
| 组件卸载                       | 清理 Hook 拥有的执行与防抖计时器                    | 结束组件工作             |

每次执行以自己的 `AbortController` 标识：新执行会中止前一个，只有当前 controller 可以写入状态。忽略控制器的自定义 Promise 仍可能在外部完成，但其结果会被忽略。防抖回调请求的 Stop 按钮需要同时调用 `cancel()` 与 `abort()`。每次 `execute` 都会为新的尝试创建新的 controller。

## 验证取消，不只是屏幕已清空

启动慢请求并取消，等待超过 2000 ms，应保持 idle。用 `reset()` 重复一次，再在完成前卸载组件，检查替换后的页面不受旧结果影响。

操作失败进入错误状态，`execute()` 解析为该状态而不是拒绝。取消（包括来自你自己 signal 的原生 `AbortError`）解析为 idle，不要为它构造成功数据。Hook 之外创建的计时器和监听器需要另外清理。SSR 身份与共享客户端隔离仍由应用负责。

参阅 [Promise 生命周期](../../reference/react/promise-and-query-state.md)、[HTTP 取消](../http/cancellation.md)与[状态和资源](../../architecture/state-and-resources.md)。
