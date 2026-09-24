---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates a `NamedFetcher` with a name, `baseURL: 'https://api.example.com'` and `timeout: 5000`.
2. Registers a request interceptor with `interceptors.request.use({ name, intercept })` whose `intercept(exchange)` sets the `Authorization: Bearer <token>` header on the exchange's request, reading the token from `localStorage`.
3. Shows other modules getting the client by name through `fetcherRegistrar` (`get` or `requiredGet`).

FAIL if the answer does any of these:

- Writes an Axios-style interceptor that receives and returns a config object (`use(config => config)`).
