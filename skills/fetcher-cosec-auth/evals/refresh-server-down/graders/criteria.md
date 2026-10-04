---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says CoSec already makes this split: only a 4xx from the refresh endpoint (or a malformed refresh response) removes the token and calls `onUnauthorized` (`RefreshTokenError`); a network error, timeout, abort or 5xx keeps the session and rejects with `RefreshUnavailableError` without calling `onUnauthorized`.
2. Redirects to `/login` from `onUnauthorized` on the `CoSecConfigurer` (with a `tokenRefresher`, e.g. `CoSecTokenRefresher`).
3. Shows the toast at the call site by testing the rejection's `cause`: `error instanceof ExchangeError && error.cause instanceof RefreshUnavailableError` (or an equivalent `error.cause` check).

FAIL if the answer does any of these:

- Writes its own refresh/401 interceptor or wraps `tokenRefresher.refresh` to swallow errors, instead of relying on the built-in split.
- Tests `error instanceof RefreshUnavailableError` on the call's rejection directly (the call rejects with an `ExchangeError` whose `cause` is it).
- Calls `tokenStorage.signOut()` for every refresh failure, or redirects from a generic `catch`.
- Says a custom `TokenRefresher` signals "signed out" by throwing any `Error` (it must carry `exchange.response.status` with the 4xx).
