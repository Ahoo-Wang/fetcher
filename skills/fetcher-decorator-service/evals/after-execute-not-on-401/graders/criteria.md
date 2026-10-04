---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that `afterExecute` runs only after a successful exchange, and the default status validation rejects the 401 before it is reached.
2. Moves the 401 redirect to a fetcher error interceptor (checking `exchange.error` is an `HttpStatusValidationError` / `exchange.response?.status === 401`), a response interceptor ordered before `VALIDATE_STATUS_INTERCEPTOR_ORDER`, or CoSec's `onUnauthorized`.

FAIL if the answer does any of these:

- Recommends disabling status validation so that `afterExecute` can handle the 401, as the main fix.
- Claims `afterExecute` runs on errors or in a `finally`, or blames a missing `implements ExecuteLifeCycle` (the hook is found at runtime by name).
- Moves the redirect into `beforeExecute`, or into a `try/catch` around every service call as the main fix.
