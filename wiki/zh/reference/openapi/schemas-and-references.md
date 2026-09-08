---
title: 'Schema 与引用'
description: 'Schema 与引用 — Fetcher 5.0.0'
---

# Schema 与引用

用 `Schema` 描述负载形状，用 `Components` 为可复用定义命名。下列可选属性仅描述约束，不会应用默认值或校验数据。

## Schema 字段

| 分组   | 字段及接受的形状                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 标识   | `$schema`、title、description、format 为字符串；type 为 `SchemaType` 或其数组                                                                          |
| 值     | example、const、default 接受任意值；enum 接受 any[]                                                                                                    |
| 标记   | nullable、readOnly、writeOnly、deprecated 为可选布尔值                                                                                                 |
| 数字   | minimum/maximum/multipleOf 为数字；exclusiveMinimum/exclusiveMaximum 接受布尔或数字                                                                    |
| 字符串 | minLength/maxLength 为数字，pattern 为字符串                                                                                                           |
| 数组   | items 为单个 Schema/Reference；minItems/maxItems 为数字，uniqueItems 为布尔                                                                            |
| 对象   | properties 将名称映射到 Schema/Reference；required 为 string[]；minProperties/maxProperties 为数字；additionalProperties 接受 boolean/Schema/Reference |
| 组合   | allOf/anyOf/oneOf 为数组，not 为单个 Schema/Reference                                                                                                  |
| 元数据 | discriminator、xml、externalDocs                                                                                                                       |

`SchemaType` 包含 string、number、integer、boolean、array、object、null。它同时容纳部分 3.0 与 3.1 表达（`nullable`、type 数组、`$schema`、const、数字排他边界），不是完整 JSON Schema 2020-12 模型。没有布尔 Schema 分支，也没有 `$defs`、prefixItems、unevaluatedProperties 字段。

## 引用与组件

`Reference` 仅含 `$ref: string`。它不检查目标存在，也不解析本地/远程指针。`IsReference<T>` 是分配式条件类型，筛选联合中可赋给 `{ $ref: string }` 的成员，不是运行时类型守卫。

`Components` 含 schemas、responses、parameters、examples、requestBodies、headers、securitySchemes、links、callbacks 的可选命名映射，各映射值也接受 Reference。`ComponentTypeMap` 为泛型代码把相同键映射到对应的非引用对象类型。

`Discriminator.propertyName` 必填，mapping 为可选字符串映射。XML 所有属性都可选：name、namespace、prefix、attribute、wrapped。它们本身不改变序列化过程。

## 完整类型示例

```ts
import type {
  Components,
  Reference,
  IsReference,
  Schema,
} from '@ahoo-wang/fetcher-openapi';
const item: Schema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: { id: { type: 'string' }, note: { type: ['string', 'null'] } },
};
const components: Components = { schemas: { Item: item } };
const ref: IsReference<Schema | Reference> = {
  $ref: '#/components/schemas/Item',
};
console.log(components.schemas?.Item, ref.$ref);
```

### SchemaType {#schematype}

[packages/openapi/src/base-types.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L44)

```ts
export type SchemaType =
  'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
```

### Discriminator {#discriminator}

[packages/openapi/src/schema.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L28)

```ts
export interface Discriminator extends Extensible {
  propertyName: string;
  mapping?: Record<string, string>;
}
```

### XML {#xml}

[packages/openapi/src/schema.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L42)

```ts
export interface XML extends Extensible {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}
```

### Schema {#schema}

[packages/openapi/src/schema.ts:91](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L91)

```ts
export interface Schema extends Extensible {
  $schema?: string;
  // General properties
  title?: string;
  description?: string;
  type?: SchemaType | SchemaType[];
  format?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  example?: any;
  const?: any;
  default?: any;

  // Numeric constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  multipleOf?: number;

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Array constraints
  items?: Schema | Reference;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object constraints
  properties?: Record<string, Schema | Reference>;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | Schema | Reference;

  // Composition
  allOf?: Array<Schema | Reference>;
  anyOf?: Array<Schema | Reference>;
  oneOf?: Array<Schema | Reference>;
  not?: Schema | Reference;

  // Enumeration
  enum?: any[];

  // Polymorphism support
  discriminator?: Discriminator;

  // XML serialization
  xml?: XML;

  // External documentation
  externalDocs?: ExternalDocumentation;
}
```

### Reference {#reference}

[packages/openapi/src/reference.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/reference.ts#L23)

```ts
export interface Reference {
  $ref: string;
}
```

### IsReference {#isreference}

[packages/openapi/src/reference.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/reference.ts#L30)

```ts
export type IsReference<T> = T extends { $ref: string } ? T : never;
```

### Components {#components}

[packages/openapi/src/components.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/components.ts#L42)

```ts
export interface Components extends Extensible {
  schemas?: Record<string, Schema | Reference>;
  responses?: Record<string, Response | Reference>;
  parameters?: Record<string, Parameter | Reference>;
  examples?: Record<string, Example | Reference>;
  requestBodies?: Record<string, RequestBody | Reference>;
  headers?: Record<string, Header | Reference>;
  securitySchemes?: Record<string, SecurityScheme | Reference>;
  links?: Record<string, Link | Reference>;
  callbacks?: Record<string, Callback | Reference>;
}
```

### ComponentTypeMap {#componenttypemap}

[packages/openapi/src/components.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/components.ts#L57)

```ts
export type ComponentTypeMap = {
  schemas: Schema;
  responses: Response;
  parameters: Parameter;
  examples: Example;
  requestBodies: RequestBody;
  headers: Header;
  securitySchemes: SecurityScheme;
  links: Link;
  callbacks: Callback;
};
```
