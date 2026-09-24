---
type: llm
weight: 1
---

Grade the final answer against $fetcher-cosec-auth. Pass only if every point holds:

- Configures auth with `new CoSecConfigurer({ appId, tokenStorage, tokenRefresher, onUnauthorized, onForbidden })` and calls `.applyTo(fetcher)` on the client.
- Uses `new CoSecTokenRefresher({ fetcher, endpoint: '/auth/refresh' })` as the `tokenRefresher`.
- Redirects to `/login` from `onUnauthorized` and warns from `onForbidden` (403).
- Stores the token after login with `tokenStorage.signIn(...)`.
- Notes that neither callback clears the error: the request still rejects after the callback runs.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
