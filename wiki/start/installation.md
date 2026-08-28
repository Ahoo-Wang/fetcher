---
title: Installation
description: Install Fetcher packages with the required runtime and peer dependencies.
---

# Installation

## Runtime requirements

- Node.js `>=18.20.8`, or a modern browser with the Fetch, Streams, and AbortController APIs required by the feature you use.
- TypeScript is recommended; packages ship type declarations and ES modules.
- React and Ant Design are peer dependencies only for packages that expose React components or hooks.

## Install the core client

```bash
pnpm add @ahoo-wang/fetcher
```

Equivalent npm command:

```bash
npm install @ahoo-wang/fetcher
```

## Install an optional package

Install only the package and peers required by your code. For example, React request state needs the core and React packages:

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-react react react-dom
```

Viewer applications also provide Ant Design and the Fetcher packages listed as peer dependencies:

```bash
pnpm add @ahoo-wang/fetcher-viewer antd @ant-design/icons dayjs react react-dom
```

Your package manager reports any additional Fetcher peer packages required by the selected version.

## Side-effect modules

`@ahoo-wang/fetcher-eventstream` extends `Response` with event-stream helpers when the module is imported. Import it once before calling those helpers:

```ts
import '@ahoo-wang/fetcher-eventstream';
```

Decorator-based services require metadata support and the TypeScript decorator options used by this repository:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Verify the installation

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher();
console.log(api.urlBuilder.build('/health'));
```

This prints `/health`. Continue with [First Request](./first-request.md).
