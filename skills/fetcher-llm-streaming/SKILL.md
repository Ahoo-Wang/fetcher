---
name: fetcher-llm-streaming
description: >
  Use when consuming Server-Sent Events, LLM token streams, OpenAI-style streaming chat responses, Fetcher eventstream helpers, response prototype extensions, stream termination detection, result extractors, or ReadableStream async iteration.
---

# fetcher-llm-streaming

## Use This Skill When

- The task involves SSE, EventSource-style data, streaming responses, or token-by-token UI updates.
- The task mentions `eventStream`, `jsonEventStream`, `textEventStream`, or `ReadableStreamAsyncIterable`.
- The task needs OpenAI-style completion chunks or DONE termination handling.
- The task needs a decorator result extractor for streaming endpoints.

## Workflow

1. Import `@ahoo-wang/fetcher-eventstream` for side-effect prototype helpers when using `Response` extensions.
2. Use standalone conversion functions when prototype mutation is undesirable.
3. Handle stream conversion errors explicitly with `EventStreamConvertError`.
4. Detect termination with the package helper instead of ad hoc string checks.
5. Load `references/api.md` for pipeline details, OpenAI streaming examples, and UI update patterns.

## Key Practices

- Keep parsing, termination detection, and UI state updates as separate steps.
- Use async iteration over streams to avoid buffering full responses in memory.
- When pairing with decorators, configure result extractors at the endpoint boundary.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs prototype extensions, standalone stream functions, SSE structures, termination handling, OpenAI streaming examples, and React UI update snippets.

## Related Skills

- $fetcher-openai-client: Use for higher-level OpenAI chat client setup.
- $fetcher-decorator-service: Use when the streaming endpoint is declared with decorators.
- $fetcher-react-hooks: Use when streaming data drives React state.
