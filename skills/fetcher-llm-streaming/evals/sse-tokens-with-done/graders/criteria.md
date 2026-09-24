---
type: llm
weight: 1
---

Grade the final answer against $fetcher-llm-streaming. Pass only if every point holds:

- Imports `'@ahoo-wang/fetcher-eventstream'` for its side effect (it patches `Response.prototype`).
- Defines a `TerminateDetector` that stops on `'[DONE]'`.
- Iterates `response.requiredJsonEventStream(detector)` with `for await`, reading `event.data.token`.
- Notes that without the detector the `[DONE]` line reaches `JSON.parse` and throws.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
