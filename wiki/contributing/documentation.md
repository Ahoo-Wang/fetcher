---
title: Maintain accurate documentation
description: Maintain accurate documentation — Fetcher
---

# Maintain accurate documentation

## Verify before explaining

Resolve public exports through package.json and src/index.ts, then read implementations and tests for signatures, defaults, errors, and cleanup. Internal files do not establish supported imports. Keep API symbols unchanged when translating.

## Place content by purpose

| Content                      | Location                |
| ---------------------------- | ----------------------- |
| First successful integration | Start                   |
| Mental model and lifecycle   | Learn                   |
| Complete application task    | Recipes                 |
| Precise API contract         | Reference package/topic |
| Agent workflow               | Skills                  |

Reference package indexes map public symbols to topic anchors. Split topics by independent concepts, not one file per symbol. Keep English and Chinese complete at matching paths, with title and description frontmatter on every page.

## Keep navigation complete

Add a Reference topic to `.vitepress/config/reference.mjs`; it supplies order to navigation, the LLM generator and checks. Update both language pages. This is a new documentation site: maintain only current pages and links, without migration pages or legacy section indexes.

## Validate examples and diagrams

Examples must include imports and necessary context. Label application endpoints and external demonstration services honestly; never include private credentials. Type-check examples through public package imports. For generated clients, run the generator and inspect actual names instead of inventing a sample import.

Mermaid uses node fill `#2d333b`, border `#6d5dfc`, text `#e6edf3`. Use autonumber in sequenceDiagram and `<br>` in labels. After diagram edits run:

```bash
pnpm --dir wiki fix:mermaid
pnpm --dir wiki build
node --test wiki/test/documentation.test.mjs
```

Do not hand-edit llms.txt, llms-full.txt or .vitepress/dist. Public SDK API changes must update the matching skills/*/references/api.md in the same change.
