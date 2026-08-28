# `@ahoo-wang/fetcher-eventstream`

把 Server-Sent Events 解析为 Web Streams，并通过异步迭代消费类型化 JSON 事件。
HTTP 响应是增量数据而不是完整正文时使用该包。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream
```

Peer 依赖为 `@ahoo-wang/fetcher`。导入该包会给平台 `Response` 类型和原型增加事件流
辅助 API。

## 示例

```ts
import '@ahoo-wang/fetcher-eventstream';
import { Fetcher } from '@ahoo-wang/fetcher';

interface Progress {
  percent: number;
}

const response = await new Fetcher().get('/jobs/42/events');
const events = response.requiredJsonEventStream<Progress>();

for await (const event of events) {
  console.log(event.data.percent);
}
```

## 核心能力

- `Response` 内容类型识别和 optional/required 流辅助 API。
- 通过原生 `TransformStream` 阶段解析 SSE 行与事件。
- 类型化 JSON 事件流与协议专用结束检测。
- 面向原始与 JSON SSE 流的 Fetcher 结果提取器。
- 保留源 `Response` 的转换错误。

## 文档

- [流式响应概念](https://fetcher.ahoo.me/zh/learn/streaming)
- [事件流参考](https://fetcher.ahoo.me/zh/reference/eventstream)
- [交互 Story](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)
