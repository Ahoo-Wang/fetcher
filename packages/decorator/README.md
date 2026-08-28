# `@ahoo-wang/fetcher-decorator`

Define HTTP services as TypeScript classes with method and parameter decorators.
Use it when a stable service interface is clearer than repeated request assembly.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator reflect-metadata
```

Peer dependency: `@ahoo-wang/fetcher`. Enable `experimentalDecorators` and
`emitDecoratorMetadata`, then import `reflect-metadata` once at startup.

## Example

```ts
import 'reflect-metadata';
import { Fetcher } from '@ahoo-wang/fetcher';
import { api, get, path } from '@ahoo-wang/fetcher-decorator';

interface User {
  id: string;
  name: string;
}

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

@api('/users', { fetcher })
class UserService {
  @get('/{id}')
  getUser(@path('id') id: string): Promise<User> {
    throw new Error('Replaced by @api');
  }
}

const user = await new UserService().getUser('u-42');
```

## Core capabilities

- Class-level API metadata and method-level overrides.
- GET, POST, PUT, PATCH, DELETE (`del`), HEAD, and OPTIONS decorators.
- Path, query, header, body, request, and exchange-attribute parameters.
- Fetcher selection, result extraction, URL parameters, and lifecycle hooks.

## Documentation

- [Declarative service recipe](https://fetcher.ahoo.me/recipes/declarative-services)
- [Decorator reference](https://fetcher.ahoo.me/reference/decorator)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
