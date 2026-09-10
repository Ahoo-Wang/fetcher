# View Engine API

Package: `@ahoo-wang/fetcher-view-engine`, version `5.0.0`. The filter layer and RecordView are implemented: headless compilation and view engine, definitions/instances with host persistence, and React filter/table/card/page components. AnalysisView and DashboardView remain separate work.

Library acceptance: after workspace build, `pnpm verify:view-engine` verifies the packed public API, owns an isolated Storybook process, runs local/HTTP host recovery, and checks the 100-row/30-column/100-filter fixture. `VIEW_ENGINE_BROWSERS=chromium,firefox,webkit` selects the readiness matrix; `VIEW_ENGINE_BROWSER_CHANNEL=chrome` optionally selects installed Chrome for Chromium; `VIEW_ENGINE_ARTIFACTS` retains stage logs, screenshots and JSON. Install matching Playwright browsers first. The CI job uses this same entry point; full unit validation uses `VITEST_MAX_WORKERS=4 pnpm test:unit`.

The readiness gate keeps raw axe findings and permits only the documented WebKit Base UI hidden focus-sentinel naming diagnostic after keyboard navigation checks; it does not certify VoiceOver. This is library validation with simulated services, not consuming-application production authentication or persistence admission.

## Core entry

`src/index.ts` exports the headless compiler and JSON-friendly field/configuration contracts. The basic display contracts remain:

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

Core imports do not load React, DOM or CSS. Field descriptors define field capabilities; persisted component configuration is separate from the compiled Wow query.

### Fields, configuration and compilation

`FilterFieldDefinition` extends `FilterField` with optional `type` (`string`, `number`, `boolean`, `date`, `datetime`, `array`), typed enum `options`, optional display `group`, element-relative child `fields`, allowed `operators`, an `editor: {name, options?}` reference. Unspecified type keeps protocol scalar types; explicit types restrict supported operators and values. The optional global operator allowlist further restricts them.

`FilterComponentConfig` is the only editing and persistence node. It keeps a stable `id`, explicit `component`, `operator`, optional `field`, and `props`; logical/element children use the same node type. Raw numeric text in props uses `FilterScalarDraftValue = {type: 'number', value: raw}`; never interpret a loaded protocol string as numeric input. Mixed scalar collection items can use string/boolean wrappers. `FilterDateTimeValue = {date?: string, time?: string, offsetMinutes?: number}` keeps date/time input. Never reconstruct component attributes from a compiled query.

`createFilterConfiguration` and `isSimpleFilter` accept readonly canonical nodes. `FilterPanel.value`, `defaultValue` and `appliedValue` accept readonly configurations; emitted configurations remain independent editable values.

| Export                                        | Contract                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FILTER_OPERATORS`                            | Complete readonly record of all 50 Wow operators: label, category, input kind and relative-time flag.                                                                                                                                                                                                 |
| `newFilterNode(operator, field?, component?)` | Creates a canonical node with an ID, explicit component (default builtin), unset props, initial container children or ACTIVE deletion state.                                                                                                                                                          |
| `getFieldOperators(field)`                    | Returns operators from field type and explicit field allowlist only; ignores editor defaults.                                                                                                                                                                                                         |
| `isSimpleFilter(root)`                        | Structural eligibility: root MATCH_ALL, field predicates, ELEMENT_MATCH, or a flat AND of these. Each element scope recursively allows fields/elements or their implicit AND, with unique fields per scope. Empty element AND drafts are editable; compilation and mode changes still check validity. |

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
  timeZone?: string; // global view/panel zone; defaults to local
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

| Export                                                                                 | Contract                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createFilterConfiguration(root, mode?)`                                               | Clones and validates the canonical component root, preserving all component references and props. Infers mode when omitted. Field/operator defaults apply only when the panel creates new nodes.                                                                                                                                         |
| `validateFilterConfiguration(value, fields?, allowedOperators?)`                       | Asserts JSON component structure, optional field bindings and an optional definition-wide operator allowlist at every node, including groups and element predicates. Element predicates reject root-only operations through nested groups; a known array without child fields has an empty child scope. Throws on invalid configuration. |
| `compileFilterConfiguration(config, fields, allowedOperators?, compilers?, timeZone?)` | Invokes component-owned pure compilers and returns `FilterCompileResult`. Requires no React mounting. Unknown components, invalid output and cross-field output return errors without an executable query.                                                                                                                               |
| `compileBuiltinFilter(props, context)`                                                 | Compiles built-in payload attributes, reusable by builtin-compatible custom renderers. Returns undefined for unset values.                                                                                                                                                                                                               |
| `clearBuiltinFilterProps(props)`                                                       | Clears built-in values while retaining other component attributes.                                                                                                                                                                                                                                                                       |
| `clearFilterValues(root, fields, compilers?, timeZone?)`                               | Applies registered clear semantics while preserving component IDs and structure.                                                                                                                                                                                                                                                         |
| `sameFilterQuery(a, b)`                                                                | Compares readonly expressions (also accepts null/undefined), ignoring object key order and redundant singleton AND/OR wrappers. Preserves predicate order and does not perform general Boolean equivalence.                                                                                                                              |

Configuration is JSON data. An object property with undefined represents an unset input and is omitted on save; null, false, zero and empty strings retain their meaning. Arrays cannot contain undefined or other non-JSON values. Functions, DOM objects, non-finite numbers and cycles are rejected. Configuration IDs are stable persisted identities; mounted renderer DOM IDs are separate.

A custom compiler may combine predicates for its bound field, but cannot escape that field or its scope. Logical/element containers remain structural component nodes. Custom compiled outputs must satisfy the declared field capabilities and global operator allowlist. The selected built-in operation is also checked before date-only lowering; its generated range/group operators implement that already-authorized calendar-day condition.

Field uniqueness is a simple-mode editing rule, not a compiler restriction. Advanced AND/OR/NOR groups accept repeated direct field bindings, including within element predicates. Compilation and view-instance validation preserve these conditions. `isSimpleFilter` returns false for repeated-field AND drafts, including unset conditions; simple configurations must satisfy this rule in every scope. Element scopes preserve their predicate tree when switching modes; OR/NOR and nested logical groups require advanced mode.

Fully unset scalar predicates and cleared collections are omitted. An explicitly empty new group is incomplete; a nonempty group whose children are all inactive is omitted. Empty output at the query root becomes MATCH_ALL. Inactive children never become MATCH_ALL inside OR/NOR. A missing part of a bound, collection item or date/time pair blocks compilation. False, zero, explicit null and valid empty strings retain their meaning. ELEMENT_MATCH only accepts element-relative fields and excludes root-only metadata/search/deletion nodes.

`ViewDefinition.timeZone` is the global timezone shared by all filters, applied summaries and date/time cells; standalone `FilterPanel.timeZone`, compiler context/last parameters and direct date controls use the same setting. Omission means the local runtime timezone. Fields do not configure individual timezones. `date` fields use YYYY-MM-DD strings; `datetime` queries use epoch milliseconds. Built-in time-enabled filters floor restored fractional seconds and numeric timestamps to the start of their second. Nonexistent local DST times are rejected; new ambiguous local DST times choose the earlier occurrence consistently across system timezones. Editing an existing timestamp retains its `offsetMinutes` hint (integer minutes, the sign used by `Date.getTimezoneOffset()`) when that offset still describes the edited local date/time. A date change across DST seasons uses the new date's actual offset; the hint cannot make a nonexistent local time valid. Relative-time predicates receive Wow `zoneId` from the global timezone (resolved local zone when omitted); the UI has no node-level timezone input. Their `datePattern` and `timeUnit` remain component properties.

```ts
const root = newFilterNode(FilterOperator.GTE, 'amount');
root.props.value = { type: 'number', value: '12.5' };
const result = compileFilterConfiguration(createFilterConfiguration(root), [
  { field: 'amount', label: 'Amount', type: 'number' },
]);
// result.expression: {op: 'GTE', field: 'amount', value: 12.5}
```

## React entry

Import components from `@ahoo-wang/fetcher-view-engine/react` and compiled styles from `@ahoo-wang/fetcher-view-engine/styles.css`.

### FilterPanel

