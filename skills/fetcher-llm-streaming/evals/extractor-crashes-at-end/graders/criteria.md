---
type: llm
weight: 1
---

Grade the final answer against $fetcher-llm-streaming. Pass only if every point holds:

- Explains that `JsonEventStreamResultExtractor` passes no terminate detector, so the terminal line is parsed as JSON and throws.
- Writes a custom `ResultExtractor` calling `exchange.requiredResponse.requiredJsonEventStream(detector)` and sets it on the endpoint.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
