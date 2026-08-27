# Developer Documentation Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all public Fetcher README and bilingual Wiki content with a developer-first, task-oriented documentation system.

**Architecture:** Wiki is the canonical source for learning, recipes, and reference. README files become short package entry points that link into the Wiki. New pages are added before old pages are deleted so every intermediate commit remains buildable and navigable.

**Tech Stack:** Markdown, VitePress 1.6, Mermaid, TypeScript examples, Prettier 3

**Spec:** `docs/superpowers/specs/2026-08-28-documentation-storybook-rewrite-design.md`

## Global Constraints

- TypeScript developers are the primary audience; show copyable results before explaining internals.
- English Wiki pages live at the root; Chinese pages mirror them under `wiki/zh/` with identical structure and code.
- Every Wiki page has `title` and `description` frontmatter.
- API names, signatures, defaults, return types, and failure behavior must be checked against `packages/*/src/index.ts`, implementation, and tests.
- No public API, runtime behavior, version, skill, `AGENTS.md`, `CLAUDE.md`, license, or generated Wiki artifact changes.
- No redirects or compatibility pages for deleted Wiki paths.
- No new documentation tooling or dependencies.
- Mermaid uses the existing dark palette, `autonumber`, and `<br>` syntax.
- Do not mechanically format the historical Wiki baseline; format only files changed by this plan.
- Commit only after `pnpm test:unit` has passed for the current checkout.

---

## File Map

**Canonical Wiki sections to create:**

- `wiki/start/{index,installation,first-request,choose-packages}.md`
- `wiki/learn/{request-lifecycle,requests-and-results,interceptors-errors-timeouts,streaming,react-data-flow}.md`
- `wiki/recipes/{declarative-services,openapi-client,openai-streaming,wow-cqrs,cosec-authentication,state-and-events,data-viewer}.md`
- `wiki/reference/{index,fetcher,decorator,eventbus,eventstream,openai,openapi,generator,react,storage,cosec,wow,viewer}.md`
- `wiki/contributing/{index,development,testing,documentation}.md`
- Exact mirrors of every file above under `wiki/zh/`

**Entry points to rewrite:**

- `README.md`, `README.zh-CN.md`
- `packages/{fetcher,decorator,eventbus,eventstream,openai,openapi,generator,react,storage,cosec,wow,viewer}/README.md`
- Matching `README.zh-CN.md` files for all 12 packages
- `integration-test/README.md`, `integration-test/README.zh-CN.md`
- `.github/workflows/README.md`

**Navigation to modify:**

- `wiki/.vitepress/config/en.ts`
- `wiki/.vitepress/config/zh.ts`

**Legacy Wiki sections to delete only in Task 9:**

- `wiki/{guide,architecture,api,packages,testing,onboarding}/`
- `wiki/zh/{guide,architecture,api,packages,testing,onboarding}/`

### Task 1: New Wiki Navigation and Start Path

**Files:**

- Modify: `wiki/.vitepress/config/en.ts`
- Modify: `wiki/.vitepress/config/zh.ts`
- Modify: `wiki/index.md`
- Modify: `wiki/zh/index.md`
- Create: `wiki/start/index.md`
- Create: `wiki/start/installation.md`
- Create: `wiki/start/first-request.md`
- Create: `wiki/start/choose-packages.md`
- Create: `wiki/zh/start/index.md`
- Create: `wiki/zh/start/installation.md`
- Create: `wiki/zh/start/first-request.md`
- Create: `wiki/zh/start/choose-packages.md`

**Interfaces:**

- Consumes: VitePress locale config and the real `Fetcher`, `FetcherOptions`, `RequestInit`, and `ResultExtractors` APIs.
- Produces: Stable new top-level paths used by every later README and Wiki task.

- [ ] **Step 1: Add the new Start entry without breaking unfinished sections**

Insert `{ text: 'Start', link: '/start/' }` as the first English nav item and `{ text: '开始', link: '/zh/start/' }` as the first Chinese nav item. Add complete `/start/` and `/zh/start/` sidebars. Keep the existing Guide, Architecture, Packages, API, Onboarding, More, social, footer, edit-link, and locale entries until Task 7, when every replacement page exists.

- [ ] **Step 2: Rewrite both homepages for developer decision-making**

