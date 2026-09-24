---
type: llm
weight: 1
---

This request belongs to $fetcher-decorator-service, not $fetcher-integration. Pass only if every point holds:

- Builds a declarative service class with `@api` and `@get`/`@post` from `@ahoo-wang/fetcher-decorator`.
- Does not replace the class with hand-written `fetcher.get`/`fetcher.post` wrapper methods.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
