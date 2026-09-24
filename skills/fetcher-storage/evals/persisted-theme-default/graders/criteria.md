---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates a `KeyStorage` with a key and `defaultValue: { mode: 'light' }`.
2. Logs changes with `addListener({ name, handle })`.

FAIL if the answer does any of these:

- Says `defaultValue` is written to storage when the `KeyStorage` is created.
- Uses a listener method other than `addListener` (such as `on`, `subscribe` or `watch`).
