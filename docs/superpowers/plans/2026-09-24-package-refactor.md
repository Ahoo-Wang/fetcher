# Package Refactor (6.0)

A first-principles pass over every package, in dependency order, before 6.0
ships. The 2026-09-24 review (six parallel reviews, each finding reproduced by
a throwaway test) found that most defects trace back to six missing principles;
the refactor fixes the principles, not the symptoms one at a time.

## Principles

1. **Trust boundary.** Credentials go only where the configuration says they
   may. Nothing is sent to an origin because a URL happened to be absolute.
2. **One owner per value semantics.** How `undefined`, `null`, arrays and dates
   become URL text is defined once, in `@ahoo-wang/fetcher`'s `UrlBuilder`.
   Layers above bind values to names and never re-serialize them.
3. **Callers own their objects.** The library never mutates a request, headers
   record, `urlParams` or options object it was handed, and no two instances
   share a mutable default. Process-wide singletons live on `globalThis` under
   a `Symbol.for` key, so two copies of a package share them.
4. **Cancellation composes.** A timeout, a caller's `signal` and a caller's
   `AbortController` all apply at once; whichever fires first wins, with its
   own reason. Cancellation handles belong to the caller.
5. **Persisted state heals.** A corrupt or foreign value in storage degrades to
   "absent"; it never makes every later read, write or sign-out throw.
6. **Render is pure, server and client agree.** No side effect during render;
   `getServerSnapshot` returns what the server rendered.

