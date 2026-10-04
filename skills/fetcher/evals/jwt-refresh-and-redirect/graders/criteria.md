---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Configures `CoSecConfigurer` from `@ahoo-wang/fetcher-cosec` with a `tokenRefresher` that refreshes at `/auth/refresh` (for example `new CoSecTokenRefresher({ fetcher, endpoint: '/auth/refresh' })`) and applies it to the fetcher (`.applyTo(fetcher)`).
2. Redirects to `/login` from the `onUnauthorized` callback and warns from the `onForbidden` callback.

FAIL if the answer does any of these:

- Writes its own 401 refresh-and-retry interceptor instead of using `CoSecConfigurer`.
- Redirects on the first 401, before a refresh is attempted.
