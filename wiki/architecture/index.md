---
title: Architecture Overview
description: High-level architecture of the Fetcher monorepo -- package dependency graph, module boundaries, design principles, and technology stack.
---

# Architecture Overview

Fetcher is a modular HTTP client ecosystem built on the native Fetch API.
It delivers an Axios-like experience through interceptor-powered middleware, TypeScript-first design, and native Server-Sent Event / LLM streaming support.
The codebase is organized as a **pnpm workspaces monorepo** with 12 packages under `packages/` plus an `integration-test/` workspace.

## System Architecture Diagram

```mermaid
graph TB
  subgraph External["External Layer"]
    style External fill:#161b22,stroke:#30363d,color:#e6edf3
    Browser["Browser Fetch API"]
    Node["Node.js / Deno Fetch"]
    Antd["Ant Design"]
    Icons["@ant-design/icons"]
  end

  subgraph Application["Application Layer"]
    style Application fill:#161b22,stroke:#30363d,color:#e6edf3
    React["react<br>React Hooks"]
    Viewer["viewer<br>UI Components"]
    Generator["generator<br>CLI Tool"]
  end

  subgraph Domain["Domain Packages"]
    style Domain fill:#161b22,stroke:#30363d,color:#e6edf3
    Wow["wow<br>DDD/CQRS"]
    OpenAI["openai<br>LLM Client"]
    Cosec["cosec<br>Auth"]
    Storage["storage<br>Key-Value"]
  end

  subgraph Core["Core Packages"]
    style Core fill:#161b22,stroke:#30363d,color:#e6edf3
    Fetcher["fetcher<br>HTTP Client"]
    Decorator["decorator<br>API Annotations"]
    EventBus["eventbus<br>Pub/Sub"]
    EventStream["eventstream<br>SSE"]
    OpenAPI["openapi<br>Types"]
  end

  Browser --> Fetcher
  Node --> Fetcher
  Fetcher --> Decorator
  Fetcher --> EventBus
  Fetcher --> EventStream
  Decorator --> OpenAI
  Decorator --> Wow
  EventStream --> OpenAI
  EventStream --> Wow
  EventBus --> Cosec
  Storage --> Cosec
  Cosec --> React
  Wow --> React
  OpenAI --> React
  EventStream --> React
  EventBus --> React
  Storage --> React
  React --> Viewer
  Antd --> Viewer
  Icons --> Viewer
  Fetcher --> Generator
  Decorator --> Generator
  OpenAPI --> Generator
  Wow --> Generator
  EventStream --> Generator

  style Fetcher fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Decorator fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style EventBus fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style EventStream fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style OpenAPI fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Wow fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style OpenAI fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Cosec fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Storage fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style React fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Viewer fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Generator fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Browser fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Node fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Antd fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Icons fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

## Package Dependency Graph

The following table summarizes each package, its role, and its internal dependencies.

| Package | npm Name | Role | Dependencies |
|---|---|---|---|
| **openapi** | `@ahoo-wang/fetcher-openapi` | OpenAPI 3.x type definitions | *none (standalone)* |
| **fetcher** | `@ahoo-wang/fetcher` | Core HTTP client | *none (foundation)* |
| **decorator** | `@ahoo-wang/fetcher-decorator` | Declarative API decorators | fetcher |
| **eventbus** | `@ahoo-wang/fetcher-eventbus` | Publish/subscribe messaging | fetcher |
| **eventstream** | `@ahoo-wang/fetcher-eventstream` | SSE / streaming support | fetcher |
| **openai** | `@ahoo-wang/fetcher-openai` | OpenAI-compatible LLM client | fetcher, eventstream, decorator |
| **wow** | `@ahoo-wang/fetcher-wow` | DDD / CQRS / Event Sourcing | fetcher, eventstream, decorator |
| **storage** | `@ahoo-wang/fetcher-storage` | Key-value storage abstraction | eventbus |
| **cosec** | `@ahoo-wang/fetcher-cosec` | Authentication & authorization | fetcher, eventbus, storage |
| **react** | `@ahoo-wang/fetcher-react` | React hooks & providers | fetcher, eventstream, eventbus, storage, wow, cosec |
| **viewer** | `@ahoo-wang/fetcher-viewer` | Ant Design UI components | *all above* + antd, @ant-design/icons |
| **generator** | `@ahoo-wang/fetcher-generator` | CLI code generator | fetcher, eventstream, decorator, openapi, wow |

Source: [packages/fetcher/src/index.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/index.ts)

## Layered Dependency Diagram

```mermaid
graph LR
  subgraph Layer0["Layer 0 - No Dependencies"]
    style Layer0 fill:#161b22,stroke:#30363d,color:#e6edf3
    OpenAPI2["openapi"]
    Fetcher2["fetcher"]
  end

  subgraph Layer1["Layer 1 - Core Extensions"]
    style Layer1 fill:#161b22,stroke:#30363d,color:#e6edf3
    Decorator2["decorator"]
    EventBus2["eventbus"]
    EventStream2["eventstream"]
  end

  subgraph Layer2["Layer 2 - Domain Packages"]
    style Layer2 fill:#161b22,stroke:#30363d,color:#e6edf3
    OpenAI2["openai"]
    Wow2["wow"]
    Storage2["storage"]
    Cosec2["cosec"]
  end

  subgraph Layer3["Layer 3 - Application"]
    style Layer3 fill:#161b22,stroke:#30363d,color:#e6edf3
    React2["react"]
    Viewer2["viewer"]
    Generator2["generator"]
  end

  OpenAPI2 --> Layer1
  Fetcher2 --> Layer1
  Layer1 --> Layer2
  Layer2 --> Layer3

  style OpenAPI2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Fetcher2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Decorator2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style EventBus2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style EventStream2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style OpenAI2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Wow2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Storage2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Cosec2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style React2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Viewer2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Generator2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

