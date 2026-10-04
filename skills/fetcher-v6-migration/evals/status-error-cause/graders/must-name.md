---
type: regex
pattern: 'error instanceof HttpStatusValidationError|\w+ instanceof HttpStatusValidationError'
match: contains
target: last_message
---

The answer tests the error itself with `instanceof HttpStatusValidationError`.
