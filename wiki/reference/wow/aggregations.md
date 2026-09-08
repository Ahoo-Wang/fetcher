---
title: 'Aggregation builders'
description: 'Aggregation builders — @ahoo-wang/fetcher-wow 5.0.0'
---

# Aggregation builders

AggregationQuery describes a server aggregation, not a JavaScript reducer. Supply at least one metric. `aggregate(query, attributes?, controller?)` returns flat rows keyed by your aliases; `aggregateStream` returns JSON SSE rows and needs explicit stream consumption. Generics describe rows but do not validate their contents.

| Builder                                        | Inputs / result                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| aggregation.element(path, predicate?)          | Select an array/nested element path, with optional element-relative filter; root metadata/search/deletion filters are rejected inside predicate. |
| field(field), constant(number)                 | Field reference or finite numeric constant expression.                                                                                           |
| add/subtract/multiply/divide(left, right)      | Binary expression tree; division is evaluated by the backend, not here.                                                                          |
| terms(field, alias)                            | Terms grouping.                                                                                                                                  |
| histogram(field, {interval, alias})            | Finite interval &gt; 0.                                                                                                                          |
| dateHistogram(field, {unit, alias, timeZone?}) | AggregationDateUnit from YEAR to SECOND, timeZone defaults UTC; empty zone and invalid enum throw.                                               |
| count(alias)                                   | Count metric; no field argument.                                                                                                                 |
| any(field, alias)                              | Backend-selected value; do not treat it as a deterministic first row.                                                                            |
| sum/avg/min/max(expression, alias)             | Numeric metric over an expression.                                                                                                               |

Query fields are filter, elements, groupBy, metrics (nonempty tuple), sort, limit. Root filter selects source documents; elements describes nested element traversal/filtering, and group/metric fields refer to that aggregation scope. Output stays flat; elements does not mean a nested output response. Sort fields refer to output aliases. Omitted filter/groupBy/sort/limit are left undefined; there is no hidden client limit or grouping.

Field syntax is validated by the same logical-field validator as filter. Aliases must be one valid segment, cannot contain dots or begin `__wow`. Invalid aliases, nonfinite constants and invalid histogram options throw TypeError. These checks do not guarantee fields exist, are numeric, or that a backend supports the query; service errors still reject. Builders perform no I/O or cleanup. Streaming readers must be cancelled and released when abandoned.

## Complete example

```ts
import { aggregation, filter, desc } from '@ahoo-wang/fetcher-wow';
import type { AggregationQuery } from '@ahoo-wang/fetcher-wow';
export const revenue: AggregationQuery = {
  filter: filter.eq('state.status', 'PAID'),
  elements: [aggregation.element('state.lines', filter.gt('quantity', 0))],
  groupBy: [aggregation.terms('sku', 'sku')],
  metrics: [
    aggregation.sum(
      aggregation.multiply(
        aggregation.field('price'),
        aggregation.field('quantity'),
      ),
      'revenue',
    ),
    aggregation.count('rows'),
  ],
  sort: [desc('revenue')],
  limit: 20,
};
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./index#public-symbols). Runtime defaults and failure behavior are described above.

### AggregationGroupType {#api-AggregationGroupType}

```ts
export enum AggregationGroupType {
  TERMS = 'TERMS',
  HISTOGRAM = 'HISTOGRAM',
  DATE_HISTOGRAM = 'DATE_HISTOGRAM',
}
```

[packages/wow/src/query/aggregation.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L22)

### AggregationMetricType {#api-AggregationMetricType}

```ts
export enum AggregationMetricType {
  COUNT = 'COUNT',
  NUMERIC = 'NUMERIC',
  ANY = 'ANY',
}
```

[packages/wow/src/query/aggregation.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L28)

### AggregationExpressionType {#api-AggregationExpressionType}

```ts
export enum AggregationExpressionType {
  FIELD = 'FIELD',
  CONSTANT = 'CONSTANT',
  BINARY = 'BINARY',
}
```

[packages/wow/src/query/aggregation.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L34)

### AggregationExpressionOperator {#api-AggregationExpressionOperator}

```ts
export enum AggregationExpressionOperator {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
}
```

[packages/wow/src/query/aggregation.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L40)

### AggregationDateUnit {#api-AggregationDateUnit}

```ts
export enum AggregationDateUnit {
  YEAR = 'YEAR',
  QUARTER = 'QUARTER',
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY',
  HOUR = 'HOUR',
  MINUTE = 'MINUTE',
  SECOND = 'SECOND',
}
```

[packages/wow/src/query/aggregation.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L47)

### AggregationFunction {#api-AggregationFunction}

```ts
export enum AggregationFunction {
  SUM = 'SUM',
  AVG = 'AVG',
  MIN = 'MIN',
  MAX = 'MAX',
}
```

[packages/wow/src/query/aggregation.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L58)

### AggregationElement {#api-AggregationElement}

```ts
export interface AggregationElement {
  path: QueryField;
  filter?: ElementFilterExpression;
}
```

[packages/wow/src/query/aggregation.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L65)

### TermsAggregationGroup {#api-TermsAggregationGroup}

```ts
export interface TermsAggregationGroup<
  FIELDS extends string = string,
