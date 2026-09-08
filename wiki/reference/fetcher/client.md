---
title: 'Client and registration'
description: 'Client and registration — @ahoo-wang/fetcher 5.0.0'
---

# Client and registration

Create a `Fetcher` for shared URL, headers, timeout, and interceptor policy. Requests still use the runtime's global `fetch`; a client does not own a connection pool or require `destroy()`.

## Construction and defaults {#construction}

`new Fetcher(options?: FetcherOptions)` accepts the following options. Supplying an options object requires `baseURL`; omitting the object uses `DEFAULT_OPTIONS`.

| Option                     | Default                                | Contract                                                                                                      |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `baseURL: string`          | `''`                                   | Used by the mutable `urlBuilder`; relative URLs still need a runtime that accepts them.                       |
| `headers?: RequestHeaders` | `{'Content-Type': 'application/json'}` | A supplied object replaces these constructor defaults. Each request gets a defensive, case-insensitive merge. |
| `timeout?: number`         | `undefined`                            | Milliseconds; no timer until configured. Request `0` disables the inherited timeout.                          |
| `urlTemplateStyle?`        | `UrlTemplateStyle.UriTemplate`         | `{id}` syntax; `Express` selects `:id`.                                                                       |
| `interceptors?`            | New `InterceptorManager`               | Supplied manager is used as-is; it can be shared across clients.                                              |
| `validateStatus?`          | `200 <= status < 300`                  | Used only when constructing the default manager.                                                              |

`urlBuilder`, `headers`, and `timeout` can be changed for subsequent requests. `interceptors` is readonly as a property, while its registries remain mutable. Default header objects are shared references: replace `client.headers` or use request headers rather than mutating exported `DEFAULT_OPTIONS.headers` globally.

## Choosing an entry point {#methods}

| Method                                             | Input                                         | Resolved value without an explicit extractor                                      |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `resolveExchange(request, options?)`               | `FetchRequest`, `RequestOptions`              | A synchronous `FetchExchange`; no HTTP I/O.                                       |
| `exchange(request, options?)`                      | Same                                          | `Promise<FetchExchange>` after the interceptor pipeline; does not extract a body. |
| `request<R = FetchExchange>(request, options?)`    | Same                                          | `Promise<R>` through the selected extractor; default exchange.                    |
| `fetch<R = Response>(url, request = {}, options?)` | `FetchRequestInit`                            | `Promise<R>`; default native `Response`.                                          |
| `get`, `head`, `options`, `trace`                  | URL, request without `method`/`body`, options | `Promise<R = Response>`; method fixed by the helper.                              |
| `post`, `put`, `patch`, `delete`                   | URL, request without `method`, options        | Same, with optional body.                                                         |

`DEFAULT_REQUEST_OPTIONS` selects `ResultExtractors.Exchange`; `DEFAULT_FETCH_OPTIONS` selects `ResultExtractors.Response`. A generic such as `get<User>()` alone does not parse JSON: select an extractor or call `response.json<User>()`. Native Fetch may reject unsupported methods such as TRACE. See [results](./results.md) and [errors](./errors-and-cancellation.md).

## Named clients {#registration}

`new NamedFetcher(name, options?)` extends `Fetcher` and immediately registers itself in the singleton `fetcherRegistrar`. `fetcher` is the exported default named instance, with `DEFAULT_FETCHER_NAME = 'default'`. Duplicate registration replaces the prior client.

`FetcherRegistrar.register(name, client): void`, `unregister(name): boolean`, and `get(name): Fetcher | undefined` manage entries. `requiredGet(name)` and the `default` getter throw `Error` when absent. Assigning `default` registers under `'default'`; `fetchers` returns a new `Map` whose values are the same clients. Unregistering does not abort in-flight requests.

`getFetcher(fetcher?, defaultFetcher?)` accepts a direct instance, a registry name, or no value. An instance wins; a name must exist; a falsy argument chooses the supplied fallback and then the global default. `FetcherCapable` exposes that optional field. `NamedCapable` supplies `name`, and `FetcherConfigurer.applyTo(fetcher): void` is the structural contract used by configurable extensions.

## Complete example {#example}

```ts
import {
  Fetcher,
  NamedFetcher,
  fetcherRegistrar,
  getFetcher,
} from '@ahoo-wang/fetcher';

const local = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 3000,
});
const named = new NamedFetcher('reports', {
  baseURL: 'https://reports.example.com',
});
console.assert(getFetcher('reports') === named);
const exchange = local.resolveExchange({ url: '/users/1' });
console.assert(exchange.request.timeout === 3000);
fetcherRegistrar.unregister('reports');
```

## Public symbols and source {#symbols}

| Symbol                                                        | Implementation                                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| <a id="fetcheroptions"></a>`FetcherOptions`                   | [fetcher.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L52)                     |
| <a id="default_options"></a>`DEFAULT_OPTIONS`                 | [fetcher.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L87)                     |
| <a id="requestoptions"></a>`RequestOptions`                   | [fetcher.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L95)                     |
| <a id="default_request_options"></a>`DEFAULT_REQUEST_OPTIONS` | [fetcher.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L98)                     |
| <a id="default_fetch_options"></a>`DEFAULT_FETCH_OPTIONS`     | [fetcher.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L101)                   |
| <a id="fetcher"></a>`Fetcher`                                 | [fetcher.ts:124](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L124)                   |
| <a id="fetchercapable"></a>`FetcherCapable`                   | [fetcherCapable.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherCapable.ts#L22)       |
| <a id="getfetcher"></a>`getFetcher`                           | [fetcherCapable.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherCapable.ts#L37)       |
| <a id="default_fetcher_name"></a>`DEFAULT_FETCHER_NAME`       | [fetcherRegistrar.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L19)   |
| <a id="fetcherregistrar"></a>`FetcherRegistrar`               | [fetcherRegistrar.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L41)   |
| <a id="fetcherregistrar-instance"></a>`fetcherRegistrar`      | [fetcherRegistrar.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L166) |
| <a id="namedfetcher"></a>`NamedFetcher`                       | [namedFetcher.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L38)           |
| <a id="fetcher-instance"></a>`fetcher`                        | [namedFetcher.ts:89](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/namedFetcher.ts#L89)           |
| <a id="namedcapable"></a>`NamedCapable`                       | [types.ts:141](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L141)                       |
| <a id="fetcherconfigurer"></a>`FetcherConfigurer`             | [types.ts:248](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/types.ts#L248)                       |

[Package index](./index.md)
