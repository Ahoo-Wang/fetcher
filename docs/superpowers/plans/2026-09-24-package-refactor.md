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

Compatibility: 6.0 is not a rewrite. Public names stay. A behavior changes only
when the old behavior is a defect no caller can want (`?a=undefined`, a timeout
silently dropped); each such change is listed in `docs/releases/v6.0.0.md`
under **Changed** or **Fixed**. Wow's TypeScript packages are the main
downstream; `downstream-wow.yml` must stay green.

## Order

Dependency order, so each package is refactored on top of settled foundations.
Each stage: deep review → plan the stage here → PRs (fix + regression test) →
update this file.

- [ ] **1. `fetcher`** — detailed below.
- [ ] **2. Release contract** — storage UMD global name (`Fetcher`, clashes
      with the core package); peer ranges `workspace:^`; unused react peers,
      react peer floor, `dequal` external. (`openai`/`openapi` import without
      `.js` in source, but unplugin-dts adds it: the declarations resolve —
      verified by `check:package-types` on a clean build. Style only.)
- [ ] **3. `decorator` + `openapi`** — parameter binding delegates
      serialization to fetcher (principle 2); subclass overrides; parameter
      name reflection; executor cache off the instance; OpenAPI 3.1 accuracy.
- [ ] **4. `eventstream` + `openai`** — EOF semantics per WHATWG, incomplete
      stream detection, linear line splitting, polyfill iterator cleanup,
      openai chunk types and `signal`.
- [ ] **5. `eventbus` + `storage`** — corrupt value recovery, `set(undefined)`,
      channel ownership and close, SSR.
- [ ] **6. `cosec`** — trusted origins (principle 1), cross-tab single-flight
      refresh, JWT payload validation, clock skew.
- [ ] **7. `react`** — render purity, SSR snapshots, `useQueryState`
      dependencies, subscription identity, `useLatest`, shared debounce
      scheduler.

## Stage 1: `fetcher`

Review findings, grouped by principle. ✅ = fixed.

**PR 1 — correctness (no API change)** — branch
`refactor/fetcher-core-correctness`, PR opened 2026-09-24; docs (wiki en/zh,
skills) and release notes updated in the same PR.

- [ ] Callers own their objects: every `Fetcher` gets its own headers record
      (all instances shared one `DEFAULT_HEADERS` object); `resolveExchange`
      copies `urlParams.path`/`query`, so an interceptor writing a path
      parameter no longer leaks it into the caller's reused request (cosec's
      `ResourceAttributionRequestInterceptor` could pin a tenant that way).
- [ ] Cancellation composes: `timeoutFetch` combines the timeout with the
      caller's `signal` and `abortController` (a `signal` used to disable the
      timeout), never aborts the caller's controller, and never writes to the
      request.
- [ ] `ReadableStream` bodies send `duplex: 'half'`.
- [ ] URL semantics owned by `UrlBuilder`: query values `undefined`/`null`
      are omitted, arrays become repeated keys, `Date` becomes ISO text; a
      path placeholder with no value (including `null`, or no `path` at all)
      throws; Express placeholders are identifiers (`/files/:name.json`).
- [ ] Singletons survive two copies: `fetcherRegistrar` on `globalThis`;
      `getFetcher` resolves names by type, not `instanceof Fetcher`.

**PR 2 — contracts**

- [ ] `Content-Type` describes the body: no default header on bodyless
      requests (every cross-origin GET was preflighted); JSON for plain
      objects and strings only; binary bodies keep the type fetch derives.
- [ ] Errors: an `ExchangeError` thrown for the same exchange (e.g.
      `HttpStatusValidationError`) is rethrown as is instead of wrapped, so
      `instanceof HttpStatusValidationError` works.
- [ ] JSDoc that contradicts the code (`timeoutFetch` examples, `@throws
FetchError`, "ResponseResultExtractor returns the exchange",
      axios-style `FetcherConfigurer` example).

## Pause point

2026-09-24: paused for quota after opening PR 1. Next: land PR 1 (CI,
self-review, Codex), then PR 2 on a branch from the merged `main`. Stages 2–7
not started. Findings for every stage are in this file's **Order** list; the
full review lives in the session that wrote this plan and is summarized there.
