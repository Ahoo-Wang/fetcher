---
prev: false
title: 'Viewer reference'
description: 'Viewer entry selection, installation and behavior contracts'
---

# Viewer

Viewer supplies Ant Design filter, table and saved-view UI. Begin with the component matching who owns the rows and saved views. A local table does not require a Wow backend; FetcherViewer requires the defined remote protocol.

## Choose an entry

| Entry                                               | Component owns                                               | Application owns                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [View](./view-and-viewer#api-View)                  | One view's filter/table/page interaction                     | `dataSource: {list,total}`, data loading and persistence                                          |
| [Viewer](./view-and-viewer#api-Viewer)              | View collection, switching and editable active-view state    | `definition`, initial views, `onLoadData`, create/update/delete persistence and success callbacks |
| [FetcherViewer](./fetcher-viewer#api-FetcherViewer) | Definition/view lookup, Wow commands and paged data requests | Compatible backend, default Fetcher/authentication, tenant/owner identity and authorization       |

`View` and `Viewer` do not filter or paginate an input array for you. Their callbacks request new data; the application supplies the resulting rows and total. A save callback acknowledges application persistence. FetcherViewer adds version confirmation for **create/update**; deletion and ordinary row queries have different boundaries.

## Installation prerequisites

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openapi @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-viewer @ahoo-wang/fetcher-wow @ant-design/icons antd dayjs react react-dom
```

This reference targets 5.0.0. The library package declares Node >=18.20.8; repository development requires Node >=20.20.2 and pnpm 10.34.5. The command includes all transitive internal peers, including packages reached through Wow/React/CoSec. Direct runtime dependencies are installed automatically. External peer ranges are React/ReactDOM ^19.2.8, antd ^6.6.3, @ant-design/icons ^6.3.4 and dayjs ^1.11.23. They are installation requirements even when a particular feature is unused. Consumers do not need to duplicate the repository React Compiler toolchain.

## Runnable core example

For setup, fixtures and expected results follow [the guide](../../guides/viewer/index.md).

<<< @/../stories/docs/LocalViewer.tsx

## Topics

- [View and Viewer composition](./view-and-viewer)
- [Models and state ownership](./models-and-state)
- [Filters and editable panels](./filters)
- [Tables, columns and cells](./tables-and-cells)
- [Saved-view panels and persistence callbacks](./saved-views)
- [FetcherViewer remote integration](./fetcher-viewer)
- [Registries, inputs and fullscreen button](./registries-and-inputs)
- [Toolbar, refresh and locale](./toolbar-and-locale)
- [Complete symbol index](./symbols)

[State and resource ownership](../../architecture/state-and-resources) · [Failure and cancellation boundaries](../../architecture/failure-model)
