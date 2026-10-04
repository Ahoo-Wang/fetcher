---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that in 6.0 a non-2xx response rejects with the `HttpStatusValidationError` itself (it is a subclass of `ExchangeError`), so `error.cause` is no longer the status error.
2. Rewrites the check to `error instanceof HttpStatusValidationError` (optionally also checking the status is 404 via `error.exchange.response?.status`), placed before any generic `ExchangeError` handling.

FAIL if the answer does any of these:

- Keeps reading the status error from `error.cause`.
- Blames something else (CORS, the URL template, a missing result extractor) as the cause.
