---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code. The project is on `@ahoo-wang/fetcher-react` 6.

PASS only if the answer does all of these:

1. Wraps the app in `SecurityProvider` from `@ahoo-wang/fetcher-react`, passing the existing `tokenStorage` exported from `src/http.ts` (the same instance `CoSecConfigurer` uses).
2. Guards `/dashboard` with `RouteGuard`, redirecting from its `onUnauthorized` callback (`navigate('/login')`) or rendering a redirect as its `fallback` (e.g. `<Navigate to="/login" />`).
3. Implements sign-out with `signOut` from `useSecurityContext()` (or `useSecurity(tokenStorage)`).

FAIL if the answer does any of these:

- Creates a new `TokenStorage` for React instead of reusing the exported one.
- Reads `tokenStorage.authenticated` directly during render (not reactive) or calls `navigate()` during render instead of using `RouteGuard`/its callback or an effect.
- Writes its own auth context or token-change subscription in place of `SecurityProvider`.
