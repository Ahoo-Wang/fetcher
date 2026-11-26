---
next: false
title: Move CoSec Authentication to the CoSec Packages
description: Replace fetcher-cosec and the fetcher-react security hooks with CoSec 8.0.0 or later, which accepts fetcher 8, or stay on fetcher 6.x for a CoSec 7.x server.
---

# Move CoSec Authentication to the CoSec Packages

Fetcher 8.0 ships no CoSec code. The CoSec client and its React hooks now live in the [CoSec repository](https://github.com/Ahoo-Wang/CoSec) under `typescript/`, are released with CoSec and carry CoSec's version. They depend on the fetcher packages; nothing in fetcher depends on them.

| Fetcher 6.x                                                                                                                         | CoSec 8                    |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `@ahoo-wang/fetcher-cosec`                                                                                                          | `@ahoo-wang/cosec-fetcher` |
| `SecurityProvider`, `useSecurity`, `RouteGuard`, `RefreshableRouteGuard` and the other security hooks in `@ahoo-wang/fetcher-react` | `@ahoo-wang/cosec-react`   |

The rest of `@ahoo-wang/fetcher-react` is unchanged in 8.0.

## Which fetcher version to install

The CoSec packages are built on fetcher: `@ahoo-wang/cosec-fetcher` takes `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-eventbus` and `@ahoo-wang/fetcher-storage` as peer dependencies, and those peer ranges decide which fetcher major goes with it. CoSec 8.0.0 and later accept both fetcher 6 (6.1.1 or later) and fetcher 8; the CoSec 8 release candidates up to `8.0.0-rc.1` accepted fetcher 6 only. To check the version you install:

```bash
npm view @ahoo-wang/cosec-fetcher@^8.0.0 peerDependencies
```

| Your server runs | Client                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CoSec 8          | Fetcher 8 with `@ahoo-wang/cosec-fetcher` and, for React, `@ahoo-wang/cosec-react`, 8.0.0 or later.                                                                                                                          |
| CoSec 7.x        | Stay on fetcher 6.x, where `@ahoo-wang/fetcher-cosec` 6.x keeps working against CoSec 7. The [`6.x` branch](https://github.com/Ahoo-Wang/fetcher/tree/6.x) keeps receiving fixes, published under npm's `latest-6` dist-tag. |

`@ahoo-wang/fetcher-cosec` is not published for fetcher 8, so an application that uses CoSec reaches fetcher 8 through the CoSec packages.

## Steps

1. Upgrade the server to CoSec 8.
2. Remove `@ahoo-wang/fetcher-cosec` from the application and install CoSec 8.0.0 or later. The `^8.0.0` range installs a CoSec 8 release and never a release candidate:

   ```bash
   pnpm add @ahoo-wang/cosec-fetcher@^8.0.0
   pnpm add @ahoo-wang/cosec-react@^8.0.0   # React applications
   ```

3. Rewrite the imports and configuration with the old-to-new mapping in the CoSec documentation: [cosec.ahoo.me/integration/clients](https://cosec.ahoo.me/integration/clients). It lists what each export of the old packages becomes; follow it rather than assuming a one-to-one rename.
4. Upgrade the `@ahoo-wang/fetcher*` packages to 8. CoSec 8.0.0 also accepts fetcher 6.1.1 or later, so this step can come before or after the others.

[Return to this task group](./index.md); [review integration boundaries](../../architecture/integration-decisions.md).
