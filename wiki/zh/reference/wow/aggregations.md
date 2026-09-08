---
title: '聚合构造器'
description: '聚合构造器 — @ahoo-wang/fetcher-wow 5.0.0'
---

# 聚合构造器

AggregationQuery 描述服务端聚合，不是 JavaScript reducer，至少提供一个 metric。`aggregate(query, attributes?, controller?)` 返回以 alias 为键的扁平行；`aggregateStream` 返回 JSON SSE 行，需要显式消费。泛型描述行但不校验内容。

| 构造器                                         | 输入 / 结果                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| aggregation.element(path, predicate?)          | 选择数组/嵌套元素路径，可带元素相对 filter；predicate 内拒绝根元数据/search/deletion 过滤。 |
| field(field)、constant(number)                 | 字段引用或有限数值常量表达式。                                                              |
| add/subtract/multiply/divide(left, right)      | 二元表达式树，除法由后端求值，不在此执行。                                                  |
| terms(field, alias)                            | terms 分组。                                                                                |
| histogram(field, {interval, alias})            | interval 必须有限且大于 0。                                                                 |
| dateHistogram(field, {unit, alias, timeZone?}) | AggregationDateUnit 从 YEAR 到 SECOND，时区默认 UTC；空时区或非法枚举抛错。                 |
| count(alias)                                   | count 指标，没有字段参数。                                                                  |
| any(field, alias)                              | 后端选择的值，不保证是确定性的第一行。                                                      |
| sum/avg/min/max(expression, alias)             | 对表达式进行数值聚合。                                                                      |

查询字段为 filter、elements、groupBy、metrics（非空元组）、sort、limit。根 filter 选择源文档，elements 描述嵌套元素遍历/过滤，分组和指标字段相对于该聚合作用域。结果仍为扁平行，elements 不表示嵌套响应。sort 使用输出 alias。省略 filter/groupBy/sort/limit 保持 undefined，没有隐藏客户端 limit 或分组。

字段语法由 filter 使用的逻辑字段校验器验证。alias 必须为合法单段，不能含点或以 `__wow` 开头。非法 alias、非有限常量、非法 histogram 选项抛 TypeError；不保证字段存在、为数值或后端支持，服务错误仍可拒绝。构造器无 I/O，无须清理；放弃流式读取时需取消并释放 reader。

## 完整示例

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

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

::: details 展开完整字段与成员

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

:::

[packages/wow/src/query/aggregation.ts:210](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L210)

## 相关专题

[客户端配置与元数据](./configuration) · [命令与等待结果](./commands) · [快照查询](./snapshot-queries) · [过滤表达式与旧条件](./filters) · [投影、排序与分页](./query-options) · [游标查询](./cursor-queries) · [事件与历史状态](./events-and-history) · [身份与资源归属](./identity-and-attribution)
