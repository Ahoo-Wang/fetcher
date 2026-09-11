---
title: React components and theme
description: Choose the right ownership layer and configure controls, cells and action props.
---

# React components and theme

## Page and table surfaces

| Component              | Required input                                                                      | Owner                                                   |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `ViewPage`             | engine or hook binding                                                              | Pure UI; no engine lifecycle ownership                  |
| `ViewPageContent`      | engine                                                                              | Renders mixed navigation; caller owns engine            |
| `RecordView`           | engine                                                                              | Renders the selected record session; caller owns engine |
| `RecordTable`          | definition, instance, appliedFilter, rows, selection/column/sort callbacks, refresh | Controlled table; caller owns requests and state        |
| `RecordColumnSettings` | definition, columns, onChange                                                       | Controlled column configuration                         |

`ViewPage`/`RecordView` accept `extensions`, `filterContext`, `selectable` (default false), `autoRefreshPaused` (default false), and `className`. ViewPage also accepts `initialSidebarCollapsed`; RecordView has `toolbarStart`. RecordTable separately accepts query/summary states and retry callbacks.

The view manager shows a Set default/Clear default action only when `getCapabilitiesSnapshot().setDefault` is true. The marker follows `state.defaultInstanceId`; changing it does not navigate away from the selected view.

## Built-in cell props

All standalone cells accept `className`. Configured renderer options are intentionally narrower than standalone props.

| Component / renderer name    | Main props or options                                     | Defaults / behavior                                                                      |
| ---------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `TextCell` / `text`          | value, text, ellipsis, copyable                           | ellipsis/copyable false; text only changes display; raw-value copying                    |
| `TagsCell` / `tags`          | value, options, maxVisible                                | maxVisible 2; typed deduplication; remaining tags open a popup                           |
| `StatusCell` / `status`      | value, options, tones                                     | neutral/success/warning/danger/info tones; unknown values remain readable                |
| `LinkCell` / `link`          | value, text, href, newTab; renderer uses hrefField/newTab | newTab false; safe URL policy                                                            |
| `DateTimeCell` / `date-time` | value, type, timeZone, locale, dateStyle, timeStyle       | type datetime, locale zh-CN, medium date/time styles; view renderer uses global timezone |
| `NumberCell` / `number`      | value, format                                             | Renderer uses field.numberFormat; empty/invalid numbers use a placeholder                |

The configured renderer is **`date-time`**, while the field type is **`datetime`**. For currency/percentage configure `field.numberFormat` with Intl options; do not put a separate format object into the number renderer's options. For tags/status, field.options supplies value labels.

Plain YYYY-MM-DD strings retain calendar-date display; timestamp values are formatted in the chosen timezone. Missing or invalid dates display a placeholder.

## Standalone filter controls

`FieldFilter` composes a label, operator selector, children and optional remove callback. It does not execute queries. `FilterSelect`/`FilterSearchSelect` provide controlled string values, options, label, onValueChange and optional onClear; SearchSelect adds candidate search. `FilterMultiSelect` handles typed multiple IDs. `FilterTextValues` retains typed input items. Use `FilterPanel` when you need configuration ownership and validation.

`FilterRemoteSelect` receives source/label and either single value or `multiple: true` with values. Its change callback includes selected items. `selectedOptions` supplies retained labels, default debounce is 300 ms and pageSize follows Wow DEFAULT_CURSOR_SIZE (bounded by MAX_CURSOR_SIZE). Invalid page sizes/debounce values throw. Changing source identity starts a new remote session.

`FilterDatePicker` uses `Date | undefined`; `FilterTimeInput` accepts incomplete text and hour/minute/second selection. `FilterDateTimeRange` receives field/value/onValueChange and optional showTime/timeZone/validity props. Date-only ranges use two months; datetime with showTime uses a combined date/time popup and explicit Confirm. These primitives do not save or apply a query by themselves.

## Extension context

`GlobalActionsRendererProps` and `ToolbarActionsRendererProps` provide definition/instance/filter/sort/options/refresh, selectedRowKeys and querying. `RowActionsRendererProps` adds record/rowKey to the common action context. `CellRendererProps` provides value/record/rowKey/index/field/column/definition/instance/options. These inputs are immutable; construct new values for changes. Cell props do not include a business command API.

