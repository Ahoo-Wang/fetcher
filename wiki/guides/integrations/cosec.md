---
next: false
title: Move CoSec Authentication to the CoSec Packages
description: Replace fetcher-cosec and the fetcher-react security hooks with the CoSec repository's packages, or stay on fetcher 6.x for a CoSec 7.x server.
---

# Move CoSec Authentication to the CoSec Packages

Fetcher 8.0 ships no CoSec code. The CoSec client and its React hooks now live in the [CoSec repository](https://github.com/Ahoo-Wang/CoSec) under `typescript/`, are released with CoSec and carry CoSec's version. They depend on the fetcher packages; nothing in fetcher depends on them.

| Fetcher 6.x                                                                                                                         | CoSec 8                    |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `@ahoo-wang/fetcher-cosec`                                                                                                          | `@ahoo-wang/cosec-fetcher` |
| `SecurityProvider`, `useSecurity`, `RouteGuard`, `RefreshableRouteGuard` and the other security hooks in `@ahoo-wang/fetcher-react` | `@ahoo-wang/cosec-react`   |

The rest of `@ahoo-wang/fetcher-react` is unchanged in 8.0.

## Choose by the server's CoSec version

| Your server runs | Use                                                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CoSec 8          | Fetcher 8 with `@ahoo-wang/cosec-fetcher` and, for React, `@ahoo-wang/cosec-react`. They speak the CoSec 8 protocol.                                                               |
| CoSec 7.x        | Stay on fetcher 6.x, where `@ahoo-wang/fetcher-cosec` 6.x keeps working against CoSec 7 and receives fixes from the [`6.x` branch](https://github.com/Ahoo-Wang/fetcher/tree/6.x). |

`@ahoo-wang/fetcher-cosec` is not published for fetcher 8. Upgrade the server to CoSec 8 before moving the client to fetcher 8.

## Steps

1. Upgrade the server to CoSec 8.
2. Remove `@ahoo-wang/fetcher-cosec` from the application and upgrade the `@ahoo-wang/fetcher*` packages to 8.
3. Install the CoSec packages. Until CoSec 8.0 is generally available they are on npm's `rc` tag:

   ```bash
   pnpm add @ahoo-wang/cosec-fetcher@rc
   pnpm add @ahoo-wang/cosec-react@rc   # React applications
   ```

4. Rewrite the imports and configuration with the old-to-new mapping in the CoSec documentation: [cosec.ahoo.me/integration/clients](https://cosec.ahoo.me/integration/clients). It lists what each export of the old packages becomes; follow it rather than assuming a one-to-one rename.

[Return to this task group](./index.md); [review integration boundaries](../../architecture/integration-decisions.md).
