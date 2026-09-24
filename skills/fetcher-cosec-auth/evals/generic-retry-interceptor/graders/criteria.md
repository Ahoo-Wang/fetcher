---
type: llm
weight: 1
---

This request belongs to $fetcher-integration, not $fetcher-cosec-auth. Pass only if every point holds:

- Answers the request as a generic Fetcher interceptor (a named, ordered response or error interceptor on `fetcher.interceptors`) that retries on HTTP 503.
- Does not bring in CoSec (`CoSecConfigurer`, token refresh, `onUnauthorized`) for this task: a 503 retry has nothing to do with authentication.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
