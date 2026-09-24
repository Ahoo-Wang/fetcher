---
type: llm
weight: 1
---

Grade the final answer against $fetcher-react-hooks. Pass only if every point holds:

- Explains that `useFetcher`'s default result is the `FetchExchange`, not the parsed body.
- Passes `resultExtractor: ResultExtractors.Json` (or reads the exchange response) to get the user.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
