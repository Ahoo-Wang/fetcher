# View Engine list sorting delivery evidence

## Scope and decision

Baseline: main `c35d121c62707d87c6b6788086e8791e84fd7a6a`, after merged error-boundary PR #1456. This is the separate sorting delivery unit of phase 1.

The user clarified that view-engine is a prototype with no compatibility debt. The old interactions are reference material, not constraints to reproduce. Five editors now share `ListOrder`/`ListOrderItem`: table columns, card summaries, sort priorities, analysis outputs and managed views. Dashboard geometry continues to use react-grid-layout. Query, saved configuration and persistence contracts are unchanged.

The new keyboard flow is Space/Enter to pick up, arrow keys to move, Space/Enter to drop, Escape to cancel. Ordinary arrow keys no longer write. The library owns sensors, geometry, scrolling, preview and drag announcements. The adapter owns business eligibility, gesture invalidation, one final submission and asynchronous result feedback. It uses library node references rather than maintaining a separate handle registry.

## Adversarial findings resolved

| Counterexample                                                                                    | Resolution                                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Async save returns false, but default optimistic sorting leaves the DOM in the attempted order    | Disable the public OptimisticSortingPlugin; use library clone feedback and a drop target outline. React remains the authoritative DOM order.        |
| Escape during keyboard sorting also dismisses the parent dialog                                   | Stop propagation of the canceled drag's native event; the first Escape cancels the gesture.                                                         |
| Owner changes away and back before an old promise resolves, allowing a stale success announcement | Invalidate submission identity on owner changes; late UI effects also check mount and operation identity.                                           |
| Permission revoke/restore, membership/order or sorting qualification changes during a gesture     | Invalidate and cancel the library operation; never restore the starting business-object snapshot.                                                   |
| A title changes during dragging                                                                   | Read the latest committed objects on drop; title edits survive reordering.                                                                          |
| Keyboard source is removed externally, leaving focus on the document body                         | After React's DOM removal, use the library registry to focus a remaining connected, enabled handle. Do not steal focus from another active control. |
| Toolbar settings receive duplicate React sibling keys                                             | Include setting kind, instance ID and editor epoch in each key.                                                                                     |

The `ResizeObserver` shim is restricted to jsdom test setup. Geometry and browser API fixtures are explicitly simulated in component tests. Production code adds no platform polyfill.

## Maintained source measurement

Collect the file set with `git diff --no-renames --name-only <baseline>` plus new source files so rename origins are counted as deletions. Count nonblank physical lines containing TypeScript tokens, excluding comments, in every changed production TS/TSX file plus new files; deleted files contribute their baseline size. Tests, documentation, generated artifacts and third-party code are excluded.

**2,317 → 2,312 lines, net −5.** This is a small reduction, not a claim of dramatic code shrinkage. The architectural benefit is eliminating two handwritten drag implementations and sharing one mechanism across five business entry points while adding native keyboard and touch support.

| Source file                            | Before | After |
| -------------------------------------- | -----: | ----: |
| `analysis/AnalysisEditor.tsx`          |    790 |   802 |
| `lib/useListOrder.ts`                  |    149 |     0 |
| `record/RecordCardSettings.tsx`        |    276 |   263 |
| `record/RecordColumnSettings.tsx`      |    262 |   247 |
| `record/page/RecordSortSettings.tsx`   |    272 |   257 |
| `record/page/RecordToolbar.tsx`        |    109 |   110 |
| `record/table/useRecordColumnOrder.ts` |     43 |     0 |
| `view/ViewManagerGroup.tsx`            |    167 |    86 |
| `view/ViewManagerRow.tsx`              |    249 |   216 |
| `lib/ListOrder.tsx`                    |      0 |   297 |
| `record/table/recordColumnOrder.ts`    |      0 |    34 |

## Consumer cost and packaging

