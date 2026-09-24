---
type: llm
weight: 1
---

Grade the final answer against $fetcher-llm-streaming. Pass only if every point holds:

- Uses `toServerSentEventStream(response)` and `toJsonServerSentEventStream(stream, detector)` explicitly.
- Does not use the side-effect import of `'@ahoo-wang/fetcher-eventstream'` or `response.eventStream()`/`jsonEventStream()`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
