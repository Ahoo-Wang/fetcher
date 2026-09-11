# Three-region analysis layout

User-approved layout: right-side query Sheet; central results; left visualization settings, collapsed by default, with visualization type selected before settings appear. Preserve the bottom Analysis/Table modes permanently. This is implementation of the approved layout, not a new architecture rewrite.

- Reuse themed Base UI dialog with right placement. One query visibility state across viewport sizes; retain mounted editors and validity, draft/execute/save separation, errors and explicit execution.
- Left visualization panel uses the executed schema. Table presentation means no chart selected; offer chart types first, retain saved chart configurations and mode choice independently. No API query on type/mode changes.
- Always render result mode navigation, including no results and no chart. Invalid charts explain issues in Analysis mode and offer an explicit Table action, without switching implicitly.
- Validate default folding, right Sheet layout/focus/closing and retained drafts, table-first unconfigured analysis, saved charts, type selection and no-query mode switches, failure/stale behavior. Update affected unit/Storybook tests, examples and docs. Run full unit/build/lint/browser checks before delivery.
- Keep PR monitoring paused. No dependency or build configuration changes.

## Verification

- Full unit suite passed; view-engine source and React Compiler each 1,390 passed, 2 existing skipped. Type checks, lint, package/dependency build, NodeNext/public contracts and wiki build passed.
- 25 analysis Storybook scenarios passed including accessibility; added the table-first selection scenario and right-edge Sheet/layout assertions.
- Inspected desktop and 390px Sheet layouts; restored the browser viewport afterward.
- Chromium/Firefox/WebKit full readiness passed, no page errors; input/switch P95 respectively 33.7/33.9ms, 62/72ms, 22/41ms. Existing 75/150ms analysis and 1250ms driver-inclusive record budgets retained. The input protocol targets the mounted Sheet and retains raw samples and stress/cancellation assertions.
- Full Storybook suite: 355 passed. Remote CI remains a separate gate. Monitoring stays paused by user instruction.
