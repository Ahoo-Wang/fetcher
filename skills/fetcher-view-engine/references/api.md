# View Engine API

Package: `@ahoo-wang/fetcher-view-engine`, version `4.0.1`. The filter layer and RecordView are implemented: headless compilation and view engine, definitions/instances with host persistence, and React filter/table/page components. AnalysisView, DashboardView and cards remain separate work.

## Core entry

`src/index.ts` exports the headless compiler and JSON-friendly field/draft contracts. The basic display contracts remain:

```ts
interface FilterField<Field extends string = string> {
  readonly field: Field;
  readonly label: string;
}
interface FilterOption<Value extends string = string> {
  readonly value: Value;
  readonly label: string;
  readonly disabled?: boolean;
}
```

Core imports do not load React, DOM or CSS. Field descriptors define editor capabilities; persisted component configuration is separate from the compiled Wow query.

### Fields, drafts and compilation

`FilterFieldDefinition` extends `FilterField` with optional `type` (`string`, `number`, `boolean`, `date`, `datetime`, `array`), typed enum `options`, optional display `group`, element-relative child `fields`, allowed `operators`, an `editor: {name, options?}` reference, and `timeZone`. Unspecified type keeps protocol scalar types; explicit types restrict supported operators and values. The optional global operator allowlist further restricts them.

`FilterDraftNode` is editor state with a stable configuration `id`, optional explicit `editor` and opaque custom `props`, plus the existing built-in Wow property names. Raw numeric text uses `FilterScalarDraftValue = {type: 'number', value: raw}`; never interpret an already-loaded protocol string as numeric input. Mixed scalar collection items can similarly use string/boolean wrappers. `FilterDateTimeValue = {date?: string, time?: string, offsetMinutes?: number}` keeps both parts while editing. Use `createFilterConfiguration` to persist these attributes; never reconstruct them from a compiled query.

`createFilterDraft` accepts `DeepReadonly<FilterExpression>` and returns an editable
draft. `compileFilterDraft` and `isSimpleFilter` accept `DeepReadonly<FilterDraftNode>`.
`FilterPanel.value` accepts a readonly expression or null; `draft` and `appliedDraft` accept readonly component editor trees;
its editing buffer and emitted drafts remain independent editable values.

| Export                                                                       | Contract                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FILTER_OPERATORS`                                                           | Complete readonly record of all 50 Wow operators: business label, category, input kind, and relative-time flag.                                                                                                                                           |
| `createFilterDraft(expression)`                                              | Strictly validates a real Wow expression, clones it and assigns IDs for new built-in editor state. It does not restore custom component props. Throws on invalid protocol input; preserves value types, nesting, ordering and absent optional parameters. |
| `newFilterDraft(op, field?)`                                                 | Creates a new draft. Value-dependent leaves start unset; logical groups and element predicates start incomplete; DELETION initially uses ACTIVE.                                                                                                          |
| `compileFilterDraft(draft, fields, allowedOperators?, compilers?, editors?)` | Returns `{expression, errors: []}` or `{errors}` with no executable expression. Each error has `{id, message}`. Validates fields, capability, type, scope and protocol through Wow constructors.                                                          |
| `getFieldOperators(field)`                                                   | Returns the field's compatible operators, restricted by its explicit allowlist.                                                                                                                                                                           |
| `isSimpleFilter(draft)`                                                      | Structural eligibility: MATCH_ALL, an ordinary field predicate, or a flat AND of those predicates. Panel also checks editor validity before switching modes.                                                                                              |

The persisted contract is:

```ts
interface FilterConfiguration {
  mode: FilterMode;
  root: FilterComponentConfig;
}
interface FilterComponentConfig {
  id: string;
  component: FilterEditorReference; // {name, options?}; reserved name: builtin
  operator: FilterOperator;
  field?: string;
  props: FilterComponentProperties;
  operands?: FilterComponentConfig[];
  predicate?: FilterComponentConfig;
}
type FilterComponentProperties = Record<string, FilterJsonValue | undefined>;
```

React applications register the complete component definition once through `extensions.filters` (see Custom editors below). The following minimal capability contract is for React-independent compilation and direct `ViewEngine` use; `ViewPage` derives it from its component definitions.

```ts
interface FilterCompilerContext {
  operator: FilterOperator;
  field?: DeepReadonly<FilterFieldDefinition>;
  fields: DeepReadonly<readonly FilterFieldDefinition[]>;
  options?: DeepReadonly<Record<string, FilterJsonValue>>;
}
interface FilterCompiler {
  compile(
    props: DeepReadonly<FilterComponentProperties>,
    context: FilterCompilerContext,
  ): FilterExpression | undefined;
  clear?(
    props: DeepReadonly<FilterComponentProperties>,
    context: FilterCompilerContext,
  ): FilterComponentProperties;
}
type FilterCompilerRegistry = Readonly<Record<string, FilterCompiler>>;
```

| Export                                                                      | Contract                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createFilterConfiguration(draft, mode?, fields?, editors?)`                | Copies editor attributes into JSON configuration, preserving IDs, unset controls, custom props and date/time attributes. Resolves explicit editor first, then field/operator defaults, then `builtin`, and saves the chosen reference. |
| `restoreFilterConfiguration(config)`                                        | Restores an editable draft directly from saved component attributes, preserving IDs. Does not compile or reverse a query.                                                                                                              |
| `validateFilterConfiguration(value, fields?)`                               | Asserts the JSON component structure and optional field bindings. Throws on invalid configuration.                                                                                                                                     |
| `compileFilterConfiguration(config, fields, allowedOperators?, compilers?)` | Invokes component-owned pure compilers and returns `FilterCompileResult`. Requires no React mounting. Unknown components, invalid output and cross-field output return errors without an executable query.                             |
| `compileBuiltinFilter(props, context)`                                      | Compiles built-in payload attributes, reusable by builtin-compatible custom renderers. Returns undefined for unset values.                                                                                                             |
| `clearBuiltinFilterProps(props)`                                            | Clears built-in values while retaining other component attributes.                                                                                                                                                                     |
| `clearFilterDraftValues(draft, fields, compilers?, editors?)`               | Applies registered clear semantics while preserving component IDs and structure.                                                                                                                                                       |
| `sameFilterQuery(a, b)`                                                     | Compares readonly expressions (also accepts null/undefined), ignoring object key order and redundant singleton AND/OR wrappers. Preserves predicate order and does not perform general Boolean equivalence.                            |

Configuration is JSON data. An object property with undefined represents an unset input and is omitted on save; null, false, zero and empty strings retain their meaning. Arrays cannot contain undefined or other non-JSON values. Functions, DOM objects, non-finite numbers and cycles are rejected. Configuration IDs are stable persisted identities; mounted renderer DOM IDs are separate.

A custom compiler may combine predicates for its bound field, but cannot escape that field or its scope. Logical/element containers remain structural component nodes. Compiled outputs must satisfy the declared field capabilities and global operator allowlist.

Field uniqueness is a simple-mode editing rule, not a compiler restriction. Advanced AND/OR/NOR groups accept repeated direct field bindings, including within element predicates. Compilation and view-instance validation preserve these conditions. `isSimpleFilter` returns false for repeated-field AND drafts, including unset conditions; a requested simple mode is rendered as advanced until the draft can be represented without losing rules.

Fully unset scalar predicates and cleared collections are omitted. An explicitly empty new group is incomplete; a nonempty group whose children are all inactive is omitted. Empty output at the query root becomes MATCH_ALL. Inactive children never become MATCH_ALL inside OR/NOR. A missing part of a bound, collection item or date/time pair blocks compilation. False, zero, explicit null and valid empty strings retain their meaning. ELEMENT_MATCH only accepts element-relative fields and excludes root-only metadata/search/deletion nodes.

