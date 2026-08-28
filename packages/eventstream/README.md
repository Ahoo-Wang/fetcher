# `@ahoo-wang/fetcher-eventstream`

Parse Server-Sent Events into Web Streams and consume typed JSON events with
async iteration. Use it when an HTTP response is incremental rather than one
complete body.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream
```

Peer dependency: `@ahoo-wang/fetcher`. Importing the package augments the
platform `Response` type and prototype with event-stream helpers.

## Example

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

## Core capabilities

- `Response` content-type detection and optional/required stream helpers.
- SSE line and event parsing through native `TransformStream` stages.
- Typed JSON event streams and protocol-specific termination detection.
- Fetcher result extractors for raw and JSON SSE streams.
- Conversion errors that retain the source `Response`.

## Documentation

- [Streaming concepts](https://fetcher.ahoo.me/learn/streaming)
- [Event stream reference](https://fetcher.ahoo.me/reference/eventstream)
- [Interactive stories](https://fetcher.ahoo.me/storybook/)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
