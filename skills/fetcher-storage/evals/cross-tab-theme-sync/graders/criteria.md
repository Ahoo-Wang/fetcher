---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Passes `eventBus: new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus(...) })` to the theme's `KeyStorage` — the constructor takes an options object with `delegate`, not the local bus as a positional argument.
2. Explains that the default event bus is local to the tab (native `storage` events are not used).

FAIL if the answer does any of these:

- Claims `KeyStorage` already syncs across tabs by default.
- Adds a `window` `storage` event listener as the sync mechanism.
- Calls `new BroadcastTypedEventBus(new SerialTypedEventBus(...))` with the local bus as a positional argument.
