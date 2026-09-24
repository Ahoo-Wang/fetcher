---
type: llm
weight: 1
---

This request belongs to $fetcher-storage, not $fetcher-eventbus. Pass only if every point holds:

- Treats this as persisted state: uses `KeyStorage` from `@ahoo-wang/fetcher-storage` (optionally with a `BroadcastTypedEventBus` as its `eventBus` for cross-tab sync).
- Does not build persistence out of a bare event bus plus hand-written `localStorage` calls.
- Invents no API: every `@ahoo-wang/*` import, class, function, option and constant it uses is one the Fetcher packages really export. Fail the response if it relies on a symbol, option or package that does not exist.