## Request Lifecycle

The following sequence diagram shows how a single HTTP request flows through the system, from the application call down to the native Fetch API and back through response interceptors.

```mermaid
sequenceDiagram
autonumber

  participant App as Application
  participant F as Fetcher
  participant IM as InterceptorManager
  participant ReqReg as Request InterceptorRegistry
  participant RespReg as Response InterceptorRegistry
  participant ErrReg as Error InterceptorRegistry
  participant Native as Native Fetch

  App->>F: fetcher.get('/users/{id}')
  F->>F: resolveExchange(request, options)
  F->>IM: interceptors.exchange(exchange)
  IM->>ReqReg: request.intercept(exchange)
  ReqReg->>ReqReg: RequestBodyInterceptor
  ReqReg->>ReqReg: UrlResolveInterceptor
  ReqReg->>ReqReg: FetchInterceptor
  ReqReg->>Native: timeoutFetch(request)
  Native-->>ReqReg: Response
  ReqReg-->>IM: exchange updated
  IM->>RespReg: response.intercept(exchange)
  RespReg->>RespReg: ValidateStatusInterceptor
  RespReg-->>IM: exchange validated
  IM-->>F: FetchExchange
  F->>F: exchange.extractResult()
  F-->>App: Response / JSON / custom type
```

See [Fetcher Core](/architecture/fetcher-core) and [Interceptor System](/architecture/interceptors) for full details.

## Design Principles

### 1. Foundation-First Layering

Every package in the monorepo targets a single responsibility. The `fetcher` package has **zero internal dependencies** -- it wraps the native Fetch API and nothing else. Higher-level packages (decorator, eventstream, eventbus) depend only on `fetcher`. Domain packages compose these foundations.

Source: [packages/fetcher/src/index.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/index.ts)

### 2. Interceptor-Driven Extensibility

All request/response processing passes through a three-phase interceptor pipeline (request, response, error). Built-in behaviors -- URL resolution, body serialization, timeout, status validation -- are themselves interceptors, not hard-coded logic. Users can inject custom interceptors at any position via the `order` property.

Source: [packages/fetcher/src/interceptorManager.ts:62-66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L62-L66)

### 3. Side-Effect Module Pattern