Use VitePress home layout. The hero has one value proposition, one `Get started`/`开始使用` action to `first-request`, one `Choose packages`/`选择包` action, and one Storybook action. Feature cards explain typed requests, interceptors, streaming, OpenAPI generation, React, and Wow integration without size or performance claims.

- [ ] **Step 3: Write the four Start pages in English and Chinese**

Use this page contract for each language:

```markdown
---
title: First Request
description: Install Fetcher and make a typed HTTP request in five minutes.
---

# First Request

## Prerequisites

## Install

## Create a client

## Send a request

## Read the result

## Handle a failed response

## Next steps
```

`first-request` uses `new Fetcher({ baseURL })`, `fetcher.get('/users/{id}', { urlParams: { path: { id } } })`, `await response.json()`, and a caught `FetcherError`. `choose-packages` maps user jobs to all 12 packages and states when the core package alone is sufficient.

- [ ] **Step 4: Format and build the Wiki**

Run: `pnpm exec prettier --write wiki/index.md wiki/zh/index.md wiki/start wiki/zh/start wiki/.vitepress/config/en.ts wiki/.vitepress/config/zh.ts`

Run: `pnpm --dir wiki build`

Expected: build succeeds; every Start navigation target resolves and all retained legacy targets still exist.

- [ ] **Step 5: Commit**

```bash
git add wiki/index.md wiki/zh/index.md wiki/start wiki/zh/start wiki/.vitepress/config/en.ts wiki/.vitepress/config/zh.ts
git commit -m "docs: add developer-first getting started path"
```

### Task 2: Learning Path

**Files:**

- Create: `wiki/learn/request-lifecycle.md`
- Create: `wiki/learn/requests-and-results.md`
- Create: `wiki/learn/interceptors-errors-timeouts.md`
- Create: `wiki/learn/streaming.md`
- Create: `wiki/learn/react-data-flow.md`
- Create: matching five files under `wiki/zh/learn/`

**Interfaces:**

- Consumes: `packages/fetcher/src`, `packages/eventstream/src`, `packages/react/src`, and their tests.
- Produces: Concept pages linked by recipes and package reference pages.

- [ ] **Step 1: Write request lifecycle and request/result pages**

`request-lifecycle` traces `Fetcher.request` → `resolveExchange` → interceptor manager → native `fetch` → result extractor. `requests-and-results` covers base URL, URI-template path values, query values, headers, JSON bodies, `Response`, and custom result extractors. Use one Mermaid sequence diagram with source links.

- [ ] **Step 2: Write interceptors, errors, and timeouts**

Document the real default interceptor order, `validateStatus`, `FetcherError`, request-level versus client-level timeout, abort behavior, and the shortest debugging path. Show the exact error type and the observable response/status fields available to callers.

- [ ] **Step 3: Write streaming and React data-flow pages**

`streaming` explains SSE framing, `Response` extension side effects, async iteration, JSON conversion, `[DONE]` termination, cancellation, and malformed events. `react-data-flow` explains execute functions, loading/result/error state, request identity, debounce, unmount behavior, and when not to use the hooks.

- [ ] **Step 4: Write full Chinese equivalents**

Keep identical headings, examples, diagrams, and source links. Translate intent naturally while preserving API identifiers and error names.

- [ ] **Step 5: Validate and commit**

Run: `pnpm exec prettier --write wiki/learn wiki/zh/learn`

Run: `pnpm --dir wiki fix:mermaid`

Run: `pnpm --dir wiki build`

Expected: Mermaid and links build successfully.

```bash
git add wiki/learn wiki/zh/learn
git commit -m "docs: rewrite Fetcher learning path"
```

### Task 3: Core Developer Recipes

**Files:**

- Create: `wiki/recipes/declarative-services.md`
- Create: `wiki/recipes/openapi-client.md`
- Create: `wiki/recipes/state-and-events.md`
- Create: matching files under `wiki/zh/recipes/`

**Interfaces:**

- Consumes: decorator, generator, OpenAPI, eventbus, and storage entry points plus generator integration fixtures.
- Produces: Copyable end-to-end workflows referenced by package README files.

- [ ] **Step 1: Write the declarative service recipe**