A temporary consumer bundles all exports from `dist/index.js` and `dist/react.js` with Vite, production minification, React/ReactDOM external, and no repository build configuration. Sum JS chunk sizes and individually gzipped chunks. This includes lazy chart/grid chunks; it is not first-load traffic, and it excludes CSS.

| Entry | Before JS bytes | After JS bytes | Before gzip | After gzip |
| ----- | --------------: | -------------: | ----------: | ---------: |
| core  |         307,738 |        307,738 |      76,194 |     76,194 |
| React |       2,439,468 |      2,582,646 |     607,085 |    646,947 |

React JS gzip increases by **39,862 bytes (38.9 KiB, 6.6%)**. This is the cost of delegating general interaction behavior, not a bundle-size optimization. The package gate verified 463 identical packed dist files, 11 public targets and 2 core runtime modules. Core retains no React or DnD runtime dependency. Archive SHA-256: `60de39011ef7144d8cf1ebe7841a436820cbeebdfc4f7a0ee4828403e0d305b2`.

## Verification

- Root `npm_config_workspace_concurrency=1 pnpm test:unit`: passed across all 13 package projects. View-engine source and React Compiler modes each passed 1,651 tests, with 3 existing skips.
- View-engine coverage: statements 95.59%, branches 91.55%, functions 97.21%, lines 97.41%; existing thresholds unchanged.
- Affected package/dependency builds, public type contracts and `pnpm lint:view-engine`: passed.
- `VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm test:storybook`: 381 tests passed (94 files passed, 2 files skipped).
- `VIEW_ENGINE_BROWSER_CHANNEL=chrome VIEW_ENGINE_BROWSERS=chromium VIEW_ENGINE_ARTIFACTS=/tmp/fve-sorting-acceptance pnpm verify:view-engine`: passed on the production build.
- Native sorting verifier: 19 scenarios passed, including pointer, wrapping, locked targets, both keyboard activation keys, Escape, owner/permission/member/order changes, removed-source focus, concurrent title update, asynchronous success/failure, modal interactions, auto-scroll Chromium touch input simulation, and closing a kept-mounted analysis sheet during keyboard sorting.
- IndexedDB: 50 cross-tab CAS races, receipts, rollback, cancellation and durable reset; local and HTTP hosts preserve saved ordering and isolation after reload.
- Dashboard lazy chunk fault: navigation, panel data, draft edits, retry and save remain usable.
- Existing Chromium performance/axe/lifecycle gates passed: 100 rows, 30 columns, 100 filter fields; light/dark and 1440/390px; no unreviewed WCAG A/AA findings. Warm interaction p95 refresh 134.05 ms, selection 84.33 ms, field picker 140.33 ms, all below the existing 1,250 ms ceiling. These are fixed no-network fixtures and include automation plus two painted frames; no speedup over baseline is claimed.
- Documentation generation, symbol index verification, documentation tests and bilingual wiki build: passed.

Native sensor assertions are retained in `packages/view-engine/scripts/verify-list-order.mjs` and are part of `verify:view-engine`; component tests do not substitute for them. Local browser and production-build acceptance does not establish real-device touch, manual screen-reader usability or real production-service admission. CI and PR review remain separate merge gates.

Independent read-only review identified the hidden-sheet lifecycle issue above; its regression failed before the fix and passed afterward. The follow-up review found no remaining blocking issue. Browser story helpers wait for the library drop target before releasing a valid move, avoiding an automation timing race without changing product behavior or acceptance budgets.

## References

- [dnd-kit React quickstart](https://dndkit.com/react/quickstart/)
- [useSortable](https://dndkit.com/react/hooks/use-sortable/)
- [Sortable state management](https://dndkit.com/react/guides/sortable-state-management/)
- [Sensors](https://dndkit.com/react/guides/sensors/)
- Installed `@dnd-kit/react` and `@dnd-kit/dom` 0.5.0 declarations/source were checked for plugin configuration, cancellation, keyboard lifecycle and feedback cleanup.
