---
title: "Packages Overview"
description: "Complete reference of all 12 Fetcher ecosystem packages, their dependencies, installation commands, and the inter-package dependency graph."
---

# Packages Overview

The Fetcher ecosystem is organized as a pnpm monorepo with 12 packages under the `@ahoo-wang` npm scope. Each package is independently publishable while sharing a unified version and build configuration.

## Package Dependency Graph

```mermaid
graph TB
    subgraph sg_1 ["Foundation"]
        OPENAPI["@ahoo-wang/fetcher-openapi<br>OpenAPI 3.x types<br>(standalone)"]
        FETCHER["@ahoo-wang/fetcher<br>Core HTTP client<br>(no internal deps)"]
    end

    subgraph sg_2 ["Middleware Layer"]
        DECORATOR["@ahoo-wang/fetcher-decorator<br>Declarative API decorators"]
        EVENTBUS["@ahoo-wang/fetcher-eventbus<br>Typed event bus system"]
        EVENTSTREAM["@ahoo-wang/fetcher-eventstream<br>SSE / LLM streaming"]
    end

    subgraph sg_3 ["Integrations"]
        OPENAI["@ahoo-wang/fetcher-openai<br>OpenAI Chat Completions"]
        WOW["@ahoo-wang/fetcher-wow<br>Wow DDD/CQRS support"]
        STORAGE["@ahoo-wang/fetcher-storage<br>Key-based storage"]
        COSEC["@ahoo-wang/fetcher-cosec<br>Auth / token management"]
    end

    subgraph sg_4 ["Application Layer"]
        REACT["@ahoo-wang/fetcher-react<br>React hooks"]
        VIEWER["@ahoo-wang/fetcher-viewer<br>API viewer components"]
        GENERATOR["@ahoo-wang/fetcher-generator<br>OpenAPI code generator"]
    end

    FETCHER --> DECORATOR
    FETCHER --> EVENTBUS
    FETCHER --> EVENTSTREAM

    FETCHER --> OPENAI
    EVENTSTREAM --> OPENAI
    DECORATOR --> OPENAI

    FETCHER --> WOW
    EVENTSTREAM --> WOW
    DECORATOR --> WOW

    EVENTBUS --> STORAGE

    FETCHER --> COSEC
    EVENTBUS --> COSEC
    STORAGE --> COSEC

    FETCHER --> REACT
    EVENTSTREAM --> REACT
    EVENTBUS --> REACT
    STORAGE --> REACT
    WOW --> REACT
    COSEC --> REACT

    REACT --> VIEWER
    OPENAPI --> VIEWER

    FETCHER --> GENERATOR
    EVENTSTREAM --> GENERATOR
    DECORATOR --> GENERATOR
    OPENAPI --> GENERATOR
    WOW --> GENERATOR

    style OPENAPI fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style FETCHER fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style DECORATOR fill:#161b22,stroke:#30363d,color:#e6edf3
    style EVENTBUS fill:#161b22,stroke:#30363d,color:#e6edf3
    style EVENTSTREAM fill:#161b22,stroke:#30363d,color:#e6edf3
    style OPENAI fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style WOW fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style STORAGE fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style COSEC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style REACT fill:#161b22,stroke:#30363d,color:#e6edf3
    style VIEWER fill:#161b22,stroke:#30363d,color:#e6edf3
    style GENERATOR fill:#161b22,stroke:#30363d,color:#e6edf3
```

## Package Registry

