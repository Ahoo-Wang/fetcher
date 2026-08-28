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

| 包                             | 适用场景                                  | 参考                        |
| ------------------------------ | ----------------------------------------- | --------------------------- |
| `@ahoo-wang/fetcher-react`     | React 请求状态、查询 Hook、存储与路由守卫 | [React](./react.md)         |
| `@ahoo-wang/fetcher-openapi`   | OpenAPI 文档的 TypeScript 类型            | [OpenAPI](./openapi.md)     |
| `@ahoo-wang/fetcher-generator` | 从 OpenAPI 生成类型化客户端               | [Generator](./generator.md) |
| `@ahoo-wang/fetcher-openai`    | 支持类型化流式响应的 Chat Completions     | [OpenAI](./openai.md)       |
| `@ahoo-wang/fetcher-wow`       | Wow 命令、查询、过滤与聚合                | [Wow](./wow.md)             |
| `@ahoo-wang/fetcher-cosec`     | CoSec 请求头、令牌、刷新与鉴权错误        | [CoSec](./cosec.md)         |

Viewer 组件库使用独立参考页，因为它的公开 API 围绕 UI 组合，而不是请求基础设施组织。

## 阅读约定

- **默认值**表示省略选项时采用的行为。
- 本参考只列出包入口公开导出的 API。
- 示例优先展示最小且可用于生产结构的路径；完整类型以 TypeScript 声明为准。
