---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Says the user should not be signed out when the refresh is unreachable: a network error, timeout, abort or 5xx keeps the session and fails with `RefreshUnavailableError` (no `onUnauthorized`), while a 4xx from the refresh endpoint or an invalid token body removes the token and throws `RefreshTokenError`, which triggers `onUnauthorized`.
2. Says a custom `TokenRefresher` signals a rejected refresh token by throwing an error whose `exchange.response.status` is the 4xx (for example by letting the fetcher's `HttpStatusValidationError` propagate), and does not convert network failures into that.
3. Shows the request code treating `RefreshUnavailableError` (the rejection's `cause`) as "offline/retry later" rather than redirecting to /login.

FAIL if the answer does any of these:

- Signs the user out (or redirects to /login) on every refresh failure.
- Catches all errors inside the refresher and returns a fake or empty token.
