---
title: Create a Declarative Service
description: Define, call, and verify a decorator service with explicit request bindings.
---

# Create a Declarative Service

Use this recipe for a stable HTTP contract with named operations. You will create a read and create method, then check their actual HTTP requests.

## 1. Prepare the compiler and server

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator reflect-metadata
```

Compile with TypeScript legacy decorators; a toolchain that only strips types cannot execute parameter decorators. Import `reflect-metadata` before service definitions. Merge these settings into your application tsconfig:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true
  }
}
```

The example assumes your application provides `GET /users/{id}?include=profile` and `POST /users`, both returning JSON `{ id, name }`. Replace the example origin; these are application routes, not Fetcher-provided endpoints.

## 2. Define and call both operations

```ts
import 'reflect-metadata';
import { Fetcher, ExchangeError } from '@ahoo-wang/fetcher';
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
const transport = new Fetcher({ baseURL: 'https://api.example.com' });

@api('/users', { fetcher: transport })
class UserService {
  @get('/{id}')
  getUser(
    @path('id') id: string,
    @query('include') include: string,
  ): Promise<User> {
    throw new Error('Replaced by @api');
  }

  @post('')
  createUser(@body() user: Omit<User, 'id'>): Promise<User> {
    throw new Error('Replaced by @api');
  }
}

export async function runUsers() {
  const users = new UserService();
  try {
    const ada = await users.getUser('42', 'profile');
    const lin = await users.createUser({ name: 'Lin' });
    return { ada, lin };
  } catch (error) {
    if (error instanceof ExchangeError) {
      console.error('HTTP status:', error.exchange.response?.status);
    }
    throw error;
  }
}
```

Call `runUsers()` from your application and handle its rejected promise at the UI or server boundary. The first request is `GET https://api.example.com/users/42?include=profile`; the second posts `{"name":"Lin"}` as JSON to `/users`. Endpoint decorators default to JSON extraction.

`@api` replaces the endpoint method. Its body and parameter default initializers do not run: writing `include = 'profile'` would not supply that query value. Pass it explicitly, as above, or use a separate ordinary wrapper method.

## 3. Verify before connecting the real API

In an isolated test, replace `globalThis.fetch` with a stub returning `Response.json({ id: '42', name: 'Ada' })`, call `runUsers()`, and assert both URLs, methods and the second request body. Restore the original fetch in `finally`. This checks the decorators and request pipeline together.

## Failures and lifetime

Missing metadata: check compiler settings and import order. An undefined binding: check argument order and parameter decorators. Non-2xx responses reject with an exchange error by default; JSON decoding can also fail. The returned `User` type does not validate server JSON. This example fully consumes both responses and owns no listener or stream to dispose.

Continue with [service and endpoint metadata](../reference/decorator/services-and-endpoints), [parameter bindings](../reference/decorator/parameters), and [execution and cancellation](../reference/decorator/execution).

[apiDecorator.ts:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L140) implements method replacement.