> extends AggregationGroupBase<FIELDS> {
  type: AggregationGroupType.TERMS;
}
```

[packages/wow/src/query/aggregation.ts:75](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L75)

### HistogramAggregationGroup {#api-HistogramAggregationGroup}

```ts
export interface HistogramAggregationGroup<
  FIELDS extends string = string,
> extends AggregationGroupBase<FIELDS> {
  type: AggregationGroupType.HISTOGRAM;
  interval: number;
}
```

[packages/wow/src/query/aggregation.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L81)

### DateHistogramAggregationGroup {#api-DateHistogramAggregationGroup}

```ts
export interface DateHistogramAggregationGroup<
  FIELDS extends string = string,
> extends AggregationGroupBase<FIELDS> {
  type: AggregationGroupType.DATE_HISTOGRAM;
  unit: AggregationDateUnit;
  timeZone?: string;
}
```

[packages/wow/src/query/aggregation.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L88)

### AggregationGroup {#api-AggregationGroup}

```ts
export type AggregationGroup<FIELDS extends string = string> =
  | TermsAggregationGroup<FIELDS>
  | HistogramAggregationGroup<FIELDS>
  | DateHistogramAggregationGroup<FIELDS>;
```

[packages/wow/src/query/aggregation.ts:96](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L96)

### FieldAggregationExpression {#api-FieldAggregationExpression}

```ts
export interface FieldAggregationExpression<FIELDS extends string = string> {
  type: AggregationExpressionType.FIELD;
  field: QueryField<FIELDS>;
}
```

[packages/wow/src/query/aggregation.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L101)

### ConstantAggregationExpression {#api-ConstantAggregationExpression}

```ts
export interface ConstantAggregationExpression {
  type: AggregationExpressionType.CONSTANT;
  value: number;
}
```

[packages/wow/src/query/aggregation.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L106)

### BinaryAggregationExpression {#api-BinaryAggregationExpression}

```ts
export interface BinaryAggregationExpression<FIELDS extends string = string> {
  type: AggregationExpressionType.BINARY;
  operator: AggregationExpressionOperator;
  left: AggregationExpression<FIELDS>;
  right: AggregationExpression<FIELDS>;
}
```

[packages/wow/src/query/aggregation.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L111)

### AggregationExpression {#api-AggregationExpression}

```ts
export type AggregationExpression<FIELDS extends string = string> =
  | FieldAggregationExpression<FIELDS>
  | ConstantAggregationExpression
  | BinaryAggregationExpression<FIELDS>;
```

[packages/wow/src/query/aggregation.ts:118](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L118)

### CountAggregationMetric {#api-CountAggregationMetric}

```ts
export interface CountAggregationMetric {
  type: AggregationMetricType.COUNT;
  alias: string;
}
```

[packages/wow/src/query/aggregation.ts:123](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L123)

### NumericAggregationMetric {#api-NumericAggregationMetric}

```ts
export interface NumericAggregationMetric<FIELDS extends string = string> {
  type: AggregationMetricType.NUMERIC;
  function: AggregationFunction;
  expression: AggregationExpression<FIELDS>;
  alias: string;
}
```

[packages/wow/src/query/aggregation.ts:128](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L128)

### AnyAggregationMetric {#api-AnyAggregationMetric}

```ts
export interface AnyAggregationMetric<FIELDS extends string = string> {
  type: AggregationMetricType.ANY;
  field: QueryField<FIELDS>;
  alias: string;
}
```

[packages/wow/src/query/aggregation.ts:135](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L135)

### AggregationMetric {#api-AggregationMetric}

```ts
export type AggregationMetric<FIELDS extends string = string> =
  | CountAggregationMetric
  | NumericAggregationMetric<FIELDS>
  | AnyAggregationMetric<FIELDS>;