`date` fields use YYYY-MM-DD strings; `datetime` fields use epoch milliseconds and validate their `timeZone` (local runtime zone when absent). Nonexistent local DST times and sub-millisecond precision that cannot be represented by the timestamp are rejected; new ambiguous local DST times use TZDate's default interpretation. Editing an existing timestamp retains its `offsetMinutes` hint (integer minutes, the sign used by `Date.getTimezoneOffset()`) when that offset still describes the edited local date/time. A date change across DST seasons uses the new date's actual offset; the hint cannot make a nonexistent local time valid. Relative-time predicates separately preserve their Wow `zoneId`, `datePattern` and `timeUnit` parameters.

```ts
const draft = newFilterDraft(FilterOperator.GTE, 'amount');
draft.value = { type: 'number', value: '12.5' };
const result = compileFilterDraft(draft, [
  { field: 'amount', label: 'Amount', type: 'number' },
]);
// result.expression: {op: 'GTE', field: 'amount', value: 12.5}
```

## React entry

Import components from `@ahoo-wang/fetcher-view-engine/react` and compiled styles from `@ahoo-wang/fetcher-view-engine/styles.css`.

### FilterPanel

| Prop                            | Contract                                                                                                                                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                         | Required applied Wow FilterExpression or null when uncompiled. Invalid/uncompiled input never falls back to all records.                                                                                                                                                            |
| `fields`                        | Required field definitions for this root scope; array fields carry their element-relative definitions.                                                                                                                                                                              |
| `onApply(expression)`           | Called exactly when Query applies a complete valid expression. The host synchronously updates `value`, then owns asynchronous requests and cancellation.                                                                                                                            |
| `mode`, `onModeChange(mode)`    | Optional controlled simple/advanced mode. Otherwise initialized from the expression. Complex loaded trees safely display advanced mode; incompatible or incomplete trees cannot switch to simple.                                                                                   |
| `onPendingChange(pending)`      | Observes changed query semantics or invalid editor input. Configuration-only changes are synchronized without a request; this is separate from the saved view dirty flag.                                                                                                           |
| `draft`, `onDraftChange(draft)` | Optional controlled draft tree; parent can retain built-in buffers and opaque custom props per instance. Otherwise managed locally.                                                                                                                                                 |
| `appliedDraft`                  | Optional controlled accepted editor baseline, including unset controls and configuration-only edits. ViewEngine consumers pass `session.filterBaseline`. When it compiles to an externally updated `value`, the panel preserves the supplied controlled `draft` and its editor IDs. |
| `onValidityChange(valid)`       | Reports aggregate editor/buffer validity. ViewEngine consumers call `setFilterValidity`; reporting true cannot clear an unsubmitted draft.                                                                                                                                          |
| `allowedOperators`              | Optional global operator allowlist, including logical and root operators.                                                                                                                                                                                                           |
| `extensions`                    | Per-panel `{filters: Record<string, FilterRegistration>}` map; no global registry.                                                                                                                                                                                                  |
| `editors`                       | Optional operator-to-editor-reference map; field references take priority.                                                                                                                                                                                                          |
| `context`                       | Opaque host definition/instance/business context passed to custom editors.                                                                                                                                                                                                          |
| `querying`, `queryError`        | Host request state. Editing stays available while querying; an unchanged in-flight query cannot be sent twice, changed filters may be applied. Errors retain applied conditions and allow retry.                                                                                    |
| `disabled`                      | Disables editing and query actions. Defaults false.                                                                                                                                                                                                                                 |
| `collapsed`                     | Defaults false. Hides the panel body while retaining mounted editors and their local buffers.                                                                                                                                                                                       |
| `renderToolbar(props)`          | Replaces the default heading; renders before the collapsible body. Receives `FilterPanelToolbarProps`, described below.                                                                                                                                                             |
| `className`                     | Optional host layout classes; keep scoped theme tokens.                                                                                                                                                                                                                             |

`FilterPanelToolbarProps` supplies `panelId: string`, `mode: FilterMode`, readonly
`options: FilterOption<FilterMode>[]`, `pending: boolean`, `disabled: boolean`, and
`onModeChange(mode): void`. Use the supplied options and callback for mode controls;
the callback also rejects transitions while disabled or to simple mode with nested
or incomplete conditions. `panelId` connects external disclosure `aria-controls`
to the body. `renderToolbar` remains visible when collapsed. The default toolbar
is unchanged for standalone panels. Add filter aligns left; Undo, Clear and Query
align right, with Query last.

Field bindings are fixed after adding. Ordinary conditions occupy equal-width grid cells within each group and reflow to one column in narrow panels; AND/OR/NOR/ELEMENT_MATCH span the grid as explicit containers. Delete controls align to the trailing edge. Standalone FieldFilter controls retain their content-sized layout. Simple mode has no condition action menu or ordering controls. Advanced mode supports adding, deleting and editing groups; conditions and groups cannot be moved to another group. Built-in scalar rows have no Clear or Special value buttons. Delete input text to unset it; use the null/empty-string operators for those predicates. The trailing remove button deletes the whole condition. Enum dropdowns retain their unset option. Clear and Undo only edit the buffer. Apply retains unset controls; Undo returns to the last applied editing state. An acknowledgement of the submitted value preserves edits made during the request; a different externally supplied value resets the panel. Key panels by instance/scope and keep custom component local state mounted or in host context if it must survive unmounts.

Add filter opens a button-anchored Popover with grouped checkboxes, using
`FilterFieldDefinition.group?: string`. It does not occupy page layout space;
the popup caps its width/height and scrolls its field area internally. It stays
open during selection changes. Done or Escape closes it and restores trigger
focus; outside interaction also dismisses it.

Checkboxes reflect the current group's direct field bindings, including unset
values. Checking adds a condition; unchecking removes that field's direct
conditions from that group, without changing other groups or querying. Simple mode
keeps one condition per field. Advanced mode displays each selected field’s direct
condition count and an Append condition icon for additional conditions in AND,
OR or NOR groups. The checkbox remains selected while any direct condition exists.
Changing logical operators preserves all conditions. In advanced mode, an adjacent icon dropdown adds AND/OR/NOR to the current
group; these three entries are excluded from the field picker. Disallowed
operators are disabled. Simple mode omits this icon. Root-level operators
remain add actions. Removing a field from its filter row also updates its
checkbox. Empty nested groups stay incomplete until filled or removed.

Groups follow their first occurrence in the definitions; mixed ungrouped fields
use Other fields. `group` is a nonempty display string when supplied and is
validated for remote definitions.

```ts
const fields: FilterFieldDefinition[] = [
  { field: 'amount', label: 'Amount', type: 'number', group: 'Order' },
  { field: 'status', label: 'Status', type: 'string', group: 'Order' },
  { field: 'customer', label: 'Customer', type: 'string', group: 'Customer' },
];
```

### Custom editors

`FilterRegistration` is a union of `FilterEditorRegistration` (`render?: 'value'`, the default) and `FilterComponentRegistration` (`render: 'filter'`). Each is one complete filter definition containing its React `component`, pure `compile`, optional `clear`, supported `modes`, and optional `supports(props, context)`. Register it once in `extensions.filters`; React applications do not register a separate compiler. The former composes inside the default frame; the latter owns the complete non-container body, including labels, values and controls. Registration always includes a pure `compile`; optional `clear` defines clearing behavior.

