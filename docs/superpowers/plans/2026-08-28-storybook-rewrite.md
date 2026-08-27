# Storybook Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the package-mirrored Storybook with a deterministic, developer-friendly catalog of interactive Fetcher behaviors and Viewer workflows.

**Architecture:** Root-level task-oriented stories replace 68 package-local stories and 16 marketing MDX pages. Stories run real Fetcher, Hook, and Viewer code while replacing only network/time boundaries with fixed local fixtures. Storybook's Vitest addon turns every story into a Chromium render test and runs `play` assertions for critical behavior.

**Tech Stack:** Storybook 10.5, React 19, Ant Design 6, Vitest 4 browser mode, Playwright Chromium, TypeScript 6

**Spec:** `docs/superpowers/specs/2026-08-28-documentation-storybook-rewrite-design.md`

## Global Constraints

- Storybook is English-only and contains interactive behavior, not a second documentation site.
- No story may access the public internet, private services, real accounts, or environment credentials.
- Fixtures use fixed IDs, timestamps, data, delays, and errors; no `Math.random()` or current time.
- Use real package implementations; replace only network, stream, and time boundaries.
- Story files are Apache-2.0 licensed TypeScript source files.
- Use Storybook Docs, Controls, Source, `play`, A11y, and Vitest; do not build custom code tabs or documentation components.
- The only dependency addition is catalog-pinned `@vitest/browser-playwright`; remove unused onboarding dependencies.
- No package public API or production source behavior changes.
- Keep one story file per coherent developer task, not per exported symbol.
- Every task ends with `pnpm build-storybook` and the relevant `pnpm test:storybook` subset.
- Commit only after `pnpm test:unit` has passed for the current checkout.

---

## File Map

**Infrastructure:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.storybook/main.ts`
- Modify: `.storybook/preview.tsx`
- Modify: `.storybook/preview.css`
- Delete: `.storybook/preview-head.html`
- Create: `.storybook/vitest.setup.ts`
- Create: `vitest.config.ts`

**New stories and fixtures:**

- Create: `stories/Overview.mdx`
- Create: `stories/fixtures/http.ts`
- Create: `stories/fixtures/viewer.ts`
- Create: `stories/http/Fetcher.stories.tsx`
- Create: `stories/http/EventStream.stories.tsx`
- Create: `stories/http/EventBus.stories.tsx`
- Create: `stories/http/Storage.stories.tsx`
- Create: `stories/http/OpenAIStream.stories.tsx`
- Create: `stories/react/AsyncState.stories.tsx`
- Create: `stories/react/FetcherHooks.stories.tsx`
- Create: `stories/react/WowQueryHooks.stories.tsx`
- Create: `stories/viewer/Inputs.stories.tsx`
- Create: `stories/viewer/Filters.stories.tsx`
- Create: `stories/viewer/Cells.stories.tsx`
- Create: `stories/viewer/ViewTable.stories.tsx`
- Create: `stories/viewer/Viewer.stories.tsx`
- Create: `stories/viewer/FetcherViewer.stories.tsx`

**Delete after replacements exist:**

- All existing `stories/*.mdx` except the new `stories/Overview.mdx`
- Existing `stories/assets/`
- All `packages/*/src/**/*.stories.tsx` and `packages/*/src/**/*.stories.ts`

### Task 1: Storybook Browser-Test Foundation

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.storybook/main.ts`
- Modify: `.storybook/preview.tsx`
- Create: `.storybook/vitest.setup.ts`
- Create: `vitest.config.ts`

**Interfaces:**

- Consumes: existing Storybook React-Vite configuration and catalog-pinned Playwright versions.
- Produces: `pnpm test:storybook` and the global `test` tag required by every later story.

- [ ] **Step 1: Add the cataloged browser provider and CI script**

Run:

```bash
pnpm add -Dw @vitest/browser-playwright@catalog:
```

Set the root script exactly to:

```json
"test:storybook": "vitest run --project=storybook"
```

- [ ] **Step 2: Create the Vitest 4 Storybook project**

