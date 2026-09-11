---
title: Definitions and instances
description: Persist component configuration and declare record and source capabilities explicitly.
---

# Definitions and instances

## ViewDefinition

| Property                              | Contract                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`, `title`                         | Shared definition identity and display title                                                         |
| `sourceId`                            | Local identifier passed to `host.resolveSource`                                                      |
| `record.rowKey`                       | Record-relative own-property path to a unique string or finite-number key                            |
| `fields`                              | Read-only field definitions with `field`, `label`, optional type/group/options/operators/editor      |
| `record.allowedLayouts`               | Required, nonempty, unique layout array: `table`, `card`, or both. A single layout hides the switch. |
| `record.defaultPresentation?`         | Optional `table` / `card` presets used when first initializing an unconfigured layout.               |
| `timeZone?`                           | Shared filter/cell datetime timezone; omission uses local runtime                                    |
| `allowedOperators?`, `filterEditors?` | Definition-level operator restrictions and editor defaults                                           |
| `record.recordActions?`               | Named global/toolbar/row renderer references                                                         |

`ViewFieldDefinition` also supports `sortable`, `cellRenderer`, `numberFormat` and `summaryFunctions`. `RendererReference` and `FilterEditorReference` are `{ name: string, options?: JSON object }`. Functions belong to runtime registration.

## ViewInstance and RecordViewConfig

`ViewInstance` is `RecordViewInstance | AnalysisViewInstance`, discriminated by `kind`. Both require `id`, `definitionId`, `title`, nonblank `revision`, `scope` and `config`. Record config is listed below; analysis config contains root filters, optional Elements scope, dimensions, metrics, sort, limit and table/chart presentation.

| Config property | Stored value                                    |
| --------------- | ----------------------------------------------- |
| `filters`       | `FilterConfiguration`: mode plus component tree |
| `sort`          | Wow `FieldSort[]`                               |
| `pagination`    | `{ mode: 'paged' \| 'cursor', size: number }`   |
| `presentation`  | `RecordPresentation`                            |

Scope is `{ type: 'personal' }` or `{ type: 'public', source: 'system' | 'shared' }`. Save-as accepts personal or shared scope. `ViewInstanceList` requires the complete visible `instances` and `defaultInstanceId: string | null`; a non-null default must name a listed instance. `ViewEngineState.defaultInstanceId` is the independently published default and can differ from `selectedInstanceId`.

A field column has `id`, `kind: 'field'`, `field` and optional `title`, `width`, `visible`, `pinned`, `renderer`, `summary`. An actions column uses `kind: 'actions'` and no field. Explicit width is 64–960 px; helpers export minimum, maximum and default (180 px). Row-key/action mandatory pinning is computed by `getRecordColumnPinning`; `orderRecordColumns` returns display order without rewriting persisted preferences.

`RecordPresentation` is a union discriminated by `layout`:

- `{ layout: 'table', table: RecordTableConfig, card?: RecordCardConfig }`
- `{ layout: 'card', card: RecordCardConfig, table?: RecordTableConfig }`

The active layout must belong to the definition's `record.allowedLayouts`. Table configuration contains `columns`; card configuration contains `title`, `fields`, and optional `cover` and `actions`. Switching preserves the other layout's configuration; saving/restoring includes both configurations, but never the runtime `renderCard` callback.

## RecordQuerySource

The source supplies `paged` and/or `cursor` from Wow `QueryApi<RecordData>`, with optional `aggregate`. These methods receive `(query, attributes?, abortController?)`; forward cancellation to the transport. The query uses the `FilterExpression` branch of Wow request types, not the older `condition` DSL.

Paged results are `{ list, total }`. Cursor results are `{ list, nextCursor }`, with `nextCursor: null` at the end. An aggregate returns result rows described by the generated aggregation query; use the summary helpers rather than guessing aliases. Advertise only supported modes. Metadata and source capability must agree.

`readRecordValue` traverses own properties and canonical dot-separated array indices; a literal dotted own key wins. `getRecordKey` and `validateRecordRows` check stable identities. `validateViewDefinition` and `validateViewInstance` are available at trust boundaries; runtime snapshots use `DeepReadonly`.

`ViewDeleteResult` contains required `defaultInstance: ViewInstance | null`, the authoritative default view from the deletion transaction rather than an ID inferred from local order.

## Mixed capabilities

A definition declares `record?: RecordCapability` and/or `analysis?: AnalysisCapability`; at least one is required. `RecordViewDefinition` requires record capability. Analysis uses `AnalysisViewConfig` and an aggregate-only `ViewSource`, without inventing a row key. See [pure analysis and result validation](./components.md#pure-analysis-compilation).

A dimension owns its display field through `label: { field: "productName", alias: "productName", title: "Product name" }`. The compiler adds an authorized ANY output and marks the result column with `labelFor`. Users configure grouping and display together; names are not listed as measures. Changing this field requires running the query. Group IDs remain unchanged; duplicate names include IDs, missing or conflicting names fall back to IDs. Valid analyses initially show results with collapsed configuration and execution details. Two dimensions automatically map to category and series. `ANALYSIS_VISUALIZATIONS` describes built-in chart capabilities.
