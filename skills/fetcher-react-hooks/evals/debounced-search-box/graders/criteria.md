---
type: llm
weight: 1
---

Grade the final answer against $fetcher-react-hooks. Pass only if every point holds:

- Uses `useDebouncedFetcherQuery` with `debounce: { delay: 300 }`.
- Sets `autoExecute: true` explicitly (it is off by default for debounced hooks).
- Updates the keyword with `setQuery` on input and uses `run`/`cancel`/`isPending()` as needed.
- Renders `loading`, `result` and `error`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
