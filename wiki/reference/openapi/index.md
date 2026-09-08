---
prev: false
title: 'Openapi reference'
description: 'Openapi reference — Fetcher 5.0.0'
---

# Openapi reference

Static OpenAPI document types for authoring specifications and generator inputs. No runtime parser, validator, client, or reference resolver is included.

## Install

```bash
pnpm add @ahoo-wang/fetcher-openapi
```

Version **5.0.0** declares Node **>=18.20.8** for consumers. Repository development requires Node **>=20.20.2** and pnpm **10.34.5**.

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

## Choose an entry point

Import `OpenAPI` to author a whole document, `Schema`/`Reference` for reusable payload contracts, and security types for document metadata. These are types only: there is no parser, HTTP client or validator to call. To generate executable clients, use the [generator](../generator/index.md).

## Topics

- [Documents and operations](documents-and-operations)
- [Schemas and references](schemas-and-references)
- [Security and extensions](security-and-extensions)

[Complete public symbol index](./symbols.md)
