---
type: llm
weight: 1
---

Grade the final answer against $fetcher-cosec-auth. Pass only if every point holds:

- Explains that the Authorization request interceptors are registered only when `tokenRefresher` is configured on `CoSecConfigurer`; with just `appId` and `tokenStorage` no Authorization header is added.
- Explains that a token must also be stored (`tokenStorage.signIn(...)`) before requests can carry it.
- Gives the corrected configuration with a `tokenRefresher` (for example `CoSecTokenRefresher`).
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
