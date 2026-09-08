---
prev: false
title: 'React 参考'
description: 'React 入口选择、安装与行为契约'
---

# React

React Hook 将异步操作连接到一个挂载组件：状态、执行、查询驱动刷新及可选防抖。它们不提供共享响应缓存。显式操作从执行 Hook 开始；只有输入改变应发送请求时才使用自动查询。

## 选择入口

| 需求                 | 入口                                                                                                        | 应用负责                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 点击发送 HTTP        | [useFetcher](./fetcher-hooks#api-useFetcher)                                                                | URL、Fetcher 和结果提取器；结果从 `result` 读取，不从 execute 返回值读取。 |
| 执行其他 Promise API | [useExecutePromise](./promise-and-query-state#api-useExecutePromise)                                        | Supplier，并将其 controller signal 传给 I/O。                              |
| 查询变化时请求       | [useQuery](./promise-and-query-state#api-useQuery) / [useFetcherQuery](./fetcher-hooks#api-useFetcherQuery) | 初始/响应式 query；普通查询 Hook 默认自动执行。                            |
| 输入时延迟搜索       | [防抖 Hook](./debounce)                                                                                     | 必填延迟；定时器 `cancel()` 与活动请求 `abort()` 相互独立。                |
| 包装现有服务         | [API Hook 工厂](./api-hooks)                                                                                | 服务对象和方法；在渲染外创建 Hook 集合。                                   |
| 只记录其他系统的状态 | [usePromiseState](./promise-and-query-state#api-usePromiseState)                                            | 执行、清理和旧结果抑制由状态 Hook 外部负责。                               |

## 完整安装前提

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-wow react react-dom
```

本参考针对 5.0.0。库包声明 Node >=18.20.8；仓库开发要求 Node >=20.20.2、pnpm 10.34.5。命令包含递归内部 peer，包括经 Wow/React/CoSec 引入的包；直接运行依赖自动安装。 外部 peer 范围为 React/ReactDOM ^19.2.8；即使不使用某项功能，仍是安装前提。消费者无需复制仓库的 React Compiler 工具链。

## 可运行核心示例

运行步骤、服务夹具与预期结果见[接入指南](../../guides/react/index.md).

<<< @/../stories/docs/ReactRequests.tsx

## 专题

- [Fetcher 请求 Hook](./fetcher-hooks)
- [Promise 与查询状态](./promise-and-query-state)
- [API Hook 工厂](./api-hooks)
- [防抖执行](./debounce)
- [Wow 查询 Hook](./wow)
- [存储与事件订阅](./storage-and-events)
- [安全 Hook 与路由守卫](./cosec)
- [监控、ref 与全屏](./monitoring-and-utilities)
- [完整符号索引](./symbols)

[状态与资源所有权](../../architecture/state-and-resources) · [失败与取消边界](../../architecture/failure-model)
