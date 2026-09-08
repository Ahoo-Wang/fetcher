---
title: 'Openai reference'
description: 'Openai reference — Fetcher 5.0.0'
---

# Openai reference

Chat Completions client with JSON and SSE results built on Fetcher and decorators. No other provider product API is exposed by this package.

## Install

```bash
pnpm add @ahoo-wang/fetcher-openai
```

Version baseline: **5.0.0**. This package declares Node **>=18.20.8**; the repository contributor toolchain is separate. Install peer packages required by your selected runtime integration.

## Minimal example

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';
export const createChat = (baseURL: string, apiKey: string) =>
  new OpenAI({ baseURL, apiKey }).chat;
```

## Topics

- [Client and chat completions](/reference/openai/client-and-completions)
- [Streaming chat completions](/reference/openai/streaming)

## Public symbol index

| Symbol                            | Reference                                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| `ChatClient`                      | [Client and chat completions](/reference/openai/client-and-completions#chatclient)        |
| `ChatRequest`                     | [Client and chat completions](/reference/openai/client-and-completions#chatrequest)       |
| `ChatResponse`                    | [Client and chat completions](/reference/openai/client-and-completions#chatresponse)      |
| `ChatTool`                        | [Client and chat completions](/reference/openai/client-and-completions#chattool)          |
| `ChatToolChoice`                  | [Client and chat completions](/reference/openai/client-and-completions#chattoolchoice)    |
| `ChatToolFunction`                | [Client and chat completions](/reference/openai/client-and-completions#chattoolfunction)  |
| `Choice`                          | [Client and chat completions](/reference/openai/client-and-completions#choice)            |
| `CompletionStreamResultExtractor` | [Streaming chat completions](/reference/openai/streaming#completionstreamresultextractor) |
| `DoneDetector`                    | [Streaming chat completions](/reference/openai/streaming#donedetector)                    |
| `Message`                         | [Client and chat completions](/reference/openai/client-and-completions#message)           |
| `OpenAI`                          | [Client and chat completions](/reference/openai/client-and-completions#openai)            |
| `OpenAIOptions`                   | [Client and chat completions](/reference/openai/client-and-completions#openaioptions)     |
| `Usage`                           | [Client and chat completions](/reference/openai/client-and-completions#usage)             |

[packages/openai/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/index.ts#L14)

## Earlier section links

Earlier reference links still lead to the corresponding topics below.

| Earlier section | Current topic |
| --- | --- |
| <span id="choose-an-entry-point"></span>Choose an entry point | [Read this topic](/reference/openai/client-and-completions.md) |
| <span id="typed-completion"></span>Typed completion | [Read this topic](/reference/openai/client-and-completions.md) |
| <span id="shared-fetcher-and-chatclient"></span>Shared Fetcher and ChatClient | [Read this topic](/reference/openai/client-and-completions.md) |
| <span id="streaming-done-and-cancellation"></span>Streaming, [DONE], and cancellation | [Read this topic](/reference/openai/streaming.md) |
| <span id="failure-boundary-and-troubleshooting"></span>Failure boundary and troubleshooting | [Read this topic](/reference/openai/index.md) |
| <span id="security-and-source-references"></span>Security and source references | [Read this topic](/reference/openai/index.md) |