`FilterEditorProps` supplies cloned readonly component `props`, `operator`, readonly `field`, current-scope `fields`, `mode`, host `context`, JSON `options`, `disabled`, `onChange(props)` and `onValidityChange(valid, message?)`. Publish raw serializable component properties, including selected IDs and display labels. Compilation belongs to the registration and runs independently of mounting. Builtin-compatible renderers can use `compileBuiltinFilter` and `clearBuiltinFilterProps`. Invalid local buffers must report `onValidityChange(false)`; a later true notification does not make invalid compiled output valid.

Explicit saved references remain attached to their components. Missing registrations and invalid outputs block Query; rendering failures are contained per editor and offer explicit built-in fallback. Logical and element containers use built-in tree controls. Compiler output cannot change the bound field, escape scope or make the component into a container, though it may combine predicates for its bound field. Callbacks from cleared, replaced or unmounted editors are ignored. `FilterValueEditor` remains available with `{node, field?, fields, disabled?, onChange(node)}` for raw built-in draft editing.

`FilterComponentProps extends FilterEditorProps` adds:

| Prop                   | Contract                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                   | Stable DOM-safe identity for this panel/node; do not persist it.                                                                                 |
| `operators`            | Readonly `FilterOption<FilterOperator>[]` for the current binding and mode, including disabled display-only options.                             |
| `errors`, `errorId`    | Current errors and the optional ID of the panel-rendered error text; use for input `aria-invalid` / `aria-describedby`.                          |
| `onOperatorChange(op)` | Validated operator transition using the latest draft. Preserves compatible values and currently reported invalidity, including same-event calls. |
| `onClear?()`           | Present only when the registration provides clear semantics; clears raw props through that function.                                             |
| `onRemove()`           | Remove the whole node without applying or saving.                                                                                                |

All mutation callbacks ignore disabled and expired editor sessions. Complete components own their UI and accessible labels; the panel retains equal-width layout, error display, field/scope validation, logical/element containers and manual Query. Candidate loading and temporary component-local buffers remain the host editor's responsibility; persistable state belongs in component props.

```tsx
const extensions: FilterExtensions = {
  filters: {
    'customer-picker': {
      render: 'filter',
      component: MyCustomerFilter, // ComponentType<FilterComponentProps>
      compile: compileBuiltinFilter,
      clear: clearBuiltinFilterProps,
      modes: ['simple', 'advanced'],
    },
  },
};
```

The corresponding field uses `editor: {name: 'customer-picker', options: {...}}`; remote definitions contain this JSON reference, never React components or callbacks. The complete example is `View Engine/Filter Panel` → `完整自定义筛选器 · 组件契约`. See the [component persistence plan](../../../docs/superpowers/plans/2026-09-08-filter-component-persistence.md) for responsibilities and lifecycle rules.

### FilterSelect

| Prop                   | Contract                                                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`              | Readonly `FilterOption<Value>[]`; labels are separate from emitted values.                                                                                                                                     |
| `value`                | Optional controlled `Value` or `null`; omitted/undefined values default to null and show the placeholder.                                                                                                      |
| `onValueChange(value)` | Called with the selected non-null value; does not query or save.                                                                                                                                               |
| `onClear()`            | Optional callback enabling the popup's Clear selection item. The host sets the controlled value to null/undefined; this does not call `onValueChange`, query or save. Omit it for required operator selectors. |
| `label`                | Required accessible name for the trigger.                                                                                                                                                                      |
| `placeholder`          | Optional text when value is null.                                                                                                                                                                              |
| `inline`               | Defaults to false. True uses an InputGroupButton trigger for a joined field control.                                                                                                                           |
| `disabled`             | Defaults to false. Disables selection.                                                                                                                                                                         |

The menu uses shadcn Select / Base UI with selected indicators and keyboard interaction. It opens at the trigger edge with `alignItemWithTrigger={false}` and `align="start"`. The menu is portalled outside clipping parents while inheriting the component's theme when opened.

### FilterSearchSelect

A searchable single select backed by Base UI Combobox, styled with the shadcn base-nova tokens. Exported from `/react`; its `FilterSearchSelectProps<Value extends string>` extends `FilterSelectProps<Value>` with optional `searchPlaceholder` (default `搜索选项…`) and `emptyText` (default `没有匹配选项`). The selection placeholder defaults to `未设置`.

The input is inside the popup: the native Combobox filters `options` by label and handles keyboard navigation. Typing only changes the candidate search, never the selected value or applied query. `onValueChange` emits the selected string ID; optional `onClear` enables a direct Clear control. Disabled options and an already-open disabled picker cannot select. If the selected ID is absent from `options`, that ID remains visible rather than silently clearing it. Popup portals inherit the trigger's scoped theme.

Use it inside a locally registered custom editor; it does not require changes to FilterPanel or the Wow compiler:

```tsx
function CustomerFilter({ props, disabled, onChange }: FilterEditorProps) {
  return (
    <FilterSearchSelect
      label="客户选择"
      options={customers}
      value={typeof props.value === 'string' ? props.value : null}
      onValueChange={id => onChange({ ...props, value: id })}
      onClear={() => onChange(clearBuiltinFilterProps(props))}
      disabled={disabled}
      inline
    />
  );
}
```

Register this component with `compile: compileBuiltinFilter` and `clear: clearBuiltinFilterProps` in `extensions.filters['customer-search']`, reference it with the field's `editor.name`, and restrict that field to `operators: [FilterOperator.EQ]`. `View Engine/Filter Panel` → `自定义筛选器 · 内置搜索 Select` provides the complete registration, compatible-node fallback and manual-apply example. Candidate search here is local; remote candidate loading remains the host editor's responsibility.

### FieldFilter

| Prop                         | Contract                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `field`                      | A `FilterField` with an immutable field path and business label; there is no field picker inside the component. |
| `operator`                   | Controlled string operator, usually a Wow `FilterOperator` value.                                               |
| `operators`                  | Readonly allowed `FilterOption<Operator>[]`.                                                                    |
| `onOperatorChange(operator)` | Publishes an operator change only. The field binding is not editable.                                           |
| `children`                   | Optional value editor, preferably `InputGroupInput` or another compatible editor.                               |
| `onRemove()`                 | Optional callback; omitting it removes the delete button.                                                       |
| `disabled`                   | Defaults to false. Disables the operator, remove action and native form descendants.                            |

The parent owns expression validation, pending edits, manual query and view save. Separate components can bind the same field; their state is controlled independently by the parent.

### FilterDatePicker

| Prop                  | Contract                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `value`               | Optional controlled `Date`; `undefined` shows the placeholder. Invalid dates show an invalid state. |
| `onValueChange(date)` | Receives the selected `Date` or `undefined`; selecting a day closes the panel.                      |
| `label`               | Required accessible name. The trigger includes the displayed date.                                  |
| `inline`              | Defaults to false; true uses an InputGroupButton for a joined field control.                        |
| `disabled`            | Defaults to false; disables the trigger and calendar days, including an already-open panel.         |

Composes shadcn Calendar and Base UI Popover. The calendar uses the Chinese locale and displays `YYYY-MM-DD`. A date represents a selected calendar day; the component does not convert it into a Wow timestamp or apply a timezone.

### FilterTimeInput

| Prop                   | Contract                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `value`                | Optional controlled raw string; omitted/undefined values default to an empty string.  |
| `onValueChange(value)` | Receives the raw text or updated clock value; does not query or save.                 |
| `label`                | Required accessible name for the input and clock controls.                            |
| `inline`               | Defaults to false; true omits the outer InputGroup border for use inside FieldFilter. |
| `disabled`             | Defaults to false; disables text input and clock selectors.                           |

Uses shadcn InputGroup, Popover and Select for a 24-hour clock. Nonempty values outside `HH:mm`, `HH:mm:ss` or `HH:mm:ss.fraction` (one to nine digits) receive `aria-invalid`. Unset or empty input is valid and never receives a required-field error. Editing hours or minutes preserves existing seconds and fractional precision; selecting seconds adds the seconds segment when absent. Malformed text is never silently converted to a query value. The host decides timezone, precision conversion and when to apply it.

For operators requiring a value, a fully unset editor remains visible but contributes no query predicate. If no predicates remain, the host applies `filter.matchAll()`. A composite date/time value is unset only when both parts are empty: one filled part requires completion and cannot silently remove the predicate. Clearing a value does not change the applied expression until Query. Operators that require no value remain active; explicit null, zero, false and valid empty-string literals retain their Wow semantics.

Clock selectors change only the selected segment of the raw text, including during partial input: `12:` plus minute `30` becomes `12:30`; `07:45:` plus second `30` becomes `07:45:30`. Editing seconds preserves the fractional suffix. Unedited missing or malformed segments remain available for correction instead of resetting to zero.

### Composition primitives

Exports: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectTrigger`, `SelectValue`, `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupText`, `Calendar`, `Popover`, `PopoverContent`, `PopoverTitle`, `PopoverTrigger`.

