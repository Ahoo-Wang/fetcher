---
title: Choose the verification boundary
description: Choose the verification boundary — Fetcher
---

# Choose the verification boundary

## Match evidence to the change

| Change                 | Command                                        | Evidence                                         |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------ |
| Package behavior       | `pnpm --filter @ahoo-wang/fetcher test`        | Focused Vitest suite                             |
| All package behavior   | `pnpm test:unit`                               | Package tests, coverage and declared type checks |
| Service integration    | `pnpm test:it`                                 | Requires the integration README service setup    |
| Storybook interactions | `pnpm test:storybook`                          | Browser interaction assertions                   |
| Documentation          | `pnpm --dir wiki build`                        | Build and internal links                         |
| Reference coverage     | `node --test wiki/test/documentation.test.mjs` | Bilingual page metadata and generated corpus     |

Tests belong in the package’s existing test layout. React and Viewer use jsdom; Viewer loads test/setup.ts. Storybook browser tests are separate from test:unit.

## Check Mermaid in a browser

Start `pnpm --dir wiki dev --host 127.0.0.1`, then run:

```bash
node --test wiki/test/mermaid-browser.test.mjs
```

The check uses installed Chrome through the existing Playwright dependency. Set WIKI_TEST_URL to check a preview server. It verifies the expanded diagram’s dialog semantics, keyboard exit, and focus restoration. Also inspect zoom, pan, language, theme, touch controls, and ordinary page scrolling.

## Before committing

Run affected package tests/builds and `pnpm test:unit`. Report commands actually run, service prerequisites that blocked checks, and any warnings. A skipped integration check cannot establish server compatibility.