Show `@api`, one HTTP method decorator, path/query/body parameter decorators, service construction, and execution. Include required TypeScript decorator settings, `reflect-metadata` initialization, expected request URL, and the error shown when metadata is missing.

- [ ] **Step 2: Write the OpenAPI generation recipe**

Use the actual CLI shape:

```bash
pnpm exec fetcher-generator generate \
  -i ./openapi.yaml \
  -o ./src/generated \
  -t ./tsconfig.json
```

Explain generated models/clients, configuration-file behavior, safe regeneration, and the benign missing default configuration warning. Link to the generator reference for Wow-specific discovery rules.

- [ ] **Step 3: Write the state-and-events recipe**

Use `KeyStorage`, `InMemoryStorage`, `SerialTypedEventBus`, `ParallelTypedEventBus`, and `BroadcastTypedEventBus` only where exported. Show a typed event, expected handler order, storage update, cleanup, and browser fallback limitations.

- [ ] **Step 4: Write Chinese equivalents and validate**

Run: `pnpm exec prettier --write wiki/recipes wiki/zh/recipes`

Run: `pnpm --dir wiki build`

Expected: all six pages and navigation links resolve.

- [ ] **Step 5: Commit**

```bash
git add wiki/recipes/declarative-services.md wiki/recipes/openapi-client.md wiki/recipes/state-and-events.md wiki/zh/recipes/declarative-services.md wiki/zh/recipes/openapi-client.md wiki/zh/recipes/state-and-events.md
git commit -m "docs: add core developer recipes"
```

### Task 4: Integration and Viewer Recipes

**Files:**

- Create: `wiki/recipes/openai-streaming.md`
- Create: `wiki/recipes/wow-cqrs.md`
- Create: `wiki/recipes/cosec-authentication.md`
- Create: `wiki/recipes/data-viewer.md`
- Create: matching four files under `wiki/zh/recipes/`

**Interfaces:**

- Consumes: openai, wow, cosec, react, and viewer public APIs and tests.
- Produces: Canonical cross-package workflows linked by Storybook and integration README files.

- [ ] **Step 1: Write OpenAI streaming and Wow CQRS recipes**

OpenAI shows client configuration with an environment-provided API key placeholder, non-streaming chat, streaming async iteration, `[DONE]`, abort, and server error behavior without real credentials. Wow shows command, single/list/paged query, `FilterExpression`, aggregation, and matching React hooks; examples must follow current 3.18 array-first filters and aggregation contracts.

- [ ] **Step 2: Write CoSec authentication**

Show interceptor registration, token storage, refresh/unauthorized behavior, space/resource attribution, and logout cleanup. Use `example.invalid`, fake tenant IDs, and environment placeholders only. Include a warning never to embed credentials in browser bundles or Storybook.

- [ ] **Step 3: Write the data-viewer recipe**

Start with an in-memory `Viewer`, then add filters, table columns, view persistence, and finally `FetcherViewer`. Show loading, empty, error, row-selection, pagination, and refresh states. Link each visual step to the new Storybook task group.

- [ ] **Step 4: Write Chinese equivalents, validate, and commit**

Run: `pnpm exec prettier --write wiki/recipes wiki/zh/recipes`

Run: `pnpm --dir wiki fix:mermaid`

Run: `pnpm --dir wiki build`

Expected: all recipes render and internal links resolve.

```bash
git add wiki/recipes wiki/zh/recipes
git commit -m "docs: add integration and viewer recipes"
```

### Task 5: Core Package Reference

**Files:**

- Create: `wiki/reference/index.md`
- Create: `wiki/reference/fetcher.md`
- Create: `wiki/reference/decorator.md`
- Create: `wiki/reference/eventbus.md`
- Create: `wiki/reference/eventstream.md`
- Create: `wiki/reference/storage.md`
- Create: matching six files under `wiki/zh/reference/`

**Interfaces:**

- Consumes: the five package `src/index.ts` files, re-exported modules, tests, and README package metadata.
- Produces: Canonical reference facts used to shorten package README files.

- [ ] **Step 1: Build an export checklist from source**

Run:

```bash
rg -n '^export ' packages/fetcher/src/index.ts packages/decorator/src/index.ts packages/eventbus/src/index.ts packages/eventstream/src/index.ts packages/storage/src/index.ts
```

