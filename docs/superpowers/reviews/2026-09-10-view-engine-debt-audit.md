# View Engine Dead Code and Coverage Audit

Baseline: `c3a64bc2`. Scope: `packages/view-engine`, repository consumers, explicit public entries and stylesheet selectors. The nine pre-existing height/layout changes are preserved outside this candidate.

## Method and boundaries

- Used the existing TypeScript checker to resolve aliases, public barrel exports and identifier references throughout the source tree. After cleanup: 138 source modules, 167 public symbols, 354 module-exported symbols. The scan produced no remaining unreferenced non-public exported value/type candidate after manual consumer checks.
- Ran `tsc --noEmit --noUnusedLocals --noUnusedParameters -p tsconfig.json` in the package; no unused locals or parameters were reported.
- Cross-checked candidates with repository-wide identifier searches, including tests, stories, examples and documentation. Public exports and named runtime extension registrations remain supported contracts, not deletion candidates solely because applications outside this repository are unknown.
- This was an audit using temporary checker tooling (`/tmp/fve-unused-symbols.cjs`), not a newly installed dependency or a new CI guarantee. Static reference checks do not prove all dynamic executions or defensive branches redundant.

## Deleted implementations

| Implementation       | Evidence                                                       | Action                                                                                 |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `InputGroupTextarea` | No source/consumer reference; absent from public React exports | Removed wrapper and export                                                             |
| `Textarea`           | Only referenced by the unused wrapper above; no public export  | Deleted the orphan module                                                              |
| `SelectSeparator`    | No source/consumer reference; absent from public React exports | Removed wrapper and export                                                             |
| `TableCaption`       | No source/consumer reference; absent from public React exports | Removed wrapper and export                                                             |
| `DialogTrigger`      | Used only by a theme test fixture and added no behavior        | Fixture uses the existing Base UI primitive; removed wrapper without deleting the test |

The deletions remove 86 source lines. Public API symbols are unchanged.

## Preserved contracts and checks

- `Dialog` theme capture and portal behavior retain their original interaction tests.
- Retained the public Calendar week-number option; added a test exercising ISO week display.
- Retained InputGroup addon focus behavior; added a test ensuring buttons keep focus while a label click focuses the input.
- Retained portal theme-variable copying, Tailwind runtime-variable isolation and unattached-scope handling; added checks for those paths.
- Retained non-string time-zone rejection at the public compiler boundary; added a regression assertion rather than deleting a previously uncovered guard.
- Handwritten named stylesheet selectors (`.dark`, `.fve-root`, `.fve-record-table`) remain in use or are documented host/theme contracts. Native-element/data-state selectors and utilities supporting consumer-composed children are retained. Tailwind generates from the remaining sources; no handwritten stylesheet rules were deleted speculatively.

## Coverage and remaining debt

Coverage now includes all `src/**/*.{ts,tsx}`, rather than selected filter/record/snapshot paths. The full-source baseline before deleting dead wrappers was statements 96.63%, branches 92.76%, functions 97.64%, lines 98.53%. Changes to scope and removal of unreachable code make comparisons with earlier narrower reports inappropriate.

This audit does not claim all historical debt is zero. The remaining costs are lifecycle coordination and its operation sequences, uncovered defensive/optional branches, and third-party WebKit focus-sentinel warnings already documented by browser acceptance. Public extension contracts and host-composed CSS cannot be classified as dead solely from a repository-local reference count. No dependency, public API or persistence format change is introduced.

## Candidate validation

Independent review found no additional issue. The full unit gate passed: 5,568 tests passed / one skipped, including view-engine 869 ordinary + 869 compiled tests and type checks. Storybook passed 286 tests. Package/story lint, build, documentation tests and bilingual wiki build passed.

With all source paths included after cleanup, coverage is statements 96.85%, branches 92.89%, functions 98.25%, lines 98.76%. The coverage report has no unexecuted statement in the remaining `components/ui` and `lib` files; this does not assert every branch or every interaction is covered. Logs: `/tmp/fve-dead-cleanup-unit.log`, `/tmp/fve-dead-cleanup-storybook.log`.

Public archive verification passed with 283 packed dist files and unchanged public targets. LocalStorage/HTTP restoration and Chromium/Firefox/WebKit readiness passed at unchanged 100 rows/30 columns/100 fields, ten warm samples and 1000ms p95 budget. Existing reviewed Base UI WebKit focus-sentinel findings remain; VoiceOver certification is not claimed. Artifacts: `/tmp/fve-dead-cleanup-acceptance/`.
