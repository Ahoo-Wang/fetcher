---
type: llm
weight: 1
---

Grade the final answer against $fetcher-openai-client. Pass only if every point holds:

- Sets `baseURL` to the gateway URL including `/v1`.
- Adds `openai.fetcher.interceptors.request.use({ name, order, intercept })` (with an `order`) that sets the `X-Trace-Id` header on the exchange.
- Notes that the client only sends Bearer auth (`apiKey`).
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
