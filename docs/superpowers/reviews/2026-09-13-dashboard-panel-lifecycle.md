# Dashboard panel lifecycle review

Base: `d19054e981f3f21762338a410351a94e97d11f93` (main after PR #1458).

## Architecture outcome

DashboardRuntime now owns dashboard configuration, applied filters, panel identity
reconciliation and aggregate coordination. DashboardPanelRuntime owns the retained
instance, live definition, resolver, position, load promise, generation and errors.
The parent reads snapshots and metadata byte counts; it does not mutate panel fields.

Raw production lines: DashboardRuntime 1,103 -> 818; internal panel owner 328;
combined 1,146 (+43, 3.9%). This is not a code-size reduction. The former runtime had
45 direct `entry` field assignment/increment sites; the new parent has zero.
Stored geometry is no longer duplicated in lifecycle state. The panel owner uses
three callbacks (activity, publication, prospective metadata admission), existing
RequestRunner and DataViewPosition. No dependency, public API or build change.

## Adversarial findings and resolution

- Same-ID replacement after reset publication could let an obsolete reload block
  the replacement. This was a regression in the initial refactor and is fixed.
- Same-owner overlapping reloads and simultaneous sibling reloads could interfere
  through dashboard-wide commit. Independent baseline probes confirmed these two
  failures already existed on main. Reload now commits only the current panel.
- Abort callbacks can synchronously start replacement work. Close now clears private
  resource pointers before cancelling/disposal, and returns the generation captured
  before callbacks. A load returns its own promise rather than rereading a pointer
  that a subscriber may have replaced. No additional lifecycle counter was added.
- If an abort callback disposes an embedding, the obsolete reload must not reserve
  metadata again. Check generation/disposal immediately after close. A tight-budget
  embedding can now be reopened after disposal.

The initial budget probe used the selected managed dashboard. Opening another
position legitimately recreates that selected runtime, so its budget failure was
not reliable leak evidence. The final probe isolates a non-selected embedding.
Removing the post-close guard makes the final probe fail on the next embedding's
budget admission; restoring it passes.

## Validation evidence

- Baseline runtime/recovery/resources/embedding tests: 44 passed.
- Four same-ID replacement cases cover instance/definition loading, ignored abort,
  late success/FORBIDDEN, query identity and cancellation. Removing cancellation
  made all four fail; restoring it passes.
- Seven reload cases cover reset/loading observers, overlapping reloads, sibling
  isolation, abort-observer deduplication and post-disposal budget reuse. All seven
  passed after fixes; individual failures were reproduced before their fixes.
- Existing applied-versus-draft, exact retained reference, FORBIDDEN cleanup,
  position-opening reentry, metadata/result budgets, saved identity transfer and
  independent embedding tests remain the behavioral acceptance surface.
- Final affected dependency/package build and root `pnpm test:unit` passed using
  `VITEST_MAX_WORKERS=2 npm_config_workspace_concurrency=1`. View-engine source and
  compiled modes each passed 1,672 tests with 3 existing skips; type checks passed.
  Coverage: statements 95.60%, branches 91.56%, functions 97.23%, lines 97.48%.
- `pnpm lint:view-engine` passed, including shared stories; scoped formatting and
  `git diff --check` passed. The final Chrome-channel Storybook run passed all 381
  interactions (94 files passed, 2 skipped). The default Playwright launch initially
  lacked its downloaded browser; the existing `VIEW_ENGINE_BROWSER_CHANNEL=chrome`
  option used installed Chrome without changing repository configuration.
- Independent read-only review: all findings resolved; ready to merge subject to
  the full checks and CI. The reviewer did not mutate the checkout.

## Delivery gate

Local build, unit/compiled/coverage/type, lint/format, browser checks and independent
review are complete. The PR must pass all remote checks and have no unresolved
review findings before squash merge. The PR remains the authoritative record for
subsequent CI and merge status.
