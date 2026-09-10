---
prev: false
title: View Engine reference
description: Public entries, prerequisites and contracts for the independent record view engine.
---

# View Engine reference

This reference describes the current 5.0.0 workspace contract. The package has not yet been published to the public registry; follow [the local build/archive instructions](../../examples/view-engine.md). Repository development requires Node >=20.20.2 and pnpm 10.34.5. React UI requires React/ReactDOM ^19.2.8; direct dependencies are installed with the package and their declared peers must also be satisfied.

| Entry                                       | Contents                                                                          | Runtime                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| `@ahoo-wang/fetcher-view-engine`            | Models, ViewHost, ViewEngine, pure filter helpers, MemoryViewHost                 | Core import does not load React, DOM or CSS |
| `@ahoo-wang/fetcher-view-engine/react`      | ViewPage, RecordView, FilterPanel, table/card presentations and built-in controls | React 19 and browser UI                     |
| `@ahoo-wang/fetcher-view-engine/styles.css` | Compiled scoped styles                                                            | Import once in the application              |

No consumer Tailwind or React Compiler plugin is required. `fve:` is the CSS utility prefix, not a prefix for configured component names. The current implementation supports `kind: 'record'` and `layout: 'table' | 'card'`.

| Contract                                                       | Topic                         |
| -------------------------------------------------------------- | ----------------------------- |
| Definition, instance, filter configuration and source shape    | [Models](./models.md)         |
| Service facade, permissions, revisions and development storage | [ViewHost](./view-host.md)    |
| Headless lifecycle, commands and snapshots                     | [ViewEngine](./engine.md)     |
| Filter serialization, compiler and remote candidates           | [Filters](./filters.md)       |
| React ownership, extension props, cells and theme              | [Components](./components.md) |
| Every exported name in both code entries                       | [Symbol index](./symbols.md)  |

Use [task guides](../../guides/view-engine/index.md) for integration steps and [the shared runnable example](../../examples/view-engine.md) for a verified starting point. Files under `dev`, internal engine services and private UI primitives are not additional public imports.

The required `ViewDefinition.allowedLayouts` controls available layouts; a single allowed layout hides the switch. Switching retains each layout configuration; see the [model contract](./models.md).
