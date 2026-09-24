---
type: llm
weight: 1
---

Grade the final answer against $fetcher-integration. Pass only if every point holds:

- Uses `urlParams: { path: { id: 123 }, query: { include: 'profile' } }` with the `/users/{id}` template.
- Passes `{ resultExtractor: ResultExtractors.Json }` as the third argument and types the call as `User`.
- Notes that without it the call resolves to a `Response` (the default extractor).
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
