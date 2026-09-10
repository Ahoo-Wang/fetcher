---
title: Table and runtime operations
description: Configure built-in cells, column layout, summaries, refresh and page expansion.
---

# Table and runtime operations

## Configure cells at the field or column

Use `field.cellRenderer` as the default and `column.renderer` for an instance-specific override. Built-ins are `text`, `tags`, `status`, `link`, `date-time` and `number`; standalone React components expose the same display capabilities.

```ts
import type {
  RecordColumn,
  ViewFieldDefinition,
} from '@ahoo-wang/fetcher-view-engine';

const amount: ViewFieldDefinition = {
  field: 'amount',
  label: 'Amount',
  type: 'number',
  sortable: true,
  cellRenderer: { name: 'number' },
  numberFormat: { style: 'currency', currency: 'CNY' },
  summaryFunctions: ['SUM', 'AVG'],
};
const column: RecordColumn = {
  id: 'amount',
  kind: 'field',
  field: 'amount',
  summary: ['SUM', 'AVG'],
};
```

Number formatting is shared by cells and summaries; calculations keep raw values. Text copying uses the original value, even when an enum label or ellipsis is displayed. Success feedback resets after 2 seconds. Unsafe link schemes render as text; new-tab links include `noopener noreferrer`.

`field` and `rowKey` paths are relative to each returned record: `customer.name`, `items.0.sku`, `meta.id`. Response property names must not contain dots; dots in field paths are navigation separators, including array indices. Each segment reads only an own property. The table does not insert `state.` or another backend prefix. Configure paths for the actual response shape and ensure the backend understands query field paths separately.

## Columns and selection

Persist column identity, visibility, order, width, pinning and summary selections in `presentation.table.columns`. The row-key column is fixed left, actions right. Width is changed by dragging the table boundary, not a number input in settings. Ordinary pinning follows contiguous pinned neighbors. Fixed edges have a shadow.

Selection is opt-in (`selectable`). Batch operations receive keys from the currently loaded page, not every record matching the filter. Declare a unique string/finite-number row key; missing, duplicate or invalid keys are data errors.

For paged queries, if the returned total no longer includes the current page, the engine clears that page and requests page one. A failed correction remains a query error and retries page one; newer navigation or queries take precedence. Cursor pagination retains its separate cursor protocol.

## Summary scope and failures

A numeric column can select several of SUM/AVG/MIN/MAX, subject to `summaryFunctions`. “This page” summarizes loaded rows; “All” uses the applied filter and the optional source `aggregate()` capability. Selection does not define aggregate scope. One failure indicator is shown at its scope label; open it for the reason and retry. `refreshSummary()` retries aggregates without requerying records. Missing numeric data remains a placeholder rather than an invented zero.

## Global runtime controls

Manual refresh, automatic refresh and page expansion are in the global toolbar. Automatic refresh offers 30 seconds, 1 minute and 5 minutes with a countdown; it does not change saved query configuration. Pause external business work through `autoRefreshPaused`. Hidden-page and active-work guards prevent overlapping automatic reads.

Expansion fills the page area and exits with Escape; it is not the browser Fullscreen API. Query errors, summary errors and action errors retain their own recovery positions. During background refresh, the last successful rows remain usable; first load uses Spin and empty results use an icon.

Verify **Record View → 表格与汇总 / 运行时工具 / 布局与主题** and **单元格 → 内置组件**. See [component props](../../reference/view-engine/components.md).

## Card layout and default configuration

Set `ViewDefinition.defaultPresentation.card` to provide the initial title, optional cover, summary fields and row actions. `defaultPresentation.table` supplies default columns. Both presets work with local definitions and remote JSON. Existing instance configuration takes precedence; switching layouts never overwrites settings or reruns record queries.

```ts
const defaultPresentation = {
  card: {
    title: { id: 'title', field: 'id' },
    fields: [
      { id: 'amount', field: 'amount', renderer: { name: 'number' } },
      { id: 'status', field: 'status' },
    ],
  },
};
```

Attach this object to a definition that declares these fields. Call `resolveRecordPresentation(definition, 'card')` when constructing an instance, or use the built-in Table/Card toolbar buttons. Only the active layout configuration is required. `engine.setLayout('card')` selects cards; `engine.setCardConfig(config)` changes their settings. Switching back restores that layout's last applied configuration, including unsaved edits. Save persists layout and both configured presentations; defaults are not reapplied on reload.

Card settings edit a local draft; Apply updates the instance, Cancel discards it. Row actions use `actions: { renderer: { name: 'custom' } }`, or `{}` to use `definition.recordActions.row`. Hiding actions sets `visible: false` and preserves the renderer. Presets contain JSON references, while actual components remain in `extensions.cells`/`rowActions`.

Missing title values fall back to the record key; 0 and false remain valid. A cover must reference a string field containing an http/https or relative image URL. Invalid or failed images show a placeholder. Card selection uses the same current-page keys as table selection. Cards do not run summaries; returning to table recalculates configured summaries without reloading records.

`ViewDefinition.allowedLayouts` is required and must be nonempty and unique: `['table']`, `['card']`, or both. A single allowed layout hides the toolbar switch. The engine and instance loading reject disallowed active layouts. Switching preserves each layout's configuration. Cards use a top-right selection button (`aria-pressed`) without a separate row; custom content should leave this corner clear. Global controls use icons with hints; menus retain text.

The shared record toolbar exposes sorting, as active rules in priority order, with drag/keyboard reordering, add/remove controls and a clear action. It uses the same `instance.config.sort` as table headers and remains available for card-only views. Explicit refresh of the same paged query retains existing rows so actions remain mounted; filter, sort, page changes and cursor refresh still reload their results.
