---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Catches the rejected `chat.completions(...)` call as `ExchangeError` (or its subclass `HttpStatusValidationError`) from `@ahoo-wang/fetcher` and reads the status from `error.exchange.response?.status`.
2. Explains that errors after the stream starts surface from the `for await` loop (`SyntaxError`, `EventStreamIncompleteError` when the stream ends before `[DONE]`, network errors), are not `ExchangeError`s, and rethrows or surfaces them instead of swallowing them.

FAIL if the answer does any of these:

- Reads the status Axios- or SDK-style, as `error.response.status` or `error.status`.
- Has a catch-all around the loop that only logs and continues, or treats a stream that ended early as a complete answer.
