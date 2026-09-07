---
name: fetcher-view-engine
description: >
  Use the independent @ahoo-wang/fetcher-view-engine package for shadcn/ui and Base UI filter controls, fixed-field filters, Select composition, and scoped themes. Applies to this package rather than the Ant Design fetcher-viewer package.
---

# Fetcher View Engine

Read [references/api.md](references/api.md) before composing or changing the package's public API.

- Import React components from `/react` and compiled styles from `/styles.css`. The core entry exports draft contracts, all operator metadata and headless compilation without React/CSS.
- Register custom filter editors through a per-panel `extensions.filters` map; preserve fixed fields and report invalid local input through `onValidityChange`.
- Use `FieldFilter` for a fixed field and a host-provided value editor. Use `FilterSelect` for controlled options with separate labels and values.
- Use `FilterPanel` for the complete buffered editor. It validates drafts, supports simple/advanced modes and calls `onApply` only on Query. The host owns requests and view saving; use `onPendingChange` for save guards.
- Reuse the shadcn components in `src/components/ui`. Preserve the Base UI implementation, `fve:` utilities, `--fve-*` tokens and portal theme behavior.
- Verify the affected package with its build and test scripts before reporting completion.
