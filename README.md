# Fetcher

[中文](./README.zh-CN.md) · [Documentation](https://fetcher.ahoo.me/) ·
[Skills](https://fetcher.ahoo.me/skills/) ·
[Storybook](https://fetcher.ahoo.me/storybook/) ·
[npm](https://www.npmjs.com/package/@ahoo-wang/fetcher)

Fetcher is a TypeScript HTTP-client ecosystem built around the platform
`fetch` API. Start with typed requests, interceptors, timeouts, and streaming;
add React, OpenAPI generation, authentication, Wow CQRS, or data-viewer packages
only when the application needs them.

## Install

```bash
pnpm add @ahoo-wang/fetcher
```

Node.js 18.20.8 or newer is required.

## Your first request

```ts
import { Fetcher, FetcherError } from '@ahoo-wang/fetcher';

interface User {
  id: string;
  name: string;
}

const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
});

try {
  const response = await api.get('/users/{id}', {
    urlParams: {
      path: { id: 'u-42' },
      query: { include: 'team' },
    },
  });
  const user: User = await response.json();
  console.log(user.name);
} catch (error) {
  if (error instanceof FetcherError) {
    console.error(error.message);
  }
}
```

## Choose packages by job

| Job                          | Package                          |
| ---------------------------- | -------------------------------- |
| HTTP client and interceptors | `@ahoo-wang/fetcher`             |
| Declarative service classes  | `@ahoo-wang/fetcher-decorator`   |
| Typed events                 | `@ahoo-wang/fetcher-eventbus`    |
| Server-Sent Events           | `@ahoo-wang/fetcher-eventstream` |
| OpenAI Chat Completions      | `@ahoo-wang/fetcher-openai`      |
| OpenAPI TypeScript types     | `@ahoo-wang/fetcher-openapi`     |
| OpenAPI client generation    | `@ahoo-wang/fetcher-generator`   |
| React hooks                  | `@ahoo-wang/fetcher-react`       |
| Typed storage                | `@ahoo-wang/fetcher-storage`     |
| CoSec authentication         | `@ahoo-wang/fetcher-cosec`       |
| Wow commands and queries     | `@ahoo-wang/fetcher-wow`         |
| Data views (new projects) | [`@ahoo-wang/fetcher-view-engine`](packages/view-engine/README.md) |
| Legacy Viewer (maintenance mode, deprecated) | [`@ahoo-wang/fetcher-viewer`](packages/viewer/README.md) |

[Choose packages](https://fetcher.ahoo.me/architecture/package-boundaries) explains peer
dependencies and the smallest useful combination.

## Learn and build

- [Start in five minutes](https://fetcher.ahoo.me/start/first-request)
- [Understand the request lifecycle](https://fetcher.ahoo.me/architecture/request-lifecycle)
- [Follow developer recipes](https://fetcher.ahoo.me/guides/services/declarative-client)
- [Use package-aware agent Skills](https://fetcher.ahoo.me/skills/)
- [Look up package APIs](https://fetcher.ahoo.me/reference/)
- [Try interactive workflows](https://fetcher.ahoo.me/storybook/)

## Contribute

```bash
pnpm install --frozen-lockfile
pnpm build
VITEST_MAX_WORKERS=4 pnpm test:unit
pnpm lint
pnpm verify:view-engine
```

See the [contributor guide](https://fetcher.ahoo.me/contributing/) for focused
package, integration, Wiki, and Storybook checks.

## License

[Apache License 2.0](./LICENSE)
