---
title: 流式与 OpenAI Skills
description: 为 Server-Sent Events 与 OpenAI Chat 流式请求选择 Fetcher Skill。
pageClass: skills-page
---

# 流式与 OpenAI Skills

处理传输协议时使用流式 Skill；请求和响应遵循 OpenAI Chat 契约时使用 OpenAI
Skill。

## `$fetcher-llm-streaming`

**适用于：** SSE 解析、`Response` 流式扩展、JSON 转换、终止检测、异步迭代、
取消和格式错误处理。

```text
$fetcher-llm-streaming 把 SSE 端点作为类型化 JSON 事件消费。
遇到 [DONE] 时停止，暴露 AbortSignal，并明确呈现转换错误。
```

Skill 会提醒 Agent：使用 `Response` 原型扩展前必须导入 eventstream 副作用。
不希望扩展原型时，使用独立转换函数。

继续阅读 [事件流参考](../reference/eventstream.md)。

## `$fetcher-openai-client`

**适用于：** `OpenAI`、`ChatClient`、Chat Completion 输入输出类型、流式选择、
结果提取器和客户端拦截器。

```text
$fetcher-openai-client 构建注入 API Key 的流式 Chat 服务。
增量渲染文本，在协议终止符处停止，并向调用方呈现部分数据与流错误。
```

Skill 不会把浏览器 Bundle 中的 Secret 视为安全。凭据必须放在可信服务端边界，
或只在受控服务端运行时注入。

继续阅读 [OpenAI 参考](../reference/openai.md)或
[OpenAI 流式场景](../recipes/openai-streaming.md)。

## 选择规则

| 任务提到                                       | 优先使用                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| SSE 帧、事件字段、`[DONE]`、`ReadableStream`   | `$fetcher-llm-streaming`                                                       |
| Chat Completions、Messages、OpenAI 模型、Delta | `$fetcher-openai-client`                                                       |
| 同时涉及两层协议                               | 先用 `$fetcher-openai-client`，只有修改传输层时再加载 `$fetcher-llm-streaming` |