Within `RecordView`, data renderers receive the executed query configuration plus current table/card presentation. Editing unqueried filters does not change the scope of displayed rows.

## Theme and accessibility

Compiled styles use `.fve-root`, `fve:` utilities and `--fve-*` variables. Explicit data-theme values are light/dark; otherwise inherited color-scheme selects the appearance. Portals copy current tokens, typography and color scheme from their trigger scope so clipped/scrolling containers remain usable. Keep labels, error associations and keyboard semantics when composing custom controls.

The public composition primitives are Button, Calendar, Popover/PopoverContent/PopoverTitle/PopoverTrigger, the Select family and the InputGroup family listed in [symbols](./symbols.md). Internal DropdownMenu, Dialog and other private files are not extra supported package imports.

## Pure analysis compilation

The core entry exports `compileAnalysis(config, context)`, `validateAnalysisResult(rows, plan)` and `analysisRowKey(row, dimensions)`, together with the analysis model types. These functions do not render React or make requests. The following example compiles COUNT + SUM and validates a supplied response; it does not depend on analysis page or engine integration.

```ts
import { AggregationFunction, FilterOperator } from '@ahoo-wang/fetcher-wow';
import {
  compileAnalysis,
  createFilterConfiguration,
  newFilterNode,
  validateAnalysisResult,
  type AnalysisCompileContext,
  type AnalysisViewConfig,
} from '@ahoo-wang/fetcher-view-engine';

const context: AnalysisCompileContext = {
  fields: [{ field: 'amount', label: 'Amount', type: 'number' }],
  capability: {
    count: true,
    fields: [
      { field: 'amount', groups: [], functions: [AggregationFunction.SUM] },
    ],
  },
};
const config: AnalysisViewConfig = {
  filters: createFilterConfiguration(newFilterNode(FilterOperator.MATCH_ALL)),
  dimensions: [],
  metrics: [
    {
      id: 'count',
      component: { name: 'count' },
      alias: 'orders',
      title: 'Orders',
      props: {},
    },
    {
      id: 'sum',
      component: { name: 'numeric' },
      field: 'amount',
      alias: 'revenue',
      title: 'Revenue',
      props: { function: AggregationFunction.SUM },
    },
  ],
  sort: [],
  limit: 100,
  presentation: {
    layout: 'table',
    columns: [{ alias: 'orders' }, { alias: 'revenue' }],
  },
};
const compiled = compileAnalysis(config, context);
if (!compiled.plan)
  throw new Error(compiled.errors.map(error => error.message).join('; '));
const result = validateAnalysisResult(
  [{ orders: 2, revenue: 125 }],
  compiled.plan,
);
if (!result.rows)
  throw new Error(result.errors.map(error => error.message).join('; '));
console.log(compiled.plan.query, result.rows);
```

`AnalysisViewConfig` keeps `filters`, `dimensions`, `metrics`, alias-based `sort`, `limit`, optional Elements `scope` and `presentation`. Each component has a stable `id`, persisted `component` reference, optional `field`, output `alias`, display `title` and raw JSON `props`. Incomplete text can remain in configuration, but compilation returns errors and no executable plan.

`AnalysisCompileContext` supplies filter `fields`, explicit `capability`, optional `timeZone`, `allowedOperators`, `filterCompilers` and custom analysis `compilers`. Capabilities separately authorize COUNT, field grouping, numeric functions and date units. Built-ins are `terms`, `histogram` (`props.interval`), `date-histogram` (`props.unit`), `count`, `any` and `numeric` (`props.function`). Date grouping requires an explicit timezone. Custom `AnalysisCompiler` registrations require a nonempty, unique `roles` array (`['dimension']`, `['metric']` or both). `AnalysisComponentCompileContext` extends `AnalysisCompileContext` with the actual readonly `role`; custom compilers and editors can branch on it. Unsupported roles are rejected before compilation. `compile` returns one group or metric, which core validates against its field, alias and capability. The engine and React adapter snapshot and freeze role metadata for each lifecycle.