| Prop                                   | Contract                                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`, `onChange(configuration)`     | Controlled `FilterConfiguration`; the parent owns edits. Mutually exclusive with `defaultValue`.                                                                                                 |
| `timeZone`                             | Global timezone shared by all filters; omission uses the local runtime zone.                                                                                                                     |
| `fields`                               | Required field definitions for this root scope; array fields carry their element-relative definitions.                                                                                           |
| `onApply({configuration, expression})` | Receives the accepted configuration and compiled query; the host owns asynchronous requests and cancellation.                                                                                    |
| `defaultValue`                         | Initial `FilterConfiguration` for local ownership. Mode is part of configuration; toolbar mode commands update it.                                                                               |
| `onPendingChange(pending)`             | Observes changed query semantics or invalid editor input. Configuration-only changes are synchronized without a request; this is separate from the saved view dirty flag.                        |
| `appliedValue`                         | Optional accepted configuration baseline. ViewEngine consumers pass `session.filterBaseline`. Keep editing and accepted configurations independently across editor unmounts.                     |
| `onValidityChange(valid)`              | Reports aggregate editor/buffer validity. ViewEngine consumers call `setFilterValidity`; reporting true cannot clear an unsubmitted draft.                                                       |
| `allowedOperators`                     | Optional global operator allowlist, including logical and root operators.                                                                                                                        |
| `extensions`                           | Per-panel `{filters: Record<string, FilterRegistration>}` map; no global registry.                                                                                                               |
| `editors`                              | Optional operator-to-editor-reference map; field references take priority.                                                                                                                       |
| `context`                              | Opaque host definition/instance/business context passed to custom editors.                                                                                                                       |
| `querying`, `queryError`               | Host request state. Editing stays available while querying; an unchanged in-flight query cannot be sent twice, changed filters may be applied. Errors retain applied conditions and allow retry. |
| `disabled`                             | Disables editing and query actions. Defaults false.                                                                                                                                              |
| `collapsed`                            | Defaults false. Hides the panel body while retaining mounted editors and their local buffers.                                                                                                    |
| `renderToolbar(props)`                 | Replaces the default heading; renders before the collapsible body. Receives `FilterPanelToolbarProps`, described below.                                                                          |
| `className`                            | Optional host layout classes; keep scoped theme tokens.                                                                                                                                          |

`FilterPanelToolbarProps` supplies `panelId: string`, `mode: FilterMode`, readonly
`options: FilterOption<FilterMode>[]`, `pending: boolean`, `disabled: boolean`, and
`onModeChange(mode): void`. Use the supplied options and callback for mode controls;
the callback also rejects transitions while disabled or to simple mode with unsupported logical groups, repeated fields within a scope
or incomplete conditions. Recursive ELEMENT_MATCH scopes with implicit AND can switch without rewriting the tree. `panelId` connects external disclosure `aria-controls`
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
checkbox. When `allowedOperators` excludes AND, adding a sibling to a standalone condition is unavailable because it would implicitly create AND; existing bindings remain removable, and permitted OR/NOR groups still accept children. Empty nested groups stay incomplete until filled or removed.

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

`FilterEditorProps` supplies cloned readonly component `props`, `operator`, readonly `field`, current-scope `fields`, `mode`, host `context`, JSON `options`, global `timeZone`, optional `errors`/`errorId`, `disabled`, `onChange(props)` and `onValidityChange(valid, message?)`. Publish raw serializable component properties, including selected IDs and display labels. Compilation belongs to the registration and runs independently of mounting. Builtin-compatible renderers can use `compileBuiltinFilter` and `clearBuiltinFilterProps`. Invalid local buffers must report `onValidityChange(false)`; a later true notification does not make invalid compiled output valid.

Explicit saved references remain attached to their components. Missing registrations and invalid outputs block Query; rendering failures are contained per editor and offer explicit built-in fallback, which remains disabled while the panel is disabled. Logical and element containers use built-in tree controls. Compiler output cannot change the bound field, escape scope or make the component into a container, though it may combine predicates for its bound field. Callbacks from cleared, replaced or unmounted editors are ignored. `FilterValueEditor` remains available with `{node, field?, fields, timeZone?, showTime?, errors?, errorId?, disabled?, onChange(node)}` for built-in component props editing.

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

The corresponding field uses `editor: {name: 'customer-picker', options: {...}}`; remote definitions contain this JSON reference, never React components or callbacks. The complete example is `View Engine/过滤器` → `完整自定义筛选器 · 组件契约`. See the [component persistence plan](../../../docs/superpowers/plans/2026-09-08-filter-component-persistence.md) for responsibilities and lifecycle rules.

### FilterSelect

| Prop                               | Contract                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`                          | Readonly `FilterOption<Value>[]`; labels are separate from emitted values.                                                                                                                                     |
| `value`, `onChange(configuration)` | Controlled `FilterConfiguration`; the parent owns edits. Mutually exclusive with `defaultValue`.                                                                                                               |
| `onValueChange(value)`             | Called with the selected non-null value; does not query or save.                                                                                                                                               |
| `onClear()`                        | Optional callback enabling the popup's Clear selection item. The host sets the controlled value to null/undefined; this does not call `onValueChange`, query or save. Omit it for required operator selectors. |
| `label`                            | Required accessible name for the trigger.                                                                                                                                                                      |
| `placeholder`                      | Optional text when value is null.                                                                                                                                                                              |
| `inline`                           | Defaults to false. True uses an InputGroupButton trigger for a joined field control.                                                                                                                           |
| `disabled`                         | Defaults to false. Disables selection.                                                                                                                                                                         |

The menu uses shadcn Select / Base UI with selected indicators and keyboard interaction. It opens at the trigger edge with `alignItemWithTrigger={false}` and `align="start"`. The menu is portalled outside clipping parents while inheriting the component's theme when opened.

### FilterSearchSelect

A searchable single select backed by Base UI Combobox, styled with the shadcn base-nova tokens. Exported from `/react`; its `FilterSearchSelectProps<Value extends string>` extends `FilterSelectProps<Value>` with optional `searchPlaceholder` (default `搜索选项…`) and `emptyText` (default `没有匹配选项`). The selection placeholder defaults to `未设置`.

The input is inside the popup: the native Combobox filters `options` by label and handles keyboard navigation. Typing only changes the candidate search, never the selected value or applied query. `onValueChange` emits the selected string ID; optional `onClear` enables a direct Clear control. Disabled options and an already-open disabled picker cannot select. If the selected ID is absent from `options`, that ID remains visible rather than silently clearing it. Popup portals inherit the trigger's scoped theme tokens and explicit marker. Native CSS container style queries keep dark variants within the nearest theme boundary; modern container style query support is required.

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

Register this component with `compile: compileBuiltinFilter` and `clear: clearBuiltinFilterProps` in `extensions.filters['customer-search']`, reference it with the field's `editor.name`, and restrict that field to `operators: [FilterOperator.EQ]`. `View Engine/过滤器` → `自定义筛选器 · 内置搜索 Select` provides the complete registration, compatible-node fallback and manual-apply example. Candidate search here is local; remote candidate loading remains the host editor's responsibility.

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

| Prop                               | Contract                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `value`, `onChange(configuration)` | Controlled `FilterConfiguration`; the parent owns edits. Mutually exclusive with `defaultValue`. |
| `onValueChange(date)`              | Receives the selected `Date` or `undefined`; selecting a day closes the panel.                   |
| `label`                            | Required accessible name. The trigger includes the displayed date.                               |
| `inline`                           | Defaults to false; true uses an InputGroupButton for a joined field control.                     |
| `disabled`                         | Defaults to false; disables the trigger and calendar days, including an already-open panel.      |

Composes shadcn Calendar and Base UI Popover. The calendar uses the Chinese locale and displays `YYYY-MM-DD`. A date represents a selected calendar day; the component does not convert it into a Wow timestamp or apply a timezone.

### FilterTimeInput

| Prop                               | Contract                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `value`, `onChange(configuration)` | Controlled `FilterConfiguration`; the parent owns edits. Mutually exclusive with `defaultValue`. |
| `onValueChange(value)`             | Receives edited text or a clock value at second precision at most; does not query or save.       |
| `label`                            | Required accessible name for the input and clock controls.                                       |
| `inline`                           | Defaults to false; true omits the outer InputGroup border for use inside FieldFilter.            |
| `disabled`                         | Defaults to false; disables text input and clock selectors.                                      |

Uses shadcn InputGroup, Popover and Select for a 24-hour clock. Clock values use `HH:mm` or `HH:mm:ss`; legacy fractional seconds are truncated before display or editing. Other nonempty formats receive `aria-invalid`. Unset or empty input is valid and never receives a required-field error. Editing hours or minutes preserves existing seconds; selecting seconds adds the seconds segment when absent. Malformed text is never silently converted to a query value. The host decides timezone and when to apply the query.

