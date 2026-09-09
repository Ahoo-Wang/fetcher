# View Engine Select Package Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in the current isolated worktree.

**Goal:** Create `@ahoo-wang/fetcher-view-engine` and replace the filter preview's native dropdowns with its shadcn/Base UI Select.

**Architecture:** Keep JSON data contracts in the core entry and React components in `/react`. Compile scoped styles into a separate CSS entry. The existing preview continues to own its editing buffer and query simulation; it consumes the package's real Select components.

**Tech Stack:** TypeScript, React, Base UI, shadcn base-nova, Tailwind CSS, Vite, Vitest.

**Spec:** [Filter component design](../specs/2026-09-05-wow-view-engine-filter-design.md).

## Constraints

- Package version `4.0.1`, Node `>=20.20.2`, pnpm `10.34.5`; external dependencies use the workspace catalog.
- Core imports must not load React, DOM or CSS. Styles use `fve` utility prefixes and `--fve-*` tokens, without global preflight.
- Each field filter has a fixed field label. Select edits an operator or value; it does not execute queries.
- Menus use shadcn's default theme, selected indicator, keyboard behavior and focus handling. Avoid native OS popup menus.
- This increment delivers Select and FieldFilter components; the broader ViewEngine, three views and persistence contracts remain governed by the overall design.

## Task 1: Independent package and reusable filter controls

Files: `packages/view-engine/{package.json,components.json,tsconfig.json,vite.config.ts,vitest.config.ts,eslint.config.js}`, `src/{index.ts,react.ts,styles.css}`, `src/components/ui/*`, `src/filter/{filterTypes.ts,FilterSelect.tsx,FieldFilter.tsx}`, `test/filter.test.tsx`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`.

Interfaces:

```ts
type FilterOption<Value extends string = string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};
type FilterField<Field extends string = string> = {
  readonly field: Field;
  readonly label: string;
};
```

`FilterSelect` accepts options, a controlled value, a label and `onValueChange`. `FieldFilter` accepts a fixed field, controlled operator/options, a value-editor child and an optional remove callback. Neither component owns query or save state.

- [x] Create package configuration and a behavior test that opens the operator menu, selects another option, and asserts only the operator callback receives the new value. Assert the field name remains fixed and no field picker exists.
- [x] Run the test against an empty component to verify the missing Select behavior.
- [x] Obtain shadcn Select/InputGroup sources with the CLI, preserving their component composition and default variants. Compile prefixed utilities and keep portalled content in the same theme scope.
- [x] Implement controlled FilterSelect and FieldFilter, then run package tests, type checking and the package build.

## Task 2: Preview integration and validation

Files: current task-owned filter preview and its runnable check; package README files, `skills/fetcher-view-engine/references/api.md`, and filter design spec.

- [x] Bundle the package's real React controls into the existing preview; remove its native select factory and dispose React roots when replacing the editor.
- [x] Keep pending edits, manual query, same-field filters and element scope behavior. Validate these through the existing runnable check and actual browser interaction.
- [x] Inspect opened menus in light/dark themes and narrow containers. Verify Escape returns focus, selection retains the field binding and does not query.
- [x] Document the shipped API and actual scope. Run `git diff --check` and affected package checks; run `pnpm test:unit` before any commit.
