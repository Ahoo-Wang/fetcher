---
prev: false
next: false
title: View Engine tasks
description: A configurable data view engine for Wow-based applications, being rewritten from a first-principles design.
---

# View Engine tasks

View Engine is being rewritten. The previous implementation is frozen at the git tag `view-engine-legacy`; the new package grows from an empty tree following the [architecture design](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/docs/design.md).

The design fixes three facts and derives everything else from them:

| Fact                       | Consequence                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| Definitions are code       | No definition service or versions; saved views are validated when opened                              |
| Configs are data           | Only `ViewInstance` and personal preferences persist; optimistic revision plus idempotent `requestId` |
| Runtime state is transient | Drafts, results and selection live in one open `ViewRuntime`                                          |

Task guides return here as each delivery step lands: Record workbench first, then Analysis, then Dashboard. Until then, read the package [README](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/README.md) for the target API and the design for module boundaries, the `ViewStore` port and the delivery order.
