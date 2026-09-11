# Analysis rule convergence

Scope approved by the user: consolidate business rules and state ownership, verify cross-entry invariants; freeze features.

1. Extract shared analysis default limits, group compatibility and effective sort-capacity policy. Compiler and editor/table consume these rules; retain backend output validation and actionable compiler errors.
2. Add an analysis setSort command that validates current query eligibility and the proposed configuration before publishing changes and running. Route result headers through it. General edit remains able to hold incomplete drafts.
3. Keep session derivation as the authority for validation/conflicts, and openingInstanceId as distinct navigation intent. Do not split these responsibilities into new managers.
4. Regressions: candidate sort rejection does not mutate config or query; capacity decisions agree with compilation; group compatibility agrees across editor/compiler. Run affected tests, full unit suite, type/build/lint and Storybook. Update API references and generated docs, push the existing PR; do not merge.

No feature additions, compatibility shims, dependencies, or wholesale component rewrite. Completion means the specified rule paths use shared decisions and validation passes, not that all possible defects have been eliminated.

## Implemented boundaries

- `analysisCapabilities.ts`: shared immutable budgets and builtin group compatibility; used by definition admission, compilation and editor choices.
- `analysisSort.ts`: shared effective sort aliases/capacity; compiler, configuration editor and result table consume the same calculation.
- `AnalysisCommands.setSort`: owns validation before mutation and querying; `AnalysisView` delegates. Invalid drafts remain editable through `edit`, but query-producing actions do not publish invalid candidate sorts.
- `deriveSession`, `analysisQueryPolicy`, editor epochs and pending navigation retain their existing ownership. No new state manager or independent UI business policy was introduced.

Verification: full `VITEST_MAX_WORKERS=4 pnpm test:unit` passed (1,389 view-engine tests in both source and React Compiler modes); affected package build, types, lint and wiki checks passed. Source line coverage 97.80%. Browser interactions and remote CI are separate gates; local results do not imply remote completion.
