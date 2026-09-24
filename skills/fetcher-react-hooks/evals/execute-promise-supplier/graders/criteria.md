---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Passes `execute` a function `(abortController) => fetch(url, { signal: abortController.signal })` instead of an already-started promise.
2. Reads the data from `result` or `onSuccess`, because `execute` resolves to `void`.

FAIL if the answer does any of these:

- Tells the user to use the value returned by `await execute(...)` as the data.
