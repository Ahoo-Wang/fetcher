# Dashboard panel lifecycle ownership

## Approved scope

The user approved concentrating panel reference loading, cancellation, replacement,
position ownership and disposal behind an internal boundary. DashboardRuntime keeps
configuration drafts, applied filters and dashboard-wide coordination. No new
dependency, build change, compatibility layer or generic state-machine framework.

## Decision

Introduce one internal DashboardPanelRuntime per data panel. Its immutable identity
is the panel ID and referenced instance ID; geometry remains solely in DashboardConfig.
Replacing either identity retires the old owner. Layout-only changes retain it.

The panel owner privately holds loaded reference metadata, the retained instance,
source resolver, position, request generation, scope and status. DashboardRuntime
reads an immutable panel snapshot and metadata byte count, and invokes load,
applyScope, refresh, block, reloadReference, suspend and dispose. It never writes
panel lifecycle fields. Loaded instance/definition metadata is published together.

Keep the existing RequestRunner and DataViewPosition. The runtime lends its shared
loader to panels and retains candidate search. Small callbacks report publication,
dashboard activity and prospective metadata admission; they do not expose parent
configuration or mutable state. The existing store owns aggregate budgets and
dashboard-position registration. The dashboard identity is supplied when a position
is scoped, so saving a new draft does not freeze the old identity into a panel.

Scope compilation stays in DashboardRuntime and existing dashboardFilters functions.
All panel scope decisions are computed before committing them. Query execution starts
after scope publication, using the existing applied snapshot rather than editor drafts.
A reference reload scopes only its own panel after the owner confirms that its private
generation still matches; it cannot block a sibling that is still loading. Reset callbacks
may reenter, so invalidation is captured before position release and notification.
Generation advances only on resource invalidation, not on each deduplicated load.

## Invariants

- Retiring an owner invalidates its requests before releasing its position. Late
  success or FORBIDDEN from an old owner cannot affect a replacement with the same ID.
- Suspending retains the admitted instance configuration but releases its live
  definition, resolver and position. Resuming reauthorizes before displaying data.
- FORBIDDEN removes retained metadata and live position data; transient errors retain
  recoverable metadata. Explicit reference reload clears retained data before loading.
- Budget admission precedes metadata publication. Cleared metadata frees budget even
  if a subsequent load fails. Sibling panels and embeddings retain their allocations.
- Observer callbacks can synchronously suspend, replace or dispose panels during
  position creation or scope updates. Recheck ownership after those calls; dispose
  positions that were opened after their owner became obsolete.
- Refresh uses applied filters; saving, geometry and content edits do not trigger
  unscoped queries or reset unaffected panel positions.

## Acceptance

Run existing dashboard lifetime, resources, runtime, persistence and embedding tests.
Add a same-panel-ID replacement probe at both instance and definition load boundaries,
including ignored abort and obsolete authorization failure. Exercise runtime behavior,
not private property names. Compare old and new behavior before accepting the refactor.

Review that DashboardRuntime no longer mutates panel state and that the new module
owns real transitions rather than forwarding writes. Record combined production code
size; more files or a smaller original file alone are not success. Reject additional
mirrored activity flags, controller registries and generic extension points.

Before commit: affected build, root pnpm test:unit, lint/format checks and independent
review. Deliver one PR; await all CI and review results, squash merge, then sync main.
The package remains version 5.0.0, Node >=20.20.2 and pnpm 10.34.5. No dependency or
public API change is planned; update public documentation if that scope changes.
