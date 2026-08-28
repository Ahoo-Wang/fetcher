---
title: 包参考
description: 选择 Fetcher 包、理解其契约，并打开详细 API 或对应 Agent Skill。
pageClass: reference-index-page
---

# 包参考

Fetcher 是分层生态，不是必须整体引入的框架 Bundle。先选择真正拥有该行为的包，再只
加入应用实际使用的集成。

::: info 如何阅读包参考
每个参考页都包含安装、主要 API 分组、默认值、生命周期、失败行为、源码导出和对应
Agent Skill。精确的长篇签名保留在每个 Skill 根据源码核对过的 API Reference 中。
:::

## 按职责选择

| 职责                            | 优先使用                                  | 何时加入                                        |
| ------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| 发送 HTTP 请求                  | [`@ahoo-wang/fetcher`](./fetcher.md)      | 始终作为运行时基础                              |
| 暴露类形式 API 服务             | [`fetcher-decorator`](./decorator.md)     | 需要稳定服务接口时                              |
| 投递类型化事件                  | [`fetcher-eventbus`](./eventbus.md)       | 多个所有者响应同一事件时                        |
| 解析 SSE 与 Token Stream        | [`fetcher-eventstream`](./eventstream.md) | 响应是 `text/event-stream` 时                   |
| 持久化一个类型化值              | [`fetcher-storage`](./storage.md)         | 状态需要存在于组件外部时                        |
| 在 React 管理请求状态           | [`fetcher-react`](./react.md)             | UI 拥有 Loading、Result、Error 与取消时         |
| 描述 OpenAPI 文档               | [`fetcher-openapi`](./openapi.md)         | 工具需要编译期文档类型时                        |
| 生成类型安全客户端              | [`fetcher-generator`](./generator.md)     | OpenAPI 是 API 契约时                           |
| 调用 OpenAI-compatible Chat API | [`fetcher-openai`](./openai.md)           | 需要 Chat Request 与 Stream 类型时              |
| 增加 CoSec 认证                 | [`fetcher-cosec`](./cosec.md)             | 服务端使用 CoSec 协议时                         |
| 调用 Wow 命令与查询             | [`fetcher-wow`](./wow.md)                 | 服务端暴露 Wow 端点时                           |
| 构建数据探索 UI                 | [`fetcher-viewer`](./viewer.md)           | Filter、Table、保存视图与远程数据构成一个体验时 |

## 分层地图

| 层         | 包                                       | 跨边界内容                                      |
| ---------- | ---------------------------------------- | ----------------------------------------------- |
| Transport  | Fetcher、EventStream                     | Request、Response、Exchange、Stream、Error      |
| Service    | Decorator、Generator、OpenAI、Wow、CoSec | 面向领域的 Client 与协议元数据                  |
| State      | EventBus、Storage、React                 | Event、持久化值、可观察异步状态                 |
| Experience | Viewer                                   | Filter、View State、Table、Action、用户可见失败 |

依赖应从表格上方向下。如果底层请求 Helper 导入 Viewer 或 React，职责就放错了层。

## 核心契约速查

| 包          | 主要入口                          | 默认所有权             | 典型清理                           |
| ----------- | --------------------------------- | ---------------------- | ---------------------------------- |
| Fetcher     | `Fetcher`、`NamedFetcher`         | Request 生命周期       | Abort 调用方任务；Eject 动态拦截器 |
| Decorator   | `@api`、方法与参数装饰器          | 服务元数据             | 应用拥有共享 Fetcher               |
| EventBus    | `SerialTypedEventBus`、`EventBus` | Handler 投递           | `off()` / `destroy()`              |
| EventStream | `Response` Helper、转换 Stream    | Stream 解析            | Cancel Stream 并 Abort 网络所有者  |
| Storage     | `KeyStorage`                      | 一个 Key 与其 Listener | Listener Remover / `destroy()`     |
| React       | `useFetcher`、`useFetcherQuery`   | 组件可见异步状态       | Hook 卸载加用户显式 Abort          |
| Viewer      | `Viewer`、`FetcherViewer`         | 数据探索工作流         | 组件与持久化 Callback 生命周期     |

## 集成契约速查

| 包        | 输入事实来源                                    | 失败边界                                   |
| --------- | ----------------------------------------------- | ------------------------------------------ |
| OpenAPI   | OpenAPI 3 文档对象                              | 仅编译期形状；运行时校验在包外             |
| Generator | OpenAPI 文件或 URL 加 TypeScript Config         | 解析、发现、生成与输出编译                 |
| OpenAI    | Chat Request 与 Fetcher 配置                    | 初始 HTTP 调用加后续 Stream 消费           |
| CoSec     | CoSec 服务端协议与 Token State                  | Refresh、最终 Unauthorized、最终 Forbidden |
| Wow       | Wow Route、Metadata、Filter 与 Aggregation 契约 | 命令结果、查询校验、HTTP/SSE 处理          |

## Reference 与 Skills

- 使用 **Reference** 选择 API、理解默认值并审查行为。
- 使用 **Skills** 让 Codex 在对应包边界内执行任务。
- Agent 需要完整签名或边界情况时，使用 Skill 的 `references/api.md`。

打开 [Skills 目录](../skills/index.md)，按任务选择。
