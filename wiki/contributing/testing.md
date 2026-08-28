---
title: Testing
description: Run the right Fetcher unit, integration, browser, Wiki, and Storybook checks.
---

# Testing

## Test matrix

| Surface                | Command                        | What it proves                           |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| All package units      | `pnpm test:unit`               | Package behavior, types, and coverage    |
| One package            | `pnpm --filter <package> test` | Focused package behavior                 |
| Integration workspace  | `pnpm test:it`                 | Generated client and service integration |
| Storybook interactions | `pnpm test:storybook`          | Chromium render and `play` assertions    |
| Storybook static build | `pnpm build-storybook`         | Production story compilation             |
| Wiki                   | `pnpm --dir wiki build`        | Markdown, Mermaid, and link rendering    |

## Unit tests

Vitest globals are enabled. Keep tests beside source, use MSW where the Fetcher
package needs an HTTP boundary, and use the browser provider only for behavior
that requires a real browser.

```bash
pnpm --filter @ahoo-wang/fetcher-viewer vitest run \
  src/filter/TextFilter.test.tsx
```

## Integration tests

Build packages first. The integration workspace may generate code from a live
test service, so confirm its documented prerequisite and do not treat a missing
service as a unit-test regression.

```bash
pnpm build
pnpm test:it
```

## Storybook

Stories replace network, stream, and time boundaries with deterministic local
fixtures while exercising real package code. Every story must render in
Chromium; critical behavior belongs in a `play` assertion. No story may contact
the public internet or require credentials.

## Before a commit

Run the focused check while iterating, then `pnpm test:unit`. For a public UI or
documentation change, also run its build and interaction gate. Warnings are not
failures, but new warnings should be diagnosed before being accepted.
