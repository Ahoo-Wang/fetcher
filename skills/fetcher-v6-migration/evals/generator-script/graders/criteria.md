---
type: llm
weight: 1
---

Grade the final answer against $fetcher-v6-migration. Pass only if every point holds:

- States that `@ahoo-wang/fetcher-generator` became `@ahoo-wang/wow-generator` (command `wow-generator`; `fetcher-generator` stays an alias until Wow v10).
- States that it is not on npm yet, so the `npm view` check comes before any install; does not tell the user to install `@ahoo-wang/wow-*` without that check.
- Says generated code must be regenerated (it then imports `@ahoo-wang/wow-client`) or have its `@ahoo-wang/fetcher-wow` import rewritten.
- Ends with a type-check of `src/generated`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
