# Analysis charts and Wow API Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development and task reviews. Independent source domains may run in parallel with explicit ownership. Do not commit, push, deploy or run compensation writes.

**Goal:** Deliver semantic, accessible analysis charts and a real Wow compensation dev API integration.

**Architecture:** Existing shared ViewEngine; pure query compiler and result projection; React shadcn/Recharts presentation; host-owned Wow source and Schema integration.

**Tech Stack:** Existing TypeScript/React/Base UI stack, approved Recharts dependency through the workspace catalog.

**Spec:** `docs/superpowers/specs/2026-09-11-analysis-charts-and-wow-api-design.md`.

## Global Constraints

- Work in the existing isolated 7646 worktree and preserve all prior uncommitted changes.
- No new chart engine or query execution facade. No public API compatibility shims.
- Recharts and shadcn Chart source are authorized; preserve build configuration unless required for this integration.
- Unit/schema aliases and chart series must represent executed query data, never working draft data.
- Service metadata and queries are read-only. No retry/recovery/configuration/deployment mutations in linyi-k8s.

## Task 1 — Query model completeness

Files: analysisModel, analysisCompiler, analysisResult plus focused tests under packages/view-engine. Extend authorized Elements scopes, raw expression editing contract, scalar ANY and result semantic metadata. Preserve existing query limits and error classification. Test invalid scope/fields, expression depth/size, representative values and metadata. Coordinate new types before other owners consume them.

- [x] Write failing contract cases.
- [x] Extend model/compiler/result handling with independently validated presentation.
- [x] Run focused tests/type checks and review changes.

## Task 2 — Pure visualization and chart renderer

Files: new analysisPresentation.ts, analysisProjection.ts, AnalysisChart.tsx and components/ui/chart.tsx plus tests. Presentation shape uses layout (table/metric/bar/line/area/pie), columns, optional x/series/metrics aliases, orientation, stacked and donut. Pure projection returns renderable data/schema or actionable issues. Use explicit units/aggregation metadata from Task 1. No API calls in chart code.

- [x] Test projection semantics before rendering.
- [x] Implement bounded projection and Recharts/shadcn rendering, tooltip/legend and accessible data alternative.
- [x] Verify scoped styles, theme, lifecycle and rendering tests.

## Task 3 — Real Wow source and compensation scenarios

Files: dedicated Wow Schema/source integration and compensation example/HTTP tests; generic definitions accept model metadata and labels rather than embedding dev routes into core. Use the discovered dev endpoints, cache only Schema for this run, preserve cancellation and auth boundaries. Provide realistic offline scenarios and an explicitly configured live example.

- [x] Test Schema adaptation and client transport against HTTP fixtures.
- [x] Implement source/example using existing clients.
- [x] Verify bounded live dev queries and retain sanitized evidence.

## Task 4 — Analysis workspace UX

Files: AnalysisView, AnalysisEditor and small dedicated presentation/query editors as required, public react exports and stories. Root owns composition and coordinates core state updates. Keep results prominent, configuration compact, current executed scope visible and narrow-screen configuration accessible.

- [x] Test saved presentation, display changes without queries, draft/result separation and error paths.
- [x] Integrate scope/expression/ANY editors and visualization controls with current Base UI patterns.
- [x] Inspect real browser desktop/narrow/theme states and fix observed defects.

## Task 5 — Integration and delivery

- [x] Review independent task changes against the approved spec.
- [x] Build dependencies, run focused checks then full unit/compiled tests and browser interaction suite.
- [x] Verify packed NodeNext/Bundler and real dev API example; clean temporary verification resources.
- [x] Update public API reference, bilingual README/wiki and implementation validation report.

## Completion evidence — 2026-09-11

Implementation and acceptance evidence: [delivery validation](../reviews/2026-09-11-analysis-delivery-validation.md). The full production-contract audit additionally covers the original input/switch latency budgets, 10,000-row stress, real HTTP/IndexedDB host behavior, deep/light themes, keyboard tooltips, saved chart restoration and 200% CSS zoom with long titles. New Storybook chapters retain explicit stable ids and pass the repository navigation verifier. No commit, push or deployment is part of this delivery.
