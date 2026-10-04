---
name: fetcher-v6-migration
description: >
  Upgrade a project from Fetcher 5.x to 6.0. Use when asked to upgrade `@ahoo-wang/fetcher*` to 6; when hooks or options (Wow query hooks, data-monitor hooks, `setQuery`, `propagateError`) are missing from `@ahoo-wang/fetcher-react`; when deprecated `fetcher-wow`, `fetcher-generator` or `fetcher-viewer` must go; or when behavior changed after the upgrade. Decides stay-on-5.x versus upgrade, then rewrites usages. Not for new Fetcher code.
---

# fetcher-v6-migration

Fetcher **6.0.0 is published** (`latest` on npm). It does two breaking things: (1) the Wow-coupled packages left fetcher — `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-generator` and `@ahoo-wang/fetcher-viewer` are **deprecated on npm** and replaced by Wow's `@ahoo-wang/wow-*` packages; (2) `@ahoo-wang/fetcher-react` is **redesigned around cancellation** (hooks and options removed, queries controlled, `execute` never rejects). `@ahoo-wang/fetcher`, `-decorator`, `-eventbus`, `-eventstream`, `-openai`, `-openapi`, `-storage` and `-cosec` keep their API but **change behavior** in ways that pass `tsc` (section 4). Source of truth: the fetcher repository's `docs/releases/v6.0.0.md`.

## 1. Check npm — never assume

```sh
npm view @ahoo-wang/fetcher dist-tags                       # latest: 6.x; release-5 only once a 5.x patch ships after 6.0
npm view @ahoo-wang/wow-client version peerDependencies     # 9.2.1 or later: fetcher peer ^5.1.5 || ^6.0.0
npm view @ahoo-wang/fetcher-wow deprecated                  # the deprecation message names the replacement
```

Wow 9.2.0 was the first stable release of `@ahoo-wang/wow-client`, `@ahoo-wang/wow-react`, `@ahoo-wang/wow-generator` and `@ahoo-wang/wow-view-engine`, but it required fetcher `^5.1.5`; **9.2.1 is the first to accept fetcher 6**. Install the version `npm view` prints (never below 9.2.1, never invented), and keep `wow-client` and `wow-react` on the **same** version (`wow-react` peers `wow-client` with a `~` range). Wow's migration guide: https://wow.ahoo.me/guide/typescript/migration. To stay on 5.x pin `^5.1.5`; use the `release-5` dist-tag only if `dist-tags` lists it.

## 2. Detect and decide

Run the grep checklist in `references/api.md`, then classify:

