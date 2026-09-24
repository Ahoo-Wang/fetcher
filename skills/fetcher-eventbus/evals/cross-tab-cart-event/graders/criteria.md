---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates the bus as a `BroadcastTypedEventBus` whose `delegate` is a `SerialTypedEventBus`.
2. Registers the audit and UI handlers with distinct `name`s and gives the audit handler the lower `order`, so it runs first.

FAIL if the answer does any of these:

- Uses a `ParallelTypedEventBus` as the delegate while relying on `order`.
- Uses raw `BroadcastChannel` or `storage` events instead of the event bus.
