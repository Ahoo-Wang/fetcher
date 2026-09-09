---
prev: false
next: false
title: 按任务查阅 API
description: 按任务查阅 API
pageClass: reference-index-page
---

# 按任务查阅 API

每个包提供入口页和专题目录。先选择职责，再进入需要的 API 家族；复杂包拆分更细，简单包保持紧凑。

| 包                                    | 职责                                | 专题数 |
| ------------------------------------- | ----------------------------------- | ------ |
| [fetcher](./fetcher/index.md)         | HTTP 请求                           | 6      |
| [decorator](./decorator/index.md)     | 声明式服务                          | 3      |
| [eventbus](./eventbus/index.md)       | 事件投递                            | 2      |
| [eventstream](./eventstream/index.md) | SSE 消费                            | 3      |
| [storage](./storage/index.md)         | 值存储                              | 2      |
| [openapi](./openapi/index.md)         | OpenAPI 类型契约                    | 3      |
| [generator](./generator/index.md)     | 生成客户端                          | 5      |
| [openai](./openai/index.md)           | 对话与 token 流                     | 2      |
| [cosec](./cosec/index.md)             | 认证与刷新                          | 3      |
| [react](./react/index.md)             | 组件请求状态                        | 8      |
| [wow](./wow/index.md)                 | 命令与查询                          | 9      |
| [viewer](./viewer/index.md)           | 数据视图与持久化                    | 8      |
| [view-engine](./view-engine/index.md) | 无头引擎、组件配置与 shadcn/Base UI | 5      |

## 如何使用参考

入口页说明用途、前提与专题选择；每个包末尾提供完整符号索引。专题页说明参数、默认值、返回值、失败与生命周期。完整业务流程见 [Guides](../guides/index.md)，首次接入从[入门](../start/index.md)开始。

参考以当前包公开导出和实现为依据；内部源码存在并不意味着可以从包入口导入。
