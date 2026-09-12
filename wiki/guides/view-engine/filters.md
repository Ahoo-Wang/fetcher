---
title: Configure filters
description: Choose built-in editors, preserve component configuration, and apply queries explicitly.
---

# Configure filters

## Choose the field editor

Field `type` and explicit `operators` declare capability; `editor` selects the default component for new nodes only. Existing nodes use their own `component` reference, which a field default change cannot replace or further restrict. Built-in names have no `fve/` prefix.

| Need                                       | `editor.name`            | Operators / options                                              |
| ------------------------------------------ | ------------------------ | ---------------------------------------------------------------- |
| Text, number, boolean, ordinary date input | `builtin` or omit editor | Operators inferred from field type and restricted by `operators` |
| One local option                           | `select`                 | EQ / NE, `field.options`                                         |
| Multiple local options                     | `multi-select`           | IN / NOT_IN, `field.options`                                     |
| One remote option                          | `remote-select`          | EQ / NE, `options.source`                                        |
| Multiple remote options                    | `remote-multi-select`    | IN / NOT_IN, `options.source`                                    |
| Multiple typed values                      | `text-values`            | IN / NOT_IN                                                      |
| Date or datetime interval                  | `datetime-range`         | BETWEEN, optional `showTime`                                     |

Options can declare `group`. IDs preserve type: `1` and `'1'` are different. `group` on the field organizes the add-filter picker, while `group` on an option organizes candidates. A field's empty `operators: []` disables filtering for that field; `definition.allowedOperators` further restricts the complete expression.

## Editing, querying and saving

Typing edits a draft. Query or Enter applies valid input. An unset control remains rendered and contributes no value-dependent predicate; it is not removed from saved configuration. The applied-condition clear button clears that control's value and queries immediately. Removing a control from the editing panel changes the draft instead.

Simple mode has one control per field in each scope. It supports ELEMENT_MATCH, including nested arrays, with an implicit AND inside each “same element satisfies” section. Empty element scopes remain editable but block Query until a child condition is added. Advanced mode can repeat a field and nest AND/OR/NOR. Existing nested branches are not flattened on a mode switch. The field picker uses grouped checkboxes in a popup; logical groups are added through the separate button-group menu.

Persist `ViewInstance.config.filters: FilterConfiguration`, including component name, options, operator and raw `props`. Do not replace it with the compiled Wow `FilterExpression`: an expression cannot restore unset controls, chosen editors or display-only properties. The component registration owns pure `compile` and optional `clear` semantics; the panel coordinates application. See [filter contracts](../../reference/view-engine/filters.md).

## Remote candidates

```ts
import type { ViewFieldDefinition } from '@ahoo-wang/fetcher-view-engine';

const customerField: ViewFieldDefinition = {
  field: 'customerId',
  label: 'Customer',
  type: 'string',
  group: 'Customer',
  editor: {
    name: 'remote-multi-select',
    options: { source: 'customers', pageSize: 20, debounceMs: 250 },
  },
};
// ViewPage extensions: { optionSources: { customers: customerOptionSource } }
```

`FilterOptionSource.search({ search, cursor, size }, signal)` returns `{ list, nextCursor }`. `resolve(ids, signal)` returns `{ list, missing }` and must account for every ID exactly once. Preserve a stable source object within an access scope and forward the signal to Fetcher or the backend. Candidate data belongs to `extensions.optionSources`, separate from record queries resolved by ViewHost. Only component configuration is saved, not the source function or search cache.

## Date granularity and timezone

Date/datetime ranges use a dual-month Date Range Picker by default. Datetime fields in date-only mode include the complete selected natural days, including the final day and DST boundaries. Set `editor.options.showTime: true` to edit start/end date and time through seconds in one popup; Confirm publishes, Cancel/Escape discards the popup draft.

Configure `ViewDefinition.timeZone` once, for example `Asia/Shanghai`; omission uses the local runtime timezone. A standalone `FilterPanel` receives `timeZone` directly. Fields do not override it. Runtime queries use epoch milliseconds; component configuration retains editable date/time values.

Verify **View Engine → 查询与筛选 → 内置筛选器** for remote paging/retry/restoration, and **扩展与组件 → 日期时间** for the standalone controls.
