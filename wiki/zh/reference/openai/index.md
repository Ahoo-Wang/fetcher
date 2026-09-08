---
title: 'Openai 参考'
description: 'Openai 参考 — Fetcher 5.0.0'
---

# Openai 参考

基于 Fetcher 和装饰器的 Chat Completions 客户端，支持 JSON 和 SSE 结果。本包不暴露供应商的其他产品 API。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-openai
```

版本基线：**5.0.0**。本包声明 Node **>=18.20.8**；仓库贡献者工具链另行规定。按所选运行时集成安装需要的 peer 包。

## 最小示例

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';
export const createChat = (baseURL: string, apiKey: string) =>
  new OpenAI({ baseURL, apiKey }).chat;
```

## 专题

- [客户端与聊天补全](/zh/reference/openai/client-and-completions)
- [流式聊天补全](/zh/reference/openai/streaming)

## 公开符号索引

| 符号                              | 参考                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| `ChatClient`                      | [客户端与聊天补全](/zh/reference/openai/client-and-completions#chatclient)       |
| `ChatRequest`                     | [客户端与聊天补全](/zh/reference/openai/client-and-completions#chatrequest)      |
| `ChatResponse`                    | [客户端与聊天补全](/zh/reference/openai/client-and-completions#chatresponse)     |
| `ChatTool`                        | [客户端与聊天补全](/zh/reference/openai/client-and-completions#chattool)         |
| `ChatToolChoice`                  | [客户端与聊天补全](/zh/reference/openai/client-and-completions#chattoolchoice)   |
| `ChatToolFunction`                | [客户端与聊天补全](/zh/reference/openai/client-and-completions#chattoolfunction) |
| `Choice`                          | [客户端与聊天补全](/zh/reference/openai/client-and-completions#choice)           |
| `CompletionStreamResultExtractor` | [流式聊天补全](/zh/reference/openai/streaming#completionstreamresultextractor)   |
| `DoneDetector`                    | [流式聊天补全](/zh/reference/openai/streaming#donedetector)                      |
| `Message`                         | [客户端与聊天补全](/zh/reference/openai/client-and-completions#message)          |
| `OpenAI`                          | [客户端与聊天补全](/zh/reference/openai/client-and-completions#openai)           |
| `OpenAIOptions`                   | [客户端与聊天补全](/zh/reference/openai/client-and-completions#openaioptions)    |
| `Usage`                           | [客户端与聊天补全](/zh/reference/openai/client-and-completions#usage)            |

[packages/openai/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/index.ts#L14)
