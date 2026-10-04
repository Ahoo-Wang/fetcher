---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that `get()` caches the value and that each instance has its own default local event bus, so a write through one instance never reaches the other's cache.
2. Fixes it by sharing one `KeyStorage` instance (exported from a module) or by passing the same `eventBus` to both instances; `reload()` may be mentioned as a read-time workaround.

FAIL if the answer does any of these:

- Claims `KeyStorage` listens to `localStorage` or the window `storage` event, or adds a `storage` event listener as the fix.
- Suggests clearing `localStorage` or a cache-busting option `KeyStorage` does not have.
