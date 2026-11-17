# Plan: `@ahoo-wang/fetcher-cosec` to CoSec 8.0's wire contract

Not committed. Read: the audit, CoSec `main` (`ProblemType`, `StatusMapping`, `ProblemEncoder`, `CoSecParameters`, IDN/SCP rules, `authentication.md`, `web.md`, `upgrading.md`) and CoSec PR #1565 (`wiki/integration/clients.md`, still open, read with `gh`). Baseline: the repo is at 6.1.0 (the audit read 6.0.1); the stale `packages/fetcher/dist` made 3 `requestTrust` tests fail until I rebuilt the deps; now 432/432 pass.

## 1. Behaviour per problem type

The problem comes from `readProblemDetails` (core, since fetcher 6.1.0; reads a clone of the body). A response with no `application/problem+json` body, or a `type` outside `https://cosec.ahoo.me/problems/`, is "no problem" and keeps today's status-only behaviour. An unknown slug is treated by its status class: 401 as `token-expired` (refresh once), 403 as `forbidden`. Callbacks keep their signature and gain a second argument: `onUnauthorized(exchange, problem?)`, `onForbidden(exchange, problem?)`, new `onScopeRejected(exchange, problem)`.

| `code` | Request path | Callback receives |
|---|---|---|
| `INVALID_REQUEST` 400 | Not refreshed, session kept; rejects with the core's `HttpStatusValidationError` (`.problem`) | none |
| `UNAUTHORIZED` 401 | **No refresh** (it means no credential was seen; refreshing cannot help). Stored token kept. | `onUnauthorized(ex, problem)` |
| `TOKEN_EXPIRED` 401 | Refresh once, retry once (unchanged). Refresh refused: token removed | `onUnauthorized` only if the refresh is refused |
| `TOKEN_REVOKED`, `TOKEN_INVALID` 401 | **No refresh (M6).** The stored pair is removed if it is still the one that was sent (another tab may have signed in again) | `onUnauthorized(ex, problem)` |
| `FORBIDDEN` 403 | Not retried | `onForbidden(ex, problem)` |
| `SCOPE_REJECTED` 403 | Not retried. **Does not clear or fall back to the default space by itself** (a retry in another space can write to the wrong place) | `onScopeRejected(ex, problem)`; falls back to `onForbidden` when absent. `exchange` carries the `CoSec-Space-Id` that was sent |
| `TOO_MANY_REQUESTS` 429 | Never touches the session. `Retry-After` is exposed | none (the error has `.problem`) |
| `UNAVAILABLE` 503, `INTERNAL_ERROR` 500 | Session kept | none |

Also: no `CoSec-Space-Id` on the refresh call, and none on a request that carries no token (both are anonymous on the server, so `SCP-3` makes them `401 unauthorized`; today a spaced refresh route signs the user out at every expiry). `RefreshTokenError`/`RefreshUnavailableError` carry the `problem` of the refresh call.

