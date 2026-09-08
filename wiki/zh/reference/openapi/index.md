---
title: 'Openapi 参考'
description: 'Openapi 参考 — Fetcher 5.0.0'
---

# Openapi 参考

用于编写规范和生成器输入的静态 OpenAPI 文档类型。不包含运行时解析器、校验器、客户端或引用解析器。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-openapi
```

版本基线：**5.0.0**。本包声明 Node **>=18.20.8**；仓库贡献者工具链另行规定。按所选运行时集成安装需要的 peer 包。

## 最小示例

```ts
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';
const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Example', version: '1' },
  paths: {},
};
console.log(document.openapi);
```

## 专题

- [文档与操作](/zh/reference/openapi/documents-and-operations)
- [Schema 与引用](/zh/reference/openapi/schemas-and-references)
- [安全与扩展](/zh/reference/openapi/security-and-extensions)

## 公开符号索引

| 符号                    | 参考                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `Callback`              | [文档与操作](/zh/reference/openapi/documents-and-operations#callback)              |
| `CommonExtensions`      | [安全与扩展](/zh/reference/openapi/security-and-extensions#commonextensions)       |
| `ComponentTypeMap`      | [Schema 与引用](/zh/reference/openapi/schemas-and-references#componenttypemap)     |
| `Components`            | [Schema 与引用](/zh/reference/openapi/schemas-and-references#components)           |
| `Contact`               | [文档与操作](/zh/reference/openapi/documents-and-operations#contact)               |
| `Discriminator`         | [Schema 与引用](/zh/reference/openapi/schemas-and-references#discriminator)        |
| `Encoding`              | [文档与操作](/zh/reference/openapi/documents-and-operations#encoding)              |
| `Example`               | [文档与操作](/zh/reference/openapi/documents-and-operations#example)               |
| `Extensible`            | [安全与扩展](/zh/reference/openapi/security-and-extensions#extensible)             |
| `ExternalDocumentation` | [文档与操作](/zh/reference/openapi/documents-and-operations#externaldocumentation) |
| `HTTPMethod`            | [文档与操作](/zh/reference/openapi/documents-and-operations#httpmethod)            |
| `Header`                | [文档与操作](/zh/reference/openapi/documents-and-operations#header)                |
| `Info`                  | [文档与操作](/zh/reference/openapi/documents-and-operations#info)                  |
| `IsReference`           | [Schema 与引用](/zh/reference/openapi/schemas-and-references#isreference)          |
| `License`               | [文档与操作](/zh/reference/openapi/documents-and-operations#license)               |
| `Link`                  | [文档与操作](/zh/reference/openapi/documents-and-operations#link)                  |
| `MediaType`             | [文档与操作](/zh/reference/openapi/documents-and-operations#mediatype)             |
| `OAuthFlow`             | [安全与扩展](/zh/reference/openapi/security-and-extensions#oauthflow)              |
| `OAuthFlows`            | [安全与扩展](/zh/reference/openapi/security-and-extensions#oauthflows)             |
| `OpenAPI`               | [文档与操作](/zh/reference/openapi/documents-and-operations#openapi)               |
| `Operation`             | [文档与操作](/zh/reference/openapi/documents-and-operations#operation)             |
| `Parameter`             | [文档与操作](/zh/reference/openapi/documents-and-operations#parameter)             |
| `ParameterLocation`     | [文档与操作](/zh/reference/openapi/documents-and-operations#parameterlocation)     |
| `PathItem`              | [文档与操作](/zh/reference/openapi/documents-and-operations#pathitem)              |
| `Paths`                 | [文档与操作](/zh/reference/openapi/documents-and-operations#paths)                 |
| `Reference`             | [Schema 与引用](/zh/reference/openapi/schemas-and-references#reference)            |
| `RequestBody`           | [文档与操作](/zh/reference/openapi/documents-and-operations#requestbody)           |
| `Response`              | [文档与操作](/zh/reference/openapi/documents-and-operations#response)              |
| `Responses`             | [文档与操作](/zh/reference/openapi/documents-and-operations#responses)             |
| `Schema`                | [Schema 与引用](/zh/reference/openapi/schemas-and-references#schema)               |
| `SchemaType`            | [Schema 与引用](/zh/reference/openapi/schemas-and-references#schematype)           |
| `SecurityRequirement`   | [安全与扩展](/zh/reference/openapi/security-and-extensions#securityrequirement)    |
| `SecurityScheme`        | [安全与扩展](/zh/reference/openapi/security-and-extensions#securityscheme)         |
| `Server`                | [文档与操作](/zh/reference/openapi/documents-and-operations#server)                |
| `ServerVariable`        | [文档与操作](/zh/reference/openapi/documents-and-operations#servervariable)        |
| `Tag`                   | [文档与操作](/zh/reference/openapi/documents-and-operations#tag)                   |
| `XML`                   | [Schema 与引用](/zh/reference/openapi/schemas-and-references#xml)                  |

[packages/openapi/src/index.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L19)

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节 | 新专题 |
| --- | --- |
| <span id="安装与入口选择"></span>安装与入口选择 | [阅读对应专题](/zh/reference/openapi/index.md) |
| <span id="导出地图"></span>导出地图 | [阅读对应专题](/zh/reference/openapi/documents-and-operations.md) |
| <span id="最小类型化文档"></span>最小类型化文档 | [阅读对应专题](/zh/reference/openapi/schemas-and-references.md) |
| <span id="类型契约"></span>类型契约 | [阅读对应专题](/zh/reference/openapi/schemas-and-references.md) |
| <span id="openapi-3-0-3-1-边界"></span>OpenAPI 3.0 / 3.1 边界 | [阅读对应专题](/zh/reference/openapi/schemas-and-references.md) |
| <span id="故障定位"></span>故障定位 | [阅读对应专题](/zh/reference/openapi/index.md) |
| <span id="源码参考"></span>源码参考 | [阅读对应专题](/zh/reference/openapi/index.md) |