```

[packages/wow/src/query/aggregation.ts:141](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L141)

### AggregationQuery {#api-AggregationQuery}

```ts
export interface AggregationQuery<
  ROOT_FIELDS extends string = string,
  AGGREGATION_FIELDS extends string = ROOT_FIELDS,
> {
  filter?: FilterExpression<ROOT_FIELDS>;
  elements?: AggregationElement[];
  groupBy?: AggregationGroup<AGGREGATION_FIELDS>[];
  metrics: [
    AggregationMetric<AGGREGATION_FIELDS>,
    ...AggregationMetric<AGGREGATION_FIELDS>[],
  ];
  sort?: FieldSort[];
  limit?: number;
}
```

[packages/wow/src/query/aggregation.ts:146](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L146)

### HistogramAggregationOptions {#api-HistogramAggregationOptions}

```ts
export interface HistogramAggregationOptions {
  interval: number;
  alias: string;
}
```

[packages/wow/src/query/aggregation.ts:161](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L161)

### DateHistogramAggregationOptions {#api-DateHistogramAggregationOptions}

```ts
export interface DateHistogramAggregationOptions {
  unit: AggregationDateUnit;
  alias: string;
  timeZone?: string;
}
```

[packages/wow/src/query/aggregation.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L166)

### aggregation {#api-aggregation}

```ts
declare const aggregation: {
  element(
    path: string,
    predicate?: ElementFilterExpression,
  ): AggregationElement;
  field<FIELDS extends string>(
    field: FIELDS,
  ): FieldAggregationExpression<FIELDS>;
  constant(value: number): ConstantAggregationExpression;
  add: <FIELDS extends string>(
    left: AggregationExpression<FIELDS>,
    right: AggregationExpression<FIELDS>,
  ) => BinaryAggregationExpression<FIELDS>;
  subtract: <FIELDS extends string>(
    left: AggregationExpression<FIELDS>,
    right: AggregationExpression<FIELDS>,
  ) => BinaryAggregationExpression<FIELDS>;
  multiply: <FIELDS extends string>(
    left: AggregationExpression<FIELDS>,
    right: AggregationExpression<FIELDS>,
  ) => BinaryAggregationExpression<FIELDS>;
  divide: <FIELDS extends string>(
    left: AggregationExpression<FIELDS>,
    right: AggregationExpression<FIELDS>,
  ) => BinaryAggregationExpression<FIELDS>;
  terms<FIELDS extends string>(
    field: FIELDS,
    alias: string,
  ): TermsAggregationGroup<FIELDS>;
  histogram<FIELDS extends string>(
    field: FIELDS,
    { interval, alias }: HistogramAggregationOptions,
  ): HistogramAggregationGroup<FIELDS>;
  dateHistogram<FIELDS extends string>(
    field: FIELDS,
    { unit, alias, timeZone }: DateHistogramAggregationOptions,
  ): DateHistogramAggregationGroup<FIELDS>;
  any<FIELDS extends string>(
    field: FIELDS,
    alias: string,
  ): AnyAggregationMetric<FIELDS>;
  count(alias: string): CountAggregationMetric;
  sum: <FIELDS extends string>(
    expression: AggregationExpression<FIELDS>,
    alias: string,
  ) => NumericAggregationMetric<FIELDS>;
  avg: <FIELDS extends string>(
    expression: AggregationExpression<FIELDS>,
    alias: string,
  ) => NumericAggregationMetric<FIELDS>;
  min: <FIELDS extends string>(
    expression: AggregationExpression<FIELDS>,
    alias: string,
  ) => NumericAggregationMetric<FIELDS>;
  max: <FIELDS extends string>(
    expression: AggregationExpression<FIELDS>,
    alias: string,
  ) => NumericAggregationMetric<FIELDS>;
};
```

[packages/wow/src/query/aggregation.ts:210](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L210)

## Related topics

[Client configuration and metadata](./configuration) · [Commands and wait results](./commands) · [Snapshot queries](./snapshot-queries) · [Filter expressions and legacy conditions](./filters) · [Projection, sorting and pagination](./query-options) · [Cursor queries](./cursor-queries) · [Events and historical state](./events-and-history) · [Shared domain types and utilities](./shared-types)
