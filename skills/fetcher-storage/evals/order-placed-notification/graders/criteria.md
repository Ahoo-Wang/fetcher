---
type: llm
weight: 1
---

This request belongs to $fetcher-eventbus, not $fetcher-storage. Pass only if every point holds:

- Uses a typed event bus from `@ahoo-wang/fetcher-eventbus` (for example `SerialTypedEventBus`) to publish and subscribe to the order-placed event.
- Does not use `KeyStorage` or any persistence for a notification that stores nothing.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
