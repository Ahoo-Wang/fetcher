---
name: fetcher-llm-streaming
description: >
  Consume SSE and LLM token streams with `@ahoo-wang/fetcher-eventstream`: Response prototype helpers, standalone converters, termination detectors, result extractors, and ReadableStream async iteration. Use for `eventStream`, `jsonEventStream`, or token-by-token responses.
---

# fetcher-llm-streaming

## Workflow

1. Import `@ahoo-wang/fetcher-eventstream` for side-effect prototype helpers when using `Response` extensions.
2. Use standalone conversion functions when prototype mutation is undesirable.
3. Handle stream conversion errors explicitly with `EventStreamConvertError`.
4. For OpenAI-style DONE termination, supply a detector function (`TerminateDetector`); the ready-made `DoneDetector` lives in `@ahoo-wang/fetcher-openai`.
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