For operators requiring a value, a fully unset editor remains visible but contributes no query predicate. If no predicates remain, the host applies `filter.matchAll()`. A composite date/time value is unset only when both parts are empty: one filled part requires completion and cannot silently remove the predicate. Clearing a value does not change the applied expression until Query. Operators that require no value remain active; explicit null, zero, false and valid empty-string literals retain their Wow semantics.

Clock selectors change only the selected segment of the raw text, including during partial input: `12:` plus minute `30` becomes `12:30`; `07:45:` plus second `30` becomes `07:45:30`. Published clock values have at most whole-second precision. Unedited missing or malformed segments remain available for correction instead of resetting to zero.

### Composition primitives

Exports: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectTrigger`, `SelectValue`, `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupText`, `Calendar`, `Popover`, `PopoverContent`, `PopoverTitle`, `PopoverTrigger`.

Select items belong in `SelectGroup`. `SelectContent` preserves the Base UI popup props plus `side`, `sideOffset`, `align`, `alignOffset`, `alignItemWithTrigger` and optional `container` / `footer: ReactNode`. The footer renders outside the listbox, with a separator; use it for tabbable actions that must not become selectable values. Its primitive positioning defaults remain bottom / 4px / center / 0 / true; `FilterSelect` explicitly uses edge alignment. The root supplies the theme for the default body portal.

Default styling comes from shadcn `base-nova`, with `fve:` utilities and `--fve-*` tokens. CSS intentionally has no global preflight. Explicit theme boundaries use `.fve-root[data-theme="light"|"dark"]`; native `light-dark()` is retained in the build.

Popover also inherits its trigger's theme in the body portal. `PopoverContent.keepMounted` forwards the Base UI Portal option (default false). The field picker enables it to retain its closed, hidden controls between opens; closing still removes them from keyboard navigation, and unmounting releases the retained subtree. Calendar forwards React DayPicker props and uses shadcn day buttons with keyboard focus support.

## Storybook

After `pnpm install`, run `pnpm storybook` from the repository root. Both it and `pnpm build-storybook` explicitly build View Engine and its workspace dependencies, retaining the public core/React/CSS `dist` paths for development and production acceptance. `View Engine/过滤器` demonstrates business filters, nested logic/element scopes, custom editors, query errors, dark mode and a 50-operator gallery. `View Engine/基础组件/日期时间` covers individual controls. Its combined example retains edits until Query, then creates a Wow filter using browser-local time and epoch milliseconds. It makes no service requests. Focused browser checks after the package build: `pnpm exec vitest run --project=storybook stories/view-engine/`.

## Record views and host contract

The core also exports `ViewEngine`, `ViewDefinition`, `ViewInstance` (currently
`RecordViewInstance`), `RecordViewConfig`, `ViewHost`, the session/snapshot types,
record validators and `readRecordValue` / `getRecordKey` helpers. These contracts
and query execution remain independent of React. Definitions, instances and
query records are JSON data; renderer functions belong in the React extension
map, never in a remote definition. Source paths are used exactly as supplied,
without a `state.` prefix or a visibility-based projection.

Response record property names must not contain dots. Dots in `field` and `rowKey` are navigation separators; each segment (including array indices) reads only an own property. Literal dotted property names are not supported.

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

`ViewDefinition` contains `id`, `title`, `sourceId`, `rowKey`, `fields`, required `allowedLayouts` and optional
`timeZone`, `defaultPresentation`, `allowedOperators`, `filterEditors`, `recordActions: {global?, toolbar?, row?}`. A
`ViewFieldDefinition` extends `FilterFieldDefinition` with `sortable?: boolean`,
`cellRenderer?: RendererReference`, `summaryFunctions?: readonly RecordSummaryFunction[]`,
and `numberFormat?: Intl.NumberFormatOptions & { locale?: string }`.
Sorting requires `sortable: true`.
`RendererReference` uses the existing `{name, options?}` JSON contract. Filter
defaults use field `editor` and definition `filterEditors` only for new nodes.
Existing nodes retain their authoritative `component` reference; there is no
separate filter-renderer protocol.

`ViewInstance` contains `id`, `definitionId`, `title`, `kind: 'record'`, `scope`,
`config`, optional `revision`. Scope is `{type:'personal'}` or
`{type:'public', source:'system'|'shared'}`. Scope describes classification,
not permission. Config contains `filters: FilterConfiguration`, `sort: FieldSort[]`,
`pagination: {mode:'paged'|'cursor', size:number}` and
`presentation: RecordPresentation` (table/card discriminated union). The former `config.filter` shape is rejected; compiled Wow filters are runtime-only.

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

`ViewHost` is a composition facade. Core exports `ViewDefinitionService`,
`ViewInstanceService`, `ViewPreferenceService` and `ViewPermissionService`.
The optional `definition`, `instance`, `preference`, and `permission` properties
hold independently replaceable services. Missing methods disable their capability.
`resolveSource` is the required local runtime bridge, not a REST operation.
The development-only HttpViewHost composes experimental resource clients;
MemoryViewHost implements the same contracts with a shared storage transaction.
To override one operation without dropping its siblings, merge the service:
`{...host, instance: {...host.instance, save: customSave}}`.

| Host member                                                          | Contract                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `definition.load(id, signal?)`                                       | Async complete definition. Optional when local definition is supplied.                                                                                                                                |
| `instance.list(definitionId, signal?)`                               | Async `ViewInstanceList`; complete instances and a nullable default ID, no duplicate per-item load. Optional with local list.                                                                         |
| `instance.load(id, signal?)`                                         | Async full instance, used for an unknown selection or explicit reload.                                                                                                                                |
| `resolveSource(sourceId)`                                            | Required configured `RecordQuerySource`, or Promise of source; requires at least one of Wow `paged` or `cursor`, with optional `aggregate` for all-record summaries.                                  |
| `permission.getInstance(instance)`                                   | `{save, saveAsPersonal, saveAsShared, delete?, rename?}`; absent means false. Missing write callbacks also disable the corresponding capability.                                                      |
| `instance.save(instance)`                                            | Async full same instance and submitted content, with a new revision if used.                                                                                                                          |
| `instance.delete(id, revision?)`                                     | Optional `Promise<ViewDeleteResult>`; resolve only after deletion, treat already absent as success. Enforce caller access, system-view protection and optimistic revision checks in the host service. |
| `instance.rename(id, title, revision?)`                              | Optional `Promise<ViewInstance>`; changes only title and returns the complete persisted instance with its revision. Must preserve config, scope, ID and definition.                                   |
| `preference.saveOrder(definitionId, instanceIds)`                    | Optional `Promise<void>`; saves the fixed current user's complete display order. `instance.list` should subsequently return that order. It does not change shared/public metadata or visibility.      |
| `preference.saveDefault(definitionId, instanceId)`                   | Optional `Promise<void>`; saves the fixed current user's default for that definition. `instanceId` is a currently visible ID or `null`; null explicitly leaves the user without a default.            |
| `instance.create(instanceWithoutIdOrRevision, {requestId, signal?})` | Async full newly identified instance with exactly the submitted content.                                                                                                                              |

Deletion requires both `delete: true` and `host.instance.delete`; omission disables
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
`instance.delete` returns `ViewDeleteResult`, whose required `defaultInstance` is
`ViewInstance | null`: the calling user's authoritative default from the deletion
transaction, including an idempotent repeat of an already completed deletion.
The engine validates the receipt and takes its default ID instead of inferring one
from stale local order. It initializes a returned default that is not loaded yet;
existing sessions and their drafts stay intact. No second list request is needed.
An invalid receipt requires deletion reconciliation through the same idempotent
retry, without discarding the local editor. Default writes and deletions are
mutually exclusive within one engine so an older receipt cannot override a newer
local default write. The default-save lock survives `load()` until the host request
settles; lifecycle invalidation only prevents stale responses from publishing.

The host owns persisted list/default maintenance, including for local definitions.
Deleting a default instance must atomically replace that ID for every affected
user with the first remaining instance in that user's visible order, or null. A user
first seen after deletion resolves the seed default against their actual visibility.
Explicit null and another user's still-visible personal instance with the same ID
remain unchanged. An inaccessible other-user personal instance is never deleted.
MemoryViewHost and IndexedDBViewHost implement these rules in one storage
transaction. Use an updated local instance list when constructing a new engine.
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

Rename requires both `rename: true` and `host.instance.rename`. The engine passes
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

`canSetDefaultInstance()` reports whether `preference.saveDefault` is available.
`setDefaultInstance(instanceId: string | null)` accepts a current instance ID or
explicit null, persists before publishing, and neither selects a view nor queries
data. It does not save or discard unsaved drafts. Reordering never changes the default. The required snapshot field
`defaultInstanceId` and required capability field `setDefault` expose the result
and availability independently from `selectedInstanceId`. Any visible personal,
shared or system instance can be selected without edit permission. The preference
is scoped by user and definition; null prevents automatic selection on the next
entry.

```ts
if (engine.canSetDefaultInstance()) {
  await engine.setDefaultInstance('my-view');
  await engine.setDefaultInstance(null);
}
```

`my-view` must come from the current instance list.

Local input uses `new ViewEngine({definitionId,host,definition,instances,filterCompilers})`. Optional `filterCompilers` supplies the React-independent capabilities for this directly owned engine; keep them consistent throughout the engine scope. `ViewPage` does not accept this option and derives the same capabilities solely from `extensions.filters`. Unknown saved components remain in configuration and block queries until their compiler is available.
An empty list with `defaultInstanceId: null` leaves selection empty without a query.
Omitting `defaultInstanceId` or naming an ID absent from the list is rejected.
A foreign instance is rejected. Explicit selection loads an unknown instance
through `instance.load` and validates its definition before querying.

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

Operation-completion notifications are synchronous and release the completed write/reload ownership first, so subscribers can issue the next command immediately under current permissions and recovery guards. A stale operation's cleanup cannot release a newer operation. Automatic reads following save-as, deletion or reload only run if completion observers have not started a newer query or cancellation; cursor navigation issued from a completion observer is preserved. Published `selectedRowKeys` remain a subset of the current rows, including when cancellation callbacks or subscribers start a replacement query. Invalid explicit selection input is still rejected.

`getSnapshot` is referentially stable until state changes; `subscribe` returns
an unsubscribe function. Snapshots isolate and freeze JSON data. Each session
keeps baseline and current instance, dirty flag, editing `FilterConfiguration`,
`filterBaseline` (accepted configuration), `appliedFilter` (compiled query or null), `filterValid` (reported local editor validity),
derived `filterPending`, rows, total, page/cursor, selected keys, `pageSummary`, `allSummary`, and independent query/write
status and error. Runtime state is never serialized into instance config.

`RecordSession.baseline`, `instance`, `filterDraft`, `filterBaseline` and `rows`,
plus `ViewEngineState.definition`, use `DeepReadonly<T>` recursively. Assignment
to nested metadata or mutation of query arrays is rejected by TypeScript.
`setFilterDraft`, `setSort` and `setColumns` accept readonly
snapshots directly and copy accepted inputs. Host query/write/permission
callbacks still receive independent editable DTOs. `RecordTable` accepts
readonly definitions, instances and rows, plus required explicit `appliedFilter: DeepReadonly<FilterExpression> | null`; presentation/summary readers also
accept readonly inputs.

Methods with an optional instance ID default to the selected instance:

When a paged response reports a total that no longer includes the requested page, the engine clears that page and re-queries page one once. Failures remain retryable at page one; newer queries/navigation supersede the correction. Cursor pagination is unchanged.

- `load()`, `selectInstance(id)`, `reloadInstance(id?)`, `canReloadInstance(id?)`, `refresh(id?, {background?: boolean})`, `retryQuery(id?)`, `dispose()`. Full `load()` rejects while save/rename/delete or preference ordering is in flight, preserving ownership of its receipt. Commands that read or edit sessions are rejected from load cancellation through metadata initialization; snapshots remain readable. This also blocks reads reentered from cancellation callbacks from capturing an old schema with the new lifecycle. `retryQuery` re-runs the current applied query at its existing page/cursor; explicit `refresh` still restarts cursor pagination at page one. Ordinary instance reload can use `instance.list` with an exact ID match when `instance.load` is absent; local edits remain intact.

Reload keeps editable title/configuration and filter drafts, but always adopts the returned authoritative `scope`. If an unconfirmed creation's source disappears from the full instance list, `ViewEngineState.pendingCreates` retains its immutable editor context under the source ID, without rows or summaries. These entries are separate from visible `instanceIds`/`sessions`: ordinary query, edit, selection and save commands cannot use them. `canReloadInstance(sourceId)` and `reloadInstance(sourceId)` still reconcile the original create request under current host permissions. `ViewPageContent` displays a scoped recovery entry. Validated recovery removes that entry and adds the created view; a confirmed deletion of that copy wins over an older creation receipt, and reconciliation preserves independently updated baselines or pending/unknown writes on an already opened copy; a definitive rejection of the original request removes the entry without creating a view. This context is engine-lifetime state and is not serialized as view configuration.

- `applyFilter(id?)`, `setFilterDraft(configuration,id?,valid?)`,
  `setFilterValidity(valid,id?)`, `setFilterMode(mode,id?)`.
- `setSort(sort,id?)`, `setColumns(columns,id?)`, `setPage(index,id?)`,
  `setPageSize(size,id?)`, `nextPage(id?)`, `setSelection(keys,id?)`.
- `refreshSummary(id?)` (async).
- `setTitle(title,id?)`, `restore(id?)`, `save(id?)`,
  `saveAs({title,scope},id?)`, `deleteInstance(id?)`, `renameInstance(title,id?)`, `getPermissions(id?)`.
- `canReorderInstances()`, `reorderInstances(instanceIds)` save the current user's navigation order.
- `canSetDefaultInstance()`, `setDefaultInstance(instanceId)` save or explicitly clear the current user's default.

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
`setFilterDraft(configuration)`; `applyFilter(id?)` accepts no external expression.
The editing and accepted snapshots both use the canonical configuration.
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
and prohibits unrelated writes; replaying the retained original create request is still allowed. Reload obtains a new baseline/revision and preserves
local edits for comparison. Ordinary request failure retains edits and does not
automatically retry. `canReloadInstance(id?)` reports whether the host supplies
the load/list interface for a known ID or the create replay interface for an unknown result. The page offers reload after ordinary
write failures as well as mismatched echoes, so revision conflicts can be resolved
without discarding the draft.

After dispatch, save/rename/delete failures classified as `UNKNOWN_OUTCOME`,
`UNAVAILABLE`, or an unclassified exception also set `requiresReload` and block
unrelated writes to that instance. Hosts must use a definitive `ViewServiceError` code for
known rejections. Successful reload unlocks writes with the authoritative revision
and retains edits; a missing/inaccessible instance keeps its recovery error and
draft. Create retains its original idempotency key for replay; delete retains its
original ID/revision for idempotent retry. The immutable capability snapshot exposes
`instances[id].retryDelete` so UI controls can offer only that retained delete.
A successful reload or full load clears the retained delete marker.

For a mismatched create echo, reload verifies the explicitly returned created ID
through instance.load, or exact ID lookup in instance.list when load is absent.
It never unlocks the source by reading that source or matching list content.
If the created ID is unknown, reload replays the original instance.create request
and validates the authoritative receipt. A newly discovered copy uses the remote baseline while keeping
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

In table mode, all-record results are reused across paging, sorting and column presentation edits. Card mode cancels and clears summaries; returning to table recalculates the configured metrics without reloading records.
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

### Themes and public CSS variables

The package exports `styles.css` plus `themes/neutral.css`, `blue.css`, `violet.css`, `green.css`, `orange.css` and `shadcn.css`. `styles.css` contains component CSS and the default Neutral values. A theme import only defines its scoped values; select it with `data-fve-theme`. Theme order does not select the active theme.

`ViewTheme` and its types are exported from `/react`:

```ts
type ViewThemeStyle = React.CSSProperties & {
  [variable: `--fve-${string}`]: string | number | undefined;
};

