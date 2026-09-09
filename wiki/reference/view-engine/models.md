---
title: Definitions and instances
description: Persist component configuration and declare record and source capabilities explicitly.
---

# Definitions and instances

## ViewDefinition

| Property                              | Contract                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `id`, `title`                         | Shared definition identity and display title                                                    |
| `sourceId`                            | Local identifier passed to `host.resolveSource`                                                 |
| `rowKey`                              | Record-relative own-property path to a unique string or finite-number key                       |
| `fields`                              | Read-only field definitions with `field`, `label`, optional type/group/options/operators/editor |
| `timeZone?`                           | Shared filter/cell datetime timezone; omission uses local runtime                               |
| `allowedOperators?`, `filterEditors?` | Definition-level operator restrictions and editor defaults                                      |
| `recordActions?`                      | Named global/table/row renderer references                                                      |

`ViewFieldDefinition` also supports `sortable`, `cellRenderer`, `numberFormat` and `summaryFunctions`. `RendererReference` and `FilterEditorReference` are `{ name: string, options?: JSON object }`. Functions belong to runtime registration.

## ViewInstance and RecordViewConfig

A `ViewInstance` is a `RecordViewInstance`: `id`, `definitionId`, `title`, optional `revision`, `scope`, `kind: 'record'`, and `config`.

| Config property | Stored value                                    |
| --------------- | ----------------------------------------------- |
| `filters`       | `FilterConfiguration`: mode plus component tree |
| `sort`          | Wow `FieldSort[]`                               |
| `pagination`    | `{ mode: 'paged' \| 'cursor', size: number }`   |
| `presentation`  | `{ layout: 'table', table: { columns } }`       |

Scope is `{ type: 'personal' }` or `{ type: 'public', source: 'system' | 'shared' }`. Save-as accepts personal or shared scope. `ViewInstanceList` returns the complete visible `instances` and a `defaultInstanceId` string or null.

A field column has `id`, `kind: 'field'`, `field` and optional `title`, `width`, `visible`, `pinned`, `renderer`, `summary`. An actions column uses `kind: 'actions'` and no field. Explicit width is 64–960 px; helpers export minimum, maximum and default (180 px). Row-key/action mandatory pinning is computed by `getRecordColumnPinning`; `orderRecordColumns` returns display order without rewriting persisted preferences.

## RecordQuerySource

The source supplies `paged` and/or `cursor` from Wow `QueryApi<RecordData>`, with optional `aggregate`. These methods receive `(query, attributes?, abortController?)`; forward cancellation to the transport. The query uses the `FilterExpression` branch of Wow request types, not the older `condition` DSL.

Paged results are `{ list, total }`. Cursor results are `{ list, nextCursor }`, with `nextCursor: null` at the end. An aggregate returns result rows described by the generated aggregation query; use the summary helpers rather than guessing aliases. Advertise only supported modes. Metadata and source capability must agree.

`readRecordValue` traverses own properties and canonical dot-separated array indices; a literal dotted own key wins. `getRecordKey` and `validateRecordRows` check stable identities. `validateViewDefinition` and `validateViewInstance` are available at trust boundaries; runtime snapshots use `DeepReadonly`.
