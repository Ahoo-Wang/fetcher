---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Creates the bus as `new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(...) })` — an options object with `delegate`.
2. Registers the audit and UI handlers as `{ name, order, handle }` objects with distinct `name`s, the audit handler with the lower `order` so it runs first.

FAIL if the answer does any of these:

- Uses a `ParallelTypedEventBus` as the delegate while relying on `order`.
- Passes the local bus positionally (`new BroadcastTypedEventBus(new SerialTypedEventBus(...))`) or registers bare functions with `on(fn)`.
- Uses raw `BroadcastChannel` or `storage` events instead of the event bus.
