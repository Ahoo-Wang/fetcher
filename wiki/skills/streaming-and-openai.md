---
title: Streaming and OpenAI skills
description: Choose Fetcher skills for Server-Sent Events and OpenAI chat streaming.
pageClass: skills-page
---

# Streaming and OpenAI skills

Use the stream skill for transport mechanics. Use the OpenAI skill when the
request and response follow OpenAI chat contracts.

## `$fetcher-llm-streaming`

**Use for:** SSE parsing, `Response` stream helpers, JSON conversion,
termination detection, async iteration, cancellation, and malformed-event
handling.

```text
$fetcher-llm-streaming consume an SSE endpoint as typed JSON events.
Stop on [DONE], expose AbortSignal, and surface conversion failures.
```

The skill reminds the agent to import the eventstream side effect before using
`Response` prototype helpers. Standalone conversion functions remain available
when prototype extension is undesirable.

Continue with the [Event stream reference](../reference/eventstream.md).

## `$fetcher-openai-client`

**Use for:** `OpenAI`, `ChatClient`, chat completion input and output types,
streaming choices, completion extractors, and client interceptors.

```text
$fetcher-openai-client build a streaming chat service with an injected API key.
Render incremental text, stop on the protocol terminator, and make cancellation
visible to the caller.
```

The skill never treats a browser-bundled secret as safe. Put credentials behind
a trusted server boundary or inject them only in a controlled server runtime.

Continue with the [OpenAI reference](../reference/openai.md) or the
[OpenAI streaming recipe](../recipes/openai-streaming.md).

## Selection rule

| If the task mentions…                                 | Start with                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| SSE framing, event fields, `[DONE]`, `ReadableStream` | `$fetcher-llm-streaming`                                                                      |
| chat completions, messages, OpenAI models, deltas     | `$fetcher-openai-client`                                                                      |
| both protocol layers                                  | `$fetcher-openai-client`, then load `$fetcher-llm-streaming` only for transport-level changes |
