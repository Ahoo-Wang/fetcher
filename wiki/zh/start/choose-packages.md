---
title: 选择与你的任务匹配的包
description: 选择与你的任务匹配的包
---

# 选择与你的任务匹配的包

先确定应用缺少的能力，再安装承担该职责的包。Fetcher 核心包可以独立发送请求。

| 任务           | 包                               | 详细入口                                         |
| -------------- | -------------------------------- | ------------------------------------------------ |
| HTTP 客户端    | `@ahoo-wang/fetcher`             | [fetcher](../reference/fetcher/index.md)         |
| 声明式服务     | `@ahoo-wang/fetcher-decorator`   | [decorator](../reference/decorator/index.md)     |
| 事件投递       | `@ahoo-wang/fetcher-eventbus`    | [eventbus](../reference/eventbus/index.md)       |
| 值存储         | `@ahoo-wang/fetcher-storage`     | [storage](../reference/storage/index.md)         |
| SSE 消费       | `@ahoo-wang/fetcher-eventstream` | [eventstream](../reference/eventstream/index.md) |
| 对话补全       | `@ahoo-wang/fetcher-openai`      | [openai](../reference/openai/index.md)           |
| OpenAPI 类型   | `@ahoo-wang/fetcher-openapi`     | [openapi](../reference/openapi/index.md)         |
| 客户端生成     | `@ahoo-wang/fetcher-generator`   | [generator](../reference/generator/index.md)     |
| React 请求状态 | `@ahoo-wang/fetcher-react`       | [react](../reference/react/index.md)             |
| 数据视图       | `@ahoo-wang/fetcher-viewer`      | [viewer](../reference/viewer/index.md)           |
| CoSec 认证     | `@ahoo-wang/fetcher-cosec`       | [cosec](../reference/cosec/index.md)             |
| Wow 命令与查询 | `@ahoo-wang/fetcher-wow`         | [wow](../reference/wow/index.md)                 |

## 常见组合

- 普通 REST：Fetcher；稳定服务接口可加 Decorator。
- OpenAPI：Generator 负责构建时生成，生成代码使用相应运行时包。
- 流：Fetcher/EventStream 负责传输和解析，React 在页面需要状态时加入。
- 数据应用：Wow 负责命令查询，React 管理组件请求状态，Viewer 提供视图界面。

依赖与 peer 要求见[安装](./installation.md)。选定包后，在其参考入口中选择专题，无需通读其他包。
