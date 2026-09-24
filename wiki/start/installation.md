---
title: Install Fetcher
description: Create an independent ESM project and install the core HTTP client.
---

# Install Fetcher

The core package supports Node `>=18.20.8`. Create an independent directory so the example does not rely on this repository's workspace links:

```bash
mkdir fetcher-first-request
cd fetcher-first-request
```

Create `package.json` with ESM enabled:

```json
{
  "name": "fetcher-first-request",
  "private": true,
  "type": "module"
}
```

Install the published client and TypeScript:

```bash
pnpm add @ahoo-wang/fetcher
pnpm add -D typescript
```

This is a consumer setup. Contributors to this repository instead need Node `>=22.12.0`, pnpm `10.34.5`, and the commands in [Development](../contributing/development.md).

Continue with [Your first request](./first-request.md).

## React and Viewer starting points

For an existing React application, follow the [React example peer installation and mounting steps](../examples/react.md). For a table on the 5.x line, use [your first data view](./first-view.md). These UI paths require additional peers beyond the core HTTP installation; [choose your starting point](./index.md) first.

## Packages in the Wow repository

The Wow client, the Wow React hooks, the generator and the data-view components moved to the [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript). Their successors are not on npm yet; they ship with Wow's first stable release. Until then use the 5.x line (npm 5.1.x); see [packages that moved](../architecture/package-boundaries.md#packages-that-moved-to-the-wow-repository).
