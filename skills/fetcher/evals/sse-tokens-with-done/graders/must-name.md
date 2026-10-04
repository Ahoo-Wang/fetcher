---
type: regex
pattern: 'requiredJsonEventStream|jsonEventStream|toJsonServerSentEventStream|jsonEventStreamResultExtractor'
match: contains
target: last_message
---

The answer reads a JSON event stream with one of the eventstream helpers.