Create `vitest.config.ts`:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(currentDirectory, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
```

- [ ] **Step 3: Load Storybook annotations in browser tests**

Create `.storybook/vitest.setup.ts`:

```ts
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';

const annotations = setProjectAnnotations([projectAnnotations]);
beforeAll(annotations.beforeAll);
```

- [ ] **Step 4: Simplify story discovery and global options**

In `.storybook/main.ts`, use only:

```ts
stories: [
  '../stories/**/*.mdx',
  '../stories/**/*.stories.@(ts|tsx)',
],
```

Remove `markdown-link-transform` and Markdown transclusion configuration. Keep Docs, A11y, Vitest, and Chromatic addons for now. In `.storybook/preview.tsx`, set `tags: ['autodocs', 'test']` and this exact order:

```ts
order: ['Overview', 'HTTP & Streaming', 'React Hooks', 'Viewer'];
```

- [ ] **Step 5: Verify the empty-project test foundation**

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: Storybook builds; current root MDX pages render-test without provider/config errors.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts .storybook/main.ts .storybook/preview.tsx .storybook/vitest.setup.ts
git commit -m "test: add Storybook browser project"
```

### Task 2: Overview and Deterministic Fixtures

**Files:**

- Create: `stories/Overview.mdx`
- Create: `stories/fixtures/http.ts`
- Create: `stories/fixtures/viewer.ts`
- Modify: `.storybook/preview.css`

**Interfaces:**

- Consumes: native `Request`, `Response`, `ReadableStream`, and viewer public types.
- Produces: `installFetchFixture(): () => void`, fixed HTTP payloads, fixed SSE chunks, and shared Viewer records/definitions used by Tasks 3-7.

- [ ] **Step 1: Write the developer overview**

`Overview.mdx` contains: what Storybook proves, four task groups, how to inspect Source/Controls/Interactions/A11y, a link to `/start/first-request`, and a statement that all data is local and deterministic. Do not repeat package marketing.

- [ ] **Step 2: Create fixed HTTP and stream fixtures**

Export these exact interfaces from `stories/fixtures/http.ts`:

```ts
export interface FixtureUser {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

export const fixtureUsers: readonly FixtureUser[];
export const fixtureSseChunks: readonly string[];
export function installFetchFixture(): () => void;
```

`installFetchFixture` saves `globalThis.fetch`, handles only `https://api.example.test/users`, `/users/{id}`, `/slow`, `/error`, `/events`, `/chat/completions`, and Viewer fixture endpoints, throws on every unexpected URL, and returns a cleanup function that restores the original fetch. Fixed users are `Ada` and `Lin`; the fixed timestamp is `2026-01-15T09:30:00.000Z`.

- [ ] **Step 3: Create shared Viewer fixtures**

Export fixed field definitions, filters, columns, two views, a paged data source, and a Viewer definition from `stories/fixtures/viewer.ts`. Use only exported Viewer/Wow types, never `any`. Include active rows, an empty data source, and an explicit `Error('Unable to load users')` fixture.

- [ ] **Step 4: Keep only minimal shared CSS**

Replace `.storybook/preview.css` with a readable docs width, a `.story-stack` vertical layout, a `.story-output` monospace result panel, and reduced-motion handling. Do not override Ant Design component internals.

- [ ] **Step 5: Verify and commit**

Run: `pnpm exec prettier --write stories/Overview.mdx stories/fixtures .storybook/preview.css`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: overview and fixture modules compile; no network is made during tests.

```bash
git add stories/Overview.mdx stories/fixtures .storybook/preview.css
git commit -m "docs: add deterministic Storybook foundation"
```

### Task 3: HTTP and Streaming Stories

**Files:**

- Create: `stories/http/Fetcher.stories.tsx`
- Create: `stories/http/EventStream.stories.tsx`
- Create: `stories/http/EventBus.stories.tsx`
- Create: `stories/http/Storage.stories.tsx`
- Create: `stories/http/OpenAIStream.stories.tsx`

**Interfaces:**

- Consumes: `installFetchFixture`, fixed users/SSE chunks, and public exports from fetcher, eventstream, eventbus, storage, and openai.
- Produces: `HTTP & Streaming/*` story IDs linked by Wiki recipes.

- [ ] **Step 1: Write Fetcher stories**

Provide `BasicRequest`, `PathAndQuery`, `PostJson`, `Timeout`, and `ServerError`. Each render has one action button and a visible request/result/error panel. Meta `beforeEach` installs and cleans the fetch fixture. `play` clicks the button and asserts exact URL/method/result or visible `FetcherError`/timeout text.

Use Storybook test APIs:

```ts
import { expect, userEvent, within } from 'storybook/test';

play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Send request' }));
  await expect(await canvas.findByText('Ada')).toBeVisible();
},
```

- [ ] **Step 2: Write EventStream stories**

Provide `TokenStream`, `MultilineEvent`, `DoneTermination`, `MalformedJson`, and `Cancelled`. Construct fixed `ReadableStream<Uint8Array>` data locally, run real converters/transforms, and render tokens/errors/cancelled state. `play` verifies final tokens and termination.

- [ ] **Step 3: Write EventBus and Storage stories**

EventBus provides serial order, parallel completion, and broadcast cleanup with visible ordered logs. Storage provides in-memory read/write, serialization, change notifications, and cleanup. Use fixed event IDs and no timers longer than 20 ms.

- [ ] **Step 4: Write local OpenAI streaming stories**

Provide non-streaming completion, token stream, abort, and API error against `https://api.example.test/chat/completions`. Use placeholder configuration only; never render or accept an API key control.

- [ ] **Step 5: Verify and commit**

Run: `pnpm exec prettier --write stories/http`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: all HTTP/streaming stories smoke-render and every `play` assertion passes without external requests.

```bash
git add stories/http
git commit -m "docs: rewrite HTTP and streaming stories"
```

### Task 4: React Hook Stories

**Files:**

- Create: `stories/react/AsyncState.stories.tsx`
- Create: `stories/react/FetcherHooks.stories.tsx`
- Create: `stories/react/WowQueryHooks.stories.tsx`

**Interfaces:**

- Consumes: fixed fetch fixtures and public React hooks.
- Produces: `React Hooks/*` stories covering developer-visible state transitions.

- [ ] **Step 1: Write async-core stories**

Cover idle → loading → success, rejection, retry, debounce, stale result suppression, and unmount cleanup using `useExecutePromise`, `useDebouncedExecutePromise`, `usePromiseState`, `useLatest`, and `useMounted`. Render all state fields and assert transitions in `play`.

- [ ] **Step 2: Write Fetcher hook stories**

Cover GET success, empty list, HTTP error, manual refetch, and debounced request. Install the fixture in meta `beforeEach`; show method, URL, loading, result, and error in the canvas.

- [ ] **Step 3: Write representative Wow query stories**

Cover single, list, paged, count, and streaming query with fixed Wow response envelopes. Use current array-first filters and real query clients. Consolidate shared query controls in the render wrapper; do not create one long custom documentation page.

- [ ] **Step 4: Verify and commit**

Run: `pnpm exec prettier --write stories/react`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: all hook transitions pass in Chromium and no act/unhandled-promise warnings remain.

```bash
git add stories/react
git commit -m "docs: rewrite React hook stories"
```

### Task 5: Viewer Inputs and Filters

**Files:**

- Create: `stories/viewer/Inputs.stories.tsx`
- Create: `stories/viewer/Filters.stories.tsx`

**Interfaces:**

- Consumes: fixed options/filter definitions and public Viewer input/filter components.
- Produces: `Viewer/Inputs/*` and `Viewer/Filters/*` interactions.

- [ ] **Step 1: Write input gallery stories**

Cover `NumberRange`, `TagInput`, `RemoteSelect`, and `Fullscreen` in Default, Disabled, Validation, Loading, Empty, and Error states where applicable. Use component public labels so A11y queries find every control. `RemoteSelect` uses the local fixture and fixed debounce.

- [ ] **Step 2: Write filter workflow stories**

Cover typed text/number/select/bool/datetime filters, adding an available filter, editing an operator/value, removing a filter, clearing all filters, and modal selection. Display the resulting `FilterExpression` JSON as visible output and assert exact updates.

- [ ] **Step 3: Verify and commit**

Run: `pnpm exec prettier --write stories/viewer/Inputs.stories.tsx stories/viewer/Filters.stories.tsx`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: keyboard/click interactions and A11y checks pass.

```bash
git add stories/viewer/Inputs.stories.tsx stories/viewer/Filters.stories.tsx
git commit -m "docs: rewrite Viewer input and filter stories"
```

### Task 6: Viewer Table Stories

**Files:**

- Create: `stories/viewer/Cells.stories.tsx`
- Create: `stories/viewer/ViewTable.stories.tsx`

**Interfaces:**

- Consumes: fixed Viewer records, columns, and public cell/table components.
- Produces: `Viewer/Tables/*` visual and interaction coverage.

- [ ] **Step 1: Build a cell gallery**

Render text, primary key, link, avatar, image, image group, tag/tags, currency, date/time, calendar time, action, and fallback behavior in one deterministic table. Include null, long text, invalid URL/image, zero currency, and timezone-stable ISO timestamps. Test link/action activation and accessible names; do not enumerate cosmetic size combinations.

- [ ] **Step 2: Build ViewTable workflows**

Cover default table, loading, empty, error presentation, sorting, pagination, row selection, column settings, action column, and dense/comfortable row height. `play` asserts selected keys, page callback data, sorted field, and settings changes.

- [ ] **Step 3: Verify and commit**

Run: `pnpm exec prettier --write stories/viewer/Cells.stories.tsx stories/viewer/ViewTable.stories.tsx`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: deterministic cells render and table interactions pass.

```bash
git add stories/viewer/Cells.stories.tsx stories/viewer/ViewTable.stories.tsx
git commit -m "docs: rewrite Viewer table stories"
```

### Task 7: Complete Viewer Flows

**Files:**

- Create: `stories/viewer/Viewer.stories.tsx`
- Create: `stories/viewer/FetcherViewer.stories.tsx`

**Interfaces:**

- Consumes: all Viewer fixtures, local fetch fixture, and public `Viewer`/`FetcherViewer` refs and callbacks.
- Produces: complete user flows that replace the old private-environment FetcherViewer story.

- [ ] **Step 1: Write in-memory Viewer flows**

Provide browse/filter/sort/page, switch view, save personal view, edit view, delete view, batch action, and refresh scenarios. Use Storybook `fn()` callbacks and visible state output. Critical `play` flows assert the final view/query/selected keys.

- [ ] **Step 2: Write FetcherViewer flows against local endpoints**

Use only `https://api.example.test` fixture endpoints. Cover definition loading, view loading, data loading, empty/error/retry, pagination, selection, and ref methods (`refreshData`, `clearSelectedRowKeys`, `getPageQuery`, `getActiveView`, `getViewerDefinition`). No interceptor may insert tenant, owner, authorization, or real host data.

- [ ] **Step 3: Verify and commit**

Run: `pnpm exec prettier --write stories/viewer/Viewer.stories.tsx stories/viewer/FetcherViewer.stories.tsx`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Expected: complete flows pass with local fixtures and no console/network errors.

```bash
git add stories/viewer/Viewer.stories.tsx stories/viewer/FetcherViewer.stories.tsx
git commit -m "docs: rewrite complete Viewer flows"
```

### Task 8: Delete Legacy Stories and Run the Full Storybook Gate

**Files:**

- Delete: old root MDX files and `stories/assets/`
- Delete: all package-local `*.stories.ts` and `*.stories.tsx`
- Modify: `.storybook/main.ts`
- Modify: `.storybook/preview.tsx`
- Delete: `.storybook/preview-head.html`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Consumes: all new root-level stories.
- Produces: final task-oriented Storybook with no credentials, external network, marketing pages, or unused addons.

- [ ] **Step 1: Delete replaced content**

Remove all files listed under “Delete after replacements exist.” Preserve only the new `Overview.mdx`, `fixtures`, `http`, `react`, and `viewer` trees.

- [ ] **Step 2: Remove unused onboarding and analytics**

Run:

```bash
pnpm remove -Dw @storybook/addon-onboarding
```

Remove the onboarding addon from `.storybook/main.ts`. Delete `preview-head.html` so Storybook no longer injects Google Analytics; product analytics requires a separate explicit decision outside this rewrite.

- [ ] **Step 3: Prove no external network or credential markers remain**

Run:

```bash
rg -l "fetch\\(['\"]https?://(?!api\\.example\\.test)" stories .storybook --glob '*.ts' --glob '*.tsx' --pcre2
rg -l '(Bearer [A-Za-z0-9._-]{20,}|Authorization\s*[:=]|linyikj\.com|Math\.random\(|Date\.now\()' stories .storybook --glob '*.ts' --glob '*.tsx' --glob '*.mdx'
```

Expected: neither command prints file paths. Public Wiki links are allowed in MDX and descriptions because they are navigation, not runtime requests.

- [ ] **Step 4: Run final format, build, browser, unit, and diff checks**

Run: `pnpm exec prettier --write stories .storybook vitest.config.ts package.json`

Run: `pnpm build-storybook`

Run: `pnpm test:storybook`

Run: `pnpm test:unit`

Run: `git diff --check`

Expected: all commands exit 0; Storybook reports no missing story glob, live-network, or credential warnings. Existing docgen TypeScript-project and bundle-size warnings may remain and are not failures.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts .storybook stories packages
git commit -m "docs: complete Storybook rewrite"
```
