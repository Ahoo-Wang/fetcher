---
title: '文档与操作'
description: '文档与操作 — Fetcher 5.0.0'
---

# 文档与操作

用这些类型编写 OpenAPI 文档，或描述[生成器](../generator/)的输入。它们描述数据，不负责获取文档、执行 OpenAPI 规范校验或调用操作。

## 文档契约

| 类型                              | 必填字段与行为                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `OpenAPI`                         | 必填 `openapi: string`、`info: Info`、`paths: Paths`；可选 servers、components、security、tags、externalDocs |
| `Info`                            | 本包所有字段均可选，包括 title/version；约束弱于规范校验器                                                   |
| `Contact`、`License`              | Contact 字段均可选；License 必填 name                                                                        |
| `Server`、`ServerVariable`        | Server 必填 url；变量必填 default；这里不执行 URL 插值                                                       |
| `Tag`、`ExternalDocumentation`    | 分别必填 name、url；仅描述元数据                                                                             |
| `Paths`、`PathItem`、`HTTPMethod` | Paths 将字符串映射到路径项；支持八种小写方法键、共享参数/servers、可选 `$ref`                                |
| `Operation`                       | 必填 responses；可选 operationId、tags、parameters、body、callbacks、security、servers                       |

## 参数与响应

`Parameter` 必填 `name` 和 `in`（`query`、`header`、`path`、`cookie`）。序列化提示（`style`、`explode`、`allowReserved`、`allowEmptyValue`）均可选，本包不提供运行时默认值。不强制路径参数设置 `required: true`，也不强制 schema/content 或 example/examples 互斥。

`RequestBody` 必填媒体类型到 `MediaType` 的 content 映射。`MediaType` 可含 Schema/Reference、示例和按属性配置的 `Encoding`。`Header` 类似 Parameter，但没有 name/in。`Responses` 将状态字符串映射到 `Response | Reference | undefined`，可配置 default。这些声明中的 Response.description 可选。`Link` 以 ID/ref 描述另一操作；`Callback` 将运行时表达式字符串映射到 PathItem。它们不跟随链接、发送回调、协商媒体类型或校验响应状态。

## 完整文档

下面仅为编译期示例，没有网络或需释放的资源。类型检查可发现已声明字段的拼写和值类型错误；外部 JSON 仍需应用层验证。

```ts
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';

const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Items', version: '1.0.0' },
  tags: [{ name: 'Items' }],
  paths: {
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        tags: ['Items'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id'],
                  properties: { id: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
};
console.log(document.paths['/items/{id}'].get?.operationId);
```

### OpenAPI {#openapi}

[packages/openapi/src/openAPI.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts#L41)

```ts
export interface OpenAPI extends Extensible {
  openapi: string;
  info: Info;
  servers?: Server[];
  paths: Paths;
  components?: Components;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}
```

### Contact {#contact}

[packages/openapi/src/info.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/info.ts#L27)

```ts
export interface Contact extends Extensible {
  name?: string;
  url?: string;
  email?: string;
}
```

### License {#license}

[packages/openapi/src/info.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/info.ts#L39)

```ts
export interface License extends Extensible {
  name: string;
  url?: string;
}
```

### Info {#info}

[packages/openapi/src/info.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/info.ts#L54)

```ts
export interface Info extends Extensible {
  title?: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version?: string;
}
```

### ServerVariable {#servervariable}

[packages/openapi/src/server.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/server.ts#L27)

```ts
export interface ServerVariable extends Extensible {
  enum?: string[];
  default: string;
  description?: string;
}
```

### Server {#server}

[packages/openapi/src/server.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/server.ts#L40)

```ts
export interface Server extends Extensible {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}
```

### Operation {#operation}

[packages/openapi/src/paths.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L44)

```ts
export interface Operation extends Extensible {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: Responses;
  callbacks?: Record<string, Callback | Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
}
```

### PathItem {#pathitem}

[packages/openapi/src/paths.ts:76](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L76)

```ts
export interface PathItem extends Extensible {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
}
```

### Paths {#paths}

[packages/openapi/src/paths.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L95)

```ts
export interface Paths extends Extensible {
  [path: string]: PathItem;
}
```

### Parameter {#parameter}

[packages/openapi/src/parameters.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L40)

```ts
export interface Parameter extends Extensible {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}
```

### RequestBody {#requestbody}

[packages/openapi/src/parameters.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L63)

```ts
export interface RequestBody extends Extensible {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}
```

### MediaType {#mediatype}

[packages/openapi/src/parameters.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L77)

```ts
export interface MediaType extends Extensible {
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  encoding?: Record<string, Encoding>;
}
```

### Encoding {#encoding}

[packages/openapi/src/parameters.ts:93](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L93)

```ts
export interface Encoding extends Extensible {
  contentType?: string;
  headers?: Record<string, Header | Reference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}
```

### Link {#link}

[packages/openapi/src/responses.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L35)

```ts
export interface Link extends Extensible {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}
```

### Response {#response}

[packages/openapi/src/responses.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L52)

```ts
export interface Response extends Extensible {
  description?: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}
```

### Responses {#responses}

[packages/openapi/src/responses.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L62)

```ts
export interface Responses extends Extensible {
  default?: Response | Reference;

  [httpCode: string]: Response | Reference | undefined;
}
```

### Callback {#callback}

[packages/openapi/src/responses.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L71)

```ts
export interface Callback extends Extensible {
  [expression: string]: PathItem;
}
```

### Tag {#tag}

[packages/openapi/src/tags.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/tags.ts#L24)

```ts
export interface Tag extends Extensible {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}
```

### HTTPMethod {#httpmethod}

[packages/openapi/src/base-types.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L26)

```ts
export type HTTPMethod =
  'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
```

### ParameterLocation {#parameterlocation}

[packages/openapi/src/base-types.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L39)

```ts
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';
```

### ExternalDocumentation {#externaldocumentation}

[packages/openapi/src/base-types.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L59)

```ts
export interface ExternalDocumentation extends Extensible {
  description?: string;
  url: string;
}
```

### Example {#example}

[packages/openapi/src/base-types.ts:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L72)

```ts
export interface Example extends Extensible {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}
```

### Header {#header}

[packages/openapi/src/base-types.ts:82](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L82)

```ts
export interface Header extends Extensible {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}
```
