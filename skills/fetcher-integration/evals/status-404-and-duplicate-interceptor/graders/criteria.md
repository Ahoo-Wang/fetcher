---
type: llm
weight: 1
---

Grade the final answer against $fetcher-integration. Pass only if every point holds:

- Explains that non-2xx responses reject with `ExchangeError` because of status validation (`ValidateStatusInterceptor`).
- Skips validation per call with `attributes: new Map([[IGNORE_VALIDATE_STATUS, true]])` or per client with a `validateStatus` option.
- Explains that `use()` ignores an interceptor whose name is already registered (it returns `false`), and that an error interceptor recovers only by clearing `exchange.error`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
