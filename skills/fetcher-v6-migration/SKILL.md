---
name: fetcher-v6-migration
description: >
  Upgrade a project from Fetcher 5.x to 6.0: `@ahoo-wang/fetcher*` 5 → 6, `fetcher-wow`/`fetcher-generator`/`fetcher-viewer` replaced by Wow's `wow-*` packages, and `@ahoo-wang/fetcher-react` exports or options (`usePagedQuery`, `useDataMonitor`, `setQuery`, `propagateError`) that stopped compiling after the bump. Decides upgrade versus stay on 5.x, finds every usage and rewrites it. Not for new code on 6.0.
---

# Fetcher 5.x → 6.0

6.0.0 shipped on 2026-10-04. Two things break; everything else is a bump:

1. **Wow-coupled packages left fetcher** and are released with [Wow](https://wow.ahoo.me) from its `typescript/` directory. Wow 9.2.1 is the first release whose packages accept fetcher 6 (peer `^5.1.5 || ^6.0.0`), so they can be adopted on 5.x first.
2. **`@ahoo-wang/fetcher-react` was redesigned around cancellation**: hooks and options were removed, queries are controlled, `execute` never rejects.

`@ahoo-wang/fetcher`, `-decorator`, `-eventbus`, `-eventstream`, `-openai`, `-openapi`, `-storage` and `-cosec` keep their API; 6.0 only corrects behavior no caller should rely on. Those corrections still need a review pass (step 4).

## 1. Find what the project uses

Run the grep checklist in `references/checklist.md` from the project root. Read the manifests and the lockfile as well as the source: generated code and CI scripts count.

## 2. Decide

| Found                                                               | Decision                                                                                                                                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-viewer`, or a data-monitor hook                 | **Stay on 5.x** (`^5.1.5`, patches on the `release-5` line). `fetcher-viewer` peers on `^5.0.0` of fetcher, `fetcher-wow` and `fetcher-react`, so the whole app stays. |
| `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-generator`, Wow hooks | Upgrade in order: latest 5.x → Wow packages → fetcher 6 (step 3).                                                                                                      |
| `@ahoo-wang/fetcher-react`                                          | Upgrade and rewrite the hook calls (`references/react.md`).                                                                                                            |
| none of the above                                                   | Bump every `@ahoo-wang/fetcher*` to `^6.0.0` together, then step 4.                                                                                                    |

`fetcher-viewer` has no drop-in successor: `@ahoo-wang/wow-view-engine` replaces it with a different model and API, so moving to it is a rewrite, not part of this upgrade. Say so instead of proposing it as a swap.

## 3. Rewrite, in this order

Confirm the current versions before installing anything, and use what the registry reports (9.2.1 or later for the Wow packages):

```sh
npm view @ahoo-wang/fetcher dist-tags
npm view @ahoo-wang/wow-client version peerDependencies
```

1. Move every `@ahoo-wang/fetcher*` to the latest 5.x (`^5.1.5`; the Wow peer range needs it).
2. Replace the moved packages and their imports. The names inside do not change:

   | 5.x                                                         | 6.x                                                                                                             |
   | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
   | `@ahoo-wang/fetcher-wow` (and `/query/locale/*`)            | `@ahoo-wang/wow-client` (same subpaths)                                                                         |
   | Wow hooks imported from `@ahoo-wang/fetcher-react`          | `@ahoo-wang/wow-react` (ESM only; has its own request state, unaffected by the redesign)                        |
   | `@ahoo-wang/fetcher-generator`, command `fetcher-generator` | `@ahoo-wang/wow-generator` (dev dependency), command `wow-generator`; the old command is an alias until Wow v10 |

3. **Regenerate** generated clients with `wow-generator`: code generated earlier imports `@ahoo-wang/fetcher-wow`. If regeneration is not possible, rewrite that import to `@ahoo-wang/wow-client`.
4. Bump every remaining `@ahoo-wang/fetcher*` to `^6.0.0` in one change (siblings peer on `^6.0.0`), then rewrite the `@ahoo-wang/fetcher-react` calls with `references/react.md`. It needs `react` `^19.0.0`.

```diff
-import { useFetcher, usePagedQuery } from '@ahoo-wang/fetcher-react';
+import { useFetcher } from '@ahoo-wang/fetcher-react';
+import { usePagedQuery } from '@ahoo-wang/wow-react';
```

## 4. Review the behavior corrections

They compile unchanged, so `tsc` will not find them. `references/checklist.md` has a grep and a fix for each. The ones that bite most:

- A non-2xx response rejects with the `HttpStatusValidationError` itself, no longer wrapped: `error.cause instanceof HttpStatusValidationError` silently stops matching. Test `error instanceof HttpStatusValidationError` before `ExchangeError`.
- No default `Content-Type`. Object and string bodies still get `application/json`; a server that wanted it on a bodyless or binary request needs it set explicitly.
- Query values: `undefined`/`null` are omitted, arrays repeat (`ids=1&ids=2`), dates are ISO 8601; decorator array arguments bind the same way instead of `0=…&1=…`.
- An event stream with a terminate detector, and every OpenAI completion stream, rejects with `EventStreamIncompleteError` when it ends before its terminating event (`[DONE]`).
- CoSec still sends the token to every origin by default: add `isTrusted: sameOriginTrust` unless every absolute URL the client calls is yours.

## 5. Verify

Type-check, run the tests, and re-run the checklist until it reports nothing left to change.

## What `@ahoo-wang/fetcher-react` no longer exports

Moved to `@ahoo-wang/wow-react` under the same names: `useSingleQuery`, `UseSingleQueryOptions`, `UseSingleQueryReturn`, `useListQuery`, `UseListQueryOptions`, `UseListQueryReturn`, `usePagedQuery`, `UsePagedQueryOptions`, `UsePagedQueryReturn`, `useCountQuery`, `UseCountQueryOptions`, `UseCountQueryReturn`, `useListStreamQuery`, `UseListStreamQueryOptions`, `UseListStreamQueryReturn`, `useFetcherSingleQuery`, `UseFetcherSingleQueryOptions`, `UseFetcherSingleQueryReturn`, `useFetcherListQuery`, `UseFetcherListQueryOptions`, `UseFetcherListQueryReturn`, `useFetcherPagedQuery`, `UseFetcherPagedQueryOptions`, `UseFetcherPagedQueryReturn`, `useFetcherCountQuery`, `UseFetcherCountQueryOptions`, `UseFetcherCountQueryReturn`, `useFetcherListStreamQuery`, `UseFetcherListStreamQueryOptions`, `UseFetcherListStreamQueryReturn`.

Removed with **no replacement** (remove the usage, or stay on 5.x): `useDataMonitor`, `UseDataMonitorOptions`, `UseDataMonitorReturn`, `DataMonitorService`, `dataMonitorService`, `DataMonitorNotificationConfig`, `useDataMonitorEventBus`, `UseDataMonitorEventBusReturn`, `DataChangedEvent`, `dataMonitorEventBus`.

Removed by the redesign, write your own or use a library such as ahooks: `useFullscreen`, `UseFullscreenOptions`, `UseFullscreenReturn`, `FullscreenProvider`, `FullscreenProviderProps`, `FullscreenContext`, `FullscreenContextValue`, `useFullscreenContext`, `getFullscreenElement`, `isFullscreen`, `enterFullscreen`, `exitFullscreen`, `addFullscreenChangeListener`, `removeFullscreenChangeListener`, `useRefs`, `UseRefsReturn`, `useForceUpdate`, `useMounted`, `useRequestId`, `UseRequestIdReturn`.

Removed by the redesign, replaced by a controlled `query` or by the state `execute` resolves to: `useQueryState`, `useCancellableQueryState`, `UseQueryStateOptions`, `UseQueryStateReturn`, `isValidateQuery`, `OnBeforeExecuteCallback`, `PromiseStateCallbacks`.

`useFetcher`, `useFetcherQuery`, `useQuery`, `useExecutePromise`, `usePromiseState`, the debounced hooks, `createExecuteApiHooks`, `createQueryApiHooks`, and the CoSec, storage and event hooks stay, with the API changes in `references/react.md`. Do not confuse `useFetcherQuery` (kept) with `useFetcherPagedQuery` (moved).

## References

- `references/checklist.md`: grep commands for every blocking usage and behavior correction, with what each hit means and its fix.
- `references/react.md`: the fetcher-react redesign: removed and changed options, migration diffs, behavior that changed without a compile error, entry points.

For writing new code against the 6.0 API afterwards, use $fetcher-react and $fetcher.
