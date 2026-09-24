---
type: llm
weight: 1
---

Grade the final answer against $fetcher-storage. Pass only if every point holds:

- Uses `storage: new InMemoryStorage()` for each test.
- Explains that `getStorage()` returns a fresh `InMemoryStorage` per call only when `window` is undefined (SSR), and that `get()` caches values.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
