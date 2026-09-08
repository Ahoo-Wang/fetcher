---
next: false
title: Stream a Chat Completion
description: Consume Chat Completions SSE through an application gateway with cancellation and reader cleanup.
---

# Stream a Chat Completion

Build a cancellable text stream using the package's Chat Completions contract. This recipe documents the installed client behavior; it does not select a provider model or add other OpenAI endpoints.

Installation must also resolve every declared peer dependency; see the [package prerequisites](../../reference/openai/index.md) for the complete graph. Application routes and identities below are supplied by your application, not created by installation.

## 1. Prepare the gateway

Install `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-openai` and `@ahoo-wang/fetcher-eventstream`. Your application gateway must accept `POST /chat/completions`, forward an authorized model request, and return `text/event-stream` with JSON data events followed by `[DONE]`. Use the gateway base URL and a model ID enabled by that gateway. Keep provider credentials on the trusted server; browser authentication belongs to your application.

## 2. Consume and release the stream

```ts
import { Fetcher, ExchangeError } from '@ahoo-wang/fetcher';
import {
  CompletionStreamResultExtractor,
  type ChatResponse,
} from '@ahoo-wang/fetcher-openai';
import type { JsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

export async function streamAnswer(
  baseURL: string,
  model: string,
  signal: AbortSignal,
  onText: (text: string) => void,
) {
  const api = new Fetcher({ baseURL });
  try {
    const stream = await api.post<JsonServerSentEventStream<ChatResponse>>(
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
    let finished = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          break;
        }
        const text = value.data.choices[0]?.delta?.content;
        if (text) onText(text);
      }
    } finally {
      try {
        if (!finished) await reader.cancel();
      } finally {
        reader.releaseLock();
      }
    }
  } catch (error) {
    if (signal.aborted) return;
    if (error instanceof ExchangeError) {
      console.error('HTTP status:', error.exchange.response?.status);
    }
    throw error;
  }
}
```

The extractor stops at `[DONE]` before attempting JSON parsing. The text is under `event.data.choices`, not directly under the SSE event. A chunk can contain role/finish information without text, so the loop skips missing content.

## 3. Connect start and stop actions

At the owning UI or server boundary, create an `AbortController`, call `streamAnswer(gatewayOrigin, modelId, controller.signal, appendText)`, and catch its rejection to display a recoverable error. Wire the stop button and owner cleanup to `controller.abort()`. Create a new controller for each attempt. `appendText` is your application's render callback; the function above treats an explicitly aborted signal as normal cancellation.

The reader lock is released after success or failure. If the consumer fails before normal completion, it cancels the reader first. An HTTP timeout is not a whole-stream deadline after response extraction; use your own abort timer if you need one and clear it during cleanup.

## 4. Check the protocol locally

Mock fetch with a `Response` whose content type is `text/event-stream` and body is `data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n`. Assert that `onText` receives `Hello`. Also test malformed JSON and an aborted request. Restore fetch after the isolated test. This checks the client without spending provider quota.

Network/status errors reject the initial request; malformed SSE/JSON or transport failure can reject a later read. Handle both. Avoid automatically replaying a partially displayed answer: retry starts a new completion.

## When you do not need caller-owned cancellation

The higher-level `ChatClient` chooses JSON or SSE from `stream`. This complete non-streaming function uses the same gateway:

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { ChatClient } from '@ahoo-wang/fetcher-openai';

export async function complete(baseURL: string, model: string) {
  const chat = new ChatClient({ fetcher: new Fetcher({ baseURL }) });
  const result = await chat.completions({
    model,
    messages: [{ role: 'user', content: 'Say hello.' }],
  });
  return result.choices[0]?.message?.content ?? '';
}
```

Pass `stream: true` for a `JsonServerSentEventStream<ChatResponse>`. The public `completions` method has no per-call signal argument, which is why the cancellable guide uses Fetcher directly.

See [streaming contracts](../../reference/openai/streaming), [ChatClient and request types](../../reference/openai/client-and-completions), and [stream consumption](../../reference/eventstream/consumption-and-cancellation).

[completionStreamResultExtractor.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/completionStreamResultExtractor.ts#L88) connects response extraction to the done detector.

[Review integration boundaries](../../architecture/integration-decisions.md); [return to this task group](./index.md).