interface ViewThemeProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'style'
> {
  theme?: string;
  appearance?: 'light' | 'dark' | 'system';
  density?: 'comfortable' | 'compact';
  style?: ViewThemeStyle;
}
```

It renders one `.fve-root` div and forwards div props, `ref`, `className` and `style`. `theme`, `appearance` and `density` map to `data-fve-theme`, `data-theme` and `data-fve-density`; explicit props take precedence over raw data attributes, and omitted props preserve/inherit those attributes. `system` follows `prefers-color-scheme` without storing a preference or changing the document root. `comfortable` preserves the defaults; `compact` changes the density values shown below. Explicit xs/sm/lg component sizes keep their own semantics.

| Variable                     | Default                                                                  | Main consumers                                            |
| ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| `--fve-background`           | `light-dark(oklch(1 0 0deg), oklch(0.145 0 0deg))`                       | Record surface, table rows                                |
| `--fve-foreground`           | `light-dark(oklch(0.145 0 0deg), oklch(0.985 0 0deg))`                   | Default text, controls                                    |
| `--fve-primary`              | `light-dark(oklch(0.205 0 0deg), oklch(0.922 0 0deg))`                   | Primary actions and selected states                       |
| `--fve-primary-foreground`   | `light-dark(oklch(0.985 0 0deg), oklch(0.205 0 0deg))`                   | Content on primary surfaces                               |
| `--fve-secondary`            | `light-dark(oklch(0.97 0 0deg), oklch(0.269 0 0deg))`                    | Secondary controls                                        |
| `--fve-secondary-foreground` | `light-dark(oklch(0.205 0 0deg), oklch(0.985 0 0deg))`                   | Content on secondary surfaces                             |
| `--fve-muted`                | `light-dark(oklch(0.97 0 0deg), oklch(0.269 0 0deg))`                    | Muted and selected-row surfaces                           |
| `--fve-muted-foreground`     | `light-dark(oklch(0.556 0 0deg), oklch(0.708 0 0deg))`                   | Auxiliary text and icons                                  |
| `--fve-accent`               | `var(--fve-muted)`                                                       | Hover and highlighted surfaces                            |
| `--fve-accent-foreground`    | `var(--fve-foreground)`                                                  | Content on accent surfaces                                |
| `--fve-popover`              | `light-dark(oklch(1 0 0deg), oklch(0.205 0 0deg))`                       | Select, menu and Popover panels                           |
| `--fve-popover-foreground`   | `var(--fve-foreground)`                                                  | Portal panel content                                      |
| `--fve-destructive`          | `light-dark(oklch(0.577 0.245 27.325deg), oklch(0.704 0.191 22.216deg))` | Errors and destructive actions                            |
| `--fve-success`              | `light-dark(oklch(0.42 0.12 150deg), oklch(0.8 0.12 150deg))`            | Success status                                            |
| `--fve-warning`              | `light-dark(oklch(0.45 0.1 75deg), oklch(0.83 0.12 75deg))`              | Warning status                                            |
| `--fve-info`                 | `light-dark(oklch(0.44 0.16 255deg), oklch(0.8 0.1 255deg))`             | Informational status                                      |
| `--fve-border`               | `light-dark(oklch(0.922 0 0deg), oklch(1 0 0deg / 10%))`                 | Borders and table separators                              |
| `--fve-input`                | `light-dark(oklch(0.922 0 0deg), oklch(1 0 0deg / 15%))`                 | Input/control surfaces                                    |
| `--fve-ring`                 | `light-dark(oklch(0.556 0 0deg), oklch(0.708 0 0deg))`                   | Keyboard focus rings                                      |
| `--fve-radius`               | `0.625rem`                                                               | Component corner-radius scale                             |
| `--fve-font-family`          | `ui-sans-serif, system-ui, sans-serif`                                   | Root and inherited controls                               |
| `--fve-font-size`            | `14px`                                                                   | Root and xs/sm/base/lg/xl text scale                      |
| `--fve-line-height`          | Unset; root falls back to `1.5`                                          | Optional override for root and semantic text line heights |
| `--fve-control-height`       | `2rem`; compact `1.75rem`                                                | Default inputs and buttons                                |
| `--fve-table-cell-padding-x` | `0.5rem`; compact `0.375rem`                                             | Table headers and cells                                   |
| `--fve-table-cell-padding-y` | `0.5rem`; compact `0.25rem`                                              | Table cells                                               |
| `--fve-toolbar-padding-x`    | `0.75rem`; compact `0.5rem`                                              | Record toolbars                                           |
| `--fve-toolbar-padding-y`    | `0.5rem`; compact `0.25rem`                                              | Record toolbars                                           |
| `--fve-toolbar-gap`          | `0.5rem`; compact `0.375rem`                                             | Record toolbar item spacing                               |

`--fve-tw-*`, calculated variables and other undocumented `--fve-*` names are internal. Built-in named color themes define the complete public color set but do not reset font or density. Custom themes may override only part of the table; outer scopes/defaults supply the rest. Define paired colors together, especially primary/primary-foreground. The library does not derive a readable foreground or guarantee contrast for user colors.

CSS typography tokens are applied at the outermost `.fve-root` and explicit `data-fve-theme` boundaries. `ViewTheme.style` also applies explicitly supplied font-family/font-size/line-height tokens without requiring a theme name; omitted items inherit, ordinary CSS style values take precedence, and removing overrides restores inheritance. Internal component wrappers inherit typography, preserving normal CSS/style font overrides and Portal font capture. Use `px` or `rem` for `--fve-font-size`; `em` and `%` compound through the semantic text scale and are unsupported for that token. Other size tokens may use `em` relative to the effective font. When `--fve-line-height` is unset, the root uses `1.5` and semantic text variants keep their upstream ratios; setting it explicitly overrides those ratios.

The shadcn theme maps host `--background`, `--foreground`, `--primary` and the matching semantic tokens into the fve namespace. Host values must be complete CSS colors (`oklch(...)`, `hsl(...)`, `#hex`); bare HSL channels are not parsed. Missing tokens use defaults. Present invalid/cyclic tokens follow CSS behavior and are not type-validated. The mapping reads host variables and never writes them. The host ThemeProvider owns preference, persistence and `.dark`; a local light scope cannot synthesize light values if the host exposes only its currently resolved dark tokens.

