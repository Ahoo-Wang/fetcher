---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates a `NamedFetcher` with a name, `baseURL: 'https://api.example.com'` and `timeout: 5000`.
2. Registers a request interceptor with `interceptors.request.use({ name, order, intercept })` whose `intercept(exchange)` sets the `Authorization: Bearer <token>` header on the exchange's request (through `exchange.ensureRequestHeaders()`, for example with `setHeader`), reading the token from `localStorage` on each request.
3. Shows other modules getting the client by name through `fetcherRegistrar` (`get` or `requiredGet`).

FAIL if the answer does any of these:

- Writes an Axios-style interceptor that receives and returns a config object (`use(config => config)`, `interceptors.request.use(fn, errorFn)`).
- Writes the header straight into `exchange.request.headers.Authorization = …` without ensuring the optional `headers` object exists (it can be `undefined`).
- Reads the token once when the client is created and bakes it into the fetcher's `headers` option, so a later login or refresh is never sent.
- Exports only a plain `new Fetcher(...)` and has other modules import the variable, with no lookup by name.
