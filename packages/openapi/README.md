# `@ahoo-wang/fetcher-openapi`

TypeScript types for OpenAPI 3.x documents. This package is type-only: it adds
no runtime code and does not parse, validate, or generate clients.

## Install

```bash
pnpm add -D @ahoo-wang/fetcher-openapi
```

No peer or runtime dependencies.

## Example

```ts
import type { OpenAPI, Schema } from '@ahoo-wang/fetcher-openapi';

export function documentTitle(document: OpenAPI): string {
  return document.info.title;
}

export const identifier: Schema = {
  type: 'string',
  format: 'uuid',
};
```

## Core capabilities

- Root document, info, server, path, and operation types.
- Parameters, request bodies, responses, media types, and headers.
- Components, references, schemas, discriminators, and XML metadata.
- Security schemes, OAuth flows, tags, and `x-*` extensions.

Validate untrusted documents before treating them as typed OpenAPI data.

## Documentation

- [Generate a client](https://fetcher.ahoo.me/recipes/openapi-client)
- [OpenAPI reference](https://fetcher.ahoo.me/reference/openapi)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