Library portals copy the scope's computed public variables and effective appearance. Variable themes therefore propagate, while structural selectors such as `.brand [data-slot=...]` do not cross a body portal. Changes to theme/density attributes, class, inline variables and system preference update open portals; arbitrary CSSOM stylesheet insertion or replacement without those changes is outside the live-update contract. Third-party portals retain their own theme-container rules. CSS custom-property aliases resolve before inheritance, so define dependent values at the target boundary instead of expecting a child override to recompute an inherited alias. Removing a local value returns to the parent/default snapshot.

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
operations, FilterPanel, layout controls, table or cards, and pagination. The lower-level
`RecordTable`, `RecordCardList`, `RecordColumnSettings` and `RecordCardSettings` can also be controlled directly.
`ViewInstanceMetadata` holds common metadata; `RecordTablePresentation` defines
table layout and columns. `RecordViewConfig` directly contains `sort`, `pagination`,
canonical component `filters` and `presentation`. `ViewInstance` currently remains
the record kind. RecordPresentation adds the card layout without adding a new view kind.
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

`ViewExtensions` extends `FilterExtensions` with `cells`, `globalActions`, `toolbarActions` and
`rowActions`, each a local name-to-React-component map. Custom components may use
any React UI. Explicit missing names and renderer failures are visible and
isolated per rendering area.

`RecordViewProps`, `ViewPageContentProps` and `ViewPageProps` also accept two finite region callbacks:

```ts
renderToolbar?: (context: RecordToolbarRenderContext) => ReactNode;
renderPagination?: (context: RecordPaginationRenderContext) => ReactNode;
```

