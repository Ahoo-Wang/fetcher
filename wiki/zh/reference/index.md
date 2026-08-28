---
title: 包参考
description: 按职责选择 Fetcher 包，并进入聚焦的 API 参考页。
---

# 包参考

Fetcher 被拆分为多个小包，应用只需安装实际使用的运行时能力。先从
`@ahoo-wang/fetcher` 开始；当表格中的职责进入应用边界时，再添加对应包。

## 核心包

| 包                               | 适用场景                          | 参考                        |
| -------------------------------- | --------------------------------- | --------------------------- |
| `@ahoo-wang/fetcher`             | HTTP 请求、拦截器、超时与结果提取 | [Fetcher](./fetcher.md)     |
| `@ahoo-wang/fetcher-decorator`   | 基于类的声明式 API 服务           | [Decorator](./decorator.md) |
| `@ahoo-wang/fetcher-eventbus`    | 类型安全的进程内或跨标签页事件    | [事件总线](./eventbus.md)   |
| `@ahoo-wang/fetcher-eventstream` | Server-Sent Events 与流式响应     | [事件流](./eventstream.md)  |
| `@ahoo-wang/fetcher-storage`     | 浏览器或内存存储支持的类型化值    | [存储](./storage.md)        |

## 集成包

集成参考将覆盖 React Hooks、OpenAPI 类型与生成器、OpenAI 流式请求、Wow
CQRS、CoSec 认证和 Viewer 组件库。在此之前，可通过[选择包](../start/choose-packages.md)
确定入口，并从[实战指南](../recipes/declarative-services.md)获得端到端示例。

## 阅读约定

- **默认值**表示省略选项时采用的行为。
- 本参考只列出包入口公开导出的 API。
- 示例优先展示最小且可用于生产结构的路径；完整类型以 TypeScript 声明为准。
