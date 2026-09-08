---
title: 显式触发并展示 React 请求
description: 用已验证的 useFetcher 组件展示加载、结果、错误和取消。
---

# 显式触发并展示 React 请求

## 前提

使用已有 React 应用，按[完整 React 示例](../../examples/react.md)安装依赖并设置入口文件。无需后端的验证可直接运行该页 Storybook 命令。受控服务分别返回用户数组、HTTP 500 错误，以及延迟 2000 ms 的结果。

## 挂载完整组件

按[完整示例](../../examples/react.md)运行仓库夹具，或复制 `ReactRequests.tsx`，通过该页消费者入口挂载 `<ReactRequests />`。维护中的文件包含完整实现；请求行为保留在那里，不必复制到多层包装中。

组件按 `baseURL` memoize `Fetcher`，向 `useFetcher` 显式传入 JSON 提取器，并将各按钮绑定到 `execute({ url })`。应用从 Hook 读取 `result`、`error`、`loading` 和 `status`。`execute()` 返回 `Promise<void>`，不会返回用户数据。

## 检查各个可见状态

1. 点击 **Load**，请求进入 loading，随后在仓库夹具中显示 **Ada, Lin**。
2. 点击 **Fail**，非 2xx 响应展示错误，不作为用户结果成功显示。
3. 点击 **Load slow**，在 2000 ms 内点击 **Cancel**。Hook 回到 idle。等待超过延迟，确认晚到的 `completed` 不会覆盖状态。
4. 再次点击 **Load**，确认取消后仍能启动新请求。

接入自己的应用时，`/api/users` 必须返回用户 JSON 数组，`/api/error` 返回非 2xx，`/api/slow` 延迟返回 JSON 对象 `{ "status": "completed" }`。这些是需要应用提供的演示路由，Hook 不会创建它们。

## 错误与清理

执行错误默认保存到 Hook 状态而不重新抛出。开启 `propagateError` 后还应处理返回 Promise 的拒绝。新执行会取消前一个请求，只有最新且仍挂载的执行能够发布状态。卸载会清理拥有的请求。这些保护不提供全局查询缓存，也不能撤销服务端已经完成的操作。

继续阅读[输入驱动查询](./queries.md)、[清理资源](./cleanup.md)、[Hook 参考](../../reference/react/fetcher-hooks.md)与[状态归属](../../architecture/state-and-resources.md)。