`compileAnalysis` returns `{ plan?, errors }`; a successful `AnalysisPlan` contains the Wow `query`, matching `schema` and optional `timeZone`. Group aliases omitted from sort are appended in ascending order for deterministic ordering. Default ceilings are 32 groups, 64 metrics, 32 effective sort items and 10,000 rows; capability limits may tighten them. At least one metric is required. Ungrouped analysis has no sort and admits at most one result row.

`validateAnalysisResult` returns `{ rows?, errors }`, rejecting the whole result on missing aliases, invalid types, excess rows or duplicate typed dimension tuples. It reads aliases as literal own keys, retains only schema columns, permits null only for nullable columns, and requires COUNT to be a nonnegative safe integer. Date bucket values are epoch milliseconds. Call `analysisRowKey(row, plan.schema.filter(column => column.role === 'dimension'))` on a validated row for its typed dimension identity.

### Text value buffers

`FilterTextValues` accepts `value?: readonly string[]`, optional controlled `rawText?: string`, `onRawTextChange?(text)` for raw typing, and `onValueChange(values, rawText)`. Without `rawText` it owns a local input buffer. Enter/paste commits the new value collection with an empty buffer in one callback; removing a chip returns the remaining values with the current buffer. A controlled caller must update both values and rawText from that callback. IME confirmation does not submit a token or query.

The registered `text-values` editor serializes every raw edit in `props.rawText`, so unconfirmed input survives instance navigation. Nonempty trimmed rawText prevents pure compilation; a non-string rawText is invalid. Confirmation removes rawText while retaining confirmed values; clearing removes both values and rawText. Whitespace-only input contributes no unconfirmed value. Standalone `onValidityChange(valid, message?)` remains optional; registered validity comes from compilation.

## Engine binding and analysis UI

Call `useViewEngine({ scopeKey, definitionId, host, definition?, instances?, extensions?, limits?, onDiagnostic? })` in your component, then render `<ViewPage {...binding} />`. The hook returns `{ engine: ViewEngine | null, extensions?, error? }`. Filter and analysis registrations are frozen together for that lifetime; cell/action callbacks may update with the same scope. `AnalysisView` accepts engine, extensions, filterContext, toolbarStart, optional controlled configurationOpen/onConfigurationOpenChange and className. `AnalysisEditor` and `AnalysisTable` are controlled composition surfaces. `AnalysisExtensions.analysis` maps names to paired `AnalysisRegistration` editor and compiler definitions.

`AnalysisEditor` receives `value`, `context`, `onChange` and optional `disabled`, `errors`, `extensions`. `AnalysisTable` receives `plan`, validated `rows`, alias-based `sort`, and optional `onSortChange`, `receivedAt`, `stale`, `querying`; its schema belongs to the displayed result, not the latest working configuration.

### Elements scopes and numeric expressions

`AnalysisCapability.scopes` contains host-authorized `AnalysisScopeDefinition` entries: `{ id, label, elements: [{ path, fields }], fields, capability }`. `AnalysisViewConfig.scope` selects `{ id, filters }`, with exactly one `FilterConfiguration` per element. Each element path is relative to the preceding scope; its filter fields are relative to the current element. Final grouping/metric fields use the scope's `fields` and capability. Root `config.filters` always uses the original root fields. Chains contain at most five elements. `analysisScopeContext(config, context)` resolves the selected field/capability context and throws for an unknown or duplicate scope ID. Switching scope in the editor preserves existing query drafts for repair.

`capability.expressions: true` enables an explicit `component.expression` on numeric metrics; omit `component.field` in expression mode. `AnalysisNumericExpression` is a `FIELD` (`field`), `CONSTANT` (`value: number | string`) or `BINARY` (`operator`, `left`, `right`) tree using Wow enum values. Operators are ADD, SUBTRACT, MULTIPLY and DIVIDE. `compileAnalysisExpression(expression, function, context)` validates finite constants, each numeric field/function authorization, depth ≤ 8 and nodes ≤ 256. Text such as `1e` remains in the draft but cannot run. Field mode keeps the existing `field` + `props.function` contract; histogram intervals also retain raw editor text.

