---
title: 'Openapi reference'
description: 'Openapi reference — Fetcher 5.0.0'
---

# Openapi reference

Static OpenAPI document types for authoring specifications and generator inputs. No runtime parser, validator, client, or reference resolver is included.

## Install

```bash
pnpm add @ahoo-wang/fetcher-openapi
```

Version baseline: **5.0.0**. This package declares Node **>=18.20.8**; the repository contributor toolchain is separate. Install peer packages required by your selected runtime integration.

## Minimal example

```ts
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';
const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Example', version: '1' },
  paths: {},
};
console.log(document.openapi);
```

## Topics

- [Documents and operations](/reference/openapi/documents-and-operations)
- [Schemas and references](/reference/openapi/schemas-and-references)
- [Security and extensions](/reference/openapi/security-and-extensions)

## Public symbol index

| Symbol                  | Reference                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| `Callback`              | [Documents and operations](/reference/openapi/documents-and-operations#callback)              |
| `CommonExtensions`      | [Security and extensions](/reference/openapi/security-and-extensions#commonextensions)        |
| `ComponentTypeMap`      | [Schemas and references](/reference/openapi/schemas-and-references#componenttypemap)          |
| `Components`            | [Schemas and references](/reference/openapi/schemas-and-references#components)                |
| `Contact`               | [Documents and operations](/reference/openapi/documents-and-operations#contact)               |
| `Discriminator`         | [Schemas and references](/reference/openapi/schemas-and-references#discriminator)             |
| `Encoding`              | [Documents and operations](/reference/openapi/documents-and-operations#encoding)              |
| `Example`               | [Documents and operations](/reference/openapi/documents-and-operations#example)               |
| `Extensible`            | [Security and extensions](/reference/openapi/security-and-extensions#extensible)              |
| `ExternalDocumentation` | [Documents and operations](/reference/openapi/documents-and-operations#externaldocumentation) |
| `HTTPMethod`            | [Documents and operations](/reference/openapi/documents-and-operations#httpmethod)            |
| `Header`                | [Documents and operations](/reference/openapi/documents-and-operations#header)                |
| `Info`                  | [Documents and operations](/reference/openapi/documents-and-operations#info)                  |
| `IsReference`           | [Schemas and references](/reference/openapi/schemas-and-references#isreference)               |
| `License`               | [Documents and operations](/reference/openapi/documents-and-operations#license)               |
| `Link`                  | [Documents and operations](/reference/openapi/documents-and-operations#link)                  |
| `MediaType`             | [Documents and operations](/reference/openapi/documents-and-operations#mediatype)             |
| `OAuthFlow`             | [Security and extensions](/reference/openapi/security-and-extensions#oauthflow)               |
| `OAuthFlows`            | [Security and extensions](/reference/openapi/security-and-extensions#oauthflows)              |
| `OpenAPI`               | [Documents and operations](/reference/openapi/documents-and-operations#openapi)               |
| `Operation`             | [Documents and operations](/reference/openapi/documents-and-operations#operation)             |
| `Parameter`             | [Documents and operations](/reference/openapi/documents-and-operations#parameter)             |
| `ParameterLocation`     | [Documents and operations](/reference/openapi/documents-and-operations#parameterlocation)     |
| `PathItem`              | [Documents and operations](/reference/openapi/documents-and-operations#pathitem)              |
| `Paths`                 | [Documents and operations](/reference/openapi/documents-and-operations#paths)                 |
| `Reference`             | [Schemas and references](/reference/openapi/schemas-and-references#reference)                 |
| `RequestBody`           | [Documents and operations](/reference/openapi/documents-and-operations#requestbody)           |
| `Response`              | [Documents and operations](/reference/openapi/documents-and-operations#response)              |
| `Responses`             | [Documents and operations](/reference/openapi/documents-and-operations#responses)             |
| `Schema`                | [Schemas and references](/reference/openapi/schemas-and-references#schema)                    |
| `SchemaType`            | [Schemas and references](/reference/openapi/schemas-and-references#schematype)                |
| `SecurityRequirement`   | [Security and extensions](/reference/openapi/security-and-extensions#securityrequirement)     |
| `SecurityScheme`        | [Security and extensions](/reference/openapi/security-and-extensions#securityscheme)          |
| `Server`                | [Documents and operations](/reference/openapi/documents-and-operations#server)                |
| `ServerVariable`        | [Documents and operations](/reference/openapi/documents-and-operations#servervariable)        |
| `Tag`                   | [Documents and operations](/reference/openapi/documents-and-operations#tag)                   |
| `XML`                   | [Schemas and references](/reference/openapi/schemas-and-references#xml)                       |

[packages/openapi/src/index.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L19)
