---
type: llm
weight: 1
---

This request belongs to $fetcher-integration, not $fetcher-decorator-service. Pass only if every point holds:

- Uses direct Fetcher calls (for example `fetcher.get(url, ...)` on a `Fetcher`/`NamedFetcher`) with a URL computed per call.
- Does not model the dynamic URL as a decorator service class (`@api`, `@get` and friends), which needs paths fixed at declaration time.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
