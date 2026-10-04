---
name: fetcher-v6-migration
description: >
  Upgrade a project from Fetcher 5.x to 6.0. Use when asked to upgrade `@ahoo-wang/fetcher*` to 6; when Wow query hooks, data-monitor hooks or other hooks/options (`setQuery`, `propagateError`, `onBeforeExecute`) are missing from `@ahoo-wang/fetcher-react`; or when `fetcher-wow`, `fetcher-generator` or `fetcher-viewer` stop resolving. Decides stay-on-5.x versus upgrade, then detects and rewrites usages. Not for writing new Fetcher code.
---

# fetcher-v6-migration

6.0 does two things. (1) The Wow-coupled packages moved to the Wow repository (`typescript/` there) and are released with Wow. (2) `@ahoo-wang/fetcher-react` is **redesigned around cancellation** — breaking: hooks and options are removed, queries are controlled, `execute` never rejects. `@ahoo-wang/fetcher`, `-decorator`, `-eventbus`, `-eventstream`, `-openai`, `-openapi`, `-storage` and `-cosec` have no breaking API change; their behavior corrections are under **Changed** in the 6.0 release notes and in the behavior checks of `references/api.md` (query serialization, timeouts with a `signal`, default `Content-Type`, `HttpStatusValidationError` no longer behind `ExchangeError.cause`, decorator array arguments, OpenAPI required fields, `EventStreamIncompleteError`, CoSec `isTrusted: sameOriginTrust`, storage `destroy()`, `RouteGuard` `onUnauthorized` after commit, `useKeyStorage` during SSR, `useLatest` after commit).

## 1. Check what is published — never assume

The replacements (`@ahoo-wang/wow-client`, `@ahoo-wang/wow-react`, `@ahoo-wang/wow-generator`, and `@ahoo-wang/wow-view-engine` superseding `fetcher-viewer`) are on npm from Wow 9.2.0, Wow's first stable release. Only **9.2.1 or later** accepts fetcher 6 (peer range `^5.1.5 || ^6.0.0`; 9.2.0 required `^5.1.5`). Docs: https://wow.ahoo.me. Before recommending any install, confirm the current versions:

```sh
npm view @ahoo-wang/fetcher dist-tags
npm view @ahoo-wang/wow-client version peerDependencies   # use 9.2.1 or later
```

Use the version that command prints (at least 9.2.1 when fetcher 6 is the target), never an invented one.

## 2. Detect usages

Run the checklist in `references/api.md` (grep patterns for manifests, imports, scripts, generated code and the fetcher-react hook API). Classify the project:

