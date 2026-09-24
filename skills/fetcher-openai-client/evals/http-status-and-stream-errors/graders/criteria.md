---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Catches the failed completion call's `ExchangeError`/`HttpStatusValidationError` and reads the status from `error.exchange.response?.status`.
2. Does not swallow errors raised while iterating the stream (`SyntaxError`, network errors): they are rethrown or surfaced.
