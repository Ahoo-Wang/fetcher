---
type: llm
weight: 1
---

This request belongs to $fetcher-v6-migration, not $fetcher-react-hooks. Pass only if every point holds:

- Explains that `usePagedQuery` was removed from `@ahoo-wang/fetcher-react` in 6.0 (moved to `@ahoo-wang/wow-react`).
- Does not tell the user to install `@ahoo-wang/wow-react` without first checking `npm view`; staying on 5.x (`@ahoo-wang/fetcher-react@5.1.3`) is an acceptable answer.
- Does not invent a replacement hook in `@ahoo-wang/fetcher-react`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
