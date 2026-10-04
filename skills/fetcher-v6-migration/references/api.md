# Fetcher 5.x → 6.0 Migration Reference

Source of truth: `docs/releases/v6.0.0.md` in the fetcher repository, checked
against the v5.1.3 and 6.0 sources and against npm.

## Contents

- [npm facts](#npm-facts)
- [Package mapping](#package-mapping)
- [Removed exports of `@ahoo-wang/fetcher-react`](#removed-exports-of-ahoo-wangfetcher-react)
- [The `@ahoo-wang/fetcher-react` redesign](#the-ahoo-wangfetcher-react-redesign)
- [Subpaths of `@ahoo-wang/fetcher-react`](#subpaths-of-ahoo-wangfetcher-react)
- [Behavior changes by package](#behavior-changes-by-package)
- [Detection checklist](#detection-checklist)
- [Rewrites](#rewrites)
- [Generated clients](#generated-clients)
- [Staying on 5.x](#staying-on-5x)

## npm facts

Confirm each before recommending an install; use the versions npm prints.

```sh
npm view @ahoo-wang/fetcher dist-tags
npm view @ahoo-wang/wow-client version peerDependencies
npm view @ahoo-wang/wow-react peerDependencies
npm view @ahoo-wang/fetcher-wow deprecated
```

- `@ahoo-wang/fetcher` 6.0.0 is published and is `latest`; so are `cosec`,
  `decorator`, `eventbus`, `eventstream`, `openai`, `openapi`, `react` and
  `storage` at 6.0.0. Their sibling peers are `^6.0.0`, so they move together.
- `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-generator` and
  `@ahoo-wang/fetcher-viewer` are **deprecated on npm** (every version); the
  deprecation message names the replacement and links Wow's migration guide,
  https://wow.ahoo.me/guide/typescript/migration. Their last versions stay
  installable on the 5.x line. `@ahoo-wang/fetcher-view-engine` was never
  published.
- The `@ahoo-wang/wow-*` packages (`wow-client`, `wow-react`, `wow-generator`,
  `wow-view-engine`) are on npm from Wow 9.2.0, Wow's first stable release; Wow
  and its npm packages share one version number. 9.2.0 required fetcher
  `^5.1.5`; **from 9.2.1 the fetcher peer range is `^5.1.5 || ^6.0.0`**, so
  they can be adopted on 5.x before upgrading fetcher. Use 9.2.1 or later.
- `@ahoo-wang/wow-react` peers `@ahoo-wang/wow-client` with a `~` range: install
  both at the same version. It does **not** depend on `@ahoo-wang/fetcher-react`:
  it has its own request state, and its hooks keep their own API (the
  fetcher-react redesign does not apply to them). It is ESM only.
- 5.x patches after 6.0 are published under the dist-tag `release-5`, so
  `latest` stays on 6.x. Until `dist-tags` lists `release-5`, pin `^5.1.5` to
  stay on 5.x.
- `@ahoo-wang/fetcher-react` 6 peers `react` `^19.0.0` (5.x needed `^19.3.0`)
  and no longer peers `@ahoo-wang/fetcher-eventstream`, `react-dom` or
  `@ahoo-wang/fetcher-wow`.

## Package mapping

| 5.x package                      | 6.x replacement (Wow repository; 9.2.1+ with fetcher 6)                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-wow`         | `@ahoo-wang/wow-client` — same client, renamed; `/query/locale/zh_CN` and `/query/locale/en_US` subpaths      |
| Wow hooks in `fetcher-react`     | `@ahoo-wang/wow-react` (ESM only), same hook names; does not depend on `fetcher-react`                        |
| `@ahoo-wang/fetcher-generator`   | `@ahoo-wang/wow-generator` — command `wow-generator`; `fetcher-generator` stays an alias until Wow v10        |
| `@ahoo-wang/fetcher-viewer`      | No drop-in replacement; stays on 5.x. `@ahoo-wang/wow-view-engine` replaces it with a different model and API |
| Data-monitor hooks               | None. Remove them or stay on 5.x                                                                              |
| `@ahoo-wang/fetcher-view-engine` | Never published; continues as `@ahoo-wang/wow-view-engine`                                                    |

## Removed exports of `@ahoo-wang/fetcher-react`

6.0 drops `export * from './wow/index.js'` and
`export * from './dataMonitor/index.js'` from the root entry, and the optional
`@ahoo-wang/fetcher-wow` peer. The redesign removes more; see the next section.

| Removed export                                                                | Replacement                        |
| ----------------------------------------------------------------------------- | ---------------------------------- |
| `useSingleQuery`, `UseSingleQueryOptions`, `UseSingleQueryReturn`             | `@ahoo-wang/wow-react`, same names |
| `useListQuery`, `UseListQueryOptions`, `UseListQueryReturn`                   | `@ahoo-wang/wow-react`, same names |
| `usePagedQuery`, `UsePagedQueryOptions`, `UsePagedQueryReturn`                | `@ahoo-wang/wow-react`, same names |
| `useCountQuery`, `UseCountQueryOptions`, `UseCountQueryReturn`                | `@ahoo-wang/wow-react`, same names |
| `useListStreamQuery`, `UseListStreamQueryOptions`, `UseListStreamQueryReturn` | `@ahoo-wang/wow-react`, same names |
| `useFetcherSingleQuery`, `UseFetcherSingleQueryOptions`, `…Return`            | `@ahoo-wang/wow-react`, same names |
| `useFetcherListQuery`, `UseFetcherListQueryOptions`, `…Return`                | `@ahoo-wang/wow-react`, same names |
| `useFetcherPagedQuery`, `UseFetcherPagedQueryOptions`, `…Return`              | `@ahoo-wang/wow-react`, same names |
| `useFetcherCountQuery`, `UseFetcherCountQueryOptions`, `…Return`              | `@ahoo-wang/wow-react`, same names |
| `useFetcherListStreamQuery`, `UseFetcherListStreamQueryOptions`, `…Return`    | `@ahoo-wang/wow-react`, same names |
| `useDataMonitor`, `UseDataMonitorOptions`, `UseDataMonitorReturn`             | none                               |
| `DataMonitorService`, `dataMonitorService`, `DataMonitorNotificationConfig`   | none                               |
| `useDataMonitorEventBus`, `UseDataMonitorEventBusReturn`                      | none                               |
| `DataChangedEvent`, `dataMonitorEventBus`                                     | none                               |

The data-monitor hooks polled a total every 30 seconds in each tab and existed
only for the viewer's "data monitor" toggle. A server-side subscription in the
Wow view engine is planned instead; there is nothing to port them to today.

## The `@ahoo-wang/fetcher-react` redesign

A request is identified by its `AbortController`. Only the current execution
may write state; a newer execution, `abort()`, `reset()` and unmounting all
abort it. State is one value, `{ status, loading, result, error }`. `execute`
never rejects: it resolves to the state this execution ended in (`idle` when it
was cancelled). Queries are controlled: the query lives in the caller's state
and is passed as `query`; the hook executes when its content (compared deeply)
changes, and `undefined` means not ready. The 6.x API is in
`$fetcher-react-hooks`.

### Removed or changed

| Removed or changed in 6.0                                                                                                                           | What to do                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `useFullscreen`, `FullscreenProvider`, `FullscreenContext`, `useFullscreenContext`, the fullscreen utilities (`enterFullscreen`, `isFullscreen`, …) | No replacement; write your own or use a library such as ahooks                          |
| `useRefs`, `useForceUpdate`, `useMounted`, `useRequestId`                                                                                           | No replacement; write your own or use a library such as ahooks                          |
| `useQueryState`, `useCancellableQueryState`, `isValidateQuery`, `UseQueryStateOptions`, `UseQueryStateReturn`                                       | Pass a controlled `query`                                                               |
| `propagateError` option                                                                                                                             | Read the state `execute` resolves to                                                    |
| `initialQuery`, `setQuery`, `getQuery` on `useQuery`, `useFetcherQuery`, the query API hooks and the debounced query hooks                          | Keep the query in your own `useState` and pass it as `query`                            |
| `run`, `cancel`, `isPending`, `setQuery` on `useDebouncedQuery` / `useDebouncedFetcherQuery`                                                        | `pending`, `flush()`, `execute()`                                                       |
| `onBeforeExecute` on execute and query API hooks; the `OnBeforeExecuteCallback` type                                                                | Prepare the arguments before calling `execute`                                          |
| `UseApiMethodExecuteOptions<TArgs, TData, E>`                                                                                                       | `UseApiMethodExecuteOptions<TData, E>` (first type parameter removed)                   |
| `UseDebouncedQueryReturn<Q, R, E>`, `UseDebouncedFetcherQueryReturn<Q, R, E>`                                                                       | `<R, E>` (no query type parameter)                                                      |
| `useQuery`'s `execute` option `(query, attributes, abortController)`                                                                                | `(query, abortController)`; generated query hooks still pass `attributes`               |
| `usePromiseState`'s `onSuccess` / `onError` options, `PromiseStateCallbacks`; setters that called them                                              | Setters are synchronous and call nothing; use `useExecutePromise`'s callbacks           |
| `DepsCapable` type                                                                                                                                  | Remove the reference; nothing replaces it                                               |
| API factories turning getter-provided functions into hooks                                                                                          | Expose the method as a method or own property; getters are never run                    |
| `PromiseStatus` enum                                                                                                                                | Now a const object plus literal type; `PromiseStatus.SUCCESS` and `'success'` both work |

New in 6.0: `useDebouncedValue(value, { delay })` → `{ value, pending, flush }`,
and `useStableValue(value)`. `react` peer is `^19.0.0`.

### Migration diffs

A query with `initialQuery`/`setQuery`:

```diff
-const { result, setQuery } = useQuery({
-  initialQuery: { keyword: '' },
-  execute: (query, attributes, abortController) => api.search(query, abortController),
-});
+const [query, setQuery] = useState({ keyword: '' });
+const { result } = useQuery({
+  query,
+  execute: (query, abortController) => api.search(query, abortController),
+});
```

`propagateError` and `try/catch`:

```diff
-try {
-  await execute(supplier); // propagateError: true
-  navigate('/done');
-} catch (error) {
-  toast(error.message);
-}
+const { status, error } = await execute(supplier);
+if (status === 'success') navigate('/done');
+else if (status === 'error') toast(error.message);
```

A debounced query:

```diff
-const { setQuery, run } = useDebouncedQuery({ initialQuery, execute, debounce: { delay: 300 } });
+const [query, setQuery] = useState(initialQuery);
+const { result, pending, flush } = useDebouncedQuery({ query, execute, debounce: { delay: 300 } });
```

The same pattern applies to `useFetcherQuery`, `useDebouncedFetcherQuery` and
the hooks of `createQueryApiHooks` (`useSearch({ query, attributes })`). A call
of `run()` that forced a debounced query becomes `flush()` (apply the waiting
query now) or `execute()` (re-run the applied one). A debounced query that
relied on the old default of not auto-executing needs `autoExecute: false` or
`query: undefined` until it is ready. To wait for input, pass
`query: ready ? query : undefined`.

`onBeforeExecute` on generated hooks:

```diff
-const { execute } = useUpdateUser({
-  onBeforeExecute: (abortController, params) => { params[0] = normalize(params[0]); },
-});
-execute(form);
+const { execute } = useUpdateUser();
+execute(normalize(form));
```

### Behavior changes (compile, but behave differently)

- `reset()` cancels the execution in flight first. It used to only set `idle`,
  and the request could write its result back later.
- `onAbort` is called synchronously and no longer delays the next execution.
- `useFetcher` no longer writes `request.abortController`; the caller's
  request object is not modified. Cancel through `abort()`/`reset()`, or pass
  `request.signal`, which still applies.
- On failure, `useFetcher`'s `exchange` is the failed request's exchange (from
  the `ExchangeError`, so `exchange.response.status` of a 404 is readable), not
  `undefined`.
- A query that executes on mount renders `loading` on its first render (it
  rendered `idle`), unless `initialStatus` is given.
- `useEventSubscription` subscribes once per `bus` and handler `name`, `order`
  and `once`, and calls the latest `handle`; it no longer resubscribes when
  only the handler object's identity changes.
- With the old `propagateError: true`, automatic and debounced executions
  produced unhandled promise rejections; `execute` no longer rejects.

**Upgrade check**: run `tsc`; then search for `propagateError`, `reset(`,
`request.abortController`, and tests that assert `idle` on the first render of
an auto-executing query (checklist step 6 below).

## Subpaths of `@ahoo-wang/fetcher-react`

| Entry                              | Formats  | Holds                                                                                                                                                                                              |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-react`         | ESM, UMD | everything below plus CoSec (`SecurityProvider`, `RouteGuard`, …), storage (`useKeyStorage`, `useImmerKeyStorage`), `useEventSubscription`, `createExecuteApiHooks`, `createQueryApiHooks`         |
| `@ahoo-wang/fetcher-react/core`    | ESM      | `PromiseStatus`, `usePromiseState`, `useExecutePromise`, `useQuery`, `useLatest`, `useStableValue`, `useDebouncedCallback`, `useDebouncedValue`, `useDebouncedExecutePromise`, `useDebouncedQuery` |
| `@ahoo-wang/fetcher-react/fetcher` | ESM      | `useFetcher`, `useFetcherQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery` and their option/return types (added in 5.1.3)                                                                  |

`/core` exists since 5.x. Neither subpath loads security, storage or event-bus
integration, so importing from them keeps those peers out of the bundle. No
migration step requires moving to the subpaths; the root entry still exports
everything that remained.

## Behavior changes by package

6.0 keeps the API of these packages but changes behavior that `tsc` does not
catch. Check every package the project uses.

### `@ahoo-wang/fetcher`

- **Status errors are thrown as is.** A request rejected by the status check
  rejects with the `HttpStatusValidationError` itself (an `ExchangeError`).
  `error.cause instanceof HttpStatusValidationError` no longer matches; test
  `error instanceof HttpStatusValidationError` before `ExchangeError`, its
  superclass. `error.exchange.error` still returns it. Other failures (timeout,
  network, an interceptor's own error) are still wrapped: a timeout is
  `error.cause instanceof FetchTimeoutError`.
- **A throwing error interceptor rejects as `ExchangeError`.** An error
  interceptor that throws, or a callback it runs (CoSec's `onUnauthorized` /
  `onForbidden`), no longer escapes the exchange as the raw thrown value: it
  becomes `exchange.error`, the call rejects with an `ExchangeError` whose
  `cause` is the thrown value, and later error interceptors do not run. A
  `catch (e) { if (e instanceof MyRedirectError) … }` must read `e.cause`.
- **`FetcherError` keeps its own stack** (where it surfaced); the original
  failure and its stack are on `cause`.
- **No default `Content-Type`.** It follows the body: `application/json` for a
  plain object or a string, fetch's own type for `Blob`/`FormData`/
  `URLSearchParams`, none for binary bodies. A server that required
  `application/json` on bodyless or binary requests needs it set explicitly.
  Cross-origin `GET`s no longer trigger a CORS preflight for it.
- **Query serialization.** `undefined`/`null` values are omitted (were sent as
  the text `undefined`/`null`); an array repeats the key (`ids=1&ids=2`, was
  `ids=1%2C2`); a `Date` becomes ISO 8601. A `URLSearchParams` is taken as is.
- **Path parameters.** A placeholder without a value, or with `null`, throws
  `Missing required path parameter: <name>` even when the request has no path
  parameters at all (the URL used to go out with `{id}` in it). Express
  placeholders end at the first non-identifier character: `/files/:name.json`
  is the parameter `name`.
- **Timeouts and signals combine.** A timeout applies together with the
  caller's `signal`/`abortController`; whichever fires first aborts. Passing a
  `signal` used to switch the timeout off, so requests that ran long with a
  `signal` may now time out. A timeout no longer aborts the caller's
  `AbortController`, and nothing is written to the request object.
- Interceptors work on a copy of `urlParams` (a reused request object is not
  changed); every `Fetcher` owns its default headers (a header set on one no
  longer leaks to others); the registrar lives on `globalThis`.
- New, optional: `FetcherOptions.fetch` (a custom fetch implementation). It
  configures the default interceptors only; with your own `interceptors`
  manager use `new InterceptorManager(validateStatus, fetch)`.

```sh
grep -rnE 'cause\s+instanceof\s+HttpStatusValidationError|cause\s+instanceof\s+(RefreshTokenError|RefreshUnavailableError)' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . | grep -v node_modules
grep -rnE "Content-Type|'content-type'" --include='*.ts' --include='*.tsx' . | grep -v node_modules
grep -rnE 'signal\s*:' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

### `@ahoo-wang/fetcher-cosec`

- **Only a rejected refresh token signs out.** When a refresh fails and storage
  still holds the same token: a **4xx** from the refresh endpoint (read at
  `error.exchange.response.status`) or a response without string
  `accessToken`/`refreshToken` removes the token and throws
  `RefreshTokenError`, which `onUnauthorized` receives. A **network error,
  timeout, abort or 5xx keeps the session** and throws the new
  `RefreshUnavailableError` (`.token`, `.cause`); `UnauthorizedErrorInterceptor`
  does not report it, and a later request refreshes again. In 5.x every
  refresh failure signed the user out. The original call rejects with an
  `ExchangeError` whose `cause` is the `RefreshUnavailableError`; show an
  "offline / try again" message there instead of waiting for
  `onUnauthorized`.
- **A custom `TokenRefresher`** signals a rejection the same way: reject with
  an error carrying `exchange.response.status` set to the 4xx (a fetcher-based
  refresher does this already). A plain `throw new Error('refresh failed')` now
  keeps the session.
- **Malformed refresh responses** fail the refresh (`RefreshTokenError`, token
  removed); 5.x stored them and sent `Bearer undefined`.
- **Callback errors**: if `onUnauthorized`/`onForbidden` throws, the call
  rejects with an `ExchangeError` whose `cause` is the callback error; when
  that happened on the refresh request, `RefreshTokenError.cause` is that
  request's `ExchangeError` (its `cause` is the callback error).
- **Cross-tab refresh under a Web Lock.** In a browser with Web Locks, tabs
  sharing a `TokenStorage` on `localStorage` refresh one at a time (lock
  `cosec-refresh:<key>`); a waiting tab reuses the token another tab stored.
  A refresh that never settles holds the other tabs' refreshes, so give the
  refresh client a `timeout`. Outside a browser, or without Web Locks, tabs
  refresh independently as before.
- **`isTrusted`** (new option on `CoSecConfig`, `CoSecRequestOptions`,
  `AuthorizationInterceptorOptions`): by default every request, an absolute
  URL on another origin included, still gets the token and the `CoSec-*`
  headers. Add `isTrusted: sameOriginTrust` unless every absolute URL the
  client requests is yours. A custom predicate is asked once per request; the
  401 retry reuses the decision.
- A JWT whose payload is not a JSON object reads as expired
  (`parseJwtPayload` returns `null`).
- `destroy()` of `TokenStorage`, `DeviceIdStorage` and `SpaceIdStorage` closes
  the broadcast bus the storage created; a bus passed in `eventBus` stays open.
- The 401 retry replays only the request phase and the response interceptors up
  to the authorization one: a failed retry runs the error interceptors once
  (`onForbidden` no longer fires twice), and `error.exchange.error` is the
  retry's own `HttpStatusValidationError`, not a nested `ExchangeError`.

```sh
grep -rnE 'new CoSecConfigurer\(|new (CoSecRequest|AuthorizationRequest)Interceptor\(|implements TokenRefresher|refresh\s*[:(]' --include='*.ts' --include='*.tsx' . | grep -v node_modules
grep -rnE 'RefreshTokenError|onUnauthorized|\.eventBus\.destroy\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

### `@ahoo-wang/fetcher-storage` and `@ahoo-wang/fetcher-eventbus`

- A stored value that cannot be deserialized is removed with a warning and read
  as absent (the default); `get()` used to throw (and so did `set()`/`remove()`).
  `set(undefined)` removes the value.
- `KeyStorage.destroy()` closes the event bus it created; a passed `eventBus`
  stays open, so drop a `storage.eventBus.destroy()` that followed it only
  when the bus was the default one.
- `KeyStorage` updates its cache before other listeners run; `addListener`
  with a name already taken returns a no-op remover (it never removes the
  other listener). New `reload()` re-reads storage.
- `EventBus.emit` creates the type's bus on first use; after `destroy()`,
  `on`/`emit` start a fresh bus. `BroadcastTypedEventBus.emit` after
  `destroy()` runs the local handlers without posting, and `destroy()` closes
  only a messenger it created (a passed `options.messenger` is left open).
- `@ahoo-wang/fetcher-eventbus` no longer peers on `@ahoo-wang/fetcher`.

### `@ahoo-wang/fetcher-decorator`

- Arguments are bound by shape: a plain object passed to `@path`, `@query` or
  `@header` is still spread into its keys; an array, a `Date` or another value
  is bound to the parameter's name. `@query('ids') ids: number[]` sends
  `ids=1&ids=2` (was `0=1&1=2`), an array header is comma-separated, a `Date`
  is ISO 8601; `undefined`/`null` entries of a spread object are left out.
- A named `@attribute('user')` stores an object whole under `user` (it was
  spread); an unnamed `@attribute()` still merges a record or `Map`.
- A subclass method that overrides an inherited endpoint without its own
  endpoint decorator runs as written (decorate it to redefine the request).
  An override that calls `super.method()` and the parent each send their own
  request; executors are no longer cached, so a changed `apiMetadata` applies
  on the next call.
- The unbound-placeholder warning fires once per endpoint, only for an unnamed
  `@path()` whose inferred name matches no placeholder.

```sh
grep -rnE "@query\(|@header\(|@attribute\('" --include='*.ts' . | grep -v node_modules
```

### `@ahoo-wang/fetcher-eventstream` and `@ahoo-wang/fetcher-openai`

- With a terminate detector, a stream that ends without the terminating event
  (OpenAI: `data: [DONE]`) rejects the `for await` loop with
  `EventStreamIncompleteError` instead of ending as if complete; a final line
  cut off before its terminator is dropped. Handle it where mid-stream errors
  are handled, and do not treat the partial answer as final.
- Converting a response whose body was already read throws
  `EventStreamConvertError` (was a bare `TypeError`).
- `ChatResponse.usage` is optional (read it with `?.`); `chat.completions`
  accepts an `AbortSignal`; `OpenAIOptions` accepts the other `FetcherOptions`
  (`timeout`, `fetch`, `headers`, …), with `apiKey` winning over an
  `Authorization` header.

```sh
grep -rnE 'requiredJsonEventStream\(|jsonEventStream\(|toJsonServerSentEventStream\(|completions\(|\.usage\.' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

### `@ahoo-wang/fetcher-openapi`

Objects typed `Info` must set `title` and `version`, and `Response` must set
`description`; `SecurityScheme.in` no longer accepts `'path'`; a
`SecurityRequirement` holds only scheme names (no `x-` keys). `tsc` reports
these. OpenAPI 3.1 fields and JSON Schema 2020-12 keywords were added.

### UMD bundles

`dist/index.umd.js` became `dist/index.umd.cjs` in `fetcher-cosec`,
`fetcher-eventbus`, `fetcher-openai`, `fetcher-openapi`, `fetcher-storage` and
`fetcher-react`. Importing by package name is unaffected; update CDN URLs,
e.g. `https://unpkg.com/@ahoo-wang/fetcher-cosec@6/dist/index.umd.cjs`.

```sh
grep -rnE 'index\.umd\.js' --include='*.html' --include='*.ts' --include='*.js' . | grep -v node_modules
```

## Detection checklist

Run from the project root. Every hit needs a decision from `SKILL.md` step 2.
The behavior checks per package are in
[Behavior changes by package](#behavior-changes-by-package).

```sh
# 1. Manifests and lockfile: packages that left fetcher
grep -rnE '"@ahoo-wang/fetcher-(wow|generator|viewer)"' --include=package.json . | grep -v node_modules
grep -nE '@ahoo-wang/fetcher-(wow|generator|viewer)@' pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null

# 2. Imports of the moved packages (includes generated code)
grep -rnE "from ['\"]@ahoo-wang/fetcher-(wow|viewer)(/[^'\"]*)?['\"]" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . | grep -v node_modules

# 3. Wow query hooks (only a problem when imported from @ahoo-wang/fetcher-react)
grep -rnE '\b[uU]se(Fetcher)?(Single|List|Paged|Count|ListStream)Query(Options|Return)?\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 4. Data-monitor hooks (no replacement)
grep -rnE '\b(useDataMonitor(EventBus)?|UseDataMonitor(Options|Return|EventBusReturn)|[dD]ataMonitorService|DataMonitorNotificationConfig|DataChangedEvent|dataMonitorEventBus)\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 5. The generator command in scripts and CI
grep -rnE '\bfetcher-generator\b' package.json .github scripts Makefile 2>/dev/null
```

Pattern 3 deliberately does not match `useFetcherQuery` or `useQuery`, which
stay in `@ahoo-wang/fetcher-react`. Confirm each hit's import source before
rewriting: a project may already import these names from `@ahoo-wang/wow-react`.

For projects on `@ahoo-wang/fetcher-react`:

```sh
# 6. Hook API removed or changed by the redesign (tsc reports most of these)
grep -rnE '\b(useFullscreen(Context)?|FullscreenProvider|FullscreenContext|useRefs|useForceUpdate|useMounted|useRequestId|use(Cancellable)?QueryState|isValidateQuery|OnBeforeExecuteCallback|PromiseStateCallbacks|DepsCapable)\b|\b(propagateError|initialQuery|onBeforeExecute|getQuery)\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules
grep -rnE '\bsetQuery\b|\bisPending\(|\breset\(|abortController\s*[:=]|request\.abortController' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 7. Tests that assert idle on the first render of an auto-executing query
grep -rnE "status\)\.toBe\(('idle'|PromiseStatus\.IDLE)\)" --include='*.test.ts' --include='*.test.tsx' . | grep -v node_modules

# 8. React hooks whose timing changed
grep -rnE 'onUnauthorized=|useLatest\(|useKeyStorage\(|useSecurity\(|<SecurityProvider|useEventSubscription\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

Rewrite every hit of step 6 with [the redesign](#the-ahoo-wangfetcher-react-redesign)
table and diffs. In step 6's second command, `setQuery` is fine when it is your
own `useState` setter, and `isPending()` stays on `useDebouncedCallback`,
`useDebouncedExecutePromise` and `useDebouncedFetcher`; check each `reset()`
caller that expected the request to finish anyway, and each request whose
`abortController` you set for `useFetcher` (cancel with `abort()` or pass
`signal`). Hooks imported from `@ahoo-wang/wow-react` keep their own API —
leave their `setQuery` alone. Step 7's hits fail now: the first render of an
auto-executing query is `loading`.

`RouteGuard`'s `onUnauthorized` now runs once after commit each time the user
becomes (or starts out) unauthenticated, not on every render; a `navigate()`
there is now safe, and code that relied on a call per render must not.
`useKeyStorage`, `useSecurity` and `SecurityProvider` render the default (the
anonymous user) on the server and during hydration, then the stored value; an
SSR page that expected the stored value in the first client render sees it one
render later. `useLatest(value).current` read during render now holds the last
committed value, not the one being rendered; read the value itself there.
`useEventSubscription` no longer resubscribes when only the handler object
changes; a handler whose `name`, `order` or `once` changes still resubscribes.

## Rewrites

`<wow-version>` is the version `npm view @ahoo-wang/wow-client version`
printed — 9.2.1 or later, the first to accept fetcher 6. The order matters:
the Wow packages go in while the app is still on 5.x, then fetcher moves to 6.

```sh
# 1. Latest 5.x (the Wow packages peer ^5.1.5) — every @ahoo-wang/fetcher* package you use
pnpm add @ahoo-wang/fetcher@^5.1.5 @ahoo-wang/fetcher-react@^5.1.5
# 2. Replace the moved packages, still on 5.x
pnpm remove @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-generator
pnpm add @ahoo-wang/wow-client@<wow-version> @ahoo-wang/wow-react@<wow-version>
pnpm add -D @ahoo-wang/wow-generator@<wow-version>
# 3. Regenerate clients with wow-generator (see Generated clients), type-check, test
# 4. fetcher 6 — every @ahoo-wang/fetcher* package you use, together
pnpm add @ahoo-wang/fetcher@^6 @ahoo-wang/fetcher-react@^6
```

After `@ahoo-wang/fetcher-react@^6`, rewrite the hook calls (see
[the redesign](#the-ahoo-wangfetcher-react-redesign)) until `tsc` passes, then
work through [Behavior changes by package](#behavior-changes-by-package).

```diff
-import { SnapshotQueryClient } from '@ahoo-wang/fetcher-wow';
+import { SnapshotQueryClient } from '@ahoo-wang/wow-client';

-import { zh_CN } from '@ahoo-wang/fetcher-wow/query/locale/zh_CN';
+import { zh_CN } from '@ahoo-wang/wow-client/query/locale/zh_CN';

-import { useFetcher, usePagedQuery } from '@ahoo-wang/fetcher-react';
+import { useFetcher } from '@ahoo-wang/fetcher-react';
+import { usePagedQuery } from '@ahoo-wang/wow-react';
```

```diff
 "scripts": {
-  "generate": "fetcher-generator generate -i http://localhost:8080/v3/api-docs"
+  "generate": "wow-generator generate -i http://localhost:8080/v3/api-docs"
 }
```

A CoSec caller that relied on every refresh failure signing out:

```diff
 try {
   await fetcher.get('/orders');
 } catch (error) {
-  // 5.x: any refresh failure had already called onUnauthorized
+  if (error instanceof ExchangeError && error.cause instanceof RefreshUnavailableError) {
+    toast('Cannot reach the server; still signed in. Try again.');
+  }
 }
```

Data-monitor hooks: delete the calls and any UI toggle built on them, or keep
the whole project on 5.x.

## Generated clients

Code produced by `fetcher-generator` imports `@ahoo-wang/fetcher-wow`.

1. Preferred: regenerate with `wow-generator` from the same OpenAPI source and
   output directory; it emits `@ahoo-wang/wow-client` imports.
2. Otherwise: replace `@ahoo-wang/fetcher-wow` with `@ahoo-wang/wow-client` in
   the generated files (same export names), and plan a regeneration.
3. Type-check the generated directory afterwards.

## Staying on 5.x

- Pin `^5.1.5` for every `@ahoo-wang/fetcher*` package, including
  `fetcher-wow`, `fetcher-generator` and `fetcher-viewer` (deprecated, still
  installable; the deprecation warning on install is expected).
- The `5.x` branch keeps receiving fixes, published under the dist-tag
  `release-5` so `latest` stays on 6.x. Run
  `npm view @ahoo-wang/fetcher dist-tags` and install
  `@ahoo-wang/fetcher@release-5` only once that tag is listed.
- A project on `fetcher-viewer` stays on 5.x as a whole: the viewer peers
  `fetcher-wow` and the 5.x `fetcher-react` with `^5.0.0`.
