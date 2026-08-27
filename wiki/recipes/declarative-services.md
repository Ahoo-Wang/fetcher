---
title: Declarative API Services
description: Turn TypeScript decorator metadata into executable Fetcher service methods.
---

# Declarative API Services

Use decorators when a stable service class communicates your HTTP contract better than repeated calls.

## Install and configure TypeScript

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator reflect-metadata
```

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Import `reflect-metadata` once in your application entry point.

## Define a service

```ts
import 'reflect-metadata';
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  api,
  body,
  get,
  path,
  post,
  query,
} from '@ahoo-wang/fetcher-decorator';

interface User {
  id: string;
  name: string;
}

const apiClient = new Fetcher({ baseURL: 'https://api.example.com' });

@api('/users', { fetcher: apiClient })
class UserService {
  @get('/{id}')
  getUser(
    @path('id') id: string,
    @query('include') include = 'profile',
  ): Promise<User> {
    throw new Error('Replaced by @api');
  }

  @post('')
  createUser(@body() user: Omit<User, 'id'>): Promise<User> {
    throw new Error('Replaced by @api');
  }
}
```

`@api` replaces decorated endpoint methods with request executors. The method body is never called after decoration; keeping a throwing body makes accidental undecorated use fail loudly.

## Call the service

```ts
const users = new UserService();

const ada = await users.getUser('42');
const lin = await users.createUser({ name: 'Lin' });
```

The first call sends:

```text
GET https://api.example.com/users/42?include=profile
```

The second sends a JSON body to `/users`.

## Override defaults deliberately

Class metadata supplies defaults. Endpoint metadata overrides the class, and instance `apiMetadata` can override class-level values where supported. Prefer one named or direct Fetcher per backend rather than repeating headers and timeouts on every method.

## Common failure: metadata is missing

If decorator metadata is not emitted or `reflect-metadata` is not initialized, parameter types and bindings cannot be resolved correctly. Check the TypeScript flags, import order, and that the method has both an endpoint decorator and explicit `@path`, `@query`, or `@body` bindings.

## Test at the network boundary

Mock `fetch`, construct the real service, call a method, and assert the final method, URL, headers, and body. Do not mock the request executor you are trying to verify.
