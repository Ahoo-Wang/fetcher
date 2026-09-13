# EmbeddedView Implementation Plan

**Goal:** Deliver a unified embedded presentation for saved dashboard, record and analysis views, including dashboard homepages, while improving existing ownership and presentation boundaries.

**Architecture:** Extend existing independent runtime positions to dashboard instances. Keep dashboard child references restricted to record/analysis. EmbeddedView receives the existing engine binding and a saved instanceId; it creates and owns an independent position from that instance's saved baseline. It never selects the engine's managed instance or owns/disposes the engine. Each mount has independent filters, results and disposal. For homepage-only hosts supply an instance list with defaultInstanceId:null to avoid starting a workbench selection. No additional query engine or persistence schema.

**Confirmed contracts:** Hide navigation/management/create/save/layout editing. Retain browsing filters, query/refresh, pagination, sorting and visualization inspection. Browse positions never become persistable drafts, even for administrators. Optional open-full-view callback receives saved instance/definition identity. Disposed/changed inputs cannot publish late results.

## 1. Runtime ownership

- Extend ViewEngine.openPosition to return a discriminated record/analysis/dashboard handle; preserve useful data-specific inference with overloads/types.
- Reuse SessionStore.openPosition and DashboardRuntime. Dashboard runtime uses position-scoped definitions, explicit non-editable browsing ownership and independent budgets.
- Position dirty state stays false; existing save/management boundaries continue rejecting positions. Managed instances remain unchanged.
- Verify same-instance dual embeddings, navigation independence, nested-dashboard rejection, disposal, reference errors and delayed reads.

## 2. Presentation cohesion

- Add EmbeddedView with engine binding, saved instanceId, extensions/filterContext and optional open-full-view action. Own positions through mount lifecycle with StrictMode and input-change cleanup.
- Extract shared data-result presentation from DashboardPanelContent; panel shell owns reference/binding errors and metadata; result presentation owns query state/errors/retry. Reuse RecordContent and AnalysisResult.
- Reuse FilterPanel for record/analysis browsing; DashboardView uses runtime-owned editability, without misleading workbench guidance in browsing mode.
- Render loading/missing target/error recovery explicitly, without stale content flashing after scope changes.

## 3. Public examples and verification

- Export the unified embedded component and document lifecycle/permissions/browsing semantics in package README, skill API and bilingual wiki. Add homepage, record and analysis Storybook examples and interactions.
- Independent architecture review; focused behavioral tests, package build/lint/types, full serial pnpm test:unit before commit, browser interactions, package consumer/production validation and docs gates.
- Commit/push to existing PR1455 and update its description. No merge.
