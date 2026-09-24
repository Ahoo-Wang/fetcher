---
type: llm
weight: 1
---

This request belongs to $fetcher-openai-client, not $fetcher-llm-streaming. Pass only if every point holds:

- Uses the `OpenAI` client from `@ahoo-wang/fetcher-openai` with `chat.completions({ ..., stream: true })`, which already handles `[DONE]`.
- Does not hand-roll SSE parsing or a custom terminate detector for the OpenAI API.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
