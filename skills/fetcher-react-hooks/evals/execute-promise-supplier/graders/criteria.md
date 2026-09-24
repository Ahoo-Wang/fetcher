---
type: llm
weight: 1
---

Grade the final answer against $fetcher-react-hooks. Pass only if every point holds:

- Passes a PromiseSupplier `(abortController) => fetch(url, { signal: abortController.signal })` to `execute`, not an already-started promise.
- Reads the data from `result` or `onSuccess`, because `execute` resolves to `void`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