Select items belong in `SelectGroup`. `SelectContent` preserves the Base UI popup props plus `side`, `sideOffset`, `align`, `alignOffset`, `alignItemWithTrigger` and optional `container` / `footer: ReactNode`. The footer renders outside the listbox, with a separator; use it for tabbable actions that must not become selectable values. Its primitive positioning defaults remain bottom / 4px / center / 0 / true; `FilterSelect` explicitly uses edge alignment. The root supplies the theme for the default body portal.

Default styling comes from shadcn `base-nova`, with `fve:` utilities and `--fve-*` tokens. CSS intentionally has no global preflight. Explicit theme boundaries use `.fve-root[data-theme="light"|"dark"]`; native `light-dark()` is retained in the build.

Popover also inherits its trigger's theme in the body portal. Calendar forwards React DayPicker props and uses shadcn day buttons with keyboard focus support.

## Storybook

Build the package, then run `pnpm storybook` from the repository root. `View Engine/Filter Panel` consumes the public package exports and demonstrates business filters, nested logic/element scopes, custom editors, query errors, dark mode and a 50-operator gallery. `View Engine/Date and Time` covers individual controls. Its combined example retains edits until Query, then creates a Wow filter using browser-local time and epoch milliseconds. It makes no service requests. Focused browser checks: `pnpm exec vitest run --project=storybook stories/view-engine/`.

## Record views and host contract

The core also exports `ViewEngine`, `ViewDefinition`, `ViewInstance` (currently
`RecordViewInstance`), `RecordViewConfig`, `ViewHost`, the session/snapshot types,
record validators and `readRecordValue` / `getRecordKey` helpers. These contracts
and query execution remain independent of React. Definitions, instances and
query records are JSON data; renderer functions belong in the React extension
map, never in a remote definition. Source paths are used exactly as supplied,
without a `state.` prefix or a visibility-based projection.

```ts
const engine = new ViewEngine({ definitionId, host });
const unsubscribe = engine.subscribe(() => {
  const { definition, selectedInstanceId, sessions } = engine.getSnapshot();
});
await engine.load();
// Later, release this page's fixed user/tenant/access scope.
unsubscribe();
engine.dispose();
```

`ViewDefinition` contains `id`, `title`, `sourceId`, `rowKey`, `fields` and optional
`allowedOperators`, `filterEditors`, `recordActions: {global?, table?, row?}`. A
`ViewFieldDefinition` extends `FilterFieldDefinition` with `sortable?: boolean`,
`cellRenderer?: RendererReference`, `summaryFunctions?: readonly RecordSummaryFunction[]`,
and `numberFormat?: Intl.NumberFormatOptions & { locale?: string }`.
Sorting requires `sortable: true`.
`RendererReference` uses the existing `{name, options?}` JSON contract. Filter
references keep field `editor` and definition `filterEditors`; there is no
separate filter-renderer protocol.

`ViewInstance` contains `id`, `definitionId`, `title`, `kind: 'record'`, `scope`,
`config`, optional `revision`. Scope is `{type:'personal'}` or
`{type:'public', source:'system'|'shared'}`. Scope describes classification,
not permission. Config contains `filters: FilterConfiguration`, `sort: FieldSort[]`,
`pagination: {mode:'paged'|'cursor', size:number}` and
`presentation: {layout:'table', table:{columns:RecordColumn[]}}`. The former `config.filter` shape is rejected; compiled Wow filters are runtime-only.

Columns form an ordered, nonempty array with unique `id`, optional `title`,
`width`, `visible`, `pinned` and `renderer`. Field columns add `{kind:'field',field}`;
action columns use `{kind:'actions'}` and require either a column renderer or
`definition.recordActions.row`. At least one column must remain visible.
Widths range from `RECORD_COLUMN_MIN_WIDTH` (64) to `RECORD_COLUMN_MAX_WIDTH`
(960), default `RECORD_COLUMN_DEFAULT_WIDTH` (180). Action columns cannot sort.
Visible, unpinned `string` columns without enum options and with omitted `width` equally share available
space above the default size, capped at 480. All explicit widths and other columns
remain fixed; insufficient space scrolls horizontally. Surplus space after caps or
when all widths are explicit stays before the right-pinned region. Container
changes update presentation only, without callbacks, dirty state or queries.
Dragging an automatic column uses its rendered size and persists only the changed
column's actual new width; zero-distance gestures preserve automatic sizing,
including if the container changes during the gesture. Column settings have no width
input; use header-edge dragging (or keyboard arrows) for sizing. Hosts can omit width
to opt into default/automatic sizing.
Changing order, visibility or width changes only presentation, never the query.

`pinned?: RecordColumnPinning` accepts `'left'`, `'right'` or `false` for ordinary
fields, defaulting to unpinned. The field bound to `definition.rowKey` always pins
left, and action columns always pin right; conflicting preferences cannot override
these rules. Identity uses the bound field path, not the column's display ID.
`getRecordColumnPinning(column, rowKey = 'id')` resolves the effective side without
rewriting stored JSON or marking the instance edited. Pass `definition.rowKey`
for nested/custom keys. Column settings use an icon button with `aria-pressed`
to toggle pinning, without a side selector. A new pin inherits `left` or `right`
from exactly one adjacent pinned settings row; zero or two pinned neighbors disable
pinning. Unpinning an ordinary field sets `false`. Existing host-configured right pins stay effective until
the user changes them. Key/action icons are pressed and disabled.

`orderRecordColumns(columns, rowKey = 'id')` returns a new array ordered as key
columns, other left-pinned fields, unpinned fields, other right-pinned fields, then
actions. Each group preserves its configured order; hidden columns remain in the
array. Settings permit moves within a group, keeping key/action columns at the
edges. Headers, records and summaries share this order and
the same offsets, which follow visible column widths. Hidden columns keep their
pin configuration but occupy no space. When selection is enabled, its checkbox
column stays on the left before field columns. Pinning and unpinning do not query
records, invalidate aggregation or clear selection. Sticky cells retain the
table's light/dark, hover and selected backgrounds without showing scrolled text
through them.

