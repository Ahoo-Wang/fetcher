# `@ahoo-wang/fetcher-cosec`

CoSec request attribution and optional JWT authentication for Fetcher. Use it
when the server contract expects CoSec application, device, request, space, or
Bearer-token behavior.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

Peer dependencies: `fetcher`, `fetcher-eventbus`, and `fetcher-storage`.

## Example

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.com' });

const cosec = new CoSecConfigurer({
  appId: 'developer-console',
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => console.error('Access denied'),
});

cosec.applyTo(api);
```

This minimal configuration adds attribution headers without authentication.
Provide a `TokenRefresher` to enable token storage, Bearer injection, and
automatic refresh. Keep refresh requests on a separate unconfigured Fetcher.

## Core capabilities

- Application, device, request, space, tenant, and owner attribution.
- JWT token parsing, persistence, sign-in, sign-out, and current-user access.
- Deduplicated automatic refresh with recursive-refresh protection.
- Configurable 401 and 403 callbacks.
- Individual interceptors for applications with a custom pipeline.

Never log, embed, or commit real tokens.

## Documentation

- [CoSec authentication recipe](https://fetcher.ahoo.me/recipes/cosec-authentication)
- [CoSec reference](https://fetcher.ahoo.me/reference/cosec)

[中文](./README.zh-CN.md) · [License](../../LICENSE)
