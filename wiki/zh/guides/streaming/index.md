---
prev: false
title: 流式消费
description: 按前提选择流式消费的具体任务。
---

# 流式消费

运行环境需要 Fetch、Response body 和 ReadableStream。服务端必须输出 SSE 帧；普通 JSON 响应不是事件流。长时间读取需要由调用者持有取消信号。

- [读取并关闭 SSE](./sse.md)
- [流式读取生成文本](./chat.md)

[全部指南](../index.md) · [集成决策](../../architecture/integration-decisions.md)