| Host member                                    | Contract                                                                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loadDefinition(id, signal?)`                  | Async complete definition. Optional when local definition is supplied.                                                                                                                           |
| `listInstances(definitionId, signal?)`         | Async `ViewInstanceList`; complete instances and a nullable default ID, no duplicate per-item load. Optional with local list.                                                                    |
| `loadInstance(id, signal?)`                    | Async full instance, used for an unknown selection or explicit reload.                                                                                                                           |
| `resolveSource(sourceId)`                      | Required configured `RecordQuerySource`, or Promise of source; requires Wow `paged` and `cursor`, with optional `aggregate` for all-record summaries.                                            |
| `getInstancePermissions(instance)`             | `{save, saveAsPersonal, saveAsShared, delete?, rename?}`; absent means false. Missing write callbacks also disable the corresponding capability.                                                 |
| `saveInstance(instance)`                       | Async full same instance and submitted content, with a new revision if used.                                                                                                                     |
| `deleteInstance(id, revision?)`                | Optional `Promise<void>`; resolve only after deletion, treat already absent as success. Enforce caller access, system-view protection and optimistic revision checks in the host service.        |
| `renameInstance(id, title, revision?)`         | Optional `Promise<ViewInstance>`; changes only title and returns the complete persisted instance with its revision. Must preserve config, scope, ID and definition.                              |
| `saveInstanceOrder(definitionId, instanceIds)` | Optional `Promise<void>`; saves the fixed current user's complete display order. `listInstances` should subsequently return that order. It does not change shared/public metadata or visibility. |
| `createInstance(instanceWithoutIdOrRevision)`  | Async full newly identified instance with exactly the submitted content.                                                                                                                         |

Deletion requires both `delete: true` and `host.deleteInstance`; omission disables
it. System instances (`public/system`) are never deletable or renamable, even if the host
permission callback grants those operations. `setTitle` also rejects system names. The engine passes the persisted ID and
baseline revision, accepts draft/pending filters after UI confirmation, and
serializes deletion with save/create/reload for that instance. While deleting,
`writeStatus` is `deleting`. It removes the session only after host success;
failure retains the view, draft, records and selection and sets `writeError`.
Deleting the active instance selects the first remaining ID in host list order
and queries it; deleting another instance preserves current selection. No
remaining instances leaves a ready, empty page. Query errors in the replacement
view do not turn a completed deletion into a failed deletion. A late request
completion after `load()` or `dispose()` cannot modify the new lifecycle.
The host owns persisted list/default maintenance, including for local definitions;
use an updated local instance list when constructing a new engine.
`ViewPage` exposes a unified Manage views dialog beside the sidebar heading.
The view switcher dropdown includes a footer action with its icon and label;
there is no separate management icon beside the switcher trigger. Opening the
action closes the dropdown without changing selection or querying, and closing
management returns focus to the current switcher trigger. The management dialog
stays mounted when the dropdown closes or deletion changes the active instance.
The old Delete item in the save menu is removed.
The dialog groups personal/public views. Names start as text; clicking the Edit
icon opens and focuses the input. Save or Cancel returns to text and focuses the
Edit icon. Escape cancels that name edit without closing management; failed saves
keep the input for retry. The dialog also provides confirmed deletion, and within-group drag handles with keyboard Up/Down support.
The user-specific order may include system views. Their names and delete controls
remain unavailable. The deletion confirmation identifies the view, explains that
business records are unaffected, and warns about shared-view impact and discarded
drafts when applicable. Cancel is initially focused; failures stay in the dialog
for retry. Deleting an instance keeps management open and returns focus to its
heading. Writes cannot be dismissed or submitted twice. Closing management discards
unsubmitted name edits without touching record-view drafts.

Rename requires both `rename: true` and `host.renameInstance`. The engine passes
the persisted revision, trims and rejects empty names, and serializes rename with
other writes/reload for that instance (`writeStatus: 'renaming'`). A successful
response updates the baseline title/revision while retaining draft filters and
columns, pending inputs, selection and query results. Later local title edits
remain intact. Mismatched response content sets `requiresReload`; it is not
silently accepted or retried.

`canReorderInstances()` reports the optional host callback capability.
`reorderInstances(instanceIds)` requires an exact permutation of the currently
loaded IDs. It persists before publishing, serializes order requests and neither
selects a view nor queries data. Failure leaves the previous order intact. If
membership changes while saving, completion preserves added IDs and never
resurrects deleted IDs. The host must validate current-user access and persist
these preferences under that user's identity, including for public/system views.

Local input uses `new ViewEngine({definitionId,host,definition,instances,filterCompilers})`. Optional `filterCompilers` supplies the React-independent capabilities for this directly owned engine; keep them consistent throughout the engine scope. `ViewPage` does not accept this option and derives the same capabilities solely from `extensions.filters`. Unknown saved components remain in configuration and block queries until their compiler is available.
An empty list or absent/unknown default leaves selection empty without a query.
A foreign instance is rejected. Explicit selection loads an unknown instance
through `loadInstance` and validates its definition before querying.

The host belongs to one fixed user, tenant and access scope for the engine's
lifetime. Dispose and recreate on scope change (key the React page accordingly).
Token refresh within the same scope is normal. The host must bind write identity
when invoking a request; backend authorization remains authoritative.

### Engine methods and runtime state

`ViewEngine` is a composition facade. Internally, `SessionStore` owns immutable
publication and derives session flags; `EngineScope`/`InstanceWork` coordinate
lifetime/navigation and write/reload exclusion. `RecordEdits` owns validated
configuration changes, `RecordQueries`/`RecordSummaries` own independent reads,
and `ViewLoader`/`ViewReload`/`ViewPersistence`/`ViewManagement` own the host flows.
These internal services are not extension entry points. Use public commands;
the runtime dependency graph of the core contains no React, DOM or table UI.

Navigation is checked again after synchronous subscriber notifications, including
query cancellation during selection or save-as. A later loaded or pending
selection wins over an older operation's automatic selection of a created copy.

`getSnapshot` is referentially stable until state changes; `subscribe` returns
an unsubscribe function. Snapshots isolate and freeze JSON data. Each session
keeps baseline and current instance, dirty flag, transient filter draft/mode,
`filterBaseline` (accepted editor tree), `appliedFilter` (compiled query or null), `filterValid` (reported local editor validity),
derived `filterPending`, rows, total, page/cursor, selected keys, `pageSummary`, `allSummary`, and independent query/write
status and error. Runtime state is never serialized into instance config.

`RecordSession.baseline`, `instance`, `filterDraft`, `filterBaseline` and `rows`,
plus `ViewEngineState.definition`, use `DeepReadonly<T>` recursively. Assignment
to nested metadata or mutation of query arrays is rejected by TypeScript.
`applyFilter`, `setFilterDraft`, `setSort` and `setColumns` accept readonly
snapshots directly and copy accepted inputs. Host query/write/permission
callbacks still receive independent editable DTOs. `RecordTable` accepts
readonly definitions, instances and rows, plus required explicit `appliedFilter: DeepReadonly<FilterExpression> | null`; presentation/summary readers also
accept readonly inputs.

Methods with an optional instance ID default to the selected instance:

- `load()`, `selectInstance(id)`, `reloadInstance(id?)`, `canReloadInstance(id?)`, `refresh(id?, {background?: boolean})`, `dispose()`.
- `applyFilter(expression?,id?)`, `setFilterDraft(draft,id?,valid?)`,
  `setFilterValidity(valid,id?)`, `setFilterMode(mode,id?)`.
- `setSort(sort,id?)`, `setColumns(columns,id?)`, `setPage(index,id?)`,
  `setPageSize(size,id?)`, `nextPage(id?)`, `setSelection(keys,id?)`.
- `refreshSummary(id?)` (async).
- `setTitle(title,id?)`, `restore(id?)`, `save(id?)`,
  `saveAs({title,scope},id?)`, `deleteInstance(id?)`, `renameInstance(title,id?)`, `getPermissions(id?)`.
- `canReorderInstances()`, `reorderInstances(instanceIds)` save the current user's navigation order.

`filterPending` is derived from compiler errors, local editor validity and equality
between the compiled draft and `appliedFilter` using `sameFilterQuery`. `setFilterDraft` compiles the
candidate and can atomically update local validity; omitted `valid` retains it.
When valid edits compile to the applied query, their configuration and editor
baseline are accepted immediately, without a request. Unset controls and opaque
display props can therefore be saved directly. `dirty` compares accepted
configuration with the saved baseline. Changed query values remain draft-only
and block Save until Query accepts them. Synchronized supported mode changes
are persisted; pending edits retain their mode until Query accepts the whole
configuration. These rules also apply without React.

`applyFilter()` compiles the current draft. Programmatic clients must first call
`setFilterDraft`; optional `applyFilter(expression)` verifies that supplied output
equals the compiled result and cannot create editor state from an expression.
Acceptance updates configuration, `filterBaseline`, `appliedFilter`, pagination
and summary scope together. Invalid local input or compiler output rejects
before mutation or requests. `setFilterValidity(true)` cannot bypass changed
query semantics. Undo/Restore, Save As and reload restore component attributes
from configuration, never by reversing a compiled query.

`appliedFilter === null` means no successful compilation. Records, aggregate
queries and action consumers must not substitute MATCH_ALL. Runtime applied
scope is never persisted into `instance.config`.

Async operations return `Promise<void>` and reject on failure. Query and write
failures are also reflected in state. UI consumers must handle rejections. Superseded
or disposed results cannot update state. Queries pass an AbortController to
Wow, and generation checks also protect against sources that ignore abort.

Paged requests use one-based `{index,size}`; cursor requests preserve opaque
`nextCursor` and only advance forward. Filter/sort/size reset to the first page;
refresh restarts cursor pagination. Selection uses explicit current-page keys
and clears when query scope/page/refresh changes. Number `0` is valid, and number
`1` differs from string `'1'`. Duplicate, missing or invalid keys fail the query;
there is no array-index fallback.

`refresh(id, {background: true})` preserves rows and page summaries during the
request; `RecordSession.refreshing` indicates this separate loading state.
Successful results replace the rows and recalculate summaries. Failure retains
the last rows, sets the query error and requires an explicit retry. Background
refresh skips pending filters, selected records, active writes, recovery states,
non-successful queries, another refresh or an in-flight all-record summary, and
cursor pages after the first. Selecting records during a background read cancels
that read; late responses cannot overwrite the selection.

Query applies the filter synchronously, then executes the request. Filter edits
remain transient until Query. Pending filters block both save forms. A save
captures a submission snapshot; success advances its baseline but keeps edits
made during the request dirty. Save-as never changes the source session; it
selects the new instance only if the source is still selected. New edits on that
source follow into the newly selected draft, with the submitted new name/scope.
Only personal/shared targets are allowed, never system.

Write responses must match submitted identity, kind, title, scope and config;
create must return a new ID. A mismatched or malformed echo marks `requiresReload`
and prohibits more writes. Reload obtains a new baseline/revision and preserves
local edits for comparison. Ordinary request failure retains edits and does not
automatically retry. `canReloadInstance(id?)` reports whether the host supplies
the read interface required for recovery. The page offers reload after ordinary
write failures as well as mismatched echoes, so revision conflicts can be resolved
without discarding the draft.

For a mismatched create echo, reload verifies the actual created ID; it never
unlocks the source merely by reading that source again. If the ID is unknown,
`listInstances` must return one new instance matching the submission. No match or
multiple matches leaves writes blocked and exposes the refreshed list for
reconciliation. A newly discovered copy uses the remote baseline while keeping
the submitted title/scope and latest source config/filter buffer for comparison.
An already opened copy retains its own session, including completed or in-flight
saves. The source baseline and draft remain unchanged. Writes and query results received after disposal cannot
select instances or cause new queries.

### Record summaries

Only fields explicitly declared as `type: 'number'` can summarize. Set their
column `summary` to an array of `SUM`, `AVG`, `MIN` and/or `MAX`:

```ts
import type { RecordColumn } from '@ahoo-wang/fetcher-view-engine';