| Context                         | Readonly state                                                                                                                    | Controlled operations                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RecordToolbarRenderContext`    | `definition`, `session`, `defaultContent`, `appliedFilter`, `querying`, `selectedRowKeys`                                         | `clearSelection(): void`, `setColumns(columns: RecordColumn[]): void`, `setLayout(layout: RecordPresentation['layout']): void`, `setCardConfig(card: RecordCardConfig): void`, `refresh(): Promise<void>` |
| `RecordPaginationRenderContext` | `definition`, `session`, `defaultContent`, `mode`, `page`, `pageSize`, `pageCount`, `canNext`, `canPrevious`, `canChangePageSize` | `setPage(index): Promise<void>`, `setPageSize(size): Promise<void>`, `nextPage(): Promise<void>`, `previousPage(): Promise<void>`                                                                         |

Return `defaultContent` to preserve the built-in region, wrap or add to it to compose, and return `null` to hide it. Render the default node at most once. These are render callbacks, so Hooks cannot be called directly inside them; return a component when local state is needed. Each callback runs below its own recoverable render boundary. Local component state survives ordinary updates within the same instance; switching instances remounts both regions, including when using standalone `RecordView`. Async event failures remain rejected operation promises for the host to handle; React error boundaries do not catch them.

Pagination availability and instance-bound operations reuse engine guards. Loading, query failure, no successful query, the last page and a cursor without `nextCursor` disable progression as applicable. Cursor mode has no random page or previous-page operation. Calling an old callback after instance navigation remains bound to the old instance and rechecks current state. The callbacks do not expose mutable engine storage or bypass query/permission validation.

Stable semantic hooks are `data-slot="record-view"`, `record-global-toolbar`, `record-toolbar`, `record-applied-filters` and `record-pagination`. Internal DOM depth and utility classes are not API. The complete global toolbar is not replaceable because it owns refresh and expansion lifecycles; `toolbarStart` and `FilterPanel.renderToolbar` remain available.

Global/table action error boundaries retry when their actual renderer inputs
change, including `selectedRowKeys` or `querying`. Unrelated unsubmitted draft
edits keep the failure isolated instead of repeatedly rerendering it.

Core exports `DeepReadonly<T>`. Extension records, instances, definitions, columns,
filters, field metadata and JSON options use recursive readonly inputs. Components
copy required fields into their own form state and submit through host commands
or engine methods; direct writes to a snapshot are compile-time errors.

| Renderer props                | Values                                                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CellRendererProps`           | `value`, full `record`, stable `rowKey`, page `index`, `field`, `column`, `definition`, `instance`, JSON `options`. Resolution: column reference → field reference → built-in.                                                            |
| `GlobalActionsRendererProps`  | `definition`, `instance`, applied `filter` / `sort`, `selectedRowKeys`, `querying`, `options`, `refresh()`. The applied filter is null until compiled. Selection is explicit current-page records, never implicitly all matching records. |
| `ToolbarActionsRendererProps` | Alias of `GlobalActionsRendererProps`; same applied scope, explicit page selection and bound refresh, rendered in the table toolbar.                                                                                                      |
| `RowActionsRendererProps`     | `record`, `rowKey`, `definition`, `instance`, applied `filter` / `sort`, `options`, `refresh()`. Resolution: column reference → definition row action.                                                                                    |

Definitions select each action area via `recordActions.global`, `.toolbar` and `.row`.
To move an existing batch component, change its definition reference from `.global`
to `.toolbar` and registration from `globalActions` to `toolbarActions`. The library does
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
`examples/react/FilterPersistenceExample.tsx` and the matching View Engine / 扩展接入 / 公共包 story demonstrate JSON-backed save/new-engine reload of unset controls and opaque selected ID/display label props. Only changed query values require Query before Save. Run `node packages/view-engine/examples/core.mjs` and
`node packages/view-engine/scripts/verify-package.mjs`.
The latter packs to a temporary directory, checks entry points and scoped CSS,
compares archive contents with dist, runs public imports/core behavior, and
type-checks consumers against the extracted package without private source aliases.
It does not install, publish or modify dependency/build configuration.

`examples/react/sales-order/OrderWorkbench.tsx` supplies independent global, row, table/batch,
filter and cell extensions. It uses public package imports, readonly inputs,
instance-bound refresh and explicit operation failure/retry handling. Run it with
`pnpm exec vite packages/view-engine/examples/react --host 127.0.0.1 --port 4175`
or open **View Engine / 快速开始 and View Engine / 扩展接入** in Storybook. Its strict local order
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

`ViewEngine.updateHost(nextHost: ViewHost): void` replaces same-scope callbacks/policy and notifies `subscribe`, preserving sessions and drafts without querying records. `ViewPage` calls it after committing a new host prop. Different user/tenant/access scopes require a new engine. `getCapabilitiesSnapshot(): ViewCapabilities` returns a cached, deeply immutable snapshot with required `reorder`, `setDefault` and `instances[id].{permissions,reload,retryDelete}` fields; consume it with `useSyncExternalStore(engine.subscribe, engine.getCapabilitiesSnapshot, engine.getCapabilitiesSnapshot)` for render-time capability reads. `getPermissions`, `canReorderInstances`, `canSetDefaultInstance`, and `canReloadInstance` remain live imperative checks, not React render subscriptions. Policy callbacks must be pure; replace the host or notify permission.subscribe when external policy inputs change rather than silently mutating closures. Commands still recheck live policy. No component opts out with `use no memo`; pure calculation and render caching is compiler-owned. Explicit caches remain for the controlled configuration clone and theme capture to stabilize Effect dependencies. Error-boundary recovery follows render inputs, not event-handler identity. Package `test` runs the same suite without and with compilation (`test:compiled`), plus type checks; Storybook exercises compiled public exports.

### View service contracts and development adapters

`src/record/ViewHost.ts` independently defines ViewHost and its definition,
instance, preference and permission service interfaces. They remain type exports
from the public package. `recordModel.ts` contains record metadata and engine state.

Core exports MemoryViewHost, MemoryViewHostOptions, ViewCreateContext, ViewDeleteResult,
ViewPermissionSnapshot, ViewServiceError and ViewServiceErrorCode.
HttpViewHost, all HTTP resource clients/transport and VIEW_SERVICE_STATUS are **not**
public exports. They live under `packages/view-engine/dev/http` and are excluded from
the published package. Routes, envelopes, status mapping and fake sessions are an
internal experiment; see the bilingual `packages/view-engine/dev/README*.md`.

MemoryViewHostOptions requires serviceKey, scopeKey, definition, instances and resolveSource. Optional store is a native Map<string, string | null>; passing the same Map shares an in-process service, while omitted stores are private to each host. Optional instancePermissions, canReorder and permissionsRevision provide trusted policy. Its synchronous transaction commits only after all domain validation succeeds. reset() clears that service/definition with an explicit empty state.

ViewHost.instance.create(input, {requestId, signal?}) retains one request ID through
unknown outcomes and retries; the service commits the instance and its receipt
atomically. Same-key different content is CONFLICT. Revision-controlled writes,
private order replacement, permission changes and component JSON restoration are
transport-independent contracts. No HTTP status values are assigned by the core.

Permission snapshots carry revision, explicit boolean grants and reorder capability.
permission.subscribe notifies ViewEngine; synchronous getters never fetch.
Applications keep one fixed access scope and replace scopeKey when identity changes.
Definition/instance IDs are nonblank valid Unicode strings and cannot equal . or .. .

OrderWorkbench accepts persistViews and optional createViewHost(resolveSource).
HTTP options belong only to dev/HttpOrderExample.tsx. Copying examples/react into an
application requires no development adapter files or private package source imports.

Build first, then run scripts/verify-view-host.mjs or scripts/verify-http-view-host.mjs
with Storybook running. The HTTP script loads development TypeScript through the
existing Vite runtime; no HTTP implementation is added to dist. Its --serve mode
starts the manual fixture on 6010. These checks cover recovery and isolation, not
production protocol or authentication readiness.

### Contract convergence

engine.load() awaits permission.load(definitionId, signal) alongside definition/instance
reads, falling back to permission.refresh(signal). Providers initialize their synchronous
getters before resolving; the engine does not duplicate their permission store. Failure
blocks ready state and record queries; retry uses load(), and disposal/reload cancels the
signal. Synchronous-only providers remain supported. updateHost is a synchronous,
same-scope replacement of prepared services; later changes notify permission.subscribe.

RecordQuerySource requires paged or cursor (both also allowed), with optional aggregate.
The selected pagination mode is checked before record/aggregate I/O. Packed public-type
verification covers both single-mode sources and rejects sources without any query mode.

All five registries resolve own properties only. Subscriber errors are reported with
console.error and isolated from command completion and other observers. Immutable
filter input references control recompilation; unrelated state patches retain derived
filter state. Incompatible component property/compile changes use a new persisted name
(e.g. order-status/v2); keep old registrations while corresponding saved data exists.

### React lint verification

`pnpm lint:view-engine` performs read-only package and `stories/view-engine` checks.
`pnpm --filter @ahoo-wang/fetcher-view-engine lint:check` checks the package without
fixing files. Root CI `pnpm lint` includes the Storybook React checks. The package
and root configuration reuse stable official react-hooks recommended rules; all
current Hooks/Compiler diagnostics and unused disable directives are errors.
Parser tsconfigRootDir is explicit. Do not add a second legacy compiler plugin or
ban all manual memoization; effect-dependency identity may require it. Executable
lint regressions cover package/root/Storybook paths and valid memoization.

## Named built-in filter components

Configured `editor.name` values: `select` and `remote-select` (EQ/NE); `multi-select`, `remote-multi-select`, `text-values` (IN/NOT_IN); `datetime-range` (BETWEEN on date/datetime fields). Core compilation and clearing resolve these names automatically; React resolves the matching registrations. Explicit own-property custom registrations override all three capabilities consistently. No remote I/O occurs during compilation.

