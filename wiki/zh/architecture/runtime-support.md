---
title: 运行环境与 SSR
description: 检查平台能力，并在共享客户端前界定可变身份状态的作用域。
---

# 运行环境与 SSR

先确定运行环境，再决定共享哪些客户端对象。核心将传输委托给原生 Fetch；存储和 UI 层还引入平台与生命周期前提。

| 环境           | 前提                                                                                                 | 应用责任                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 浏览器 HTTP    | Fetch 及端点所用的原生请求/响应 API                                                                  | 与服务端一起配置来源、CORS、Cookie 和响应验证                |
| 浏览器 SSE     | 可读响应体及管线所用的流 API                                                                         | 管理流消费与取消                                             |
| Node 消费者    | 库清单声明 Node `>=18.20.8`                                                                          | 检查所选包及实际依赖链；声明不等于每个工具的实测矩阵         |
| 仓库开发       | Node `>=20.20.2`、pnpm `10.34.5`                                                                     | 使用仓库工具链构建和测试                                     |
| React / Viewer | 匹配 peer；仓库 catalog 为 React/ReactDOM `^19.2.8`、antd `^6.6.3`、icons `^6.3.4`、dayjs `^1.11.23` | 验证框架的 SSR 导入/渲染/水合路径；不能据此推断支持 React 18 |

要求来源为 [packages/fetcher/package.json:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/package.json#L31)、[package.json:39](https://github.com/Ahoo-Wang/fetcher/blob/main/package.json#L39)、[pnpm-workspace.yaml:7](https://github.com/Ahoo-Wang/fetcher/blob/main/pnpm-workspace.yaml#L7) 及[包清单](./package-boundaries.md)。流提取检查响应体的实现见 [packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)。生成器依赖可能比库的引擎声明要求更高的运行环境。

## 只在预期身份作用域内共享配置

客户端可以复用稳定的服务默认配置，但 `headers`、`timeout` 和 `urlBuilder` 都可变，registrar 也是模块全局实例。SSR 为每个入站用户请求修改共享客户端授权头，可能使请求使用另一个请求的身份。使用请求作用域客户端，或通过请求选项传入身份而不修改共享默认值；相关 token/存储状态也要限定作用域。见 [packages/fetcher/src/fetcher.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L127) 和 [packages/fetcher/src/fetcherRegistrar.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L166)。

`getStorage()` 在存在 `window` 时使用浏览器 localStorage，否则创建内存实现。这种回退不会建立服务端请求作用域，也不会跨进程持久化。此路径没有捕获 localStorage 被禁用时的访问异常。涉及这些约束时，应明确选择存储实现和生命周期。见 [packages/storage/src/env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20) 与[存储运行环境参考](../reference/storage/serialization-and-runtime.md)。

## 将 Viewer 状态作为应用状态管理

非空视图列表的 `Viewer` 在渲染过程中直接读取 `window.location.pathname`，而不是等到 effect 中读取；因此当前实现不能直接在没有 `window` 的服务端渲染。SSR 应用应通过仅客户端渲染的边界挂载 `Viewer`（也包括渲染它的 `FetcherViewer`），并验证实际导入、渲染和水合路径。空视图提前返回不代表完整 Viewer 支持 SSR。见 [packages/viewer/src/viewer/Viewer.tsx:296](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L296)。

FetcherViewer 在模块作用域创建默认视图 ID 存储，固定键为 `fetcher-viewer-local-default-view-id`。Viewer 在 effect 中初始化共享数据监控。这些行为要求审查身份与资源生命周期，不能据此承诺它们是无状态 SSR 组件。见 [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L94) 和 [packages/viewer/src/viewer/Viewer.tsx:222](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L222)。

定义、租户或所有者变化时重新挂载视图，可以分隔 UI 状态；服务端仍须实施访问控制，应用仍须合理划分持久化偏好。具体 SSR 框架仍需要导入、渲染和水合验证，本章不代表所有框架已通过认证。

继续阅读[共享客户端](../guides/http/shared-client.md)、[存储与事件](../guides/integrations/storage-and-events.md)和[状态所有权](./state-and-resources.md)。
