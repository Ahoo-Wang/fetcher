---
next: false
title: 选择下一项任务
description: 从已成功运行的请求或数据表继续完成具体应用能力。
---

# 选择下一项任务

第一个示例成功后，选择应用下一步需要的改动。每篇指南会说明后端与资源前提。

| 下一步结果                         | 指南                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| 复用服务地址、请求头与超时策略     | [共享 HTTP 客户端](../guides/http/shared-client.md)                                 |
| 发送参数或 JSON 并选择返回值       | [构造请求](../guides/http/requests.md) → [读取结果](../guides/http/results.md)      |
| 展示有用的错误并停止不再需要的请求 | [处理失败](../guides/http/failures.md) → [取消请求](../guides/http/cancellation.md) |
| 为重复使用的端点提供具名方法       | [服务客户端](../guides/services/index.md)                                           |
| 逐步展示事件或生成文本             | [流式消费](../guides/streaming/index.md)                                            |
| 用 React 输入驱动请求              | [React 查询](../guides/react/queries.md) → [防抖](../guides/react/debounce.md)      |
| 让表格控件真正改变显示行           | [Viewer 数据任务](../guides/viewer/index.md)                                        |
| 接入已有平台服务                   | [Wow、CoSec、存储与事件](../guides/integrations/index.md)                           |

通过[架构与选型](../architecture/index.md)决定状态、取消和持久化的所有者。已知操作、需要精确契约时查询 [API 参考](../reference/index.md)；[完整示例](../examples/index.md)继续作为可执行基线。
