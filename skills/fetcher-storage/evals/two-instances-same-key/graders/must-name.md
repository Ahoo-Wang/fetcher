---
type: regex
pattern: 'eventBus|reload\(|[Ss]hare'
match: contains
target: last_message
---

The answer names a shared `eventBus`, a shared instance, or `reload()`.