**The refresh call (M1, M7).** `401` of any type ends the session (the application's recommended status; `token-expired` is also what an unreachable-by-anonymous route answers, which the client cannot tell apart). Everything else (400, 403, 404, **429**, 5xx, network) is no verdict: session kept, `RefreshUnavailableError`. After a 429 the client does not call the route again before `Retry-After`. Escape hatch for an application whose refresh answers 400/403 for a dead token: `CoSecConfig.isRefreshRejected(error)`, default = status 401.

## 2. Refresh state machine under rotation (M2, M3)

Facts used: a refresh presented again within `rotation-leeway` (default 30 s, operator's, unreadable by the client) of the server's move is answered; after it the session is revoked (`IDN-16`). The server moves at some `m` >= the time the request was sent, so any retry sent before `t0 + leeway` is safe whatever happened to the first attempt.

- `t0` = send time of the first attempt on a pair whose outcome is unknown. It is stored with the pair (same storage, so a reload or another tab knows) and never slides. It is cleared when a new pair is stored or the session ends.
- Outcome unknown = timeout, network error, 5xx (`IDN-19`: "a write that cannot be confirmed" may have been applied), or a non-CoSec answer. Outcome known: 2xx; a CoSec refusal (pipeline refusals happen before the handler, so `429` and `400` mean nothing was moved: first-attempt marker is cleared, but an older unresolved `t0` stays).
- **Inside the window** (`now - t0 < leeway - 5 s`, `rotationLeeway` configurable, default 30 s): the same pair is retried, up to 2 times in the same call with short backoff, and again by any later request. This heals the lost-response case. Safe by the argument above.
- **After the window, outcome still unknown: I cannot make this safe.** One more attempt per request is made with the same pair (a gamble). It works if the first attempt never reached the server (common: mobile timeouts) and revokes the session if it was recorded; in that case the new pair is lost anyway, so the user signs in either way. A `401` then ends the session normally, with `TOKEN_REVOKED` in `problem` for the application to explain. **Decision for you (D1):** the alternative is a local sign-out at the end of the window (never presents a possibly replaced pair; costs false sign-outs after any long timeout). I recommend the gamble; it is a small change either way.
- **Shared storage (M3):** the lock, reload and cross-tab event bus stay for `localStorage` + Web Locks and are now also used for any storage the application declares shared: new `TokenStorage` option `sharedAcrossTabs: true` (custom IndexedDB/cookie-backed `Storage`). A tab that waited for the lock reads the pair the other stored.
- **Not made safe, documented:** `sessionStorage` (a duplicated tab starts with a copy of the pair), in-memory storage shared by app code, a custom storage not declared shared, no `navigator.locks` (insecure context): two holders of one pair each refresh it, and the next refresh of one of them revokes the session. The rule for such clients: refresh in one place only. A sync of new pairs between tabs by `sid` over `BroadcastChannel` would fix the `sessionStorage` copy case; not planned, say if you want it. Also not fixable: a cross-origin browser client against a host with no CORS filter before CoSec sees a refused refresh as a network error, i.e. "unknown outcome", forever (`web.md#cors`).

## 3. Removed / deprecated / added, and the version

- **Removed:** `AuthorizeResult`, `AuthorizeResults` (7.x names, nothing in 8.0 sends them); the `CoSec-App-Id` header, `CoSecHeaders.APP_ID`; the "any 4xx ends the session" rule; the `ForbiddenErrorInterceptor` assumption that every 403 is the same.
- **Deprecated (no-op, removed next major):** `appId` in `CoSecConfig`, `CoSecRequestOptions`, `AppIdCapable`, `CoSecOptions` (becomes optional, ignored; the app is the token's `aud`).
- **Added:** `CoSecProblemType`, `CoSecProblem`, `readCoSecProblem`, `getCoSecProblem(error|exchange)`, `ResponseCodes.TOO_MANY_REQUESTS`, `onScopeRejected`, `isRefreshRejected`, `rotationLeeway`, `TokenStorage({sharedAcrossTabs})`, `problem` on the two refresh errors, `sid`/`auth_time` on `CoSecJwtPayload` (additive). Claim names (`tenantId`, `roles`, `policies`, `attributes`, `aud`) are untouched.
- **Version:** breaking for the package and CoSec-8-only (a 7.x server reads `CoSec-App-Id`). The repo versions in lockstep: `update-all-versions.sh` writes one version to every package, `publish-npm.sh` publishes every package, peers/deps are `workspace:^` (react would publish a dependency on `cosec ^7`). A cosec-only major needs release-tooling changes (the repo says ask first). **Proposal: the maintainers' release PR runs `pnpm update-version 7.0.0` for the whole repo** (as 6.0.0 did); notes: "only `fetcher-cosec` changes; 6.x speaks CoSec 7.x, 7.0 speaks CoSec 8.0". The `5.x` branch precedent suggests a `6.x` maintenance branch for CoSec 7 users. I bump nothing.

## 4. `packages/react` and other users

React imports only `TokenStorage`, `JwtTokenManager`, `CompositeToken`, `CoSecJwtPayload` (types and storage): no source change; its tests run as regression. Its `RouteGuard.onUnauthorized` is its own prop. `integration-test/src/cosec/cosec.ts` drops `appId`. Docs: `packages/cosec` README en/zh, `wiki/reference/cosec/*`, `wiki/guides/integrations/cosec.md` (+ `wiki/zh`), `skills/fetcher-cosec-auth` (SKILL, `references/api.md`, evals that name `appId`/4xx), `skills/fetcher-v6-migration` (CoSec lines), `AGENTS.md` of the package; `llms*.txt` are generated, not edited.

## 5. Tests

No CoSec server. A test model `test/support/fakeCoSec.ts` implements the contract rows used: access/refresh pairs with `sid` and generations, `rotation-leeway` on a fake clock, expired token = anonymous, `SCP-3`, `scope-rejected`, rate limit, problem bodies in `ProblemEncoder`'s byte shape, a refresh route that is or is not anonymous-reachable, response loss on demand, two "tabs" (two managers over one storage and fake `navigator.locks`). Each of M1-M7 gets a test that fails on today's code. A model is only as right as my reading, so it proves the client against the contract as written, not against CoSec.

**A real CoSec 8 host would need (not built):** a sample Spring Boot app with the starter, a refresh route with the policy of `clients.md`, `TokenFamilies` with a short `rotation-leeway` (3 s), a rate limit rule on the refresh route, a CORS filter, a login, a spaced route; run from `integration-test` as a separate project (Node 22 `fetch`, plus Playwright for two tabs and Web Locks). Better: CoSec publishes golden `problem+json` bodies for the ten types (it owns the encoder) and both sides test against them.

## 6. Where I am unsure

1. D1 above (late retry); also the 5 s margin and 2 in-call retries are my choices.
2. `401` of any type on refresh ends the session: the application owns that status (`clients.md` says recommendation), so 400/403 refusals change behaviour; `isRefreshRejected` is my escape hatch. Audit says a malformed pair is `400`/`401`; `clients.md` says `401` for `TokenVerificationException`.
3. `clients.md` tells a client on `scope-rejected` to drop the stored space (default space as fallback); I leave that to an application callback because the fallback can write to another space. Your call.
4. Treating a 503 from the refresh as "possibly recorded" follows `IDN-19`'s wording; not tested against a host.
5. `rotation-leeway` is unreadable by the client; the contract page should say the client must be configured to the server's value (or less).
6. `TOKEN_EXPIRED` from the refresh route is ambiguous (session over, route closed to anonymous, clock): I surface the problem and document, nothing more.
7. The audit says the client reads no `CoSec-Request-Id`; I put `requestId` from the body on `CoSecProblem` and do not read the header.