The `eventstream` package uses a **side-effect import** -- simply importing `@ahoo-wang/fetcher-eventstream` patches `Response.prototype` with `eventStream()`, `jsonEventStream()`, and related properties. No explicit registration is required.

Source: [packages/eventstream/src/responses.ts:102-239](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/responses.ts#L102-L239)

### 4. Named Registry Pattern

Multiple Fetcher instances are managed through `FetcherRegistrar` and `NamedFetcher`. A global singleton `fetcherRegistrar` stores named instances, and a convenience default `fetcher` export is pre-registered under the name `"default"`.

Source: [packages/fetcher/src/fetcherRegistrar.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L166), [packages/fetcher/src/namedFetcher.ts:89](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L89)

### 5. Result Extraction Strategy

Rather than forcing a single return type, the Fetcher uses a `ResultExtractor` function to transform a `FetchExchange` into the caller's desired type. Built-in extractors include `Exchange`, `Response`, `Json`, `Text`, `Blob`, `ArrayBuffer`, and `Bytes`.

Source: [packages/fetcher/src/resultExtractor.ts:131-160](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L131-L160)

## Request Processing Flowchart

```mermaid
flowchart TD
  Start(["fetcher.get('/users/{id}')"])
  Merge["Merge headers + timeout"]
  CreateExchange["Create FetchExchange"]
  ReqPhase["Execute Request Interceptors"]
  Body["Serialize body (RequestBodyInterceptor)"]
  URL["Resolve URL (UrlResolveInterceptor)"]
  Exec["Execute fetch (FetchInterceptor)"]
  RespPhase["Execute Response Interceptors"]
  Validate["Validate status code"]
  Extract["Extract result via ResultExtractor"]
  ErrorCheck{{"Error occurred?"}}
  ErrPhase["Execute Error Interceptors"]
  Handled{{"Error handled?"}}
  Throw["throw ExchangeError"]
  Done(["Return result"])

  Start --> Merge --> CreateExchange --> ReqPhase
  ReqPhase --> Body --> URL --> Exec
  Exec --> ErrorCheck
  ErrorCheck -->|No| RespPhase --> Validate --> Extract --> Done
  ErrorCheck -->|Yes| ErrPhase --> Handled
  Handled -->|Yes| Done
  Handled -->|No| Throw

  style Start fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Merge fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style CreateExchange fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style ReqPhase fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Body fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style URL fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Exec fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style RespPhase fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Validate fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Extract fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style ErrorCheck fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style ErrPhase fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Handled fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Throw fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
  style Done fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

## Technology Stack

| Category | Technology | Purpose |
|---|---|---|
| Language | TypeScript (strict mode) | Type safety across all packages |
| Runtime | Browser Fetch API, Node.js native fetch | HTTP transport |
| Build | Vite + unplugin-dts | Bundle ESM/UMD + type declarations |
| Testing | Vitest + @vitest/coverage-v8 | Unit tests and coverage |
| Browser Tests | @vitest/browser + Playwright | Component testing (viewer) |
| HTTP Mocking | MSW (Mock Service Worker) | Fetcher unit tests |
| Code Generation | ts-morph + commander | Generator CLI |
| UI Framework | React 19 + Ant Design 5 | Viewer components |
| Styling | Less | Ant Design theme integration |
| Package Manager | pnpm workspaces | Monorepo management |
| Linting | ESLint + Prettier | Code style enforcement |
| React Compiler | babel-plugin-react-compiler | Automatic React optimization |

Source: [CLAUDE.md](https://github.com/Ahoo-Wang/fetcher/blob/main/CLAUDE.md)

## Cross-References

- [Fetcher Core](/architecture/fetcher-core) -- `Fetcher`, `NamedFetcher`, `FetcherRegistrar`, timeout and error handling
- [Interceptor System](/architecture/interceptors) -- `InterceptorManager`, `InterceptorRegistry`, built-in interceptors
- [EventStream & SSE](/architecture/eventstream) -- side-effect module, SSE protocol, LLM streaming
- [URL Builder](/architecture/url-builder) -- `UrlBuilder`, path templates, query parameters
