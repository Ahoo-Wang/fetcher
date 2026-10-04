---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says this is an intended 6.0 behavior change, not a bug: a refresh that fails with a network error, timeout, abort or 5xx keeps the session (the token stays stored) and rejects with `RefreshUnavailableError`, which does not call `onUnauthorized`; a later request refreshes again.
2. Says only a 4xx from the refresh endpoint (or a malformed refresh response) still signs the user out with `RefreshTokenError` and `onUnauthorized`.
3. Shows how to handle the unavailable case at the call site, for example `error instanceof ExchangeError && error.cause instanceof RefreshUnavailableError` → show a "try again" message (or an equivalent check of `error.cause`).

FAIL if the answer does any of these:

- Calls it a bug or a misconfiguration of `CoSecConfigurer`/`CoSecTokenRefresher`, or tells the user to downgrade to 5.x to get the redirect back.
- Says `onUnauthorized` should fire for a 503 and suggests changing interceptor order or adding a `tokenRefresher` to make it fire.
- Claims the caller's rejection is the `RefreshUnavailableError` itself (it is the `ExchangeError` whose `cause` is it).
