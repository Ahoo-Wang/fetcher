---
title: 'Client and chat completions'
description: 'Client and chat completions — Fetcher 5.0.0'
---

# Client and chat completions

This package implements Chat Completions. It does not expose Responses, embeddings, images, files, audio, or realtime clients. The following contract describes this SDK's implementation, not a guarantee of a provider's current model availability or limits.

`OpenAI` always creates its own Fetcher and Authorization header. To use an existing authenticated proxy, construct `ChatClient({ fetcher })` instead; this also preserves that Fetcher's headers, timeout and interceptors. Configure ApiMetadata before the first call because the decorator executor caches per-method metadata.

## Client contract

| API                                      | Input/default                                                        | Return/effect                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `OpenAI(options)`                        | Required `baseURL: string` and `apiKey: string`; no default endpoint | Owns readonly fetcher and chat; creates Fetcher with Authorization: Bearer apiKey |
| `OpenAIOptions`                          | Extends BaseURLCapable, both fields required                         | Type only; keys are not validated                                                 |
| `ChatClient(apiMetadata?)`               | Optional decorator ApiMetadata, e.g. `{ fetcher }`                   | Uses class basePath `chat`                                                        |
| `ChatClient.completions<T>(chatRequest)` | Required ChatRequest; POST `/completions` under chat basePath        | Promise of ChatResponse or JSON SSE stream based on stream flag                   |
| `ChatClient.beforeExecute(exchange)`     | FetchExchange; called by decorator runtime                           | void; truthy request.body.stream selects CompletionStreamResultExtractor          |

`stream: true` inferred as a literal returns a stream; `false` or no stream property returns ChatResponse. A boolean or broad ChatRequest returns the response/stream union, so preserve literals or narrow your request at the call site. There is no second method argument for request options.

## Request and result types

`ChatRequest` requires model:string and messages:Message[]. Optional fields: frequency_penalty, presence_penalty, temperature, top_p, max_tokens, n and seed are numbers; logit_bias is Record&lt;string, number&gt; or null; response_format is Record&lt;string, unknown&gt;; stop is string/string[]/null; stream is boolean; user is string; tools and tool_choice are described below. These are forwarded; the SDK neither assigns provider defaults nor validates ranges or model capability.

`Message` has optional string content and role plus arbitrary properties. `ChatToolFunction` requires name, optionally description and parameters:Record&lt;string, unknown&gt;. `ChatTool` requires type:'function' and function. `ChatToolChoice` permits 'none', 'auto', or `{ type: 'function', function: { name } }`; this version does not declare a 'required' literal.

`ChatResponse` requires choices:Choice[], created:number, id:string, object:string, usage:Usage. `Choice` has optional finish_reason, index, message and delta. `Usage` declares completion_tokens, prompt_tokens and total_tokens. Response, Choice, Usage and Message allow additional properties. These are TypeScript declarations, not JSON validation; providers may omit usage in stream chunks, so consume only fields present.

## Complete request

Use a trusted backend to hold provider credentials, or an application-specific compatible proxy. The example function takes configuration instead of embedding a real key. Its endpoint must serve `/v1/chat/completions` when baseURL ends in `/v1`.

```ts
import { OpenAI, type OpenAIOptions } from '@ahoo-wang/fetcher-openai';

export async function answer(options: OpenAIOptions, model: string) {
  const client = new OpenAI(options);
  try {
    const result = await client.chat.completions({
      model,
      messages: [{ role: 'user', content: 'Say hello.' }],
      stream: false,
    });
    return result.choices[0]?.message?.content ?? '';
  } catch (error) {
    console.error('Chat request failed', error);
    throw error;
  }
}
```

Network, HTTP-status and JSON-decoding failures propagate through Fetcher. There is no automatic model fallback or retry specific to this package. Non-stream JSON consumption has no reader to release; clients have no dispose method. For reader ownership see [streaming](./streaming).

<span id="openaioptions"></span>

**`OpenAIOptions`** — [packages/openai/src/openai.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L24)

<span id="openai"></span>

**`OpenAI`** — [packages/openai/src/openai.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/openai.ts#L63)

<span id="chatclient"></span>

**`ChatClient`** — [packages/openai/src/chat/chatClient.ts:78](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts#L78)

<span id="chatrequest"></span>

**`ChatRequest`** — [packages/openai/src/chat/types.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L14)

<span id="chattoolfunction"></span>

**`ChatToolFunction`** — [packages/openai/src/chat/types.ts:99](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L99)

<span id="chattool"></span>

**`ChatTool`** — [packages/openai/src/chat/types.ts:116](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L116)

<span id="chattoolchoice"></span>

**`ChatToolChoice`** — [packages/openai/src/chat/types.ts:131](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L131)

<span id="message"></span>

**`Message`** — [packages/openai/src/chat/types.ts:136](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L136)

<span id="chatresponse"></span>

**`ChatResponse`** — [packages/openai/src/chat/types.ts:143](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L143)

<span id="choice"></span>

**`Choice`** — [packages/openai/src/chat/types.ts:153](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L153)

<span id="usage"></span>

**`Usage`** — [packages/openai/src/chat/types.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/types.ts#L166)
