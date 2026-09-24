---
type: regex
pattern: '\.signal'
match: contains
target: last_message
---

The answer hands the hook's abort signal to `fetch` (`.signal`).
