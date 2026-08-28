# Fetcher Storybook Scenario Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Overview, HTTP & Streaming, and React Hooks read as deterministic developer scenarios while leaving every Viewer story unchanged.

**Architecture:** A Storybook preview decorator looks up component-level scenario metadata by the existing story title and wraps only HTTP/React stories in one shared scene frame. Overview becomes a linked scenario catalog, while manager branding reuses the existing Fetcher logo. Existing story IDs and package behavior stay unchanged.

**Tech Stack:** Storybook 10, React 19, TypeScript, CSS, Vitest browser stories.

**Spec:** `docs/superpowers/specs/2026-08-28-storybook-scenario-lab-design.md`

## Global Constraints

- Do not modify any `Viewer/*` story content, frame, component styling, or behavior.
- Preserve existing story IDs, routes, deterministic fixtures, and public package imports.
- Use only existing dependencies and the current blue/violet palette.
- Keep all Storybook tests keyboard-accessible and leave `scenario` fixed by each exported story.
- Do not commit, push, or create a PR without a later explicit user request.

---

### Task 1: Shared HTTP/React Scenario Frame

**Files:**

- Modify: `.storybook/preview.tsx`
- Modify: `.storybook/preview.css`
- Test: `stories/http/EventBus.stories.tsx`
- Modify: `stories/http/EventStream.stories.tsx`
- Modify: `stories/http/Fetcher.stories.tsx`
- Modify: `stories/http/OpenAIStream.stories.tsx`
- Modify: `stories/http/Storage.stories.tsx`
- Test: `stories/react/AsyncState.stories.tsx`
- Modify: `stories/react/FetcherHooks.stories.tsx`
- Modify: `stories/react/WowQueryHooks.stories.tsx`
- Test: `stories/viewer/FetcherViewer.stories.tsx`

**Interfaces:**

- Consumes: Storybook decorator `context.title`, `context.name`, and `context.parameters.layout`.
- Produces: `.story-scene` markup for titles under `HTTP & Streaming/` and `React Hooks/`; Viewer receives the unwrapped `Story`.

- [ ] **Step 1: Add failing scene-structure assertions**

In Event Bus and Async State play helpers, assert that the decorated canvas contains:

```ts
await expect(canvas.getByText('Setup')).toBeVisible();
await expect(canvas.getByText('Action')).toBeVisible();
await expect(canvas.getByText('Observe')).toBeVisible();
```

In `FetcherViewer` Remote Success, assert the exclusion:

```ts
expect(canvas.queryByText('Setup')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run Storybook tests and verify RED**

Run:

```bash
pnpm test:storybook
```

Expected: HTTP/React scene labels are missing; existing behavior assertions still run.

- [ ] **Step 3: Add title-keyed scene metadata and decorator markup**

In `.storybook/preview.tsx`, define metadata for the five HTTP and three React titles:

```ts
interface SceneDefinition {
  domain: string;
  summary: string;
  fixture: string;
  setup: string;
  observe: string;
}
```

Wrap only matching titles with semantic markup containing the current
`context.name`, then render `<Story />` inside `.story-scene__stage`. Return the
plain Story for Overview and Viewer.

- [ ] **Step 4: Hide the internal HTTP/React scenario Controls**

In the five HTTP and three React meta objects, replace the unusable radio
Control without touching Viewer:

```ts
argTypes: {
  scenario: {
    table: {
      disable: true;
    }
  }
}
```

- [ ] **Step 5: Style the lab frame**

Extend `.storybook/preview.css` with:

- a light neutral lab surface and white stage;
- compact domain label, story heading, fixture badge;
- a three-column ordered Setup/Action/Observe contract;
- one-column responsive reflow below 720px;
- no selectors targeting `.ant-*`, Storybook manager, or Viewer internals.

- [ ] **Step 6: Run Storybook tests and verify GREEN**

Run `pnpm test:storybook` and expect 15 files / 76 tests to pass.

---

### Task 2: Scenario Catalog And Fetcher Branding

**Files:**

- Modify: `stories/Overview.stories.tsx`
- Create: `.storybook/manager.ts`

**Interfaces:**

- Consumes: the existing story routes and Storybook manager theme API.
- Produces: six task-entry links and a branded manager shell without changing story IDs.

- [ ] **Step 1: Add failing Overview assertions**

Extend the Overview play function to require the reading model and six links:

```ts
await expect(canvas.getByText('Setup')).toBeVisible();
await expect(canvas.getByText('Action')).toBeVisible();
await expect(canvas.getByText('Observe')).toBeVisible();
await expect(canvas.getAllByRole('link')).toHaveLength(7);
```

The seven links are six Storybook task entries plus the existing five-minute guide.

- [ ] **Step 2: Run the Overview story and verify RED**

Run `pnpm test:storybook` and expect the new Overview assertions to fail.

- [ ] **Step 3: Rewrite Overview as a task catalog**

Keep the existing heading, fixture provenance, and guide. Add six real `_top`
links for:

- request lifecycle → Fetcher docs;
- event delivery → Event Bus docs;
- streaming → Event Stream docs;
- async state → Async State docs;
- fetch state → React Fetcher docs;
- CQRS query state → Wow Queries docs.

Add a semantic ordered Setup/Action/Observe explanation. Do not add icons,
illustrations, or placeholder assets.

- [ ] **Step 4: Brand the manager**

In `.storybook/manager.ts`, configure the manager with
`storybook/manager-api` and `storybook/theming`:

- brand title: `Fetcher Scenario Lab`;
- brand URL: Overview docs;
- existing blue/violet palette and dark manager base.

- [ ] **Step 5: Verify Overview and static build**

Run:

```bash
pnpm test:storybook
pnpm build-storybook
```

Expected: all interactions pass and static output contains the branded manager asset.

---

### Task 3: Visual QA And Repository Gates

**Files:**

- Verify only: Overview, Event Bus, Async State, FetcherViewer.

**Interfaces:**

- Consumes: completed scenario frame, catalog, and manager theme.
- Produces: same-viewport visual proof and a clean uncommitted branch for review.

- [ ] **Step 1: Capture the four routes at the audit viewport**

Capture Overview, Event Bus, Async State, and FetcherViewer in the in-app
browser. Confirm:

- Overview reads as a scenario catalog;
- HTTP and React show the scenario contract before controls/output;
- FetcherViewer is visually unchanged and has no scenario frame;
- no content is cropped and narrow reflow remains readable.

- [ ] **Step 2: Run complete repository gates**

```bash
pnpm build
pnpm test:unit
pnpm lint
pnpm test:storybook
pnpm build-storybook
git diff --check
```

Existing repository warnings may remain; all commands must exit 0.

- [ ] **Step 3: Independent scope review**

Review the uncommitted diff for scene clarity, accessibility, route stability,
and the Viewer exclusion. Fix every Critical/Important finding, rerun affected
gates, and leave the changes uncommitted for user review.