Public behavior changes are confirmed with the maintainer before they merge
(2026-09-25). Stages 1–5 were confirmed then; stage 6 keeps sending
credentials to every origin by default (maintainer's choice), with an opt-in
`sameOriginTrust`.

Compatibility: 6.0 is not a rewrite. Public names stay. A behavior changes only
when the old behavior is a defect no caller can want (`?a=undefined`, a timeout
silently dropped); each such change is listed in `docs/releases/v6.0.0.md`
under **Changed** or **Fixed**. Wow's TypeScript packages are the main
downstream; `downstream-wow.yml` must stay green.

## Order

Dependency order, so each package is refactored on top of settled foundations.
Each stage: deep review → plan the stage here → PRs (fix + regression test) →
update this file.

- [x] **1. `fetcher`** — detailed below. #1927, #1930.
- [x] **2. Release contract** (#1931, with `.github/scripts/package-contract.mjs`
      guarding it) — storage UMD global name (`Fetcher`, clashes
      with the core package); peer ranges `workspace:^`; unused react peers,
      react peer floor, `dequal` external. (`openai`/`openapi` import without
      `.js` in source, but unplugin-dts adds it: the declarations resolve —
      verified by `check:package-types` on a clean build. Style only.)
- [x] **3. `decorator` + `openapi`** (#1932) — parameter binding delegates
      serialization to fetcher (principle 2); subclass overrides; parameter
      name reflection; executor cache off the instance; OpenAPI 3.1 accuracy.
- [x] **4. `eventstream` + `openai`** (#1933) — EOF semantics per WHATWG, incomplete
      stream detection, linear line splitting, polyfill iterator cleanup,
      openai chunk types and `signal`.
- [x] **5. `eventbus` + `storage`** (#1934) — corrupt value recovery, `set(undefined)`,
      channel ownership and close, SSR.
- [x] **6. `cosec`** (#1935) — trusted origins (principle 1), cross-tab single-flight
      refresh, JWT payload validation, clock skew.
- [x] **7. `react`** (#1936) — render purity, SSR snapshots, `useQueryState`
      dependencies, subscription identity, `useLatest`, shared debounce
      scheduler.

## Stage 1: `fetcher`

Review findings, grouped by principle. ✅ = fixed.

**PR 1 — correctness (no API change)** — #1927.

- [x] Callers own their objects: every `Fetcher` gets its own headers record
      (all instances shared one `DEFAULT_HEADERS` object); `resolveExchange`
      copies `urlParams.path`/`query`, so an interceptor writing a path
      parameter no longer leaks it into the caller's reused request (cosec's
      `ResourceAttributionRequestInterceptor` could pin a tenant that way).
- [x] Cancellation composes: `timeoutFetch` combines the timeout with the
      caller's `signal` and `abortController` (a `signal` used to disable the
      timeout), never aborts the caller's controller, and never writes to the
      request.
- [x] `ReadableStream` bodies send `duplex: 'half'`.
- [x] URL semantics owned by `UrlBuilder`: query values `undefined`/`null`
      are omitted, arrays become repeated keys, `Date` becomes ISO text; a
      path placeholder with no value (including `null`, or no `path` at all)
      throws; Express placeholders are identifiers (`/files/:name.json`).
- [x] Singletons survive two copies: `fetcherRegistrar` on `globalThis`;
      `getFetcher` resolves names by type, not `instanceof Fetcher`.

**PR 2 — contracts** — #1930.

- [x] `Content-Type` describes the body: no default header on bodyless
      requests (every cross-origin GET was preflighted); JSON for plain
      objects and strings only; binary bodies keep the type fetch derives.
- [x] Errors: an `ExchangeError` thrown for the same exchange (e.g.
      `HttpStatusValidationError`) is rethrown as is instead of wrapped, so
      `instanceof HttpStatusValidationError` works.
- [x] JSDoc that contradicts the code (`timeoutFetch` examples,
      `@throws FetchError`, "ResponseResultExtractor returns the exchange",
      axios-style `FetcherConfigurer` example).

## Stage 3: `decorator` + `openapi`

One PR, #1932.

- [x] Binding by value shape (principle 2): a plain object is spread (as
      before — Wow's `@attribute() attributes` relies on it); arrays, dates and
      other values bind to the parameter name and fetcher serializes them. An
      explicitly named `@attribute('x')` stores under `x` (new
      `ParameterMetadata.explicit`; an inferred name does not count).
- [x] A subclass override of an inherited endpoint without its own decorator
      is kept.
- [x] Parameter-name inference with a scanner (strings, comments, nested
      brackets); destructured parameters have no name. Not a parser library: a
      full JS parser as a runtime dependency of a decorator package costs more
      than the 40-line scanner, and names only need identifiers.
- [x] Executor cache in a WeakMap, rebuilt when `apiMetadata` is replaced;
      unbound calls and standard (TC39) decorators fail with a clear error.
- [x] Placeholder warning uses the fetcher's template style and the merged
      path parameters.
- [x] OpenAPI types: required fields, 3.1 additions, `in` without `path`,
      `SecurityRequirement` not extensible. Kept as a 3.0 ∪ 3.1 superset for
      readers; `paths` stays required (optional in 3.1) so readers need no
      `?.` everywhere.

## Stage 4: `eventstream` + `openai`

One PR, #1933.

- [x] End of stream reported truthfully: a cut final line is dropped;
      complete lines missing only the blank line still dispatch (deliberate
      deviation from WHATWG, which drops them: some servers end that way); a
      stream with a terminate detector that ends without the terminating event
      errors with `EventStreamIncompleteError` (openai: before `[DONE]`).
- [x] `retry` only on the event whose block set it; linear line splitting;
      polyfill iterator `throw`/`next`/`return` semantics.
- [x] openai: `completions(request, signal?)`, `usage?`, `stream_options`,
      JSDoc.

## Stage 5: `eventbus` + `storage`

- [x] Corrupt stored value → removed with a warning, read as absent (it made
      `get`/`set`/`remove` all throw); `set(undefined)` → `remove()`;
      `InMemoryStorage` stores text.
- [x] `BroadcastChannelMessenger` unrefs its channel in Node;
      `StorageMessenger.close()` removes its pending keys.
- Deferred to stage 6 (they belong to cosec's ownership of buses): closing a
  broadcast bus a `TokenStorage` creates, and cross-tab refresh ordering.

## Stage 6: `cosec`

Each change below was confirmed with the maintainer on 2026-09-25.

- [x] Trust boundary as an option: `isTrusted` (default: trust every
      request, as before — maintainer's choice); `sameOriginTrust` exported for
      apps that want credentials kept to their own origins.
- [x] Cross-tab refresh race: on a failed refresh the manager re-reads
      storage (`KeyStorage.reload()`) and reuses a token another tab stored for
      the same session instead of removing it.
- [x] JWT payload must be an object.
- [x] Storages close the event bus they created (`ownEventBus()`).
- Not done: a default clock-skew margin (`earlyPeriod` stays 0; the 401
  retry covers a slow clock) and `navigator.locks` single-flight across tabs
  (the re-read fixes the observed race; locks would add a browser-only path).

## Stage 7: `react`

Confirmed with the maintainer on 2026-09-25.

- [x] `RouteGuard.onUnauthorized` in an effect.
- [x] `useKeyStorage` server snapshot = default value.
- [x] `useQueryState` keeps the latest `execute` without depending on it.
- [x] `useLatest` assigns in `useInsertionEffect`.
- [x] `useEventSubscription` unsubscribes only what it subscribed;
      `useFetcher` clears `exchange` on failure; `useFullscreen` resets its
      dynamic target.
- Kept: `useFetcher` still attaches its `AbortController` to the caller's
  request. The review called it a mutation, but callers cancel through
  `request.abortController` (tested); it is the contract.
- Not done (follow-ups): share the duplicated debounce scheduler of
  `useDebouncedQuery` / `useDebouncedFetcherQuery`; pass the abort signal to
  execute-API methods; re-render `useSecurity` when the token expires.

## Downstream follow-ups

- Wow `typescript/wow-client/test/clients/endpointTable.test.ts` records the
  wire headers in `golden/client-endpoints.json`, including the old default
  `content-type: application/json` on every GET. Since PR 2 the advisory
  `downstream-wow.yml` check fails on that snapshot, as intended. Regenerate
  the golden in the Wow change that moves Wow to fetcher 6 (not before: Wow's
  own CI still runs against 5.x until then).

## Pause point

2026-09-25: all seven stages merged (#1927, #1930–#1936). Open follow-ups:

- Done since: the shared debounce scheduler (#1938); `appendAbortController`
  for execute-API hooks (#1939, opt-in); `useSecurity` re-renders at
  refresh-token expiry (confirmed: not at access-token expiry, which the next
  request refreshes). Decided: `earlyPeriod` stays 0 by default.
- Wow: regenerate `golden/client-endpoints.json` when Wow moves to fetcher 6
  (until then `downstream-wow.yml` fails on it, as expected).
- `.claude/settings.local.json` is tracked with stale viewer permissions;
  untracking it would delete it from every checkout on the next pull, so it
  is left to the maintainer.

Every public behavior change goes to the maintainer before merging.
