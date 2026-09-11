---
next: false
title: Complete View Engine example
description: A shared runnable record page with real local filtering, sorting and pagination.
---

# Complete View Engine example

## Run and verify

From this repository, with Node >=20.20.2 and pnpm 10.34.5:

```bash
pnpm install
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm storybook
```

Open [View Engine → 入门与业务流程 → 最小接入](http://localhost:6006/?path=/story/view-engine-扩展接入-最小接入--minimal). The displayed page starts unchanged; interactions are manual. Run the separate regression story for assertions:

```bash
pnpm exec vitest run --project=storybook stories/view-engine/QuickStart.test.stories.tsx
```

Install Playwright Chromium first (`pnpm exec playwright install chromium`), or set `VIEW_ENGINE_BROWSER_CHANNEL=chrome` to use installed Chrome. Full business and narrow-dark regressions live in `stories/view-engine/orders`.

| Action                               | Expected result                                              |
| ------------------------------------ | ------------------------------------------------------------ |
| Open the page                        | SO-202609-1001 and SO-202609-1002, 3 total rows              |
| Next page                            | SO-202609-1003                                               |
| Set Amount to 10000 without querying | Current result stays unchanged                               |
| Press Enter                          | Only SO-202609-1001                                          |
| Clear the applied amount value       | All 3 records are eligible again; the filter control remains |
| Sort Amount ascending                | SO-202609-1002, SO-202609-1003 on page 1                     |

## Sales order lifecycle

Start with [the complete order workbench](http://localhost:6006/?path=/story/view-engine-全链路体验--workbench). Create an order for two monitors (CNY 2,400), submit it as sales, approve it as the manager, collect payment as finance, then release, prepare, ship and receive it. Record the invoice, reconcile, and close the order. The order detail shows the next action and responsible role. Use its handoff button to change operator while keeping the same order open. Aftersales orders remain queued until closure; a failed refresh can be retried inside the detail without repeating the write.

The chapter stories cover prepaid and credit release, partial shipments, rejected deliveries, returns, refunds and invoice credits. They share 18 consistent order seeds and start independently. Query and view settings use the public engine; business forms, validation and mutations live in `packages/view-engine/examples/react/sales-order/`. Resetting the workbench restores business records. View persistence is demonstrated separately and never persists business orders.

```bash
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm exec vitest run --project=storybook stories/view-engine/orders
```

## Full shared component

The source below is the component rendered by the Storybook Minimal story. It uses the public package entries. The local source supports only the advertised amount lower-bound/AND predicates and ordinary paging; other operators require a business QueryApi. It returns full records and supplies no saved-view service, so saving is unavailable. The [saved-view guide](../guides/view-engine/saved-views.md) covers that next step.

<<< @/../stories/docs/RecordViewExample.tsx

## Use a separate React application

Until this package is published, build and verify its local archive:

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
node packages/view-engine/scripts/verify-package.mjs
pnpm --filter @ahoo-wang/fetcher-view-engine pack --pack-destination /tmp/view-engine-pack
```

The pack command prints the archive filename. In a React 19 TypeScript application, install that absolute `.tgz` path with `pnpm add`, satisfy the declared peer dependencies, copy the shared component, and render `<RecordViewExample />`. If an internal dependency version is not published in your environment, pack the corresponding workspace dependency as well; the package verifier exercises the workspace-built artifacts together without publishing them.

This verifies a browser UI and a local record source. Authentication, durable view storage and your backend's query behavior belong to the application integration; see [ViewHost](../reference/view-engine/view-host.md).