For every re-exported module, identify public runtime values separately from types. Do not paste an uncurated symbol dump into the Wiki.

- [ ] **Step 2: Write the reference index and Fetcher reference**

The index maps tasks to packages and peer dependencies. Fetcher reference covers constructor options, request methods, URL parameters, bodies, result extractors, named clients, interceptors, errors, timeout, and exported constants with exact defaults.

- [ ] **Step 3: Write decorator, eventbus, eventstream, and storage references**

Each page uses: install, imports, primary API tables, lifecycle/cleanup, failure behavior, one compact example, and source/test links. Clearly mark side-effect imports and browser-only behavior.

- [ ] **Step 4: Write Chinese equivalents, validate, and commit**

Run: `pnpm exec prettier --write wiki/reference wiki/zh/reference`

Run: `pnpm --dir wiki build`

Expected: reference pages compile as Markdown and contain no symbols absent from current exports.

```bash
git add wiki/reference wiki/zh/reference
git commit -m "docs: add core package reference"
```

### Task 6: Integration Package Reference

**Files:**

- Create: `wiki/reference/openai.md`
- Create: `wiki/reference/openapi.md`
- Create: `wiki/reference/generator.md`
- Create: `wiki/reference/react.md`
- Create: `wiki/reference/cosec.md`
- Create: `wiki/reference/wow.md`
- Create: matching six files under `wiki/zh/reference/`

**Interfaces:**

- Consumes: package entry points, nested re-export entry points, exact generator CLI help, and Wow query tests.
- Produces: Canonical integration references used by README and recipes.

- [ ] **Step 1: Verify public exports and CLI behavior**

Run:

```bash
rg -n '^export ' packages/openai/src/index.ts packages/openapi/src/index.ts packages/generator/src/index.ts packages/react/src/index.ts packages/cosec/src/index.ts packages/wow/src/index.ts
node packages/generator/dist/cli.js generate --help
```

Record only current flags, defaults, types, and operators.

- [ ] **Step 2: Write OpenAI, OpenAPI, and Generator references**

Differentiate the runtime OpenAI client, type-only OpenAPI package, and code-generator CLI. Generator reference includes input formats, configuration, output structure, discovery rules, exit/failure behavior, and regeneration workflow.

- [ ] **Step 3: Write React, CoSec, and Wow references**

React groups hooks by async core, Fetcher, storage, CoSec, eventbus/data monitor, and Wow. CoSec groups configuration, token lifecycle, interceptors, attribution, unauthorized/forbidden errors, and cleanup. Wow groups commands, query clients, array-first filters, aggregation, models, endpoints, and configuration.

- [ ] **Step 4: Write Chinese equivalents, validate, and commit**

Run: `pnpm exec prettier --write wiki/reference wiki/zh/reference`

Run: `pnpm --dir wiki build`

Expected: all integration reference pages and links pass.

```bash
git add wiki/reference wiki/zh/reference
git commit -m "docs: add integration package reference"
```

### Task 7: Viewer Reference and Contributor Guides

**Files:**

- Create: `wiki/reference/viewer.md`
- Create: `wiki/zh/reference/viewer.md`
- Create: `wiki/contributing/index.md`
- Create: `wiki/contributing/development.md`
- Create: `wiki/contributing/testing.md`
- Create: `wiki/contributing/documentation.md`
- Create: matching four files under `wiki/zh/contributing/`
- Modify: `wiki/.vitepress/config/en.ts`
- Modify: `wiki/.vitepress/config/zh.ts`

**Interfaces:**

- Consumes: viewer exports/tests, root scripts, package scripts, Wiki `AGENTS.md`, and CI workflows.
- Produces: Final canonical Wiki areas needed before README rewrite and legacy-page deletion.

- [ ] **Step 1: Write Viewer reference**

Group the API by inputs, filter definitions, registries, cells, tables, top bar, views, `Viewer`, and `FetcherViewer`. Document required providers, controlled state, callbacks, ref methods, default behavior, locale, and failure states. Prefer tables for props and link complex workflows to Storybook.

- [ ] **Step 2: Write contributor guides**

`development` documents Node/pnpm requirements, install/build commands, package layout, version lockstep, and code style. `testing` distinguishes unit, integration, browser, Wiki, and Storybook checks with exact commands. `documentation` records bilingual parity, source verification, Mermaid constraints, generated artifacts, and review checklist.

