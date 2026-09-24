---
type: llm
weight: 1
---

Grade the final answer against $fetcher-eventbus. Pass only if every point holds:

- Creates the bus as `new BroadcastTypedEventBus({ delegate: new SerialTypedEventBus('cart-updated') })`.
- Registers the audit and UI handlers with unique `name`s and an `order` so the audit handler (lower `order`) runs first on the serial delegate.
- Notes that local handlers run first and that the sending tab does not receive its own broadcast message.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
