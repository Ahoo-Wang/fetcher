---
type: llm
weight: 1
---

Grade the final answer against $fetcher-openapi-types. Pass only if every point holds:

- Types the extensions with `Operation & CommonExtensions` (or the `Extensible` `x-*` keys) rather than `any`.
- Filters out operations whose `x-internal` is true.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
