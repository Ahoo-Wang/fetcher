---
type: llm
weight: 1
---

Grade the final answer against $fetcher-integration. Pass only if every point holds:

- Creates `new NamedFetcher('api', { baseURL: 'https://api.example.com', timeout: 5000 })`.
- Registers `interceptors.request.use({ name, order, intercept })` whose `intercept(exchange)` mutates the exchange with `setHeader(exchange.ensureRequestHeaders(), 'Authorization', `Bearer ...`)` and returns nothing.
- Other modules retrieve it with `fetcherRegistrar.get('api')` or `fetcherRegistrar.requiredGet('api')`.
- Does not assign to `exchange.request.headers` directly.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