React exports: `FilterMultiSelect`/`FilterMultiSelectProps`, `FilterRemoteSelect`/`FilterRemoteSelectProps`, `FilterTextValues`/`FilterTextValuesProps`, `FilterDateTimeRange`/`FilterDateTimeRangeProps`. Remote single uses `value` and a scalar/null callback; `multiple: true` uses `values` and an array callback. DateTimeRange takes a field and `{lowerBound?, upperBound?}`. TextValues takes a string array and can report an uncommitted input buffer through onValidityChange.

`FilterDateTimeRange` and the default date/datetime BETWEEN editor share a Date Range Picker. Date mode is the default: two adjacent months appear side by side on wide screens and vertically in a scrollable popup on narrow screens. The first date click publishes an incomplete range; the second completes it, including a same-day range. Clear removes both bounds. For datetime fields, set the persisted `component.options.showTime: true` (or direct component `showTime`) to enable date/time editing through seconds. This mode keeps the start/end values on one trigger, edits dates and both times together in a popup, and only publishes on Confirm; Cancel/Escape discard popup edits. Restored fractional-second strings and numeric timestamps are floored to their second; selection or confirmation publishes second-precision values and retains valid offset hints. Query timestamps still use epoch milliseconds. Table cell data and lower-level Wow protocol values retain their original precision. `timeZone` is supplied globally, not in field metadata.

For datetime date mode, component props retain calendar dates and any inactive clock text; clock parts do not affect the query. Compilation includes the complete selected natural days in the global zone: BETWEEN starts at the first day's beginning and ends one millisecond before the following day, including 23/25-hour DST days. This inclusive whole-day bound is not truncated to seconds. EQ becomes the single-day range, NE its NOR, IN/NOT_IN combine single-day ranges, and GT/GTE/LT/LTE use the corresponding day boundary. `showTime: true` uses timestamp comparisons at whole-second precision and requires complete date/time pairs. The configuration stores `showTime` with the component reference, never generated wire bounds in place of component props. `date` string fields retain calendar string queries.

The direct select, multi-select, remote-select, text-values, date and time controls accept optional `invalid` and `errorId` to associate displayed errors with their actual focusable input/trigger; FilterPanel forwards its current errors. Registered value editors receive optional `errors`, `errorId` and global `timeZone` alongside existing props. Missing custom `clear` leaves core props unchanged; FilterPanel disables its clear action and displays the reason instead of silently succeeding.

```ts
const definition: ViewDefinition = {
  id: 'orders',
  title: 'Orders',
  sourceId: 'orders',
  rowKey: 'id',
  allowedLayouts: ['table', 'card'],
  timeZone: 'Asia/Shanghai', // omit to use the local runtime zone
  fields: [
    {
      field: 'createdAt',
      label: 'Created',
      type: 'datetime',
      operators: [FilterOperator.BETWEEN],
      editor: { name: 'datetime-range', options: { showTime: true } },
    },
  ],
};
// Omit showTime (or set false) for the default whole-day date range.
```

Core exports `FilterOptionValue = string | number`, `FilterOptionItem = FilterOption<FilterOptionValue>` and `FilterOptionSource`. `FilterOption` and field options support an optional group label. IDs preserve their types and numeric IDs must be finite. `FilterExtensions.optionSources` and `FilterEditorProps.optionSources` are optional readonly named source registries.

```ts
interface FilterOptionSource {
  search(
    query: Pick<CursorQuery, 'cursor' | 'size'> & { search: string },
    signal: AbortSignal,
  ): Promise<CursorPage<FilterOptionItem>>;
  resolve(
    values: readonly FilterOptionValue[],
    signal: AbortSignal,
  ): Promise<{ list: FilterOptionItem[]; missing: FilterOptionValue[] }>;
}
```

Remote `options.source` selects a runtime source; optional `pageSize` defaults to Wow DEFAULT_CURSOR_SIZE and `debounceMs` defaults to 300. Search and label resolution have independent cancellation and retries. Every resolution request must be accounted for exactly once in list/missing. Search results deduplicate by typed ID; a repeated pagination cursor fails rather than looping. A new keyword resets the cursor history.

Selection props use `value` or `values` and an optional `selectedOptions` label snapshot. Labels do not compile into filters; hydration does not publish onChange or mark dirty. Empty values contribute no predicate. Clear preserves the node and configuration. Missing IDs remain selected until explicitly removed. No function, credential or endpoint is persisted. Changing the source object isolates its session; standalone panels need a React key for access-scope changes.

`FilterTextValues` splits newline/comma/semicolon input and deduplicates without numeric coercion or CSV interpretation. A pending token consumes Enter before Query. Ranges require two complete ordered endpoints and reuse scalar timezone/DST validation; they do not expand a date to the end of the day.

`examples/react/BuiltinFiltersExample.tsx` and **View Engine / 过滤器 / 内置组件** demonstrate Fetcher candidate loading and IndexedDBViewHost JSON recovery. The implementation reuses `@ahoo-wang/fetcher-react/core`; it does not import Ant Design or add candidate operations to ViewHost.

`getFieldOperators(field)` derives capabilities only from field type and explicit `field.operators`. Field `editor` and definition `filterEditors` are defaults for new nodes; an existing node's `component` is authoritative. Its registration supplies component-specific compatibility checks, so changing a field editor default does not restrict or replace saved components.

## Built-in table cells

The `/react` entry exports six components and their corresponding `*Props` types:

| Component    | Standalone props beyond className                                                                                                             | Built-in name and JSON options                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| TextCell     | `value?: unknown`, `text?: string`, `ellipsis?: boolean`, `copyable?: boolean`                                                                | `text`: ellipsis/copyable, default false                                           |
| TagsCell     | `value?: CellValue \| readonly CellValue[] \| null`, `options?: readonly CellOption[]`, `maxVisible?: number`                                 | `tags`: maxVisible, positive integer, default 2                                    |
| StatusCell   | `value?: CellValue \| null`, `options?: readonly CellOption[]`, `tones?: readonly CellStatusTone[]`                                           | `status`: tones array                                                              |
| LinkCell     | `value?: unknown`, `text?: string`, `href?: string \| null`, `newTab?: boolean`                                                               | `link`: hrefField/newTab; newTab defaults false                                    |
| DateTimeCell | `value?: string \| number \| Date \| null`, `type?: 'date' \| 'datetime'`, `timeZone?: string`, `locale?: string`, `dateStyle?`, `timeStyle?` | `date-time`: locale/dateStyle/timeStyle; type from field; timeZone from definition |
| NumberCell   | `value?: number \| null`, `format?: ViewFieldDefinition['numberFormat']`                                                                      | `number`: no options; format from field.numberFormat                               |

`CellValue = string | number | boolean`; numbers must be finite. `CellOption` has value/label. `CellTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'`; `CellStatusTone` has value/tone. These types are exported from `/react`. Date/time styles use Intl full/long/medium/short; default date and time styles are medium, standalone type is datetime. Calendar dates do not shift with timezone. Local date/time strings use existing scalar timezone/DST validation and reject fractional seconds beyond three digits. Invalid row dates/numbers become placeholders; invalid builtin options are configuration errors.

Column renderer overrides field.cellRenderer. Explicit own-property extensions.cells entries override builtins, including an explicit matching builtin name. Unknown names and inherited names do not silently resolve. Static builtin registration is internal, not a second public plugin registry. JSON preserves name/options only; all six components are independent of ViewHost and query state.

Tags deduplicate typed values, preserve enum labels and expose overflow through a keyboard-operable Popover. Status tones preserve 1 versus '1' identity and reject duplicate mappings in JSON. Text copies the original value; optional text changes display only. Clipboard failures show local feedback and old-value feedback does not appear on a changed cell. Links parse and allowlist HTTP(S)/mailto/tel/relative protocols; unsafe links retain readable text. Explicit null href disables linking; omitted href uses value. newTab always adds noopener noreferrer. Domain routing remains custom.

Core `formatRecordNumber(value: number, field: Pick<ViewFieldDefinition, 'numberFormat'>): string` is shared with summaries. Currency/percent are numberFormat styles, with no currency-string parsing or unit guessing (0.125 => 12.5%). Summary calculations retain raw values. Tone CSS tokens are --fve-success/--fve-warning/--fve-info and existing --fve-destructive.

