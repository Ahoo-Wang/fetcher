# `@ahoo-wang/fetcher-openai`

类型化 OpenAI Chat Completions 客户端，自动处理 JSON 与 Server-Sent Event 结果。
在可信服务端或自有代理之后使用。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openai
```

Peer 依赖：`fetcher`、`fetcher-decorator` 和 `fetcher-eventstream`。

## 示例

```ts
import { OpenAI } from '@ahoo-wang/fetcher-openai';

const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = await openai.chat.completions({
  model: 'gpt-4.1-mini',
  messages: [{ role: 'user', content: '写一段简短发布说明。' }],
  stream: true,
});

for await (const event of stream) {
  const text = event.data.choices[0]?.delta?.content;
  if (text) process.stdout.write(text);
}
```

切勿把 API Key 嵌入浏览器产物或 Storybook。

## 核心能力

- 根据 `stream` 字面量标志推导条件返回类型。
- 非流式 `ChatResponse` JSON 提取。
- 类型化 SSE 分块，并在 `[DONE]` 自动结束。
- 公开请求、响应、消息、choice、usage 与 delta 类型。
- 为已有配置 Fetcher 的应用提供 `ChatClient`。

## 文档

- [OpenAI 流式实战](https://fetcher.ahoo.me/zh/recipes/openai-streaming)
- [OpenAI 参考](https://fetcher.ahoo.me/zh/reference/openai)
- [交互式流 Story](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)
