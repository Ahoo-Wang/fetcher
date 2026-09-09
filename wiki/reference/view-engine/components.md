---
title: React components and theme
description: Choose the right ownership layer and configure controls, cells and action props.
---

# React components and theme

## Page and table surfaces

| Component              | Required input                                                                      | Owner                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ViewPage`             | scopeKey, definitionId, host                                                        | Creates/loads/disposes engine; optional local definition and instance list |
| `ViewPageContent`      | engine                                                                              | Renders page navigation and record view; caller owns engine                |
| `RecordView`           | engine                                                                              | Renders the selected record session; caller owns engine                    |
| `RecordTable`          | definition, instance, appliedFilter, rows, selection/column/sort callbacks, refresh | Controlled table; caller owns requests and state                           |
| `RecordColumnSettings` | definition, columns, onChange                                                       | Controlled column configuration                                            |

`ViewPage`/`RecordView` accept `extensions`, `filterContext`, `selectable` (default false), `autoRefreshPaused` (default false), and `className`. ViewPage also accepts `initialSidebarCollapsed`; RecordView has `toolbarStart`. RecordTable separately accepts query/summary states and retry callbacks.

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

`GlobalActionsRendererProps` and `TableActionsRendererProps` provide definition/instance/filter/sort/options/refresh, selectedRowKeys and querying. `RowActionsRendererProps` adds record/rowKey to the common action context. `CellRendererProps` provides value/record/rowKey/index/field/column/definition/instance/options. These inputs are immutable; construct new values for changes. Cell props do not include a business command API.

## Theme and accessibility

Compiled styles use `.fve-root`, `fve:` utilities and `--fve-*` variables. Explicit data-theme values are light/dark; otherwise inherited color-scheme selects the appearance. Portals copy current tokens, typography and color scheme from their trigger scope so clipped/scrolling containers remain usable. Keep labels, error associations and keyboard semantics when composing custom controls.

The public composition primitives are Button, Calendar, Popover/PopoverContent/PopoverTitle/PopoverTrigger, the Select family and the InputGroup family listed in [symbols](./symbols.md). Internal DropdownMenu, Dialog and other private files are not extra supported package imports.
