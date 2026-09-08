---
title: 'Schemas and references'
description: 'Schemas and references — Fetcher 5.0.0'
---

# Schemas and references

Use `Schema` for payload shape and `Components` to name reusable definitions. Optional properties below describe constraints; they do not apply defaults or validate data.

## Schema fields

| Family      | Fields and accepted shape                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity    | `$schema`, title, description, format are strings; type is `SchemaType` or an array                                                                         |
| Values      | example, const, default accept any value; enum accepts any[]                                                                                                |
| Flags       | nullable, readOnly, writeOnly, deprecated are optional booleans                                                                                             |
| Numbers     | minimum/maximum/multipleOf are numbers; exclusiveMinimum/exclusiveMaximum accept boolean or number                                                          |
| Strings     | minLength/maxLength numbers, pattern string                                                                                                                 |
| Arrays      | items is one Schema/Reference; minItems/maxItems numbers, uniqueItems boolean                                                                               |
| Objects     | properties maps names to Schema/Reference; required is string[]; minProperties/maxProperties numbers; additionalProperties accepts boolean/Schema/Reference |
| Composition | allOf/anyOf/oneOf arrays, not one Schema/Reference                                                                                                          |
| Metadata    | discriminator, xml and externalDocs                                                                                                                         |

`SchemaType` includes string, number, integer, boolean, array, object, null. This supports selected 3.0 and 3.1 notation together (`nullable`, type arrays, `$schema`, const, numeric exclusive bounds); it is not a complete JSON Schema 2020-12 model. There is no boolean Schema alternative, `$defs`, prefixItems, or unevaluatedProperties field.

## References and components

`Reference` contains only `$ref: string`. It neither verifies target existence nor resolves local/remote pointers. `IsReference<T>` is a distributive conditional type selecting union members assignable to `{ $ref: string }`; it is not a runtime type guard.

`Components` holds optional named maps of schemas, responses, parameters, examples, requestBodies, headers, securitySchemes, links and callbacks. Each map value also accepts Reference. `ComponentTypeMap` maps those same keys to the corresponding non-reference object type for generic code.

`Discriminator.propertyName` is required; mapping is optional string-to-string. All XML properties are optional: name, namespace, prefix, attribute, wrapped. They do not change serialization themselves.

## Complete type example

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
