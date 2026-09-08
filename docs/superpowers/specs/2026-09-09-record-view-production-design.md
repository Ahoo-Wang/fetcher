# RecordView library production acceptance

Date: 2026-09-09. Baseline: `24ae764b`. The user approved this scope and delegated implementation decisions and review preparation for the next day.

## Delivery boundary

Complete the existing data-view library: core ViewEngine, ViewHost services, LocalStorageViewHost, filters, table/cells, view management, and five extension categories. Preserve the current behavior and reusable Fetcher APIs. AnalysisView receives a next-phase contract document, not runtime implementation. No publication, push, deployment, production authentication, or database integration is part of this delivery.

## Acceptance

1. Configuration and query correctness: field paths, operators, dates/timezones, values, pagination/sorting/selection, and page/all summaries preserve meaning. Invalid inputs fail explicitly. Renderer failures stay local. Confirmed defects get a failing regression before the shared cause is repaired.
2. Restore and concurrency: saved component JSON restores through a fresh host/engine/registry. Cover CAS conflicts, uncertain writes, permissions, cross-scope navigation, stale responses, cancellation, and disposal. View storage contains configuration, not business records. Existing service and extension contracts remain authoritative.
3. UX: exercise default light/dark themes, 1440px and 390px containers, real keyboard input, focus return, popover clipping, empty/loading/error/retry, and grouped checkbox selection. Run automated accessibility checks plus inspect screenshots. Fix violations in the owned components; report actual tested browser versions.
4. Scale: use 100 loaded rows, 30 visible data columns, and 100 filter candidate fields. Record repeatable warm interaction timings and raw samples, browser/viewport/host details. A no-network warm interaction exceeding a 1000ms p95 budget is a blocker; this is a generous regression ceiling, not an advertised latency SLA. Verify repeated mount/unmount settles requests/subscriptions and that query-draft editing does not rerender unchanged data cells. No speculative virtualizer or cache layer.
5. Delivery: consume public built exports and packed output. Reuse the package, local-storage, and HTTP-experiment verification scripts in an isolated CI runner; start/stop its own server, accept explicit URL/browser configuration, and return failure for any failed stage. Keep artifacts on failure. All package tests, React-compiled tests/types, Storybook, lint, and builds must pass. Limit test workers for deterministic resource use without increasing timeouts or skipping assertions.
6. Handoff: document record-only constraints separately from reusable filters, component registration/configuration, view metadata, permission services, and formatting. Analysis must define dimensions/measures/result aliases and its own identity/query/display semantics before it can generalize these contracts.

## Architecture and files

Keep runtime edits in the module that owns the confirmed defect. The production verifier is development-only, using the installed Playwright, Storybook, and axe dependencies. A dedicated development story supplies the scale/UX fixture using public package imports. Existing local/HTTP host scripts continue proving recovery and five extensions. CI calls one root command after build; that command also runs the new readiness checks. No new dependencies or published entry points.

Primary review artifacts are a requirement-to-evidence report and a next-phase analysis contract document. Commit the final implementation and evidence after required checks. The user's autonomous-execution instruction replaces intermediate approval pauses; this existing isolated worktree stays on its current branch.

## Completion rule

No unresolved blocker affecting correctness, saved data, principal interactions, or the agreed acceptance checks. Evidence must identify the tested revision/working-tree content, commands, actual results and limitations. Local pass does not claim that remote GitHub Actions ran or that a consuming application's security/operations were admitted.

## Recorded acceptance decision

WebKit's hidden Base UI focus sentinels produce an `aria-command-name` diagnostic, tracked as expected behavior in [Base UI #5237](https://github.com/mui/base-ui/issues/5237). Preserve the raw findings and classify only this exact rule on visually hidden native Base UI sentinel spans. All other findings still fail. Verify real keyboard entry, Tab from the last option into the next workbench control, and Escape restoration; do not alter dependency focus plumbing to silence the scanner. This is a disclosed automated-check exception, not a VoiceOver certification. Direct synthetic focus on an outside sentinel may fall back to body and is recorded as a dependency boundary.
