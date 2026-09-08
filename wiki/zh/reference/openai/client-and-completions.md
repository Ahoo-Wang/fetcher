---
title: '客户端与聊天补全'
description: '客户端与聊天补全 — Fetcher 5.0.0'
---

# 客户端与聊天补全

本包实现 Chat Completions，没有 Responses、embeddings、images、files、audio 或 realtime 客户端。以下契约描述 SDK 当前实现，不保证供应商当前模型可用性或限制。

`OpenAI` 始终创建自己的 Fetcher 和 Authorization 头。复用已有认证代理时，应构造 `ChatClient({ fetcher })`，这样也会保留该 Fetcher 的请求头、超时和拦截器。ApiMetadata 应在首次调用前设置，因为装饰器执行器会按方法缓存元数据。

## 客户端契约

| API                                      | 输入/默认值                                               | 返回/效果                                                                     |
| ---------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `OpenAI(options)`                        | 必填 `baseURL: string`、`apiKey: string`，无默认端点      | 持有 readonly fetcher 和 chat；创建带 Authorization: Bearer apiKey 的 Fetcher |
| `OpenAIOptions`                          | 继承 BaseURLCapable，两字段必填                           | 仅为类型，不校验 key                                                          |
| `ChatClient(apiMetadata?)`               | 可选装饰器 ApiMetadata，如 `{ fetcher }`                  | 类 basePath 为 `chat`                                                         |
| `ChatClient.completions<T>(chatRequest)` | 必填 ChatRequest；向 chat basePath 下 `/completions` POST | 根据 stream 标记返回 ChatResponse 或 JSON SSE 流的 Promise                    |
| `ChatClient.beforeExecute(exchange)`     | FetchExchange，由装饰器运行时调用                         | void；request.body.stream 为真值时选择 CompletionStreamResultExtractor        |

字面量 `stream: true` 返回流；`false` 或无 stream 属性返回 ChatResponse。boolean 或宽类型 ChatRequest 返回响应/流联合，因此调用处应保留字面量或收窄请求。方法没有用于请求选项的第二个参数。

## 请求与结果类型

`ChatRequest` 必填 model:string、messages:Message[]。可选字段 frequency_penalty、presence_penalty、temperature、top_p、max_tokens、n、seed 为数字；logit_bias 为 Record&lt;string, number&gt; 或 null；response_format 为 Record&lt;string, unknown&gt;；stop 为 string/string[]/null；stream 为 boolean；user 为 string；tools 和 tool_choice 见下文。这些字段直接转发，SDK 不设置供应商默认值，不校验范围或模型能力。

`Message` 有可选 string content、role，并允许任意属性。`ChatToolFunction` 必填 name，可选 description、parameters:Record&lt;string, unknown&gt;。`ChatTool` 必填 type:'function' 和 function。`ChatToolChoice` 允许 'none'、'auto' 或 `{ type: 'function', function: { name } }`，此版本没有声明 'required' 字面量。

`ChatResponse` 必填 choices:Choice[]、created:number、id:string、object:string、usage:Usage。`Choice` 含可选 finish_reason、index、message、delta。`Usage` 声明 completion_tokens、prompt_tokens、total_tokens。Response、Choice、Usage、Message 均允许附加属性。这些是 TypeScript 声明，不是 JSON 校验；供应商流 chunk 可能省略 usage，应只消费实际存在的字段。

## 完整请求

在可信后端持有供应商凭据，或使用应用专用兼容代理。示例函数接受配置，不嵌入真实 key。当 baseURL 以 `/v1` 结尾时，服务需提供 `/v1/chat/completions`。

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

网络、HTTP 状态、JSON 解码失败通过 Fetcher 传播。本包没有专属模型回退或自动重试。非流式 JSON 消费无 reader 需释放；客户端没有 dispose 方法。reader 所有权见[流式处理](./streaming)。

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
