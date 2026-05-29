---
name: fetcher-viewer-components
description: >
  Use when building Fetcher Viewer React and Ant Design data table experiences, including FetcherViewer, Viewer, View, ViewTable, FilterPanel, EditableFilterPanel, view management, TopBar actions, row selection, column settings, cell renderers, and form controls.
---

# fetcher-viewer-components

## Use This Skill When

- The task involves data tables, filtering, view management, or Fetcher Viewer components.
- The task mentions `FetcherViewer`, `Viewer`, `View`, `ViewTable`, `FilterPanel`, or `EditableFilterPanel`.
- The task needs TopBar actions, row selection, primary or batch actions, column settings, or saved views.
- The task needs cell renderers, remote select, tag input, number range, or locale support.

## Workflow

1. Choose `FetcherViewer` for the full data-loading and view-persistence orchestrator.
2. Choose `Viewer` or `View` when the caller controls loading, persistence, or layout state directly.
3. Define field, filter, column, action, and pagination contracts before composing components.
4. Use registries for filter and cell customization instead of scattering one-off render logic.
5. Load `references/api.md` for prop maps, component hierarchy, filter/cell examples, and integration patterns.

## Key Practices

- Keep operational UI dense and predictable; avoid marketing-style layouts around viewer components.
- Prefer typed cell renderers and filter components over ad hoc table render functions.
- Route data-fetching hook questions to `fetcher-react-hooks` unless the table/viewer integration is central.

## References

- `references/api.md`: Detailed package API, examples, and edge-case guidance. Load it only when the task needs component hierarchy, package imports, FetcherViewer props, Viewer and View examples, filter system, cell components, data entry controls, locale support, and React hook integration.

## Related Skills

- $fetcher-react-hooks: Use for data-fetching and query state hooks.
- $fetcher-wow-cqrs: Use for Wow query clients backing viewer data.
- $fetcher-cosec-auth: Use when viewer data access is tenant or policy aware.
