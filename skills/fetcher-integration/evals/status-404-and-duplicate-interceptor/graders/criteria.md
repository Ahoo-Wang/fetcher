---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Explains that the 404 rejects because of status validation, and handles it per call with the `IGNORE_VALIDATE_STATUS` attribute, per client with `validateStatus`, or by recovering in an error interceptor.
2. Gives a cause for the double log that fits Fetcher's rules — for example that `use()` ignores a second interceptor with the same `name` (so the duplicate is registered under another name or on another fetcher), or that the error is logged again by the caller because the interceptor does not clear `exchange.error`.

FAIL if the answer does any of these:

- Claims Fetcher resolves non-2xx responses without throwing by default.
