---
type: llm
weight: 1
---

Grade the final answer against $fetcher-eventbus. Pass only if every point holds:

- `ParallelTypedEventBus` ignores `order`.
- Switches to `SerialTypedEventBus`, which awaits handlers one after another sorted by `order` (lower first).
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the skill documents (in `SKILL.md` or `references/api.md`). Fail the response if it relies on a symbol, option or package that does not exist.
