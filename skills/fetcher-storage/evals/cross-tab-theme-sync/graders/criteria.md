---
type: llm
weight: 1
---

Grade the final answer against $fetcher-storage. Pass only if every point holds:

- Passes `eventBus: new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus('app:theme') })` to `KeyStorage`.
- Explains that the default bus is local to the tab and that native `storage` events are not used.
- Uses one bus per key.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
