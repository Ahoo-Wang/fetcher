---
title: 运行环境与 SSR
description: 检查平台能力，并在共享客户端前界定可变身份状态的作用域。
---

# 运行环境与 SSR

先确定运行环境，再决定共享哪些客户端对象。核心将传输委托给原生 Fetch；存储和 React 层还引入平台与生命周期前提。

| 环境        | 前提                                                                 | 应用责任                                                     |
| ----------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| 浏览器 HTTP | Fetch 及端点所用的原生请求/响应 API                                  | 与服务端一起配置来源、CORS、Cookie 和响应验证                |
| 浏览器 SSE  | 可读响应体及管线所用的流 API                                         | 管理流消费与取消                                             |
| Node 消费者 | 库清单声明 Node `>=18.20.8`                                          | 检查所选包及实际依赖链；声明不等于每个工具的实测矩阵         |
| 仓库开发    | Node `>=22.12.0`、pnpm `10.34.5`                                     | 使用仓库工具链构建和测试                                     |
| React       | peer 为 React `^19.0.0`；仓库开发与测试使用 React/ReactDOM `^19.3.0` | 验证框架的 SSR 导入/渲染/水合路径；不能据此推断支持 React 18 |

要求来源为 [packages/fetcher/package.json:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/package.json#L31)、[package.json:41](https://github.com/Ahoo-Wang/fetcher/blob/main/package.json#L41)、[pnpm-workspace.yaml:31](https://github.com/Ahoo-Wang/fetcher/blob/main/pnpm-workspace.yaml#L31) 及[包清单](./package-boundaries.md)。流提取检查响应体的实现见 [packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)。

## 只在预期身份作用域内共享配置

客户端可以复用稳定的服务默认配置，但 `headers`、`timeout` 和 `urlBuilder` 都可变，registrar 是保存在 `globalThis` 上的进程级单例，第二份包副本也共享它。SSR 为每个入站用户请求修改共享客户端授权头，可能使请求使用另一个请求的身份。使用请求作用域客户端，或通过请求选项传入身份而不修改共享默认值；相关 token/存储状态也要限定作用域。见 [packages/fetcher/src/fetcher.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L127) 和 [packages/fetcher/src/fetcherRegistrar.ts:172](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L172)。

`getStorage()` 在存在 `window` 时使用浏览器 localStorage，否则创建内存实现。这种回退不会建立服务端请求作用域，也不会跨进程持久化。此路径没有捕获 localStorage 被禁用时的访问异常。涉及这些约束时，应明确选择存储实现和生命周期。见 [packages/storage/src/env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20) 与[存储运行环境参考](../reference/storage/serialization-and-runtime.md)。

## 按用户隔离 React 状态

React Hook 把状态保存在挂载的组件内部，不在组件或请求之间缓存响应。在服务端渲染时，Hook 仍使用传给它的客户端与存储，因此上面的身份规则同样适用于你传入的客户端。租户或用户变化时重新挂载子树，可以分隔 UI 状态；服务端仍须实施访问控制。具体 SSR 框架仍需要导入、渲染和水合验证，本章不代表所有框架已通过认证。

5.x 的 Viewer（`@ahoo-wang/fetcher-viewer`）在渲染时读取 `window`，必须挂在仅客户端渲染的边界内，见 5.x 的 [Viewer 指南](../guides/viewer/index.md)。

继续阅读[共享客户端](../guides/http/shared-client.md)、[存储与事件](../guides/integrations/storage-and-events.md)和[状态所有权](./state-and-resources.md)。