| Found                                                                     | Decision                                                                                                                                                                               |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-viewer`, or any data-monitor hook                     | **Stay on 5.x** (`^5.1.3`). No drop-in 6.x replacement: `@ahoo-wang/wow-view-engine` supersedes `fetcher-viewer` with a different model and API, and the data-monitor hooks have none. |
| `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-generator`, Wow query hooks | Move to the latest 5.x (the Wow peer range needs `^5.1.5`), **switch to the Wow packages (9.2.1 or later) first**, then upgrade fetcher.                                               |
| `@ahoo-wang/fetcher-react` hooks (any of them)                            | Upgrade, and **rewrite the hook calls** (section 3b) — they no longer type-check or behave the same.                                                                                   |
| none of the above                                                         | **Upgrade** every `@ahoo-wang/fetcher*` to `^6.0.0` once 6.0.0 is on npm; no code changes beyond the **Changed** checks in `references/api.md`.                                        |

Removed from `@ahoo-wang/fetcher-react` in 6.0:

- Wow query hooks, moved to `@ahoo-wang/wow-react` under the same names: `useSingleQuery`, `useListQuery`, `usePagedQuery`, `useCountQuery`, `useListStreamQuery` with `UseSingleQueryOptions`/`UseSingleQueryReturn`, `UseListQueryOptions`/`UseListQueryReturn`, `UsePagedQueryOptions`/`UsePagedQueryReturn`, `UseCountQueryOptions`/`UseCountQueryReturn`, `UseListStreamQueryOptions`/`UseListStreamQueryReturn`; and `useFetcherSingleQuery`, `useFetcherListQuery`, `useFetcherPagedQuery`, `useFetcherCountQuery`, `useFetcherListStreamQuery` with `UseFetcherSingleQueryOptions`/`UseFetcherSingleQueryReturn`, `UseFetcherListQueryOptions`/`UseFetcherListQueryReturn`, `UseFetcherPagedQueryOptions`/`UseFetcherPagedQueryReturn`, `UseFetcherCountQueryOptions`/`UseFetcherCountQueryReturn`, `UseFetcherListStreamQueryOptions`/`UseFetcherListStreamQueryReturn`. `@ahoo-wang/wow-react` has its own request state and does not depend on `@ahoo-wang/fetcher-react`; its hooks keep their own API, so the redesign below does not apply to them.
- Data-monitor hooks, **no replacement**: `useDataMonitor`, `UseDataMonitorOptions`, `UseDataMonitorReturn`, `DataMonitorService`, `dataMonitorService`, `DataMonitorNotificationConfig`, `useDataMonitorEventBus`, `UseDataMonitorEventBusReturn`, `DataChangedEvent`, `dataMonitorEventBus`.
- Redesign, **no replacement** (write your own, or use a library such as ahooks): `useFullscreen`, `UseFullscreenOptions`, `UseFullscreenReturn`, `FullscreenProvider`, `FullscreenProviderProps`, `FullscreenContext`, `FullscreenContextValue`, `useFullscreenContext`, `getFullscreenElement`, `isFullscreen`, `enterFullscreen`, `exitFullscreen`, `addFullscreenChangeListener`, `removeFullscreenChangeListener`, `useRefs`, `UseRefsReturn`, `useForceUpdate`, `useMounted`, `useRequestId`, `UseRequestIdReturn`.
- Redesign, **replaced by a controlled `query`**: `useQueryState`, `useCancellableQueryState`, `UseQueryStateOptions`, `UseQueryStateReturn`, `isValidateQuery`; the `initialQuery` option and the returned `setQuery`/`getQuery` on `useQuery`, `useFetcherQuery`, the query API hooks and the debounced query hooks.
- Redesign, other: the `propagateError` option (read the state `execute` resolves to); `onBeforeExecute` and `OnBeforeExecuteCallback` on generated API hooks (prepare arguments before `execute`); `PromiseStateCallbacks` and `usePromiseState`'s `onSuccess`/`onError` (use `useExecutePromise`'s); `run`/`cancel`/`isPending` on `useDebouncedQuery`/`useDebouncedFetcherQuery` (now `pending`, `flush()`, `execute()`).

`useFetcher`, `useFetcherQuery`, `useQuery`, `useExecutePromise`, `usePromiseState`, the debounced hooks, `createExecuteApiHooks`/`createQueryApiHooks`, CoSec, storage and event hooks stay — with the changed API in section 3b. Do not confuse `useFetcherQuery` (kept) with `useFetcherPagedQuery` (moved).

## 3. Rewrite, in this order

1. Pin `@ahoo-wang/fetcher-react@5.1.3` — the first version whose `@ahoo-wang/fetcher-wow` peer is optional, and the first with the `/fetcher` subpath.
2. Remove `@ahoo-wang/fetcher-wow` and `@ahoo-wang/fetcher-generator`, add the Wow packages at the version `npm view` reported (9.2.1 or later), and move imports (`references/api.md` has the diffs). From 9.2.1 their fetcher peer range is `^5.1.5 || ^6.0.0` (move the `@ahoo-wang/fetcher*` packages to `^5.1.5` first), so the app keeps working on 5.x and is ready for step 4; confirm with `npm view @ahoo-wang/wow-client peerDependencies`.
3. Replace the `fetcher-generator` command with `wow-generator` (`fetcher-generator` stays an alias until Wow v10), then **regenerate** clients: code generated earlier imports `@ahoo-wang/fetcher-wow`; the new generator emits `@ahoo-wang/wow-client`. If regeneration is impossible, rewrite that import.
4. Upgrade the remaining `@ahoo-wang/fetcher*` packages to `^6.0.0` together, and rewrite fetcher-react hook calls (3b).
5. Verify: type-check, run tests, and re-run the grep checklist until it finds nothing.

### 3b. fetcher-react hook calls

Rewrite with `references/api.md` (removed/changed table and diffs):

- **Query in your own state**: `const [query, setQuery] = useState(initial)` and pass `query`; drop `initialQuery`, and `setQuery`/`getQuery` from the hook's return. `useQuery`'s `execute` option loses `attributes`: `(query, abortController)`. Generated query hooks take `{ query, attributes }`.
- **`execute` never rejects**: replace `propagateError: true` + `try/catch` with `const { status, result, error } = await execute(…)` and branch on `status`. A cancelled execution resolves to `status: 'idle'`.
- **Debounced query hooks**: pass the state's `query`; use `pending` and `flush()` instead of `run`/`cancel`/`isPending()`. They now auto-execute by default, and the first query runs at once.
- **Generated execute hooks**: drop `onBeforeExecute`; `UseApiMethodExecuteOptions` has lost its first type parameter. Pass `appendAbortController: true` to forward the controller.
- **Behavior that still compiles but changed**: `reset()` now cancels the in-flight request first; `onAbort` is called synchronously; `useFetcher` no longer writes `request.abortController` (cancel with `abort()`/`reset()` or pass `request.signal`); on failure `useFetcher`'s `exchange` is the failed request's exchange instead of `undefined`; an auto-executing query renders `loading` on its first render (was `idle`); `useEventSubscription` no longer resubscribes when only the handler object changes.
- **Upgrade check**: run `tsc`; then search for `propagateError`, `reset(`, `request.abortController`, and tests asserting `idle` on the first render of an auto query.

Gotchas:

- `@ahoo-wang/wow-react` is ESM only; the `fetcher-react` UMD bundle no longer carries the Wow hooks.
- `@ahoo-wang/fetcher-react/core` (promise state, `useQuery`, debounce hooks, `useLatest`, `useStableValue`) and `@ahoo-wang/fetcher-react/fetcher` (`useFetcher`, `useFetcherQuery` and their debounced variants) are ESM-only subpaths without security, storage or event-bus integration. The root entry exports everything that remained.
- `@ahoo-wang/fetcher-react` 6 needs `react` `^19.0.0`.
- A project on `@ahoo-wang/fetcher-viewer` must keep **all** fetcher packages on 5.x: its peers are `^5.0.0`.
- After 6.0, 5.x patches publish under the dist-tag `release-5` (`@ahoo-wang/fetcher@release-5`); `latest` moves to 6.x.

## References

- `references/api.md`: package mapping, the removed-export tables with replacements, the fetcher-react redesign (removed/changed API, migration diffs, behavior changes), subpath contents, the detection checklist, and version facts. Load it for the detection step and for any rewrite.

## Related Skills

- $fetcher-react-hooks: the 6.x API of `@ahoo-wang/fetcher-react`, for writing the rewritten hook calls.
- $fetcher-openapi-types: the OpenAPI type layer, which stays in fetcher.
