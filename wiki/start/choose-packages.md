---
title: Choose packages for your task
description: Choose packages for your task
---

# Choose packages for your task

Identify the capability your application needs, then add the package that owns it. The Fetcher core can send requests by itself.

| Task                     | Package                          | Details                                          |
| ------------------------ | -------------------------------- | ------------------------------------------------ |
| HTTP clients             | `@ahoo-wang/fetcher`             | [fetcher](../reference/fetcher/index.md)         |
| Declarative services     | `@ahoo-wang/fetcher-decorator`   | [decorator](../reference/decorator/index.md)     |
| Event delivery           | `@ahoo-wang/fetcher-eventbus`    | [eventbus](../reference/eventbus/index.md)       |
| Stored values            | `@ahoo-wang/fetcher-storage`     | [storage](../reference/storage/index.md)         |
| SSE consumption          | `@ahoo-wang/fetcher-eventstream` | [eventstream](../reference/eventstream/index.md) |
| Chat completions         | `@ahoo-wang/fetcher-openai`      | [openai](../reference/openai/index.md)           |
| OpenAPI types            | `@ahoo-wang/fetcher-openapi`     | [openapi](../reference/openapi/index.md)         |
| Client generation        | `@ahoo-wang/fetcher-generator`   | [generator](../reference/generator/index.md)     |
| React request state      | `@ahoo-wang/fetcher-react`       | [react](../reference/react/index.md)             |
| Data viewers             | `@ahoo-wang/fetcher-viewer`      | [viewer](../reference/viewer/index.md)           |
| CoSec authentication     | `@ahoo-wang/fetcher-cosec`       | [cosec](../reference/cosec/index.md)             |
| Wow commands and queries | `@ahoo-wang/fetcher-wow`         | [wow](../reference/wow/index.md)                 |

## Common compositions

- REST: Fetcher, plus Decorator when a stable service interface helps.
- OpenAPI: Generator produces clients at build time; generated code uses the relevant runtime packages.
- Streaming: Fetcher/EventStream transport and parse data; add React when a page needs state.
- Data applications: Wow owns commands/queries, React manages component request state, Viewer supplies the view interface.

See [Installation](./installation.md) for dependencies and peers. Once you choose a package, use its reference index to select a topic without reading the rest of the ecosystem.
