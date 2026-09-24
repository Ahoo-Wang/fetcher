---
type: llm
weight: 1
---

Grade the final answer against $fetcher-decorator-service. Pass only if every point holds:

- Explains that `afterExecute` runs only after a successful exchange: the default status validation throws on 401 before it is reached.
- Recommends handling 401 in an error interceptor on the fetcher, or with CoSec `onUnauthorized`, instead of `afterExecute`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
