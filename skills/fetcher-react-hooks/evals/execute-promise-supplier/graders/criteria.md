---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code. The project is on `@ahoo-wang/fetcher-react` 6.

PASS only if the answer does all of these:

1. Explains that `execute(fetch(...))` starts the request before the hook can control it, and passes `execute` a function `(abortController) => fetch(url, { signal: abortController.signal })` instead.
2. Reads the data from the hook's `result` state, from `onSuccess`, or from the state `await execute(...)` resolves to (`{ status, result, error }`, checking `status === 'success'`).

FAIL if the answer does any of these:

- Treats the value `await execute(...)` resolves to as the response data itself, or wraps `execute` in `try/catch` to catch request errors (it never rejects).
- Recommends the removed `propagateError` option.
