---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says `ParallelTypedEventBus` ignores `order` entirely.
2. Switches to `SerialTypedEventBus`, which awaits handlers one by one sorted by `order` (lower first).
