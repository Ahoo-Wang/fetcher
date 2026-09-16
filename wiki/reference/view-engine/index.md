---
prev: false
title: View Engine reference
description: Public entries and contracts of the view engine; the reference follows the rewrite step by step.
---

# View Engine reference

The package is being rewritten and has no published API yet. The target entries are fixed by the [architecture design](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/docs/design.md):

| Entry                            | Contents                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@ahoo-wang/fetcher-view-engine` | Model types, pure kernels (`validate*` / `compile*` / `project*`), runtime, `ViewStore` port, `MemoryViewStore` |
| `/react`                         | Hooks and headless controllers                                                                                  |
| `/ui`                            | Default components, default views, workbench                                                                    |
| `/styles.css`, `/themes/*`       | Default styles and themes, imported explicitly                                                                  |

Reference pages for models, kernels, runtime, store and components are added as each entry ships. The previous reference is available at the git tag `view-engine-legacy`.
