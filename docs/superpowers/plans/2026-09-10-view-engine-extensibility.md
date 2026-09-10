# View Engine Extensibility Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task by task. Commit, push and publication require explicit user authorization.

**Goal:** Deliver composable record regions and importable, scoped themes including user CSS.
**Architecture:** Keep the current engine and Base UI/shadcn components. Share pagination policy between default and custom rendering. Use CSS variables for themes and extend the existing Portal snapshot lifecycle.
**Tech Stack:** TypeScript, React 19, Base UI, Tailwind 4, Vitest, Playwright.
**Spec:** ../specs/2026-09-10-view-engine-extensibility-design.md

## Global Constraints

- Work in the existing isolated worktree; preserve default behavior and public contracts.
- No new dependencies or root tsconfig changes. Commit, push and publication require explicit user authorization.
- Theme CSS build output and package exports are necessary parts of the approved theme delivery.
- Node >=20.20.2; pnpm 10.34.5; package 5.0.0. CSS has fve prefixes.

## Task 1: Record regions

Files: record/recordReactTypes.ts, RecordView.tsx, ViewPage.tsx, page/RecordPagination.tsx, new page/recordPaginationPolicy.ts, new RecordRegion.tsx; test/recordRegions.test.tsx.

- [x] Test ViewPage forwarding, preservation of custom component state, bound callbacks, loading/end/cursor pagination policy and async failure.
- [x] Run `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/recordRegions.test.tsx` before implementation; assert rendered custom controls are absent under old behavior.
- [x] Add `renderTableToolbar` and `renderPagination` props; context includes defaultContent, readonly definition/session and bound region operations. Execute callbacks under RecordRendererBoundary descendant.
- [x] Derive `canNext`, `canPrevious`, `canChangePageSize` once; callbacks re-read engine snapshots before invoking existing methods.
- [x] Repeat focused tests and type check. Document exact exported interfaces for Task 3.

## Task 2: Theme CSS, wrapper and Portal

Files: src/styles.css, src/themes/*.css, src/theme/ViewTheme.tsx, src/lib/usePortalTheme.ts, src/react.ts, package.json, vite.config.ts, test/viewTheme.test.tsx, test/portalTheme.test.tsx, scripts/verify-themes.mjs.

- [x] Write wrapper and Portal attribute/system-change tests, observe missing API/synchronization failures.
- [x] Write browser assertions for blue vs neutral computed colors, custom scoped overrides, nested radius=0, import order and open Portal changes; run baseline expecting missing themes.
- [x] Add ViewTheme with `theme?: string`, appearance light/dark/system, density comfortable/compact, typed CSS custom properties. CSS remains independently usable.
- [x] Add scoped neutral/blue/violet/green/orange and shadcn CSS exports. Preserve defaults; map semantic font, radius and density tokens to actual consumers.
- [x] Observe theme/density attributes and media changes while open; snapshot effective variables without leaking runtime Tailwind values.
- [x] Verify themes from build and tarball in independent consumer, and run focused tests/type check.

## Task 3: Public recipes and integration verification

Files: README.md, README.zh-CN.md, skills/fetcher-view-engine/references/api.md, wiki/guides/view-engine/extensions.md and zh counterpart, examples/react/ThemesExample.tsx, stories/view-engine/Themes.stories.tsx.

- [x] Add copyable built-in/user/shadcn imports plus a stateful region example using published APIs. Explain import vs selection, partial overrides, lifecycle and Portal boundaries.
- [x] Run affected package build/tests, lint, browser/theme verifier, wiki validation. Use tarball checks to validate CSS export completeness and production imports.
- [x] Review implementation against spec, address concrete findings, and record actual command results. No claim of checks not run.

## Verification evidence

- Package build and test succeeded: 116 files, 920 tests in both normal and React Compiler modes; typecheck and ESLint passed.
- Focused final regressions: 16 tests passed; original Storybook layout interactions: 5 passed in Chrome.
- Built CSS: five primary text pairs per light/dark meet 4.5:1; focus palette pairs meet 3:1. These checks do not claim every arbitrary user color is accessible.
- Independent directory installed nine local package tarballs (overrides prevent mixing registry builds), built production examples without Tailwind, and passed live theme/Portal/state retention checks.
- Wiki documentation tests: 10 passed; bilingual VitePress build passed after correcting external source links.
- Font-size token intentionally supports px/rem, not em/%; other dimensions support em. No commit or publication performed.
