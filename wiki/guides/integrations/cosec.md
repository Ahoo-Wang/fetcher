---
next: false
title: Move CoSec Authentication to the CoSec Packages
description: Replace fetcher-cosec and the fetcher-react security hooks with the CoSec repository's packages on the fetcher version their peers accept, or stay on fetcher 6.x for a CoSec 7.x server.
---

# Move CoSec Authentication to the CoSec Packages

Fetcher 8.0 ships no CoSec code. The CoSec client and its React hooks now live in the [CoSec repository](https://github.com/Ahoo-Wang/CoSec) under `typescript/`, are released with CoSec and carry CoSec's version. They depend on the fetcher packages; nothing in fetcher depends on them.

| Fetcher 6.x                                                                                                                         | CoSec 8                    |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `@ahoo-wang/fetcher-cosec`                                                                                                          | `@ahoo-wang/cosec-fetcher` |
| `SecurityProvider`, `useSecurity`, `RouteGuard`, `RefreshableRouteGuard` and the other security hooks in `@ahoo-wang/fetcher-react` | `@ahoo-wang/cosec-react`   |

The rest of `@ahoo-wang/fetcher-react` is unchanged in 8.0.

## Which fetcher version to install

The CoSec packages are built on fetcher: `@ahoo-wang/cosec-fetcher` takes `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-eventbus` and `@ahoo-wang/fetcher-storage` as peer dependencies, and those peer ranges decide which fetcher major goes with it. Read them for the version you install:

```bash
npm view @ahoo-wang/cosec-fetcher@rc peerDependencies
```

`8.0.0-rc.1` accepts fetcher `^6.1.1` (6.1.1 or a later 6.x), not fetcher 8 yet. From CoSec 8.0.0 the CoSec packages accept fetcher 8 as well. Moving to fetcher 8 before your CoSec packages accept it ends in a peer-dependency conflict.

| Your server runs | Client                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CoSec 8          | `@ahoo-wang/cosec-fetcher` and, for React, `@ahoo-wang/cosec-react`, on the fetcher major their peer ranges accept: 6.x (6.1.1 or later) with `8.0.0-rc.1`, fetcher 8 from CoSec 8.0.0. |
| CoSec 7.x        | Stay on fetcher 6.x, where `@ahoo-wang/fetcher-cosec` 6.x keeps working against CoSec 7 and receives fixes from the [`6.x` branch](https://github.com/Ahoo-Wang/fetcher/tree/6.x).      |

`@ahoo-wang/fetcher-cosec` is not published for fetcher 8, so an application that uses CoSec reaches fetcher 8 through the CoSec packages.

## Steps

1. Upgrade the server to CoSec 8.
2. Remove `@ahoo-wang/fetcher-cosec` from the application and install the CoSec packages. Until CoSec 8.0 is generally available they are on npm's `rc` tag:

   ```bash
   pnpm add @ahoo-wang/cosec-fetcher@rc
   pnpm add @ahoo-wang/cosec-react@rc   # React applications
   ```

3. Rewrite the imports and configuration with the old-to-new mapping in the CoSec documentation: [cosec.ahoo.me/integration/clients](https://cosec.ahoo.me/integration/clients). It lists what each export of the old packages becomes; follow it rather than assuming a one-to-one rename.
4. Keep the `@ahoo-wang/fetcher*` packages on the major the CoSec packages' peer ranges accept, and upgrade them to 8 once those ranges include it.

[Return to this task group](./index.md); [review integration boundaries](../../architecture/integration-decisions.md).
