---
type: llm
weight: 1
---

This request belongs to $fetcher-v6-migration, not $fetcher-openapi-types. Pass only if every point holds:

- Does not claim that `@ahoo-wang/fetcher-openapi` generates clients: it only provides types.
- Does not tell the user to install a client generator from fetcher 6 (`@ahoo-wang/fetcher-generator` left fetcher in 6.0), and does not tell them to install `@ahoo-wang/wow-generator` without first checking `npm view`.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