`examples/react/BuiltinCellsExample.tsx` consumes only public exports and demonstrates column renderer/options persistence through IndexedDBViewHost. Storybook **View Engine / 单元格 / 内置组件** separates display examples from interaction regressions.

## Recovery and input boundary corrections

An unconfirmed create retains its original requestId, submitted snapshot and original known IDs until validated completion. A rejected retry does not prove an earlier attempt failed. Full engine load preserves in-flight/unconfirmed requests; replaying the original request remains possible even when ordinary writes are blocked. reloadInstance replays unknown creates through instance.create using the same key/body; it never adopts a new list item based on matching content. A response that explicitly identifies the new instance may instead be checked through instance.load or exact ID lookup in instance.list. Existing independently opened copies keep their own edits and newer baselines. Pending requests are engine-lifetime state, not serialized view configuration. Successful save-as and reconciliation complete independently of the following record request; record failures remain in the selected session query state and can be retried with `retryQuery`, without reissuing creation. Selecting the already-active valid instance clears a prior navigation error without querying or replacing its draft.

Instance validation enforces `definition.allowedOperators` together with field-level operator compatibility before publishing host responses; this structural check preserves opaque component props without running custom compilers. Instance lists must provide `defaultInstanceId: null` or the ID of a member; invalid or omitted defaults are rejected before sessions are published. An optional `revision`, when supplied, must be a nonblank string. MemoryViewHost and IndexedDBViewHost preserve explicit null, never change the default on create or reorder, atomically normalize every affected user's default on deletion, and resolve a later new user's seed default against actual visibility. Scoped absent deletion is a successful no-op; it never removes a hidden private instance. Existing visible instances retain permission and revision checks.

Remote onValueChange uses current candidate labels for newly added/reselected IDs; unchanged IDs preserve their existing saved snapshots, excluding unavailable decorations. Paste replaces the selected text or inserts at the caret before tokenization. Datetime range compilation uses the shared strict scalar validation, so false/0 in the date/time properties cannot become an unset filter. DateTimeCell accepts explicit calendar/clock forms (T/t or whitespace, optional Z/z or numeric offset), rejects unsupported text, and never uses the host timezone to interpret a field-zoned local string.

## Record presentation and card layout

`RecordPresentation` is `RecordTablePresentation | RecordCardPresentation`. The active layout requires its own configuration; the other configuration is optional and retained after switching. A card-only instance does not require table columns. No layout switch calls `paged` or `cursor` or changes filters, sorting, pagination or selection.

```ts
interface RecordTableConfig {
  columns: RecordColumn[];
}
type RecordCardFieldConfig = Pick<
  Extract<RecordColumn, { kind: 'field' }>,
  'id' | 'field' | 'title' | 'renderer'
>;
interface RecordCardConfig {
  title: RecordCardFieldConfig;
  cover?: { field: string };
  fields: RecordCardFieldConfig[];
  actions?: { visible?: boolean; renderer?: RendererReference };
}
interface RecordPresentationDefaults {
  table?: RecordTableConfig;
  card?: RecordCardConfig;
}
```

`ViewDefinition.defaultPresentation?: DeepReadonly<RecordPresentationDefaults>` supplies optional local or remote presets. `resolveRecordPresentation(definition: DeepReadonly<ViewDefinition>, layout: RecordPresentation['layout'], existing?: DeepReadonly<RecordPresentationDefaults>): RecordPresentation` validates provided configurations, chooses existing configuration before presets before built-ins, and returns a writable independent copy. Explicit null is invalid. Built-in table columns include every top-level definition field; built-in card title uses rowKey. Only the requested layout is initialized. Persisted instances are validated, never repaired using defaults.

`ViewEngine.setLayout(layout, id?): void` changes layout; `setCardConfig(card: DeepReadonly<RecordCardConfig>, id?): void` edits card configuration without switching. Both preserve the other layout's settings and participate in dirty/save/save-as/restore. `RecordToolbarRenderContext` exposes bound `setLayout` and `setCardConfig` alongside its existing methods.

React exports `RecordCardList`, `RecordCardSettings` and their props. `RecordCardListProps` contains the query/result/selection/extension inputs of RecordTableProps, without table columns, sorting callbacks or summaries. `RecordCardSettingsProps` supplies readonly definition/card, optional disabled, and synchronous `onChange(card: RecordCardConfig): void`; throw from onChange to keep its local draft and show an error. Do not swallow submission errors or provide asynchronous callbacks.

Card title and summary fields reuse cells. An intrinsic row-key title outside definition.fields receives minimal runtime field metadata (its path and a record-key label), so an explicit title renderer still runs; the host definition is not modified. Missing raw title values (null, undefined, empty/whitespace strings) fall back to the row key; 0 and false stay valid. Covers require a string field and http/https or relative image URLs; absent values, invalid URLs and image failures show a placeholder. Missing cover configuration omits the image region. Actions reuse rowActions: absent actions hides the area; an object inherits the definition's row action unless renderer overrides it. visible defaults to true; false preserves its renderer for later re-enabling. Field/rendering failures remain local to their boundary.

Card mode returns no metrics from getRecordSummaryMetrics. It cancels pending aggregate work and ignores late responses. Background record refresh and refreshSummary in card mode do not query aggregate; returning to table recomputes summaries for current data/filter. Only presentation configuration is persisted; computed summaries remain transient.

### Top-level layout switch and custom card content

The global toolbar owns a single layout dropdown labeled with the current layout, at every container width. RecordToolbar retains batch actions and layout settings.

`RecordViewProps.renderCard?: (context: RecordCardRenderContext) => ReactNode` is also forwarded by ViewPage/ViewPageContent and supported directly by RecordCardList. The context provides readonly definition, instance, record, rowKey, index (within the current page), selected and defaultContent, plus instance-bound refresh(): Promise<void>. It exposes no engine internals. Return custom JSX or wrap defaultContent; return a component when Hooks are needed. The callback and any component it returns run inside the existing per-card error boundary. A failed card does not remove sibling cards or library-managed selection controls.

The library retains grid/frame, selection, loading/error/empty states and pagination. Custom content owns the title, cover, fields and action arrangement. Card settings affect the built-in defaultContent; entirely custom content may ignore them. renderCard is runtime-only and is never persisted or selected through a new registry.

```tsx
<ViewPage
  {...pageProps}
  renderCard={({ record, rowKey, selected }) => (
    <article>
      <h2>{String(rowKey)}</h2>
      <p>{String(record.amount)}</p>
      {selected && <span>Selected</span>}
    </article>
  )}
/>
```

RecordCardSettings explicitly displays “无封面” when no cover is chosen, and disables the add-field control with “已添加全部字段” when all fields are included. Its apply action updates the current view; saving requires the host's existing persistence capability. The RecordCardList Storybook includes custom-content and persisted-config examples.

The primary card Storybook preview uses ProductCatalogExample: 12 home/travel products with local SVG covers, category/status/favorite filtering, price/stock sorting, details, favorites and individual/batch publishing. Default cards retain built-in configuration; custom cards emphasize price and stock. View configuration can use MemoryViewHost. Catalog writes are in-memory and refresh the same query source in Table and Card. Order action retry regressions remain separate.

`ViewDefinition.allowedLayouts` 为必填的非空、不重复数组：`['table']`、`['card']` 或同时开启。仅允许一种布局时，顶部不显示切换入口；引擎和实例加载均拒绝未允许的活动布局。切换保留各模式配置。卡片使用右上角选择按钮（`aria-pressed`），不占独立行；自定义内容应避让该角标。顶部通用操作使用图标及提示，菜单保留文字。

`RecordView`/`ViewPage` hide built-in card settings when `renderCard` is supplied, including wrappers around `defaultContent`. Provide business configuration through the existing `renderToolbar` and `setCardConfig` when needed. Table column settings remain available.

The shared record toolbar exposes sorting, as active rules in priority order, with drag/keyboard reordering, add/remove controls and a clear action. It uses the same `instance.config.sort` as table headers and remains available for card-only views. Explicit refresh of the same paged query retains existing rows so actions remain mounted; filter, sort, page changes and cursor refresh still reload their results.

### IndexedDB browser persistence

The `/react` entry exports IndexedDBViewHost and IndexedDBViewHostOptions. Required options match MemoryViewHost except for store; optional databaseName defaults to `fve-view-state`. All reads, permission checks, CAS, receipts and writes run in a native IndexedDB readwrite transaction. Success resolves after commit; failure and cancellation roll back. reset() atomically clears the service/definition. The two concrete hosts share only internal view-domain logic; the core entry has no browser globals.