| # | Package | Description | Key Source | Dependencies |
|---|---------|-------------|------------|--------------|
| 1 | [@ahoo-wang/fetcher](./fetcher.md) | Core HTTP client with interceptors, URL building, and timeout control | [`packages/fetcher/src/fetcher.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts) | None (standalone) |
| 2 | [@ahoo-wang/fetcher-decorator](./decorator.md) | TypeScript decorators for declarative API service definitions | [`packages/decorator/src/apiDecorator.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts) | `@ahoo-wang/fetcher`, `reflect-metadata` |
| 3 | [@ahoo-wang/fetcher-eventbus](./eventbus.md) | Typed event bus with serial, parallel, and broadcast implementations | [`packages/eventbus/src/eventBus.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventbus/src/eventBus.ts) | `@ahoo-wang/fetcher` |
| 4 | [@ahoo-wang/fetcher-eventstream](./eventstream.md) | SSE stream processing and LLM streaming support (side-effect module) | [`packages/eventstream/src/responses.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/responses.ts) | `@ahoo-wang/fetcher` |
| 5 | [@ahoo-wang/fetcher-openai](./openai.md) | Type-safe OpenAI Chat Completions API client | [`packages/openai/src/chat/chatClient.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openai/src/chat/chatClient.ts) | `fetcher`, `eventstream`, `decorator` |
| 6 | [@ahoo-wang/fetcher-openapi](./openapi.md) | OpenAPI 3.x Specification TypeScript types | [`packages/openapi/src/openAPI.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts) | None (standalone) |
| 7 | [@ahoo-wang/fetcher-storage](./storage.md) | Key-based storage with serialization and change notifications | [`packages/storage/src/`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/) | `@ahoo-wang/fetcher-eventbus` |
| 8 | [@ahoo-wang/fetcher-cosec](./cosec.md) | Enterprise authentication with automatic token management | [`packages/cosec/src/`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/) | `fetcher`, `eventbus`, `storage` |
| 9 | [@ahoo-wang/fetcher-wow](./wow.md) | Wow DDD/CQRS framework integration | [`packages/wow/src/`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/) | `fetcher`, `eventstream`, `decorator` |
| 10 | [@ahoo-wang/fetcher-react](./react.md) | React hooks for data fetching with automatic re-rendering | [`packages/react/src/`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/) | `fetcher`, `eventstream`, `eventbus`, `storage`, `wow`, `cosec` |
| 11 | [@ahoo-wang/fetcher-viewer](./viewer.md) | React + Ant Design API documentation viewer | [`packages/viewer/src/`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/) | Most packages + `antd`, `react` |
| 12 | [@ahoo-wang/fetcher-generator](./generator.md) | OpenAPI-to-TypeScript code generator CLI | [`packages/generator/src/`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/) | `fetcher`, `eventstream`, `decorator`, `openapi`, `wow` |

## Installation

Install individual packages or combinations as needed:

```bash
# Core HTTP client
pnpm add @ahoo-wang/fetcher

# Declarative API decorators (requires reflect-metadata)
pnpm add @ahoo-wang/fetcher-decorator reflect-metadata

# Event bus system
pnpm add @ahoo-wang/fetcher-eventbus

# SSE / LLM streaming support
pnpm add @ahoo-wang/fetcher-eventstream

# OpenAI API client
pnpm add @ahoo-wang/fetcher-openai

# OpenAPI 3.x types
pnpm add @ahoo-wang/fetcher-openapi

# Key-based storage
pnpm add @ahoo-wang/fetcher-storage

# CoSec authentication
pnpm add @ahoo-wang/fetcher-cosec

# React hooks
pnpm add @ahoo-wang/fetcher-react

# API viewer components (requires antd)
pnpm add @ahoo-wang/fetcher-viewer antd @ant-design/icons

# Wow DDD/CQRS support
pnpm add @ahoo-wang/fetcher-wow

# Code generator (CLI tool)
pnpm add -D @ahoo-wang/fetcher-generator
```

## Layered Architecture

The packages follow a clear layered architecture, moving from foundational utilities up to application-level components.

