---
title: Filter configuration and components
description: Serialize editor props, compile pure expressions, and connect remote option sources.
---

# Filter configuration and components

## Three representations

| Representation         | Purpose                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `FilterDraftNode`      | Transient editing tree: id/op/field/editor, raw values/props, operands or predicate                 |
| `FilterConfiguration`  | JSON-safe `{ mode, root }`; root nodes have id/component/operator/field/props and optional children |
| Wow `FilterExpression` | Compiled request predicate; it is not a UI restoration format                                       |

`FilterJsonValue` allows null, booleans, finite numbers, strings, arrays and JSON objects. Object properties may be unset (`undefined`) and are omitted when serialized; do not put functions, cycles or undefined array items into props. A component name identifies its persistence/compile protocol.

## Core functions

| Function                                                                                | Result / behavior                                                       |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `createFilterDraft(expression)`, `newFilterDraft(op, field?)`                           | Create transient nodes with IDs                                         |
| `createFilterConfiguration(draft, mode?, fields?, editors?)`                            | Copy raw props and resolve component identities into JSON configuration |
| `restoreFilterConfiguration(config)`                                                    | Validate and return a draft tree; read the mode from config             |
| `validateFilterConfiguration(value, fields?)`                                           | Assert valid configuration, throwing on malformed input                 |
| `compileFilterConfiguration(config, fields, allowedOperators?, compilers?, timeZone?)`  | `{ expression?, errors }`                                               |
| `compileFilterDraft(draft, fields, allowedOperators?, compilers?, editors?, timeZone?)` | Serialize then compile using the same contract                          |
| `clearFilterDraftValues(node, fields, compilers?, editors?, timeZone?)`                 | Clear through component semantics while preserving nodes                |
| `compileBuiltinFilter`, `clearBuiltinFilterProps`                                       | Reuse default component compilation/clearing                            |
| `getFieldOperators`, `FILTER_OPERATORS`, `isSimpleFilter`, `sameFilterQuery`            | Capability, metadata, mode and query comparisons                        |

Supply fields/editor defaults when creating configuration if the draft relies on them. Explicit node editors take precedence over field editors, operator defaults and `builtin`. A compile error prevents application; an empty valid collection of predicates compiles to MATCH_ALL.

## FilterPanel

Required props are `value: FilterExpression | null`, `fields` and `onApply(expression)`. Optional controlled props include `draft/onDraftChange`, `appliedDraft`, `mode/onModeChange`, `onPendingChange`, `onValidityChange`, `timeZone`, `extensions`, `editors` and `allowedOperators`. `querying`, `queryError`, `disabled`, `collapsed`, `renderToolbar` and `className` integrate it with a host layout.

`value` is the applied predicate. Keep draft and appliedDraft independently if editors unmount while navigating. `collapsed` hides the panel body while retaining local buffers. Use `FilterPanelToolbarProps.onModeChange` when relocating its toolbar, so mode guards remain effective. Enter in an ordinary input queries; Enter used by a popup remains owned by that popup.

## FilterRegistration

The registration's `component` receives immutable raw `props`, field/operator/mode/context/options, errors, disabled state and change/validity callbacks. `compile(props, context)` is pure and returns an expression or undefined; `clear` optionally returns cleared props. `modes` is required. `supports` can reject incompatible bindings. Default `render: 'value'` receives `FilterEditorProps`; `render: 'filter'` receives `FilterComponentProps` with id/operators/errorId and onOperatorChange/onClear/onRemove.

`FilterCompilerRegistry` is the headless subset for callers of ViewEngine/core helpers. React users register the combined definition once in `extensions.filters`; ViewPage connects its compiler and component. Changing a registration's protocol requires a new name or an explicit configuration migration.

## Remote option contract

`FilterOptionSource` is independent of ViewHost:

```ts
import type { CursorPage, CursorQuery } from '@ahoo-wang/fetcher-wow';
import type {
  FilterOptionItem,
  FilterOptionValue,
} from '@ahoo-wang/fetcher-view-engine';

interface FilterOptionSource {
  search(
    query: Pick<CursorQuery, 'cursor' | 'size'> & { search: string },
    signal: AbortSignal,
  ): Promise<CursorPage<FilterOptionItem>>;
  resolve(
    values: readonly FilterOptionValue[],
    signal: AbortSignal,
  ): Promise<{
    list: FilterOptionItem[];
    missing: FilterOptionValue[];
  }>;
}
```

The actual search query uses `Pick<CursorQuery, 'cursor' | 'size'>` plus search; follow its exported types when implementing. Values are strings or finite numbers. Resolve must classify each requested ID once, preserving number/string identity. Search, pagination and label hydration have separate error recovery; a failed next page retains prior candidates. Saved labels do not replace authorization or source revalidation.