const columns: RecordColumn[] = [
  { id: 'id', kind: 'field', field: 'id' },
  { id: 'amount', kind: 'field', field: 'amount', summary: ['SUM', 'AVG'] },
];
```

`RecordSummaryFunction` contains these four functions; COUNT is not supported.
`getRecordSummaryFunctions(field)` returns all four for numeric fields, or their
explicit `field.summaryFunctions` subset. `[]` disables summaries. Other field
types have no summary controls or capabilities. Definition and instance validation
reject nonnumeric summaries, duplicate selections and unsupported functions, including
COUNT. Action columns cannot summarize; all columns together may select at most
64 metrics (four metrics on one column count as four).

Column settings use a multi-select for the permitted functions. The menu stays
open while toggling selections; clearing the last selection shows “不汇总”. Omitted
or empty `summary` arrays disable summaries. The selected functions are saved
with the instance. The footer displays **本页 and 所有 together
as two aligned rows**; there is no exclusive summary-scope setting or switch.
The scope label appears once in the left selection column, or the first visible
column when selection is disabled, following that column’s pinning. Each column
lists metrics in SUM/AVG/MIN/MAX order regardless of the persisted selection order.
Metric labels stay left, numbers stay right and use tabular digits on a single line. Hiding columns retains their
configuration; the footer is hidden when no visible column summarizes.

Numeric `field.numberFormat` shares formatting between default cells and summaries.
It accepts `Intl.NumberFormatOptions` plus `locale?: string` (default `zh-CN`).
Decimal formatting with no digit options defaults to `maximumFractionDigits: 2`;
currency, percent and unit styles use Intl defaults. For example:

```ts
import type { ViewFieldDefinition } from '@ahoo-wang/fetcher-view-engine';

