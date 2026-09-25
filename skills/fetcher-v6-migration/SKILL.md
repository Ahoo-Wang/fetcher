---
name: fetcher-v6-migration
description: >
  Upgrade a project from Fetcher 5.x to 6.0. Use when asked to upgrade `@ahoo-wang/fetcher*` to 6, when Wow query hooks or data-monitor hooks are missing from `@ahoo-wang/fetcher-react`, or when `fetcher-wow`, `fetcher-generator` or `fetcher-viewer` stop resolving. Decides stay-on-5.x versus upgrade, then detects and rewrites usages. Not for writing new Fetcher code.
---

# fetcher-v6-migration

6.0 only **removes**: the Wow-coupled packages moved to the Wow repository (`typescript/` there) and are released with Wow. `@ahoo-wang/fetcher`, `-decorator`, `-eventbus`, `-eventstream`, `-openai`, `-openapi`, `-storage` and `-cosec` have no breaking API change (behavior corrections are under **Changed** in the 6.0 release notes — a query sent as `?a=undefined`, a timeout dropped when a `signal` is passed, a `Content-Type: application/json` sent on every request, a status failure hidden behind `ExchangeError.cause`, a decorator array argument spread into `0=…&1=…`, an undecorated subclass override replaced by `@api`, OpenAPI types that left `Info.title`/`version` and `Response.description` optional, an event stream (an OpenAI completion stream included) that ends before its terminating event now erroring with `EventStreamIncompleteError`, a CoSec token sent to absolute URLs on any origin unless `isTrusted: sameOriginTrust` is set, a JWT with a non-object payload now reading as expired, a storage `destroy()` that now also closes the event bus it created, a React `RouteGuard` whose `onUnauthorized` now runs in an effect after commit instead of during render, `useKeyStorage` (and `useSecurity`/`SecurityProvider`) rendering the default during SSR and hydration, `useQueryState` no longer re-running when only `execute` changes, `useLatest` updating its ref after commit — other bug fixes are under **Fixed**); `@ahoo-wang/fetcher-react` otherwise only lost exports.

## 1. Check what is published — never assume

The replacements (`@ahoo-wang/wow-client`, `@ahoo-wang/wow-react`, `@ahoo-wang/wow-generator`) are **not on npm yet**; they ship with Wow's first stable release, and fetcher 6.0 ships after that. Before recommending any install, run:

```sh
npm view @ahoo-wang/fetcher dist-tags
npm view @ahoo-wang/wow-client version   # a 404 means: not published yet
```

Never write `pnpm add @ahoo-wang/wow-*` into a plan, script or manifest until that command returns a version, and never invent one.

## 2. Detect usages

Run the checklist in `references/api.md` (grep patterns for manifests, imports, scripts and generated code). Classify the project:

| Found                                                                     | Decision                                                                                                                                                    |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-viewer`, or any data-monitor hook                     | **Stay on 5.x** (`^5.1.3`). No 6.x replacement exists.                                                                                                      |
| `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-generator`, Wow query hooks | Replacements not on npm yet → **stay on 5.x**, move to 5.1.3 and prepare. Once published → switch to the Wow packages on 5.1.3 first, then upgrade fetcher. |
| none of the above                                                         | **Upgrade** every `@ahoo-wang/fetcher*` to `^6.0.0` once 6.0.0 is on npm; no code changes beyond the **Changed** checks in `references/api.md`.             |

Removed from `@ahoo-wang/fetcher-react` in 6.0:

- Wow query hooks, moved unchanged to `@ahoo-wang/wow-react`: `useSingleQuery`, `useListQuery`, `usePagedQuery`, `useCountQuery`, `useListStreamQuery` with `UseSingleQueryOptions`/`UseSingleQueryReturn`, `UseListQueryOptions`/`UseListQueryReturn`, `UsePagedQueryOptions`/`UsePagedQueryReturn`, `UseCountQueryOptions`/`UseCountQueryReturn`, `UseListStreamQueryOptions`/`UseListStreamQueryReturn`; and `useFetcherSingleQuery`, `useFetcherListQuery`, `useFetcherPagedQuery`, `useFetcherCountQuery`, `useFetcherListStreamQuery` with `UseFetcherSingleQueryOptions`/`UseFetcherSingleQueryReturn`, `UseFetcherListQueryOptions`/`UseFetcherListQueryReturn`, `UseFetcherPagedQueryOptions`/`UseFetcherPagedQueryReturn`, `UseFetcherCountQueryOptions`/`UseFetcherCountQueryReturn`, `UseFetcherListStreamQueryOptions`/`UseFetcherListStreamQueryReturn`.
- Data-monitor hooks, **no replacement**: `useDataMonitor`, `UseDataMonitorOptions`, `UseDataMonitorReturn`, `DataMonitorService`, `dataMonitorService`, `DataMonitorNotificationConfig`, `useDataMonitorEventBus`, `UseDataMonitorEventBusReturn`, `DataChangedEvent`, `dataMonitorEventBus`.

`useFetcher`, `useFetcherQuery`, `useQuery`, `usePromiseState` and every other hook stay. Do not confuse `useFetcherQuery` (kept) with `useFetcherPagedQuery` (moved).

## 3. Rewrite, in this order

1. Pin `@ahoo-wang/fetcher-react@5.1.3` — the first version whose `@ahoo-wang/fetcher-wow` peer is optional, and the first with the `/fetcher` subpath.
2. Only when the Wow packages are published: remove `@ahoo-wang/fetcher-wow` and `@ahoo-wang/fetcher-generator`, add the Wow packages at the version `npm view` reported, and move imports (`references/api.md` has the diffs). They accept fetcher `^5.1.3 || ^6`, so the app keeps working on 5.x.
3. Replace the `fetcher-generator` command with `wow-generator` (`fetcher-generator` stays an alias until Wow v10), then **regenerate** clients: code generated earlier imports `@ahoo-wang/fetcher-wow`; the new generator emits `@ahoo-wang/wow-client`. If regeneration is impossible, rewrite that import.
4. Upgrade the remaining `@ahoo-wang/fetcher*` packages to `^6.0.0` together.
5. Verify: type-check, run tests, and re-run the grep checklist until it finds nothing.

Gotchas:

- `@ahoo-wang/wow-react` is ESM only; the `fetcher-react` UMD bundle no longer carries the Wow hooks.
- `@ahoo-wang/fetcher-react/core` (promise state, `useQuery`, debounce, utility hooks) and `@ahoo-wang/fetcher-react/fetcher` (`useFetcher`, `useFetcherQuery` and their debounced variants) are ESM-only subpaths without security, storage or event-bus integration. The root entry still exports everything that remained.
- A project on `@ahoo-wang/fetcher-viewer` must keep **all** fetcher packages on 5.x: its peers are `^5.0.0`.
- After 6.0, 5.x patches publish under the dist-tag `release-5` (`@ahoo-wang/fetcher@release-5`); `latest` moves to 6.x.

## References

- `references/api.md`: package mapping, the removed-export table with replacements, subpath contents, before/after diffs, the detection checklist, and version facts. Load it for the detection step and for any rewrite.

## Related Skills

- $fetcher-react-hooks: the hooks that remain in `@ahoo-wang/fetcher-react` 6.x.
- $fetcher-openapi-types: the OpenAPI type layer, which stays in fetcher.
