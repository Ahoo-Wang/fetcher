# Analysis state quality implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent query-policy work and focused review; apply shared-state changes sequentially. Track completion below.

**Goal:** Make editing lifecycle, final validation and query intent explicit owners rather than scattered conditions.
**Architecture:** Session derivation owns published invariants, including resource validation. Commands own query intent and execution; UI binds commands and editor lifecycle. Internal updates preserve record/analysis type discrimination.
**Tech Stack:** Existing TypeScript, React, Vitest, Storybook; no new dependencies.
**Spec:** `docs/superpowers/reviews/2026-09-11-analysis-architecture-quality.md`, confirmed by user.

## Global constraints

Existing linked worktree `feat/view-engine-analysis`, PR 1444. No compatibility shim for unreleased view-engine. Preserve 75/150ms CI budgets, coverage requirements, abort/stale-result guarantees and saved-vs-executed separation. Run full pnpm test:unit before commits. Update API reference and bilingual docs for public changes. Do not merge.

## Tasks

- [x] 1. Central query policy: add pure `analysisQueryPolicy(session, intent)` for manual/open/reload/auto decisions. Add `AnalysisCommands.refresh(id)` and wire public `analysis(id).refresh()`; move automatic-refresh query equality/qualification out of AnalysisView. Preserve manual execution of valid drafts and reject invalid editor input; open/reload/auto never execute unresolved conflicts. `AnalysisSession.queryValid` is a derived boolean supplied by Task 2. Test all intents against dirty query, presentation-only edits, invalid editor, conflict, same in-flight query, cancelled first run and evicted results. Run focused analysis engine tests and policy tests.
- [x] 2. Single finalization path: derive all session fields and validation at publication for both sessions and pendingCreates. Move config-size handling from Store into session validation, preserve reference caching without depending on old flat error arrays. Add `queryValid` to AnalysisSession; compilation/size/editor validity determine it, while presentation issues only block save. `patch` only merges inputs and publication derives once. Test size limit changes, pending creates, invalidity round trips and one compile per edit. Keep final write/run trust-boundary revalidation.
- [x] 3. Explicit editor lifecycle: add readonly `editorEpoch` to both session kinds; remote adoption uses a shared pure reset transition to advance epoch and reset buffers, rather than preserving a stale boolean. Ordinary reload and restore retain their existing non-destructive semantics. Bind editor validity callbacks to the epoch; obsolete cleanup callbacks cannot overwrite the new editor state. Key only editor subtrees by epoch and retain other UI state. Test remote title-only adoption with invalid buffered inputs, stale callback rejection/ignore, and ordinary reload/restore preservation in both record and analysis.
- [x] 4. Typed internal updates: replace the merged Partial intersection with common-only patch plus discriminated record/analysis patches; update callers to identify their session kind. Reject mismatched kinds in the shared boundary. Extend existing compiled type-contract fixture with invalid cross-kind result/config updates. Do not add a generic state-machine framework.
- [x] 5. Validate and document: focused regressions, full package source/Compiler/type tests, architecture import tests, all Storybook interactions, production browser budgets, docs generation/build, lint and PR formatting. Request independent review of actual diff, fix verified findings, push to existing PR and reply to connector feedback. Record which architectural risks remain instead of claiming no further issues.

## Rulings

- Explicit user confirmation authorizes the audited refactor; no repeated design approval is needed.
- Remote adoption discards local editor buffers via a new lifecycle; reload/restore preserve buffers as previously documented. This makes the product intent explicit without silently changing restore semantics.
- Query policy can be implemented independently from shared session work. Agent owns query policy, AnalysisCommands and ViewQueries; controller owns Store/session transitions/ViewEngine/React wiring to avoid concurrent edits.
- Existing regression suite supplies the green baseline for behavior-preserving extraction; new lifecycle and type guarantees require failing regressions before implementation.
