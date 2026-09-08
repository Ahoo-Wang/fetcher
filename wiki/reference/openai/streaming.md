---
title: 'Streaming chat completions'
description: 'Streaming chat completions — Fetcher 5.0.0'
---

# Streaming chat completions

Request `stream: true` to receive `JsonServerSentEventStream<ChatResponse>`. Each value is a JSON SSE event: read `event.data.choices`, not `event.choices`. Deltas are incremental, not the final accumulated message.

## Extraction and termination

| Export                                          | Contract                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `DoneDetector(event: ServerSentEvent): boolean` | True only when raw event.data equals `[DONE]` exactly; no trimming/case folding           |
| `CompletionStreamResultExtractor(exchange)`     | Requires a FetchResponse and readable body; returns requiredJsonEventStream(DoneDetector) |

The terminal marker is recognized before JSON parsing and is not emitted as a ChatResponse. Other malformed JSON fails stream consumption. A successful request Promise means a stream was obtained; errors can still occur later while reading. The extractor does not assemble choices, execute tool calls, estimate usage, or reconnect.

## Complete streaming function

ChatClient does not accept a per-call signal parameter. Use the underlying Fetcher request API with CompletionStreamResultExtractor when you need a per-request signal. An AbortController can stop the pending request; cancel the acquired reader when finishing early, and always release its lock.

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CompletionStreamResultExtractor,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

export async function readAnswer(
  baseURL: string,
  model: string,
  signal: AbortSignal,
) {
  const fetcher = new Fetcher({ baseURL });
  const stream = await fetcher.post<JsonServerSentEventStream<ChatResponse>>(
    '/chat/completions',
    {
      signal,
      body: {
        model,
        messages: [{ role: 'user', content: 'Say hello.' }],
        stream: true,
      },
    },
    { resultExtractor: CompletionStreamResultExtractor },
  );
  const reader = stream.getReader();
  let answer = '';
  let finished = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        break;
      }
      answer += value.data.choices[0]?.delta?.content ?? '';
    }
    return answer;
  } finally {
    try {
      if (!finished) await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}
```

The example expects an authenticated same-application proxy or a server-side configured transport. It does not call an external provider during documentation checks. See [EventStream cancellation](../eventstream/consumption-and-cancellation) for iteration alternatives.

<span id="donedetector"></span>

**`DoneDetector`** — [packages/openai/src/chat/completionStreamResultExtractor.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L39)

<span id="completionstreamresultextractor"></span>

**`CompletionStreamResultExtractor`** — [packages/openai/src/chat/completionStreamResultExtractor.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L88)
