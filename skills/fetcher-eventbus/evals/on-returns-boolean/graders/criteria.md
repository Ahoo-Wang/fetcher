---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that `on()` returns a boolean (`false` when a handler with that name already exists, which is then not added), not an unsubscribe function.
2. Unsubscribes with `off(name)`, using the handler's `name`.

FAIL if the answer does any of these:

- Calls `off(handler)` with the handler object or function instead of its name.
- Calls a method the bus does not have, such as `unsubscribe`, `removeListener` or `removeHandler`.
