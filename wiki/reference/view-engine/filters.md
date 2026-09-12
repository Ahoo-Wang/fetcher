---
title: Filter configuration and components
description: Serialize editor props, compile pure expressions, and connect remote option sources.
---

# Filter configuration and components

## Configuration and query

| Representation          | Purpose                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `FilterComponentConfig` | The only editing node: id/component/operator/field/props and optional operands or predicate |
| `FilterConfiguration`   | JSON-safe `{ mode, root }`, shared by editing, applied and saved snapshots                  |
| Wow `FilterExpression`  | Compiled request predicate; it is not a UI restoration format                               |

`FilterJsonValue` allows null, booleans, finite numbers, strings, arrays and JSON objects. Object properties may be unset (`undefined`) and are omitted when serialized; do not put functions, cycles or undefined array items into props. A component name identifies its persistence/compile protocol.

## Core functions

| Function                                                                               | Result / behavior                                                                                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `newFilterNode(operator, field?, component?)`                                          | Create a canonical node with an ID, explicit component reference (default `builtin`) and initial props |
| `createFilterConfiguration(root, mode?)`                                               | Clone and validate the canonical root; infer mode when omitted                                         |
| `validateFilterConfiguration(value, fields?, allowedOperators?)`                       | Assert valid configuration, throwing on malformed input                                                |
| `compileFilterConfiguration(config, fields, allowedOperators?, compilers?, timeZone?)` | `{ expression?, errors }`                                                                              |
| `clearFilterValues(root, fields, compilers?, timeZone?)`                               | Clear through component semantics while preserving node identities                                     |
| `compileBuiltinFilter`, `clearBuiltinFilterProps`                                      | Reuse default component compilation/clearing                                                           |
| `getFieldOperators`, `FILTER_OPERATORS`, `isSimpleFilter`, `sameFilterQuery`           | Capability, metadata, mode and query comparisons                                                       |

Construct component props directly. The panel resolves field/operator defaults only when creating nodes; saved nodes always use their explicit component references. A compile error prevents application; an empty valid collection of predicates compiles to MATCH_ALL.

`getFieldOperators(field)` derives capabilities only from field type and explicit `field.operators`. Field `editor` and definition `filterEditors` are defaults for new nodes; an existing node's `component` is authoritative. Its registration supplies component-specific compatibility checks, so changing a field editor default does not restrict or replace saved components.

## FilterPanel

Required props are `fields` and `onApply({configuration, expression})`. Use controlled `value/onChange` with `FilterConfiguration`, or `defaultValue` for local ownership; these forms are mutually exclusive. `appliedValue` optionally supplies the accepted configuration baseline. Mode belongs to `configuration.mode`. Optional props include `onPendingChange`, `onValidityChange`, `timeZone`, `extensions`, `editors` and `allowedOperators`. `querying`, `queryError`, `disabled`, `collapsed`, `renderToolbar` and `className` integrate it with a host layout.

Keep editing and accepted configurations independently if editors unmount while navigating. `collapsed` hides the panel body while retaining local buffers. Use `FilterPanelToolbarProps.onModeChange` when relocating its toolbar, so mode guards remain effective. Enter in an ordinary input queries; Enter used by a popup remains owned by that popup.

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

## Recoverable text values

`FilterTextValues` accepts `value?: readonly string[]`, optional controlled `rawText?: string`, `onRawTextChange?(text)` for raw typing, and `onValueChange(values, rawText)`. Without `rawText` it owns a local input buffer. Enter/paste commits the new value collection with an empty buffer in one callback; removing a chip returns the remaining values with the current buffer. A controlled caller must update both values and rawText from that callback. IME confirmation does not submit a token or query.

The registered `text-values` editor serializes every raw edit in `props.rawText`, so unconfirmed input survives instance navigation. Nonempty trimmed rawText prevents pure compilation; a non-string rawText is invalid. Confirmation removes rawText while retaining confirmed values; clearing removes both values and rawText. Whitespace-only input contributes no unconfirmed value. Standalone `onValidityChange(valid, message?)` remains optional; registered validity comes from compilation.

For pure COUNT/SUM compilation with these same filter configurations, see [Pure analysis compilation](./components.md#pure-analysis-compilation).
