---
type: llm
weight: 1
---

Grade the final answer against $fetcher-openai-client. Pass only if every point holds:

- Catches `ExchangeError`/`HttpStatusValidationError` from the completion call and reads the status from `error.exchange.response?.status`.
- Does not swallow errors raised while iterating the stream (such as `SyntaxError` or network errors): they are rethrown or surfaced.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
