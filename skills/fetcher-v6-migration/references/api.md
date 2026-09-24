# Fetcher 5.x → 6.0 Migration Reference

Source of truth: `docs/releases/v6.0.0.md` in the fetcher repository, checked
against the v5.1.3 and 6.0 sources of `@ahoo-wang/fetcher-react`.

## Contents

- [Version facts](#version-facts)
- [Package mapping](#package-mapping)
- [Removed exports of `@ahoo-wang/fetcher-react`](#removed-exports-of-ahoo-wangfetcher-react)
- [Subpaths of `@ahoo-wang/fetcher-react`](#subpaths-of-ahoo-wangfetcher-react)
- [Detection checklist](#detection-checklist)
- [Rewrites](#rewrites)
- [Generated clients](#generated-clients)
- [Staying on 5.x](#staying-on-5x)

## Version facts

- The `@ahoo-wang/wow-*` packages are **not on npm yet**. They are published
  with Wow's first stable release; Wow and its npm packages share one version
  number. Confirm with `npm view @ahoo-wang/wow-client version` and use the
  version it prints — never a guessed one.
- fetcher 6.0.0 is released after that Wow release. Confirm with
  `npm view @ahoo-wang/fetcher dist-tags`.
- The Wow packages declare fetcher peers `^5.1.3 || ^6` (`wow-react` on
  `fetcher-react`) and `^5.1.0 || ^6` (the rest), so they can be adopted on
  5.1.3 before upgrading fetcher.
- 6.0 makes no breaking API change to `@ahoo-wang/fetcher`,
  `fetcher-decorator`, `fetcher-eventbus`, `fetcher-eventstream`,
  `fetcher-openai`, `fetcher-openapi`, `fetcher-storage` or `fetcher-cosec`;
  the only removals are in `fetcher-react` and the packages that left. These
  packages do receive bug fixes — see **Fixed** in the 6.0 release notes
  (`docs/releases/v6.0.0.md`), for example the CoSec 401 refresh-retry no
  longer re-running the error phase (#1249).

## Package mapping

| 5.x package                      | 6.x replacement (Wow repository, not on npm yet)                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-wow`         | `@ahoo-wang/wow-client` — same client, renamed; `/query/locale/zh_CN` and `/query/locale/en_US` subpaths |
| Wow hooks in `fetcher-react`     | `@ahoo-wang/wow-react` (ESM only), built on `fetcher-react/core` and `fetcher-react/fetcher`             |
| `@ahoo-wang/fetcher-generator`   | `@ahoo-wang/wow-generator` — command `wow-generator`; `fetcher-generator` stays an alias until Wow v10   |
| `@ahoo-wang/fetcher-viewer`      | None in 6.x. Stays on 5.x; `@ahoo-wang/wow-view-engine` supersedes it once declared stable (unpublished) |
| Data-monitor hooks               | None. Remove them or stay on 5.x                                                                         |
| `@ahoo-wang/fetcher-view-engine` | Never published; continues as `@ahoo-wang/wow-view-engine`, unpublished until stable                     |

The last 5.x versions of `fetcher-wow` and `fetcher-generator` (5.1.3) stay on
npm and are meant to be deprecated with a pointer to their replacement.

## Removed exports of `@ahoo-wang/fetcher-react`

6.0 drops `export * from './wow/index.js'` and
`export * from './dataMonitor/index.js'` from the root entry, and the optional
`@ahoo-wang/fetcher-wow` peer.

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

## Subpaths of `@ahoo-wang/fetcher-react`

| Entry                              | Formats  | Holds                                                                                                                                                                                                                                                       |
| ---------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-react`         | ESM, UMD | everything below plus CoSec (`SecurityProvider`, `RouteGuard`, …), storage (`useKeyStorage`, `useImmerKeyStorage`), `useEventSubscription`, `createExecuteApiHooks`, `createQueryApiHooks`                                                                  |
| `@ahoo-wang/fetcher-react/core`    | ESM      | `usePromiseState`, `useExecutePromise`, `useQuery`, `useQueryState`, `useDebouncedCallback`, `useDebouncedExecutePromise`, `useDebouncedQuery`, fullscreen helpers, `useMounted`, `useLatest`, `useRefs`, `useRequestId`, `useForceUpdate`, `PromiseStatus` |
| `@ahoo-wang/fetcher-react/fetcher` | ESM      | `useFetcher`, `useFetcherQuery`, `useDebouncedFetcher`, `useDebouncedFetcherQuery` and their option/return types (added in 5.1.3)                                                                                                                           |

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

## Rewrites

Apply only after `npm view` shows the Wow packages are published; `<wow-version>`
is the version it printed.

```sh
pnpm add @ahoo-wang/fetcher-react@5.1.3
pnpm remove @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-generator
pnpm add @ahoo-wang/wow-client@<wow-version> @ahoo-wang/wow-react@<wow-version>
pnpm add -D @ahoo-wang/wow-generator@<wow-version>
# then, once fetcher 6.0.0 is on npm, every @ahoo-wang/fetcher* package you use:
pnpm add @ahoo-wang/fetcher@^6 @ahoo-wang/fetcher-react@^6
```

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
