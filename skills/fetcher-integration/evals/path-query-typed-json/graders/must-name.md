---
type: regex
pattern: 'ResultExtractors\.Json|\.json\(\)'
match: contains
target: last_message
---

The answer parses the body (`ResultExtractors.Json` or `.json()`).