The `any` component requires an authorized scalar `field` with `capability.fields[].any: true`. It returns a representative value, not a stable group key or a numeric chart metric. COUNT, SUM, AVG, MIN, MAX and ANY semantics are recorded in `AnalysisResultColumn.aggregation`; dimensions carry `group` metadata with type and applicable interval, unit and timeZone.

### Wow Schema mapping

`adaptWowAnalysisSchema(schema, options?)` is a pure adapter returning `{ model, fields, capability }`; it does not fetch Schema or create a client. `WowAnalysisSchemaOptions` accepts `labels` and `units` keyed by absolute logical field paths. Supply the returned fields/capability to the definition, then use the existing Snapshot/EventStream query client as the host's aggregation source and forward cancellation.

Only nodes with `masked === false` and supported explicit capabilities are published. Scalar numeric, string and boolean fields are mapped conservatively. Temporal fields require `TEMPORAL_EPOCH` with `MILLISECONDS`; other temporal encodings, unions and unknown types are omitted. Object arrays with `ELEMENT_SCOPE` become predefined relative scope chains; root arrays are never flattened into scalar aggregate fields, and scalar arrays are omitted. ANY requires `AGGREGATE_TERMS` on a scalar. Filter operators are limited to the supported PRESENCE, EXACT_MATCH, RANGE and LITERAL_MATCH contracts; full-text-only fields are omitted. Scalar `enumValues` arrays become field `options` with the original string/number/boolean values and `String(value)` labels only when every member matches the field type; null or mixed-type lists are omitted in full. The host may translate option labels and add `numberFormat` to capability fields.

### Presentation and readable values

`AnalysisPresentation` contains `layout: 'table' | 'metric' | 'bar' | 'line' | 'area' | 'pie'`, required `columns: { alias, width? }[]`, optional `x`, `series`, `metrics` aliases, `orientation: 'vertical' | 'horizontal'`, `stacked` and `donut`. An explicitly empty metrics list is invalid. `compileAnalysis` validates only query configuration and returns schema in query order. `validateAnalysisPresentation(value, schema?)` separately returns display-validation strings. Save validation combines both; Run remains query-only. Display changes consume the executed result and do not issue a query.

Switching to the data table retains the chart axes, series, metric selection and display preferences for the return trip. Editing or deleting query outputs preserves visualization references. Existing results keep their executed schema until a new query succeeds. Invalid mappings are repaired only by explicit user selection or the repair action; ambiguous initial mappings remain unselected. Positive and negative SUM values stack separately around zero in both bar and area charts; null/missing combinations report incompatibility while the data table remains available. Changing the layout never truncates a valid metric selection or replaces an explicitly empty selection. A multi-metric pie request shows its compatibility message until the user explicitly selects one supported metric; returning to the previous layout retains the selection. Optional defaults are resolved when rendering rather than written into the draft, so a layout round trip does not create an otherwise unchanged dirty view.

`projectAnalysis(plan, rows, presentation)` consumes admitted rows and returns `{ plan, issues, points, series, x?, continuous }`. Its projected plan applies column order/width and appends unspecified columns. Incompatible dimensions, units or metric semantics produce actionable issues and a table fallback. Metric cards require an ungrouped result; line/area require a continuous numeric/time axis; pie requires SUM or COUNT, no null/negative values and no series split. Charts allow at most 500 returned groups, 12 series and 24 pie sectors. Projection never recomputes averages, synthesizes zero buckets or claims a full total from limited groups. Typed tuple identities survive duplicate display labels. Analysis tables use fixed column layout with 160px default widths (overridden by column width), horizontal scrolling in narrow containers, and full cell values in native titles when text is clipped. `AnalysisTable.sortDisabled` defaults to false; set it when working inputs cannot run, without marking the displayed result as loading.

`formatAnalysisValue(value, column?, timeZone?)` returns display text. Group/ANY field `options: { value, label }[]` use typed value matching; `numberFormat` is `Intl.NumberFormatOptions & { locale?: string }` on capability fields and result columns. COUNT uses exact integer grouping; other numbers default to at most three fraction digits, with up to six significant digits for nonzero magnitudes below 0.001. The default locale is `zh-CN`. Explicit numeric options override that default precision; invalid Intl settings fall back to the raw value. Null/undefined display as `无值`, zero stays zero, and datetimes use the plan timezone. Tables, metric cards and metric tooltips retain the original value in a title. Formatting never changes query values, sorting or row identity.