- [ ] **Step 3: Replace navigation with the final information architecture**

Use these exact English top-level links and mirror them under `/zh/`:

```ts
nav: [
  { text: 'Start', link: '/start/' },
  { text: 'Learn', link: '/learn/request-lifecycle' },
  { text: 'Recipes', link: '/recipes/declarative-services' },
  { text: 'Reference', link: '/reference/' },
  { text: 'Contributing', link: '/contributing/' },
  { text: 'Storybook', link: '/storybook/', target: '_blank' },
];
```

Chinese labels are `开始`、`学习`、`场景`、`参考`、`贡献`、`Storybook`. Replace legacy sidebars with one complete sidebar group per new directory. Keep social links, footer, edit links, locale metadata, and existing VitePress features.

- [ ] **Step 4: Write Chinese equivalents and validate**

Run: `pnpm exec prettier --write wiki/reference/viewer.md wiki/zh/reference/viewer.md wiki/contributing wiki/zh/contributing`

Run: `pnpm --dir wiki fix:mermaid`

Run: `pnpm --dir wiki build`

Expected: Wiki contains every target from the new navigation.

- [ ] **Step 5: Commit**

```bash
git add wiki/reference/viewer.md wiki/zh/reference/viewer.md wiki/contributing wiki/zh/contributing wiki/.vitepress/config/en.ts wiki/.vitepress/config/zh.ts
git commit -m "docs: add viewer reference and contributor guides"
```

### Task 8: Root and Foundation Package README Files

**Files:**

- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `packages/fetcher/README.md`
- Modify: `packages/fetcher/README.zh-CN.md`
- Modify: `packages/decorator/README.md`
- Modify: `packages/decorator/README.zh-CN.md`
- Modify: `packages/eventbus/README.md`
- Modify: `packages/eventbus/README.zh-CN.md`
- Modify: `packages/eventstream/README.md`
- Modify: `packages/eventstream/README.zh-CN.md`
- Modify: `packages/storage/README.md`
- Modify: `packages/storage/README.zh-CN.md`

**Interfaces:**

- Consumes: completed Start, Learn, Recipe, and Reference paths.
- Produces: Short public entry points with no duplicated reference content.

- [ ] **Step 1: Rewrite root README pair**

Use this exact structure: value proposition, install, five-minute Fetcher example, task-to-package table, Learn/Recipes/Reference/Storybook links, contribution commands, license. The example uses `new Fetcher`, URI-template path data, query data, `Response.json()`, and `FetcherError` handling.

- [ ] **Step 2: Rewrite five foundation package README pairs**

Every file uses: purpose, when to use, install, peer dependencies, one minimal example, core capabilities, docs links. Keep each under roughly one screen before the example and remove exhaustive API tables.

- [ ] **Step 3: Check links, format, and commit**

Run: `pnpm exec prettier --write README.md README.zh-CN.md packages/fetcher/README.md packages/fetcher/README.zh-CN.md packages/decorator/README.md packages/decorator/README.zh-CN.md packages/eventbus/README.md packages/eventbus/README.zh-CN.md packages/eventstream/README.md packages/eventstream/README.zh-CN.md packages/storage/README.md packages/storage/README.zh-CN.md`

Run: `pnpm --dir wiki build`

Expected: README links target new Wiki paths and code uses current exports.

```bash
git add README.md README.zh-CN.md packages/fetcher/README.md packages/fetcher/README.zh-CN.md packages/decorator/README.md packages/decorator/README.zh-CN.md packages/eventbus/README.md packages/eventbus/README.zh-CN.md packages/eventstream/README.md packages/eventstream/README.zh-CN.md packages/storage/README.md packages/storage/README.zh-CN.md
git commit -m "docs: rewrite core developer readmes"
```

### Task 9: Integration, Viewer, and Contributor README Files

**Files:**

- Modify: README pairs under `packages/openai`, `packages/openapi`, `packages/generator`, `packages/react`, `packages/cosec`, `packages/wow`, and `packages/viewer`
- Modify: `integration-test/README.md`
- Modify: `integration-test/README.zh-CN.md`
- Modify: `.github/workflows/README.md`

**Interfaces:**