const fields: ViewFieldDefinition[] = [
  {
    field: 'amount',
    label: 'Amount',
    type: 'number',
    numberFormat: { style: 'currency', currency: 'CNY' },
  },
  {
    field: 'quantity',
    label: 'Quantity',
    type: 'number',
    numberFormat: { maximumFractionDigits: 0 },
  },
];
```

The core exports `formatRecordNumber(value: number, field: ViewFieldDefinition): string`
for custom cells and headless consumers. Invalid formats are rejected when loading
definitions; only numeric fields may declare them. Formatting is for display only:
raw records, aggregates and queries retain full precision. Summary values use a
shadcn Tooltip to expose the raw value on hover or keyboard focus; Escape dismisses
it. Null/unavailable values remain “—”. Narrow columns truncate displayed values
without wrapping; the complete value remains accessible through the tooltip.

- **Page:** calculates from the loaded current-page records, independent of row
  selection. Numeric functions skip null/missing values and reject nonnumeric or
  non-finite values. Empty numeric inputs return null, distinct from a real zero.
  Calculation uses JavaScript numbers.
- **All:** automatically calls the source's optional Wow `aggregate` when summary
  metrics are configured. The ungrouped request contains the applied `filter` and
  metrics only: no page, cursor, sort, selection, projection or record scanning.
  The response must contain exactly one row with every metric alias, each a finite
  number or null. Invalid/missing results are errors, never page totals or zero
  fallbacks. Missing `aggregate` produces an all-summary error without preventing
  record queries or local page calculation.

All-record results are reused across paging, sorting and presentation edits.
Query, refresh and instance selection refresh them; changed filters or summary
columns invalidate them. Unapplied filter edits leave both results on the applied
scope. Function changes recompute the page and request the new all-record metrics,
without reloading records.

`RecordSummaryResult` is `{status: 'idle' | 'loading' | 'success' | 'error',
values: Readonly<Record<string, Readonly<Partial<Record<RecordSummaryFunction, number | null>>>>>,
error: string | null}`; values are keyed by column ID and function, for example
`values.amount.SUM` and `values.amount.AVG`. Session `pageSummary` and `allSummary` are transient and
independent of each other and the record query. `load`/record queries do not wait
for aggregation. `refreshSummary(id?)` recalculates the page and retries aggregation
without reloading records; errors reject the promise and populate summary state.
Aborted/old responses cannot overwrite newer results. Removing all summary metrics
cancels pending aggregation. Separate record and aggregate requests do not promise
an atomic server snapshot.

The core exports `calculateRecordSummary(rows, metrics)`,
`createRecordSummaryQuery(filter, metrics)` and
`readRecordSummaryResult(response, metrics)`. Each `RecordSummaryMetric` is
`{id: string, field: string, function: 'SUM' | 'AVG' | 'MIN' | 'MAX'}` without
table display settings. Empty/malformed IDs or fields, duplicate ID/function
pairs and more than 64 metrics are rejected. Query construction requires at
least one metric. `getRecordSummaryMetrics(instance.config.presentation)` adapts
the implemented table presentation to these query inputs. Query/result helpers use aliases
`summary0`, `summary1`, … in stable metric-ID/function order, independent of
column presentation or selection-array order. Pass the same validated metric
bindings to both. `RECORD_SUMMARY_LABELS`
contains the default function labels.

Standalone `RecordTable` requires explicit `appliedFilter` and accepts controlled `pageSummary`, `allSummary` and
`onSummaryRetry()`. It renders both results without fetching or calculating them.
It also accepts `queryError?: string | null` and `onQueryRetry?()`. Failures render
inside the record area rather than as empty data; existing rows remain visible
and are labelled as the previous result. RecordView omits pagination until the
failed query recovers. Retry returns focus to the record-result container.
Record loading uses one centered shadcn Spinner. Each loading summary scope has
one Spinner beside its label, independent of the number of selected metrics.
Pending metric slots stay blank; pagination omits duplicate loading text. Spinners
have accessible status labels and respect reduced-motion preferences. Loading
does not collapse metric rows.

Each failed scope shows one error icon beside its label. Activating it opens a
Popover with the cause; all-summary errors include “重试汇总” when `onSummaryRetry`
is provided. Page-summary errors show their own cause without retrying all records.
Errors are announced once per scope and stay inside the corresponding summary row,
without a separate full-width alert below the table. Closing details returns focus
to the error trigger, or to the scope label when retry clears the error.

Loading and errors remain separate: an all-summary failure retains the page values
and records; retry only requests aggregation. Null/unavailable values display “—”; actual zero
remains zero. Long numbers stay on one line with an ellipsis and their complete,
unrounded value in the title. Summary cells never pass fabricated records to cell
or business-action renderers.

### React composition and business extensions

`ViewPage` accepts `Omit<ViewEngineOptions, 'filterCompilers'>`, required nonempty `scopeKey`, plus `extensions`, `filterContext`,
`selectable` (default false), `autoRefreshPaused` (false), `className`, and `initialSidebarCollapsed` (false).
It owns creation/loading/disposal, including React StrictMode. `[scopeKey, definitionId]`
identifies the lifetime; change scopeKey when user, tenant or access scope changes.
Same-scope host callbacks and optional capabilities update after commit without
recreating the engine. Local definition and list are initialization inputs;
new object references do not reload them. Change the React key to explicitly
reinitialize local data. `ViewPageContent` takes an
already-owned `engine` with the same visual props and leaves lifecycle to the
caller. `RecordView` renders only the selected record instance's business
operations, FilterPanel, column controls, table and pagination. The lower-level
`RecordTable` and `RecordColumnSettings` can also be controlled directly.
`ViewInstanceMetadata`, `RecordQueryConfig` and `RecordTablePresentation` name
the common metadata, record query and implemented presentation boundaries.
`RecordViewConfig` combines query settings and presentation, replacing the compiled `filter` with persisted component `filters`; `ViewInstance` currently remains the
record kind. These named boundaries do not claim additional view renderers.
The published record table relies on React Compiler to cache derived values, callbacks and JSX; unsubmitted draft edits do not rerender record cells in the compiled build. Uncompiled source tests verify the same functional behavior without promising identical render counts. Its widths,
effective pinning, filler and summary-label region are computed in a pure internal
layout module. The engine and auto-refresh control share one domain block policy;
document visibility and focus remain React concerns.
RecordView's global toolbar orders the title, current instance and Save split button before its global actions.
`toolbarStart?: ReactNode` replaces its default definition heading with leading
content; ViewPage owns this slot for its Save split button and instance navigation.
Save As and Restore live in the view options menu; instance management has its own entry beside navigation; without save permission, Save As is the
primary button. Save As displays described Personal/Public radio options; a denied
scope stays visible but disabled, and the default selection uses an allowed scope.
Personal means visible only to the user; Public means visible to users with access.
Pending filters block saving/Save As but still allow Restore. The
filter split control toggles disclosure and selects simple/advanced mode through
FilterPanel's guards. Global creation actions sit at the right edge. A separate
table toolbar keeps selection status and Clear selection on the left; table actions and column settings align right, in that order. Clear selection retains the query/draft and returns focus to the toolbar.
Record counts and pagination share the footer. Filters start expanded; the
toolbar disclosure retains mounted editors and their drafts. Pending edits display
near Query while expanded and on the filter toggle while collapsed. The active
instance title/sidebar does not duplicate the notice; other instances keep their
pending markers. Toggling filters does not query or clear selection
and is not saved to the instance. Controls wrap within narrow containers.
Applied-filter Badge tags appear below the editor and above the table toolbar,
including while the editor is collapsed. The outer AND is split into independent
tags; OR/NOR and element conditions remain atomic groups. Close buttons unset the
values and immediately query, retaining fields, operators, groups and editor IDs.
Value-free predicates do not expose a clear button. Clearing is disabled during a
loading query or pending edits; query or undo the draft first. Enter in a single-line
filter input applies a valid query. Composition/IME confirmation, selectors,
multiline inputs, portals and keys handled by custom editors do not trigger queries.
Labels preserve exact thresholds and wrap long expressions; no tags displays all
records. Pending drafts do not replace the tags until Query is applied. The global
filter toggle only controls visibility and mode, without an applied-filter tooltip.
Auto-refresh tooltips explain the pause cause and resumption rule. Successful
saves briefly show a check and “已保存” with an accessible status announcement.

If fixed regions leave less than 128px for ordinary fields, RecordTable temporarily
shrinks key columns, presents actions in 64px popovers and lets ordinary pinned
columns scroll in the center. Key values retain readable suffixes and expose their
full values through tooltips. Saved configuration is restored when width permits;
mandatory-column resize handles appear in the regular layout. An explicit warning
covers containers still too small for their mandatory columns. Adaptation does not
save configuration, query records or change the selection. Numeric headers and
cells default to right alignment and tabular numerals.
Column settings use drag handles to reorder within the same fixed group; arrows
are not displayed. Pointer position selects the insertion boundary, and gaps
between rows accept drops at the displayed indicator. The drag handle uses the
browser's native preview without manual popup/iframe coordinate offsets.
Dropping calls `onChange` with the reordered columns; cancelled
or cross-group drops do not change the configuration. Focus a handle and press
Up/Down for keyboard access, with focus retained and the new position announced.
Column settings have one row per column: order handle, visibility/title, optional numeric summary multi-select, and pin icon. Width is adjusted at table-header edges only (drag or keyboard). For an unpinned field, exactly one adjacent settings row must be pinned; the field inherits that side. With zero or two pinned neighbors pinning is disabled. Ordinary pinned fields can still be unpinned; key/action anchors remain locked. The active instance has no separate dirty badge; the save button and pending/error guards express its actionable state. Inactive instances retain draft markers.

The page uses its own container width (64rem threshold), so it also adapts inside narrow host layouts. The wide page shows personal/system/shared groups; collapsing replaces the
sidebar with a grouped Select. Narrow layouts show the Select without losing
the user's sidebar preference. Toggling navigation neither queries nor clears
buffers, pagination or selection.

The top global toolbar places the filter control, combined manual/automatic
refresh and page expansion before host global actions. Automatic refresh options
are off (default), 30 seconds, 1 minute or 5 minutes. The next interval begins after the previous read
finishes. Automatic refresh checks document visibility and skips focused editors
or popups in addition to the engine guards above. Hosts can set
`autoRefreshPaused` on `ViewPage`, `ViewPageContent` or `RecordView` while their
own business operation is active. The interval resets when switching instances
and is not saved in view configuration.

The button displays the selected period and a deadline-based `mm:ss` countdown,
updated each second without an ARIA live announcement. Paused conditions replace
the countdown with a paused label; active reads show a refreshing label.
Visibility/focus changes update this state immediately. Resuming, selecting a
different period, or completing a manual/background read starts a full interval.
Unmounting or disabling automatic refresh removes timers and activity listeners.

Expand fills the current document viewport while leaving browser chrome visible.
`ViewPage` expands the complete workspace; a standalone `RecordView` expands its
own content. It keeps editors, selection, pagination and portal owners mounted.
Escape closes an active popup first, then exits expansion; the toolbar also
provides Collapse. Expansion is transient and restores body scrolling on exit
or unmount. In an iframe it expands within that frame.

`ViewExtensions` extends `FilterExtensions` with `cells`, `globalActions`, `tableActions` and
`rowActions`, each a local name-to-React-component map. Custom components may use
any React UI. Explicit missing names and renderer failures are visible and
isolated per rendering area.

Global/table action error boundaries retry when their actual renderer inputs
change, including `selectedRowKeys` or `querying`. Unrelated unsubmitted draft
edits keep the failure isolated instead of repeatedly rerendering it.

Core exports `DeepReadonly<T>`. Extension records, instances, definitions, columns,
filters, field metadata and JSON options use recursive readonly inputs. Components
copy required fields into their own form state and submit through host commands
or engine methods; direct writes to a snapshot are compile-time errors.

| Renderer props               | Values                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CellRendererProps`          | `value`, full `record`, stable `rowKey`, page `index`, `field`, `column`, `definition`, `instance`, JSON `options`. Resolution: column reference → field reference → built-in.                                                            |
| `GlobalActionsRendererProps` | `definition`, `instance`, applied `filter` / `sort`, `selectedRowKeys`, `querying`, `options`, `refresh()`. The applied filter is null until compiled. Selection is explicit current-page records, never implicitly all matching records. |
| `TableActionsRendererProps`  | Alias of `GlobalActionsRendererProps`; same applied scope, explicit page selection and bound refresh, rendered in the table toolbar.                                                                                                      |
| `RowActionsRendererProps`    | `record`, `rowKey`, `definition`, `instance`, applied `filter` / `sort`, `options`, `refresh()`. Resolution: column reference → definition row action.                                                                                    |

