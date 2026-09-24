---
type: llm
weight: 1
---

Grade the final answer against $fetcher-decorator-service. Pass only if every point holds:

- States there is no `@delete` decorator and the correct one is `@del`.
- Returns the raw exchange with `returnType: EndpointReturnType.EXCHANGE` on that endpoint (or a `resultExtractor` that yields the exchange) so headers can be read.
- Notes that decorated endpoints default to parsed JSON, unlike core `fetcher.get()`, which returns a `Response`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