- Consumes: completed integration recipes/reference and Storybook's planned task-group URLs.
- Produces: Remaining public README entry points.

- [ ] **Step 1: Rewrite seven package README pairs**

Each README contains, in order: purpose, when to use it, install command, peer dependencies, one minimal executable example, 3 to 6 core capabilities, and links to its Wiki Reference, relevant Recipe, and Storybook when an interactive story exists. OpenAPI explicitly says type-only. Generator leads with CLI. React groups hooks by job. CoSec avoids browser-secret examples. Wow uses 3.18 array-first filters. Viewer leads with `Viewer` and links visual behavior to Storybook.

- [ ] **Step 2: Rewrite integration and workflow README files**

Integration README files contain prerequisites, build-before-test ordering, generator fixture requirements, expected commands, failure diagnosis, and cleanup. Workflow README lists each CI workflow, trigger, required local equivalent, secrets category without values, and failure triage.

- [ ] **Step 3: Format, validate, and commit**

Run: `pnpm exec prettier --write packages/openai/README.md packages/openai/README.zh-CN.md packages/openapi/README.md packages/openapi/README.zh-CN.md packages/generator/README.md packages/generator/README.zh-CN.md packages/react/README.md packages/react/README.zh-CN.md packages/cosec/README.md packages/cosec/README.zh-CN.md packages/wow/README.md packages/wow/README.zh-CN.md packages/viewer/README.md packages/viewer/README.zh-CN.md integration-test/README.md integration-test/README.zh-CN.md .github/workflows/README.md`

Run: `pnpm --dir wiki build`

Expected: all README files format and link to existing canonical pages.

```bash
git add packages/*/README.md packages/*/README.zh-CN.md integration-test/README.md integration-test/README.zh-CN.md .github/workflows/README.md
git commit -m "docs: rewrite integration and viewer readmes"
```

### Task 10: Remove Legacy Wiki and Run Full Documentation Gate

**Files:**

- Delete: every Markdown file under the 12 legacy directories listed in the File Map
- Modify: the exact new Wiki or README file named by a failing link or parity check; the task cannot commit while any such failure remains

**Interfaces:**

- Consumes: all completed new Wiki and README content.
- Produces: one public documentation tree with no compatibility layer or stale references.

- [ ] **Step 1: Prove new content no longer references legacy paths**

Run:

```bash
rg -n '/(guide|architecture|api|packages|testing|onboarding)/|\]\((\.\./)*(guide|architecture|api|packages|testing|onboarding)/' README.md README.zh-CN.md packages integration-test wiki --glob '*.md'
```

Expected: no intentional documentation link remains. Source-code words such as `packages` are allowed only when they are not Wiki URLs.

- [ ] **Step 2: Delete legacy Wiki pages**

Delete only the directories listed in the File Map. Keep `wiki/index.md`, `wiki/zh/index.md`, `wiki/public`, `.vitepress`, scripts, and generated artifacts untouched.

- [ ] **Step 3: Verify bilingual file parity**

Run:

```bash
diff -u \
  <(find wiki/start wiki/learn wiki/recipes wiki/reference wiki/contributing -type f -name '*.md' | sed 's#^wiki/##' | sort) \
  <(find wiki/zh/start wiki/zh/learn wiki/zh/recipes wiki/zh/reference wiki/zh/contributing -type f -name '*.md' | sed 's#^wiki/zh/##' | sort)
```

Expected: no diff.

- [ ] **Step 4: Scan public content for credentials and private endpoints**

Run:

```bash
rg -l '(Bearer [A-Za-z0-9._-]{20,}|api[_-]?[Kk]ey\s*[:=]|Authorization\s*[:=]|dev-api\.|linyikj\.com)' README.md README.zh-CN.md packages integration-test wiki --glob '*.md'
```

Expected: no file paths printed. Documentation that explains the `Authorization` header must use an obvious placeholder and be manually reviewed.

- [ ] **Step 5: Run the complete documentation gate**

Run: `pnpm --dir wiki fix:mermaid`

Run: `pnpm --dir wiki build`

Run: `pnpm test:unit`

Run: `git diff --check`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add README.md README.zh-CN.md packages integration-test .github/workflows/README.md wiki
git commit -m "docs: complete developer documentation rewrite"
```