| Found                                                                     | Decision                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@ahoo-wang/fetcher-viewer`, or any data-monitor hook                     | **Stay on 5.x** (`^5.1.5`, every `@ahoo-wang/fetcher*` package: the viewer peers `^5.0.0`). `@ahoo-wang/wow-view-engine` replaces the viewer with a different model and API; the data-monitor hooks have no replacement. |
| `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-generator`, Wow query hooks | Upgrade in the order of section 3: Wow packages first (on 5.x), then fetcher 6.                                                                                                                                          |
| `@ahoo-wang/fetcher-react` hooks                                          | Upgrade, then **rewrite the hook calls** (section 3, step 5).                                                                                                                                                            |
| none of the above                                                         | Bump every `@ahoo-wang/fetcher*` to `^6.0.0` together, then run the behavior checks (section 4).                                                                                                                         |

Removed from `@ahoo-wang/fetcher-react` in 6.0:

- Wow query hooks, moved **unchanged** to `@ahoo-wang/wow-react`: `useSingleQuery`, `useListQuery`, `usePagedQuery`, `useCountQuery`, `useListStreamQuery` with `UseSingleQueryOptions`/`UseSingleQueryReturn`, `UseListQueryOptions`/`UseListQueryReturn`, `UsePagedQueryOptions`/`UsePagedQueryReturn`, `UseCountQueryOptions`/`UseCountQueryReturn`, `UseListStreamQueryOptions`/`UseListStreamQueryReturn`; and `useFetcherSingleQuery`, `useFetcherListQuery`, `useFetcherPagedQuery`, `useFetcherCountQuery`, `useFetcherListStreamQuery` with `UseFetcherSingleQueryOptions`/`UseFetcherSingleQueryReturn`, `UseFetcherListQueryOptions`/`UseFetcherListQueryReturn`, `UseFetcherPagedQueryOptions`/`UseFetcherPagedQueryReturn`, `UseFetcherCountQueryOptions`/`UseFetcherCountQueryReturn`, `UseFetcherListStreamQueryOptions`/`UseFetcherListStreamQueryReturn`. `@ahoo-wang/wow-react` has its own request state and does not depend on `@ahoo-wang/fetcher-react`, so the redesign below does not apply to them (their `setQuery` stays).
- Data-monitor hooks, **no replacement**: `useDataMonitor`, `UseDataMonitorOptions`, `UseDataMonitorReturn`, `DataMonitorService`, `dataMonitorService`, `DataMonitorNotificationConfig`, `useDataMonitorEventBus`, `UseDataMonitorEventBusReturn`, `DataChangedEvent`, `dataMonitorEventBus`.
- Redesign, **no replacement** (write your own or use a library such as ahooks): `useFullscreen`, `UseFullscreenOptions`, `UseFullscreenReturn`, `FullscreenProvider`, `FullscreenProviderProps`, `FullscreenContext`, `FullscreenContextValue`, `useFullscreenContext`, `getFullscreenElement`, `isFullscreen`, `enterFullscreen`, `exitFullscreen`, `addFullscreenChangeListener`, `removeFullscreenChangeListener`, `useRefs`, `UseRefsReturn`, `useForceUpdate`, `useMounted`, `useRequestId`, `UseRequestIdReturn`.
- Redesign, **replaced by a controlled `query`**: `useQueryState`, `useCancellableQueryState`, `UseQueryStateOptions`, `UseQueryStateReturn`, `isValidateQuery`; the `initialQuery` option and the returned `setQuery`/`getQuery` on `useQuery`, `useFetcherQuery`, the query API hooks and the debounced query hooks.
- Redesign, other: `propagateError` (read the state `execute` resolves to); `onBeforeExecute` and `OnBeforeExecuteCallback` (prepare arguments before `execute`); `PromiseStateCallbacks` and `usePromiseState`'s `onSuccess`/`onError` (use `useExecutePromise`'s); `run`/`cancel`/`isPending` on `useDebouncedQuery`/`useDebouncedFetcherQuery` (now `pending`, `flush()`, `execute()`).

`useFetcher`, `useFetcherQuery`, `useQuery`, `useExecutePromise`, `usePromiseState`, the debounced hooks, `createExecuteApiHooks`/`createQueryApiHooks`, the CoSec components, storage and event hooks stay. Do not confuse `useFetcherQuery` (kept) with `useFetcherPagedQuery` (moved).

## 3. Upgrade, in this order

1. **Latest 5.x first**: every `@ahoo-wang/fetcher*` package to `^5.1.5` (the Wow packages peer `^5.1.5`; `fetcher-react`'s `fetcher-wow` peer is optional from 5.1.3).
2. **Swap the moved packages while still on 5.x**: remove `@ahoo-wang/fetcher-wow` and `@ahoo-wang/fetcher-generator`; add `@ahoo-wang/wow-client` and `@ahoo-wang/wow-react` (and `-D @ahoo-wang/wow-generator`) at the version `npm view` printed; move the imports (diffs in `references/api.md`). The app keeps working on 5.x.
3. **Generator**: replace the `fetcher-generator` command with `wow-generator` (the old name stays an alias until Wow v10) and **regenerate** — code generated earlier imports `@ahoo-wang/fetcher-wow`; `wow-generator` emits `@ahoo-wang/wow-client`. If you cannot regenerate, rewrite that import.
4. **fetcher 6**: bump every remaining `@ahoo-wang/fetcher*` package to `^6.0.0` in one change (their sibling peers are `^6.0.0`; mixing 5 and 6 breaks peer resolution). `fetcher-react` 6 needs `react` `^19.0.0` and no longer peers `fetcher-eventstream` or `react-dom`.
5. **fetcher-react hooks**: run `tsc` and fix each error with the redesign table in `references/api.md`:
   - Query in your own state: `const [query, setQuery] = useState(initial)`, pass `query`; drop `initialQuery` and the hook's `setQuery`/`getQuery`. `useQuery`'s `execute` option is `(query, abortController)` (no `attributes`). Generated query hooks take `{ query, attributes }`.
   - `execute` never rejects: replace `propagateError: true` + `try/catch` with `const { status, result, error } = await execute(…)` and branch on `status` (`'idle'` when cancelled).
   - Debounced query hooks: `pending` and `flush()` replace `run`/`cancel`/`isPending()`; they auto-execute by default and run the first query at once.
   - Generated execute hooks: drop `onBeforeExecute`; `UseApiMethodExecuteOptions` lost its first type parameter; `appendAbortController: true` forwards the controller.
   - Still compiles, behaves differently: `reset()` cancels the in-flight request; `onAbort` is synchronous; `useFetcher` no longer writes `request.abortController`; a failed `useFetcher` exposes the failed `exchange`; an auto-executing query renders `loading` on its first render; `RouteGuard` calls `onUnauthorized` after commit; `useKeyStorage`/`useSecurity` render the default during SSR and hydration.
6. **Behavior checks** (section 4) for every package you use.
7. **Verify**: type-check, run the tests, re-run the grep checklist until only intended hits remain.

## 4. Behavior changes that type-check

The ones that most often break an app (full list with grep checks in `references/api.md`):

- **Errors** (`@ahoo-wang/fetcher`): a status failure rejects with the `HttpStatusValidationError` itself — test `error instanceof HttpStatusValidationError` (before `ExchangeError`, its superclass), not `error.cause`. An **error interceptor that throws** (including a CoSec `onUnauthorized`/`onForbidden` callback) no longer escapes raw: the call rejects with an `ExchangeError` whose `cause` is the thrown value, and later error interceptors do not run — a `catch` that tested for your own error class must read `error.cause`.
- **Requests** (`@ahoo-wang/fetcher`): no default `Content-Type` (only plain-object and string bodies get `application/json`); `undefined`/`null` query values are omitted, arrays repeat (`ids=1&ids=2`, was `ids=1%2C2`), a `Date` is ISO 8601; a missing or `null` path parameter throws `Missing required path parameter`; a timeout now also applies when a `signal` is passed.
- **CoSec** (`@ahoo-wang/fetcher-cosec`): a refresh that fails on a network error, timeout, abort or **5xx keeps the session** and rejects with `RefreshUnavailableError` (inside the call's `ExchangeError`, at `cause`), **without** `onUnauthorized` — only a 4xx or a malformed refresh response signs out with `RefreshTokenError`. A custom `TokenRefresher` must reject with an error carrying `exchange.response.status` for a rejection to sign out. Add `isTrusted: sameOriginTrust` unless every absolute URL the client requests is yours. Set a `timeout` on the refresh client: browser tabs now refresh one at a time under a Web Lock.
- **Streams**: a stream that ends before its terminating event (OpenAI `data: [DONE]`) rejects with `EventStreamIncompleteError`; `ChatResponse.usage` is optional.
- **Decorator**: an array `@query('ids')` is sent as `ids=1&ids=2` (was `0=1&1=2`); a named `@attribute('x')` object is stored whole; an undecorated subclass override runs as written.
- **CDN/UMD**: `dist/index.umd.js` → `dist/index.umd.cjs` in `fetcher-cosec`, `-eventbus`, `-openai`, `-openapi`, `-storage`, `-react`.

## References

- `references/api.md`: npm facts, package mapping, the removed-export tables, the fetcher-react redesign (table, diffs, behavior), subpaths, **behavior changes by package**, the detection checklist, rewrites, generated clients and staying on 5.x. Load it for detection and for any rewrite.

## Related Skills

- $fetcher-react-hooks: the 6.x API of `@ahoo-wang/fetcher-react`, for writing the rewritten hook calls.
- $fetcher-cosec-auth: the 6.x CoSec refresh, trust and 401/403 semantics.
- $fetcher-integration: the 6.x error classes and interceptor behavior of `@ahoo-wang/fetcher`.
