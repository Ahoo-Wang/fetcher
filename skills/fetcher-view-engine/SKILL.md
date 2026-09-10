---
name: fetcher-view-engine
description: >
  Build React record/table workbenches with @ahoo-wang/fetcher-view-engine and shadcn/Base UI. Use for ViewEngine, ViewPage, RecordView, ViewHost, server-provided view definitions and saved instances, paged/cursor queries, personal/shared view persistence and recovery, global/row/batch actions, filter and cell extensions, or standalone FilterPanel/Select controls and scoped themes. Applies to this independent view engine rather than the Ant Design fetcher-viewer package.
---

# Fetcher View Engine

Read [references/api.md](references/api.md) before composing or changing public APIs. Verify exports against `packages/view-engine/src/index.ts` and `src/react.ts` and reuse the package's examples and Storybook scenarios.

## Choose the composition boundary

- For a complete workbench with saved-view navigation and management, use `ViewPage`. It owns the engine lifecycle; keep `scopeKey` stable for the same user/tenant/access scope and recreate it when that identity changes.
- For a caller-owned `ViewEngine`, use `RecordView` for the record workbench or `ViewPageContent` for the navigation/management shell. The caller disposes its engine.
- For a controlled table with externally owned data, use `RecordTable`. For an isolated buffered filter editor, use `FilterPanel`; its caller handles `onApply` and any requests or saving. Use `FieldFilter` for a fixed field and `FilterSelect` for controlled labels/values.
- Import headless contracts, `ViewEngine` and `MemoryViewHost` from the core entry, React components from `/react`, and compiled styles from `/styles.css`.

## Connect a record workbench

1. Describe the actual response with `ViewDefinition`: source ID, own-property `rowKey`/field navigation paths, field metadata and allowed operators. Store columns and their renderer references in `ViewInstance.config.presentation.table.columns`, alongside the instance’s filter, sort and pagination configuration. Response property names exclude dots; dots in configured paths only navigate objects/arrays. Definitions and saved `ViewInstance` configurations are JSON; runtime functions belong in extensions.
2. Implement the applicable `ViewHost` services: `definition`, `instance`, `preference`, `permission`, plus `resolveSource` for business queries. The host provides metadata, persistence, current-user authorization and request identity/CAS guarantees. Reuse Fetcher/Wow query clients and existing storage APIs.
3. Let the engine coordinate selection, filter drafts/applied/saved state, paged/cursor navigation, queries, summaries, saving and recovery. Complete workbenches use engine commands for these operations. Instance lists supply `defaultInstanceId: null` or a returned ID. Saved operators must satisfy both definition-wide and field-level restrictions.
4. Persist `config.filters` component properties and references. The registered component owns pure compilation to a Wow filter; Query/Enter applies the draft. Preserve unset controls and opaque custom props. In React, register each component and compiler together through `extensions.filters`; directly owned headless engines use `filterCompilers`.
5. Use `extensions.globalActions`, `toolbarActions`, `rowActions`, `filters` and `cells` for the five extension points. Table actions handle current-page batch selection. Reuse built-in filters and cell renderers before adding custom components; report invalid editor buffers through `onValidityChange`.
6. Respect the current capability/permission snapshot and system-view name/delete restrictions. Keep drafts after failures. Use `retryQuery` for record failures, `refreshSummary` for aggregate failures, and `reloadInstance` for instance/write reconciliation. Unknown creations keep their original request ID/body; source-less recovery contexts remain in `pendingCreates`. These are local recovery entries, not ordinary queryable or saveable views. See the reference for conflict and idempotent-replay contracts.

## Verify delivery

- Use `IndexedDBViewHost` for real browser persistence; use `MemoryViewHost` and the existing development HTTP fixtures for Node/in-process state to verify saved JSON through a fresh host/engine back into components, including extension props, permissions and uncertain-write recovery. Business records stay outside view storage.
- Reuse the shadcn components in `src/components/ui`. Preserve Base UI behavior, `fve:` utilities, `--fve-*` tokens, scoped portal themes and accessibility.
- Run affected package tests/builds; include Storybook interaction checks for UI changes and the existing package/host acceptance commands for delivery-contract changes. Repository commits require the full `pnpm test:unit` check. Read exact commands from package scripts and the API reference.
