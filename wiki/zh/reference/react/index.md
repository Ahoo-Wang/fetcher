---
prev: false
title: 'React 参考'
description: 'React 入口选择、安装与行为契约'
---

# React

React Hook 将异步操作连接到一个挂载组件：状态、执行、查询驱动刷新及可选防抖。它们不提供共享响应缓存。显式操作从执行 Hook 开始；只有输入改变应发送请求时才使用自动查询。

所有 Hook 遵循同一模型：请求以其 `AbortController` 标识，只有当前请求可以写入状态。状态是一个值 `{ status, loading, result, error }`；`execute` 从不拒绝，解析为执行结束时的状态。查询是受控的：查询保存在你的状态中，内容变化时 Hook 执行。

## 选择入口

| 需求                 | 入口                                                                                                        | 应用负责                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 点击发送 HTTP        | [useFetcher](./fetcher-hooks#api-useFetcher)                                                                | URL、Fetcher 和结果提取器；渲染 `result`，按 `execute` 解析出的状态分支。 |
| 执行其他 Promise API | [useExecutePromise](./promise-and-query-state#api-useExecutePromise)                                        | Supplier，并将其 controller signal 传给 I/O。                             |
| 查询变化时请求       | [useQuery](./promise-and-query-state#api-useQuery) / [useFetcherQuery](./fetcher-hooks#api-useFetcherQuery) | 查询，保存在你自己的状态中；`undefined` 表示未就绪。默认自动执行。        |
| 输入时延迟搜索       | [防抖 Hook](./debounce)                                                                                     | 必填延迟；防抖查询增加 `pending` 和 `flush()`，`abort()` 停止活动请求。   |
| 包装现有服务         | [API Hook 工厂](./api-hooks)                                                                                | 服务对象和方法；在渲染外创建 Hook 集合。                                  |
| 只记录其他系统的状态 | [usePromiseState](./promise-and-query-state#api-usePromiseState)                                            | 执行、清理和旧结果抑制由状态 Hook 外部负责。                              |

## 子路径入口 {#subpath-entries}

| 入口                               | 导出                                                                                            | 加载                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `@ahoo-wang/fetcher-react`         | 这些页面上的全部 Hook 与组件                                                                    | 下方声明的全部 peer                                |
| `@ahoo-wang/fetcher-react/core`    | Promise 与查询状态、防抖回调/值/查询、`useLatest`、`useStableValue`                             | 只有 React，不加载任何 `@ahoo-wang/*` 包           |
| `@ahoo-wang/fetcher-react/fetcher` | `useFetcher`、`useFetcherQuery`、`useDebouncedFetcher`、`useDebouncedFetcherQuery` 及其选项类型 | `@ahoo-wang/fetcher`；不加载 CoSec、存储或事件总线 |

子路径只提供 ESM；根入口另有 UMD 构建。子路径与根入口共用一个模块图，所以从 `/core` 导入的 Hook 或 `PromiseStatus` 与从根入口导入的是同一个值。[符号索引](./symbols)标出每个符号由哪个子路径导出。导入子路径时，声明的 peer 仍是安装前提；子路径只限制打包加载的内容。

## 完整安装前提

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage react react-dom
```

库包声明 Node >=18.20.8；仓库开发要求 Node >=22.12.0、pnpm 10.34.5。命令包含全部递归内部 peer（React → CoSec → 存储 → 事件总线）；直接运行依赖（`dequal`、`immer`）自动安装。外部 peer 为 React ^19.0.0；渲染器按应用需要安装（浏览器用 `react-dom`）。即使不使用某项功能，peer 仍是安装前提。消费者无需复制仓库的 React Compiler 工具链。

::: info 6.0 变更
这些 Hook 已按上述模型重构（破坏性变更）。移除了全屏 Hook、`useRefs`、`useForceUpdate`、`useMounted`、`useRequestId`、`useQueryState`、`propagateError` 选项、`initialQuery`/`setQuery`/`getQuery` 和 `onBeforeExecute`。各专题页说明其 Hook 的变化；[最新值与稳定值](./utilities#removed-in-6-0)列出被移除工具的替代方案。
:::

::: info Wow 查询 Hook 与数据监控
Wow 查询 Hook（`useListQuery`、`usePagedQuery`、`useFetcherListQuery` 等）与数据监控 Hook（`useDataMonitor`、`DataMonitorService`）只保留在 5.x 线（npm 5.1.x，分支 [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x/packages/react)）。从 6.0 起，Wow Hook 位于 Wow 仓库的 `@ahoo-wang/wow-react`（[`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)，[文档](https://wow.ahoo.me)）；它自 Wow 9.2.0 起已发布到 npm，9.2.1 及以上兼容 fetcher 6。数据监控 Hook 随 `@ahoo-wang/fetcher-viewer` 一同退役。
:::

## 可运行核心示例

运行步骤、服务夹具与预期结果见[接入指南](../../guides/react/index.md).

<<< @/../stories/docs/ReactRequests.tsx

## 专题

- [Fetcher 请求 Hook](./fetcher-hooks)
- [Promise 与查询状态](./promise-and-query-state)
- [API Hook 工厂](./api-hooks)
- [防抖执行](./debounce)
- [存储与事件订阅](./storage-and-events)
- [安全 Hook 与路由守卫](./cosec)
- [最新值与稳定值](./utilities)
- [完整符号索引](./symbols)

[状态与资源所有权](../../architecture/state-and-resources) · [失败与取消边界](../../architecture/failure-model)