`AnalysisEditor` includes scope filters, scalar ANY, bounded formula editing and raw numeric drafts. `AnalysisPresentationEditor` is public from the React entry and accepts `value`, optional executed `plan`, `onChange`, `disabled` and `showIssues` (default `true`). Full analysis views let the chart result own compatibility notices to avoid duplicates; table-only views and standalone editors retain them. `AnalysisView` renders the supported charts using lazy Recharts loading; query and display editors remain separate.

Sources: [analysisCompiler.ts:205](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/analysisCompiler.ts#L205), [wowAnalysis.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/wowAnalysis.ts#L62), [analysisProjection.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/analysisProjection.ts#L106), [analysisFormatting.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/analysisFormatting.ts#L18)。

`AnalysisEditor` also accepts `filterContext`, combined filter/analysis `extensions`, and `onFilterValidityChange(valid)` for the current element-filter editors. `AnalysisView` combines root and every element editor validity before Run/Save; a valid panel cannot clear another panel's invalid buffer. Scope and instance changes discard obsolete editor validity. Custom scope filter components receive the same extensions and host context as root filters.

Analysis uses three regions: a right-side query Sheet, central results, and a left visualization panel collapsed by default. The query Sheet keeps its editor mounted across closing and resizing; closing preserves drafts and neither saves nor runs. Select a chart type before configuring visualization fields. Unconfigured analysis defaults to the data table; saved charts retain their presentation. The bottom Analysis / Table modes are always available, even without a chart or result, and switching does not query or save. Chart incompatibility stays in Analysis mode with an explicit Table action. Dimensions and metrics keep their summary chips, retained popover editors and keyboard ordering.

`AnalysisView` preserves one editor subtree across layout changes and dialog closure, including extension-local drafts and invalid state. The exported `DialogContent` accepts optional `keepMounted` (default `false`), forwarding the Base UI Portal option; retained content is hidden while closed. Pie/donut charts expose persistent values and returned-group shares, using normalized ratios to avoid overflow without changing admitted values.

View-kind icons are consistent in the sidebar, instance selector and view manager, with accessible type descriptions. Chart and metric results use centered bottom Analysis/Data table tabs. Switching tabs is local, does not query or save, and retains the returned-table page after its first opening. Unsupported chart configurations show their reason in Analysis mode and offer an explicit action to view the data table; neither mode is disabled or selected implicitly.

Analysis views share manual refresh, automatic refresh (off, 30 seconds, 1 minute, 5 minutes) and expand-in-place controls with data views. Automatic refresh pauses for background pages, editing/popups, pending queries, errors, writes and unrun query changes. It never submits a query draft. Escape exits the expanded view without remounting the editor. The refresh interval belongs to the mounted view and is cleared when it unmounts.

`AnalysisPresentationEditor.chartOnly` defaults to false; the full analysis view enables it, keeps table inspection in the bottom mode switch, and shows chart settings only after a chart is selected.

The query Sheet uses “Run and view”: `engine.analysis(id).start()` synchronously validates and captures the query, then returns `{ accepted, completion }`. Validation may throw; refusal returns `accepted: false`. Close the Sheet only on acceptance, and handle `completion` independently. `run()` awaits the same execution pipeline. `AnalysisSession.queryAttempt` retains the last accepted plan, including after failure; `pendingQuery` describes only the active request. Revisiting a failed instance does not implicitly retry it.

The result summary always uses the last successful configuration, schema, rows and local reception time. Reaching a known limit means more groups may exist, not a confirmed truncation or global total. Unrun drafts and failed attempts remain visible alongside old results; header sorting is disabled while the working query differs. Saving and execution remain independent. Instance navigation retains raw editor input, viewing mode and panel preference. Table mode hides the visualization panel without resetting it; the explicit visualization action selects Analysis and expands it. Available existing chart types are checked against successful results; only unique field mappings are initialized, and style controls expand on demand. These display operations never query.
