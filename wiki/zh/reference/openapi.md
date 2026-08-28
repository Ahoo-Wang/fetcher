---
title: OpenAPI 参考
description: 为 OpenAPI 3.x 文档、Reference、Extension 和 Schema 提供零运行时代码的类型。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openapi`

`@ahoo-wang/fetcher-openapi` 是用于编写或转换 OpenAPI 文档的纯类型词汇表；它不加载、校验、解引用或生成文档。

## 安装与入口选择

```bash
pnpm add -D @ahoo-wang/fetcher-openapi
```

使用 `import type`：全部类型由 [`packages/openapi/src/index.ts:19`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L19) 重导出，不产生运行时值。要生成 Client 请使用 [Generator 参考](./generator.md)；处理外部 JSON/YAML 前使用专门的 Validator。

| 目标 | 入口 | 契约 |
| --- | --- | --- |
| 根文档 | `OpenAPI`、`Info`、`Server`、`Tag` | `openapi`、`info`、`paths` 必填。 |
| 路径 | `Paths`、`PathItem`、`Operation` | Operation 必须有 `responses`。 |
| 请求 | `Parameter`、`RequestBody`、`MediaType`、`Encoding` | Parameter 需要 `name`/`in`；Request Body 需要 `content`。 |
| Result/Callback | `Responses`、`Response`、`Header`、`Link`、`Callback` | Result 条目可内联或为 `$ref`。 |
| Component | `Components`、`Schema`、`Reference` | 保留每个 `Schema | Reference` 联合类型。 |
| Auth/Extension | `SecurityScheme`、`SecurityRequirement`、`Extensible` | 允许 `x-*`，但语义由应用定义。 |

## 导出地图

| 类型族 | 公共类型 |
| --- | --- |
| 基础/文档 | `HTTPMethod`、`ParameterLocation`、`SchemaType`、`ExternalDocumentation`、`Example`、`Header`、`OpenAPI`、`Info`、`Contact`、`License`、`Server`、`ServerVariable`、`Tag` |
| Path | `Paths`、`PathItem`、`Operation` |
| 输入/输出 | `Parameter`、`RequestBody`、`MediaType`、`Encoding`、`Responses`、`Response`、`Link`、`Callback` |
| Component/Schema | `Components`、`ComponentTypeMap`、`Schema`、`Discriminator`、`XML` |
| Security | `OAuthFlow`、`OAuthFlows`、`SecurityScheme`、`SecurityRequirement` |
| Reference/Extension | `Reference`、`IsReference<T>`、`Extensible`、`CommonExtensions` |

## 最小类型化文档

```ts
import type { OpenAPI, Operation, Reference, Schema } from '@ahoo-wang/fetcher-openapi';

const page: Schema = {
  type: 'object',
  required: ['total'],
  properties: { total: { type: 'integer', format: 'int64' } },
};

const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Catalog', version: '1.0.0' },
  paths: {
    '/products/{id}': {
      get: {
        operationId: 'getProduct',
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
  components: { schemas: { Page: page } },
};

function isReference(value: Schema | Reference): value is Reference {
  return '$ref' in value;
}

const operation: Operation = document.paths['/products/{id}'].get!;
```

`OpenAPI` 只要求 `openapi`、`info`、`paths`；`servers`、`components`、全局 `security`、`tags`、`externalDocs` 可选（[`openAPI.ts:41`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts#L41)）。`PathItem` 公开 8 个 HTTP Method 键，且 `Operation.responses` 必填（[`paths.ts:44`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L44)）。

## 类型契约

| 类型 | 必填 | 重要分支 |
| --- | --- | --- |
| `Parameter` | `name`、`in` | `schema` 或 `content`；两者都可包含 Reference。 |
| `RequestBody` | `content` | `Operation.requestBody` 是 `RequestBody | Reference`。 |
| `Responses` | — | `default` 与状态码键为 `Response | Reference | undefined`。 |
| `Schema` | — | 约束、`items`、`properties`、`additionalProperties`、组合、`discriminator`、`xml`。 |
| `Components` | — | Schema、Response、Parameter、Example、Request Body、Header、Security Scheme、Link、Callback 映射。 |
| `SecurityScheme` | `type` | `apiKey`、`http`、`oauth2`、`openIdConnect`；OAuth Flow 要求 `scopes`。 |
| `Callback` | — | Expression 键映射到 `PathItem`。 |

公共 `$ref` 形状名为 `Reference`（`{ $ref: string }`），并没有 `ReferenceObject`。读取内联字段前，先收窄所有 `Schema | Reference`、`Response | Reference` 等联合类型（[`reference.ts:23`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/reference.ts#L23)）。`Operation` 对 Parameter、Request Body、Callback 使用 Reference 联合；`Responses` 也对 Response 条目使用该联合（[`paths.ts:50`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L50)、[`responses.ts:62`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L62)）。

## OpenAPI 3.0 / 3.1 边界

`OpenAPI.openapi` 是未收窄的 `string`：本包不选择、校验或转换 OpenAPI 版本。`Schema` 同时允许常见 3.0 字段（如 `nullable`）和面向 3.1/JSON Schema 的字段（如 `$schema`、`const`、`type: 'null'`、数值 Exclusive Bound、Type Array）。它是宽松形状，而非 3.0 或 3.1 合规证明（[`schema.ts:91`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L91)）。

每个可扩展对象接受 `x-${string}`。`CommonExtensions` 是便利清单，而非全部 Vendor Extension 的限制（[`extensions.ts:22`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/extensions.ts#L22)）。

## 故障定位

| 现象 | 检查 |
| --- | --- |
| 字段被拒绝 | 核对对应 Interface；本包不建模所有方言 Extension。 |
| 无法读取 `properties` 或 `content` | 先收窄 `Reference` 联合。 |
| JSON/YAML 类型通过但工具失败 | 另行校验和解引用；本包没有 Parser 或运行时 Validator。 |
| Extension 被拒绝 | 使用 `x-` 键；不允许任意未知键。 |
| 需要 3.1 合规性 | 加用版本感知 Validator。 |

## 源码参考

- [公共导出：`packages/openapi/src/index.ts:19`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L19)
- [文档根：`packages/openapi/src/openAPI.ts:41`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts#L41)
- [输入：`packages/openapi/src/parameters.ts:40`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L40)
- [Schema：`packages/openapi/src/schema.ts:91`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L91)
- [Security：`packages/openapi/src/security.ts:63`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/security.ts#L63)
