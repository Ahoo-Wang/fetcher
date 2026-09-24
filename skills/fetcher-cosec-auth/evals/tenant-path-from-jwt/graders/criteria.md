---
type: llm
weight: 1
---

Grade the final answer against $fetcher-cosec-auth. Pass only if every point holds:

- Keeps the `{tenantId}` placeholder in the request URL (`/tenant/{tenantId}/orders`).
- Lets `ResourceAttributionRequestInterceptor` (registered by CoSec) fill the placeholder from the current JWT.
- Does not decode the token and interpolate the tenant id into the URL by hand.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
