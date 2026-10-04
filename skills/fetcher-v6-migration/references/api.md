# Fetcher 5.x → 6.0 Migration Reference

Source of truth: `docs/releases/v6.0.0.md` in the fetcher repository, checked
against the v5.1.3 and 6.0 sources of `@ahoo-wang/fetcher-react`.

## Contents

- [Version facts](#version-facts)
- [Package mapping](#package-mapping)
- [Removed exports of `@ahoo-wang/fetcher-react`](#removed-exports-of-ahoo-wangfetcher-react)
- [The `@ahoo-wang/fetcher-react` redesign](#the-ahoo-wangfetcher-react-redesign)
- [Subpaths of `@ahoo-wang/fetcher-react`](#subpaths-of-ahoo-wangfetcher-react)
- [Detection checklist](#detection-checklist)
- [Rewrites](#rewrites)
- [Generated clients](#generated-clients)
- [Staying on 5.x](#staying-on-5x)

## Version facts

- The `@ahoo-wang/wow-*` packages (`wow-client`, `wow-react`,
  `wow-generator`, `wow-view-engine`, `wow-view-store`) are on npm from Wow
  9.2.0, Wow's first stable release; Wow and its npm packages share one version
  number. Docs: https://wow.ahoo.me. Confirm with
  `npm view @ahoo-wang/wow-client version` and use the version it prints —
  never a guessed one.
- fetcher 6.0.0 is released after Wow 9.2.1. Confirm with
  `npm view @ahoo-wang/fetcher dist-tags`.
- From Wow 9.2.1 the Wow packages declare the fetcher peer range
  `^5.1.5 || ^6.0.0` (9.2.0 declared `^5.1.5` only; confirm with
  `npm view @ahoo-wang/wow-client peerDependencies`), so they can be adopted on
  5.x before upgrading fetcher. Use 9.2.1 or later. `@ahoo-wang/wow-react` does **not** depend on
  `@ahoo-wang/fetcher-react`: it has its own request state, and its hooks keep
  their own API (the fetcher-react redesign does not apply to them).
- 6.0 makes no breaking API change to `@ahoo-wang/fetcher`,
  `fetcher-decorator`, `fetcher-eventbus`, `fetcher-eventstream`,
  `fetcher-openai`, `fetcher-openapi`, `fetcher-storage` or `fetcher-cosec`;
  the breaking changes are the packages that left and `fetcher-react`, which
  lost exports and was redesigned around cancellation (see
  [the redesign](#the-ahoo-wangfetcher-react-redesign)). These
  packages do receive corrections — see **Changed** (e.g. `@ahoo-wang/fetcher`
  omits `undefined`/`null` query values, repeats array query parameters,
  keeps the timeout when a `signal` is passed, sends no default `Content-Type`
  and rejects a status failure with the `HttpStatusValidationError` itself;
  `fetcher-decorator` binds an array, `Date` or other non-plain-object argument
  to its parameter name instead of spreading it, stores a named
  `@attribute('x')` object whole, and keeps a subclass override that has no
  endpoint decorator; `fetcher-openapi` requires `Info.title`, `Info.version`
  and `Response.description` and adds the OpenAPI 3.1 fields;
  `@ahoo-wang/fetcher-eventstream` drops a final line cut off before its line
  terminator and, with a terminate detector, errors a stream that ends without
  the terminating event with `EventStreamIncompleteError` — for
  `@ahoo-wang/fetcher-openai`, a completion stream that ends before
  `data: [DONE]`; `fetcher-cosec` adds the `isTrusted` option — by default
  every request, an absolute URL on another origin included, still carries the
  token and CoSec headers, so set `isTrusted: sameOriginTrust` — and reads a
  JWT whose payload is not a JSON object as expired; `destroy()` of
  `KeyStorage`, `TokenStorage`, `DeviceIdStorage` and `SpaceIdStorage` also
  closes the event bus the storage created, while a bus passed in `eventBus`
  stays open; in `fetcher-react`, `RouteGuard` calls `onUnauthorized` in an
  effect after commit, `useKeyStorage` (and so `useSecurity` and
  `SecurityProvider`) renders the default during SSR and hydration, and
  `useLatest` updates its ref after commit) and **Fixed** in the 6.0 release
  notes (`docs/releases/v6.0.0.md`), for example the CoSec 401 refresh-retry no
  longer re-running the error phase (#1249), or a tab reusing the token another
  tab refreshed instead of signing out (`KeyStorage.reload()`).

## Package mapping

| 5.x package                      | 6.x replacement (Wow repository, on npm from Wow 9.2.0; use 9.2.1+ with fetcher 6)                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-wow`         | `@ahoo-wang/wow-client` — same client, renamed; `/query/locale/zh_CN` and `/query/locale/en_US` subpaths                    |
| Wow hooks in `fetcher-react`     | `@ahoo-wang/wow-react` (ESM only), same hook names; does not depend on `fetcher-react`                                      |
| `@ahoo-wang/fetcher-generator`   | `@ahoo-wang/wow-generator` — command `wow-generator`; `fetcher-generator` stays an alias until Wow v10                      |
| `@ahoo-wang/fetcher-viewer`      | Deprecated on npm; no drop-in replacement, stays on 5.x. Replaced by `@ahoo-wang/wow-view-engine` (different model and API) |
| Data-monitor hooks               | None. Remove them or stay on 5.x                                                                                            |
| `@ahoo-wang/fetcher-view-engine` | Never published; continues as `@ahoo-wang/wow-view-engine`                                                                  |

The last 5.x versions of `fetcher-wow` and `fetcher-generator` (5.1.3) stay on
npm and are meant to be deprecated with a pointer to their replacement.

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
an auto-executing query (checklist step 9 below).

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

## Detection checklist

Run from the project root. Every hit needs a decision from `SKILL.md` step 2.

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

Behavior checks from **Changed**, for every project that upgrades
`@ahoo-wang/fetcher`:

```sh
# 6. Status errors read from `cause`; HttpStatusValidationError is now thrown as is
grep -rnE 'cause\s+instanceof\s+HttpStatusValidationError' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . | grep -v node_modules
```

Rewrite `error.cause instanceof HttpStatusValidationError` to
`error instanceof HttpStatusValidationError`, tested before `ExchangeError`, its
superclass; `error.exchange.error` still returns it. A timeout is still
`error.cause instanceof FetchTimeoutError`. The fetcher no longer sends
`Content-Type: application/json` by default: a plain-object or string body
still gets it, but a server that expects it on bodyless requests or on binary
bodies needs it set on those requests.

For `@ahoo-wang/fetcher-decorator`: an array passed to `@query('ids')` is now
sent as `ids=1&ids=2` (it was `0=1&1=2`), an array header as a comma-separated
list, and a `Date` as ISO 8601; a server that read the old keys needs the new
form. A named `@attribute('user')` holding an object now stores it under
`user` instead of merging its keys. A subclass method that overrides an
inherited endpoint without its own endpoint decorator now runs as written;
decorate it if it was meant to redefine the request.

For `@ahoo-wang/fetcher-openapi`: objects typed `Info` or `Response` must now
set `title` and `version`, or `description`; `SecurityScheme.in` no longer
accepts `'path'`, and a `SecurityRequirement` holds only scheme names (no
`x-` keys).

For projects that consume event streams with a terminate detector
(`@ahoo-wang/fetcher-eventstream`) or stream chat completions
(`@ahoo-wang/fetcher-openai`):

```sh
# 7. Streams that now reject when they end before their terminating event
grep -rnE 'requiredJsonEventStream\(|jsonEventStream\(|toJsonServerSentEventStream\(|completions\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

A stream that ends without its terminating event (for OpenAI, `data: [DONE]`)
now rejects the `for await` loop with `EventStreamIncompleteError` instead of
ending as if complete; handle it where mid-stream errors are handled, and do
not treat the partial answer as final. `ChatResponse.usage` is now optional:
read it with `?.`.

For projects on `@ahoo-wang/fetcher-cosec` or `@ahoo-wang/fetcher-storage`:

```sh
# 8. CoSec setups and storage cleanup to review
grep -rnE 'new CoSecConfigurer\(|new (CoSecRequest|AuthorizationRequest)Interceptor\(|\.eventBus\.destroy\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

Add `isTrusted: sameOriginTrust` to each CoSec setup unless every absolute URL
the client requests is yours: by default an absolute URL on any origin still
receives the access token and the device ID. A JWT whose payload is not a JSON
object now reads as expired. `destroy()` now closes the event bus the storage
created itself, so a following `storage.eventBus.destroy()` on that default
bus is redundant (drop it); keep it for a bus you passed in `eventBus`.

For projects on `@ahoo-wang/fetcher-react`:

```sh
# 9. Hook API removed or changed by the redesign (tsc reports most of these)
grep -rnE '\b(useFullscreen(Context)?|FullscreenProvider|FullscreenContext|useRefs|useForceUpdate|useMounted|useRequestId|use(Cancellable)?QueryState|isValidateQuery|OnBeforeExecuteCallback|PromiseStateCallbacks|DepsCapable)\b|\b(propagateError|initialQuery|onBeforeExecute|getQuery)\b' --include='*.ts' --include='*.tsx' . | grep -v node_modules
grep -rnE '\bsetQuery\b|\bisPending\(|\breset\(|abortController\s*[:=]|request\.abortController' --include='*.ts' --include='*.tsx' . | grep -v node_modules

# 10. Tests that assert idle on the first render of an auto-executing query
grep -rnE "status\)\.toBe\(('idle'|PromiseStatus\.IDLE)\)" --include='*.test.ts' --include='*.test.tsx' . | grep -v node_modules

# 11. React hooks whose timing changed
grep -rnE 'onUnauthorized=|useLatest\(|useKeyStorage\(|useSecurity\(|<SecurityProvider|useEventSubscription\(' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

Rewrite every hit of step 9 with [the redesign](#the-ahoo-wangfetcher-react-redesign)
table and diffs. In step 9's second command, `setQuery` is fine when it is your
own `useState` setter, and `isPending()` stays on `useDebouncedCallback`,
`useDebouncedExecutePromise` and `useDebouncedFetcher`; check each `reset()`
caller that expected the request to finish anyway, and each request whose
`abortController` you set for `useFetcher` (cancel with `abort()` or pass
`signal`). Hooks imported from `@ahoo-wang/wow-react` keep their own API —
leave their `setQuery` alone. Step 10's hits fail now: the first render of an
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
printed — 9.2.1 or later, the first to accept fetcher 6.

```sh
pnpm add @ahoo-wang/fetcher-react@5.1.3
pnpm remove @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-generator
pnpm add @ahoo-wang/wow-client@<wow-version> @ahoo-wang/wow-react@<wow-version>
pnpm add -D @ahoo-wang/wow-generator@<wow-version>
# then, once fetcher 6.0.0 is on npm, every @ahoo-wang/fetcher* package you use:
pnpm add @ahoo-wang/fetcher@^6 @ahoo-wang/fetcher-react@^6
```

After `@ahoo-wang/fetcher-react@^6`, rewrite the hook calls (see
[the redesign](#the-ahoo-wangfetcher-react-redesign)) until `tsc` passes.

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

- Pin `^5.1.3` for every `@ahoo-wang/fetcher*` package, including
  `fetcher-wow`, `fetcher-generator` and `fetcher-viewer`.
- The `5.x` branch keeps receiving fixes. After 6.0 they are published under
  the npm dist-tag `release-5` (`pnpm add @ahoo-wang/fetcher@release-5`), so
  `latest` no longer points at 5.x.
- A project on `fetcher-viewer` stays on 5.x as a whole: the viewer's peers
  (`fetcher-wow`, the 5.x `fetcher-react`) are `^5.0.0`.
