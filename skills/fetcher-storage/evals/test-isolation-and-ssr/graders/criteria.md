---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Gives each test its own `KeyStorage` with `storage: new InMemoryStorage()`.
2. Explains at least one of the causes: `get()` caches the value, or the default backend is the shared `localStorage` when `window` exists and a fresh in-memory storage otherwise.

FAIL if the answer does any of these:

- Relies only on `localStorage.clear()` in `beforeEach` as the fix.
