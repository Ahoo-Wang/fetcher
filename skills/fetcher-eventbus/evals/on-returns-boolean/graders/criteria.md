---
type: llm
weight: 1
---

Grade the final answer against $fetcher-eventbus. Pass only if every point holds:

- Explains that `on()` returns a boolean (`false` when a handler with the same name is already registered), not an unsubscribe function.
- Unsubscribes with `off(name)` using the handler name.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
