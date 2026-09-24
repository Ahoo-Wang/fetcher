---
type: llm
weight: 1
---

This request belongs to $fetcher-integration, not $fetcher-v6-migration. Pass only if every point holds:

- Sets up `new NamedFetcher(name, { baseURL, timeout: 5000 })` with a request interceptor (`interceptors.request.use({ name, order, intercept })`) that sets the Bearer `Authorization` header.
- Does not turn the answer into a migration plan (no stay-on-5.x advice, no `@ahoo-wang/wow-*` packages): nothing is being migrated.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
