---
type: llm
weight: 1
---

Grade the final answer against $fetcher-storage. Pass only if every point holds:

- Creates `new KeyStorage<Theme>({ key: 'app:theme', defaultValue: { mode: 'light' } })` (the default JSON serializer is fine).
- Logs changes with `addListener({ name, handle })`, and notes it returns a remover function.
- Notes that `defaultValue` is not written to storage.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
