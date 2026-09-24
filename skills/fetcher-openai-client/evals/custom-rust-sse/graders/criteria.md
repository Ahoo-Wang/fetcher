---
type: llm
weight: 1
---

This request belongs to $fetcher-llm-streaming, not $fetcher-openai-client. Pass only if every point holds:

- Parses the stream as generic SSE with `@ahoo-wang/fetcher-eventstream` (for example `jsonEventStream()`/`requiredJsonEventStream()` or `toJsonServerSentEventStream`), reading `event.data.delta`.
- Does not use the `OpenAI` client or OpenAI chat-completion types for a non-OpenAI service.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
