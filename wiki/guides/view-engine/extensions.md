---
next: false
title: Add application extensions
description: Register global, table, row, filter and cell extensions with explicit ownership.
---

# Add application extensions

## Five extension points

| Need                          | Registration               | Configuration reference                               |
| ----------------------------- | -------------------------- | ----------------------------------------------------- |
| Global business operation     | `extensions.globalActions` | `definition.recordActions.global`                     |
| Batch / table operation       | `extensions.tableActions`  | `definition.recordActions.table`                      |
| Per-record action             | `extensions.rowActions`    | `definition.recordActions.row` plus an actions column |
| Filter component and compiler | `extensions.filters`       | Field/editor/operator component reference             |
| Custom cell                   | `extensions.cells`         | `field.cellRenderer` or `column.renderer`             |

Each reference is `{ name, options? }`; options must be JSON data. Register components, service clients and callbacks in runtime extensions, not persisted JSON. Unknown names and invalid configuration surface an error; they are not silently treated as another component. Start with built-ins before registering a custom implementation.

```ts
// The values on the right are your application components/registrations.
const extensions = {
  globalActions: { 'create-order': CreateOrder },
  tableActions: { 'process-orders': ProcessSelectedOrders },
  rowActions: { 'process-order': ProcessOrder },
  cells: { 'customer-link': CustomerLink },
  filters: { 'order-status': orderStatusFilter },
};
```

## Operations

Action props include the immutable definition/instance, applied `filter`, `sort`, options and an instance-bound `refresh()`. Table/global actions also receive `selectedRowKeys` and `querying`; row actions receive `record` and `rowKey`. A null applied filter means query scope is unavailable: do not start a filter-wide write from it.

The application executes business writes, handles their errors and prevents duplicates. Await the write, then refresh the bound instance. If refresh fails after a successful write, retry the refresh instead of repeating the write. Disable or pause conflicting work and pass `autoRefreshPaused` while your business operation is active. Cell renderers only receive display context; do not issue writes during render.

## Filters

One `FilterRegistration` combines `component`, pure `compile(props, context)`, required supported `modes`, optional `supports`, and optional `clear`. The default `render: 'value'` composes the editor inside the standard field/operator/remove frame. `render: 'filter'` receives the complete control contract, including labels, operator changes, clearing and removal.

`onChange` publishes serializable raw props and does not apply a query. Report incomplete local input through `onValidityChange(false, message)`. Compilation returns `undefined` for an unset value and throws for invalid nonempty input. Clearing preserves unrelated display attributes. Keep the registration stable for an engine lifetime; incompatible saved-prop semantics require a new component name.

The complete implementation is available in **View Engine → 扩展接入 → 公共包**. `packages/view-engine/examples/react/OrderExtensions.tsx` implements all five extension types; `OrderOperations.tsx` coordinates business writes and refresh. The code panels show the actual source, and the regression scenarios exercise writes, failure recovery and JSON restoration. API details: [filters](../../reference/view-engine/filters.md), [components](../../reference/view-engine/components.md).
