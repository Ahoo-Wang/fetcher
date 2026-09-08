---
title: Installation and runtime
description: Separate application runtime, optional peers, and repository tooling.
---

# Installation and runtime

## Install the core package

```bash
pnpm add @ahoo-wang/fetcher
# npm install @ahoo-wang/fetcher
```

## Check the packages you use

The table follows current package.json declarations. Browsers must provide the Fetch, AbortController, and Streams APIs needed by your features; version declarations do not polyfill runtime APIs.

| Package                                          | Declared Node range | Peer dependencies                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [fetcher](../reference/fetcher/index.md)         | `>=18.20.8`         | None                                                                                                                                                                                                                                                                                                |
| [decorator](../reference/decorator/index.md)     | `>=18.20.8`         | `@ahoo-wang/fetcher`                                                                                                                                                                                                                                                                                |
| [eventstream](../reference/eventstream/index.md) | `>=18.20.8`         | `@ahoo-wang/fetcher`                                                                                                                                                                                                                                                                                |
| [react](../reference/react/index.md)             | `>=18.20.8`         | `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-eventstream`, `@ahoo-wang/fetcher-eventbus`, `@ahoo-wang/fetcher-storage`, `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-cosec`, `react`, `react-dom`                                                                                                     |
| [viewer](../reference/viewer/index.md)           | `>=18.20.8`         | `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-decorator`, `@ahoo-wang/fetcher-eventbus`, `@ahoo-wang/fetcher-eventstream`, `@ahoo-wang/fetcher-openapi`, `@ahoo-wang/fetcher-react`, `@ahoo-wang/fetcher-storage`, `@ahoo-wang/fetcher-wow`, `@ant-design/icons`, `antd`, `dayjs`, `react`, `react-dom` |

## Feature-specific setup

Declarative services need `experimentalDecorators` and `emitDecoratorMetadata`; see [Decorator setup](../reference/decorator/index.md). Import `@ahoo-wang/fetcher-eventstream` to register Response stream helpers; see [Stream results](../reference/eventstream/json-and-results.md). Install the peer dependencies of your selected React or Viewer version rather than treating the core-only command as a complete UI setup.

## If you contribute to this repository

The repository uses Node `>=20.20.2` and pnpm `10.34.5`. These contributor requirements differ from the consumer declarations above. Follow [Development](../contributing/development.md) to install the workspace and run checks.

Continue with [Your first request](./first-request.md).