Definitions select each action area via `recordActions.global`, `.table` and `.row`.
To move an existing batch component, change its definition reference from `.global`
to `.table` and registration from `globalActions` to `tableActions`. The library does
not relocate individual buttons inside a host component.

Business permissions, confirmations and action completion/errors belong to the
host components. `refresh` is bound to the rendered instance even if navigation
changes while a command is running. Global actions remain available on empty
results. The package does not invent business commands.

Cards, AnalysisView and DashboardView are not implemented in this increment;
there is no nonfunctional layout switch. Storybook **View Engine / Record View**
demonstrates this contract with a local simulated service, not a live backend.

### Runnable built-package integration

From the repository root, build with
`pnpm --filter @ahoo-wang/fetcher-view-engine build`, then run
`examples/react/FilterPersistenceExample.tsx` and the matching Library Delivery story demonstrate JSON-backed save/new-engine reload of unset controls and opaque selected ID/display label props. Only changed query values require Query before Save. Run `node packages/view-engine/examples/core.mjs` and
`node packages/view-engine/scripts/verify-package.mjs`.
The latter packs to a temporary directory, checks entry points and scoped CSS,
compares archive contents with dist, runs public imports/core behavior, and
type-checks consumers against the extracted package without private source aliases.
It does not install, publish or modify dependency/build configuration.

`examples/react/OrderExample.tsx` supplies independent global, row, table/batch,
filter and cell extensions. It uses public package imports, readonly inputs,
instance-bound refresh and explicit operation failure/retry handling. Run it with
`pnpm exec vite packages/view-engine/examples/react --host 127.0.0.1 --port 4175`
or open **View Engine / Library Delivery** in Storybook. Its strict local order
service rejects unsupported queries; replace that service with the host's real
authenticated client rather than interpreting the demonstration as backend admission.

Module responsibilities and the cohesive editing-hook size exception are documented
in both package READMEs. Source, tests and stories are organized by behavior; internal
page/table/editor components compose the public surface without expanding it.

Programmatically opening a controlled Dialog, Popover, Select or dropdown menu refreshes its portal theme before paint, just like trigger-driven opening. Closing Save As returns focus to its persistent opener; restoring a save-only instance whose menu disappears returns focus to the view-action group without enabling Save or adding a tab stop.

Portal theme snapshots copy public `--fve-*` tokens and typography but exclude
private `--fve-tw-*` utility state. Each overlay keeps its own transforms/shadows.
The scoped base reset includes `.fve-root` itself, uses border-box sizing and the
default `--fve-border` token; it never resets unrelated host elements.

### React Compiler build boundary

The published `/react` entry is built with React Compiler using the repository Vite `reactCompilerPreset`. Compiler packages are development dependencies; React 19 supplies `react/compiler-runtime`. Consumers do not configure the compiler. Core runtime imports remain React-free and packed verification enforces both entry boundaries.

`ViewEngine.updateHost(nextHost: ViewHost): void` replaces same-scope callbacks/policy and notifies `subscribe`, preserving sessions and drafts without querying records. `ViewPage` calls it after committing a new host prop. Different user/tenant/access scopes require a new engine. `getCapabilitiesSnapshot(): ViewCapabilities` returns a cached, deeply immutable snapshot with `reorder` and `instances[id].{permissions,reload}`; consume it with `useSyncExternalStore(engine.subscribe, engine.getCapabilitiesSnapshot, engine.getCapabilitiesSnapshot)` for render-time capability reads. `getPermissions`, `canReorderInstances`, and `canReloadInstance` remain live imperative checks, not React render subscriptions. Policy callbacks must be pure; replace the host when external policy inputs change rather than silently mutating closures. Commands still recheck live policy. No component opts out with `use no memo`; pure calculation and render caching is compiler-owned. Explicit memoization remains only for the controlled draft clone and theme capture, which are Effect dependencies. Error-boundary recovery follows render inputs, not event-handler identity. Package `test` runs the same suite without and with compilation (`test:compiled`), plus type checks; Storybook exercises compiled public exports.