```mermaid
graph LR
    subgraph sg_1 ["Layer 1: Foundation"]
        direction TB
        L1A["fetcher-openapi"]
        L1B["fetcher"]
    end

    subgraph sg_2 ["Layer 2: Middleware"]
        direction TB
        L2A["fetcher-decorator"]
        L2B["fetcher-eventbus"]
        L2C["fetcher-eventstream"]
    end

    subgraph sg_3 ["Layer 3: Integrations"]
        direction TB
        L3A["fetcher-openai"]
        L3B["fetcher-wow"]
        L3C["fetcher-storage"]
        L3D["fetcher-cosec"]
    end

    subgraph sg_4 ["Layer 4: Application"]
        direction TB
        L4A["fetcher-react"]
        L4B["fetcher-viewer"]
        L4C["fetcher-generator"]
    end

    L1A --> L2A
    L1B --> L2A
    L1B --> L2B
    L1B --> L2C

    L2A --> L3A
    L2B --> L3C
    L2C --> L3A
    L2C --> L3B

    L3A --> L4A
    L3B --> L4A
    L3C --> L4A
    L3D --> L4A

    L4A --> L4B
    L1A --> L4C

    style L1A fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style L1B fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style L2A fill:#161b22,stroke:#30363d,color:#e6edf3
    style L2B fill:#161b22,stroke:#30363d,color:#e6edf3
    style L2C fill:#161b22,stroke:#30363d,color:#e6edf3
    style L3A fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style L3B fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style L3C fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style L3D fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style L4A fill:#161b22,stroke:#30363d,color:#e6edf3
    style L4B fill:#161b22,stroke:#30363d,color:#e6edf3
    style L4C fill:#161b22,stroke:#30363d,color:#e6edf3
```

## Build System

All packages share a unified Vite build configuration:

```mermaid
graph LR
    subgraph sg_1 ["Build Pipeline"]
        SRC["TypeScript Source"]
        VITE["Vite"]
        UNPLUGIN["unplugin-dts"]
    end

    subgraph sg_2 ["Outputs"]
        ESM["dist/index.es.js<br>ESM"]
        UMD["dist/index.umd.js<br>UMD"]
        DTS["dist/index.d.ts<br>Types"]
    end

    SRC --> VITE
    VITE --> ESM
    VITE --> UMD
    VITE --> UNPLUGIN
    UNPLUGIN --> DTS

    style SRC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style VITE fill:#161b22,stroke:#30363d,color:#e6edf3
    style UNPLUGIN fill:#161b22,stroke:#30363d,color:#e6edf3
    style ESM fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style UMD fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style DTS fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

Each package outputs:

| Output | Format | Description |
|--------|--------|-------------|
| `dist/index.es.js` | ESM | ES Module bundle for modern bundlers |
| `dist/index.umd.js` | UMD | Universal module for direct browser usage |
| `dist/index.d.ts` | TypeScript | Full type declarations |

## Monorepo Management

```mermaid
sequenceDiagram
autonumber

    participant Dev as Developer
    participant PNPM as pnpm
    participant Cat as pnpm-workspace.yaml
    participant Pkg as packages/*

    Dev->>PNPM: pnpm install
    PNPM->>Cat: Read catalog protocol
    Cat-->>PNPM: Centralized dependency versions
    PNPM->>Pkg: Install with catalog versions
    Pkg-->>PNPM: Dependencies resolved
    PNPM-->>Dev: node_modules ready

    Dev->>PNPM: pnpm build
    PNPM->>Pkg: Build all packages (topological order)
    Pkg-->>PNPM: dist/ artifacts
    PNPM-->>Dev: All packages built

    Dev->>PNPM: pnpm --filter @ahoo-wang/fetcher test
    PNPM->>Pkg: Run vitest for target package
    Pkg-->>PNPM: Test results
    PNPM-->>Dev: Coverage report
```

## Shared Conventions

All packages follow these conventions:

- **ES Modules**: `"type": "module"` in all `package.json` files
- **TypeScript Strict**: Strict mode enabled across all packages
- **License**: Apache 2.0 with headers in every source file
- **Testing**: Vitest with `@vitest/coverage-v8`
- **Formatting**: Prettier with single quotes, trailing commas, 80-char width
- **Version**: Synchronized across all packages via `pnpm update-version <version>`
- **Bundle Analysis**: Each package has a `vite-bundle-analyzer` script

## Related Pages

- [Fetcher (Core)](./fetcher.md) - The foundation HTTP client
- [Decorator](./decorator.md) - Declarative API definitions
- [EventBus](./eventbus.md) - Typed event system
- [EventStream](./eventstream.md) - SSE and LLM streaming
- [OpenAI](./openai.md) - Chat Completions integration
- [OpenAPI](./openapi.md) - Specification type definitions
- [Storage](./storage.md) - Key-based storage abstraction
- [React](./react.md) - React hooks and integration
- [Generator](./generator.md) - Code generation CLI
