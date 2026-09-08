---
title: 'URL construction and templates'
description: 'URL construction and templates — @ahoo-wang/fetcher 5.0.0'
---

# URL construction and templates

`UrlBuilder` combines a base URL, path substitutions, and a query record. It does not send a request and does not perform general RFC URI-template expansion.

## Builder {#builder}

`new UrlBuilder(baseURL: string, urlTemplateStyle?)` exposes mutable `baseURL` and `urlTemplateResolver`. `build(url: string, params?: UrlParams): string` resolves both parts; `resolveRequestUrl(request: FetchRequest)` delegates to `build`. `UrlBuilderCapable` requires a `urlBuilder`. `UrlParams.path` and `.query` are optional `Record<string, any>` values.

`combineURLs(baseURL, relativeURL)` trims trailing/leading slash runs at the join. Empty relative URL returns the base unchanged; an absolute or protocol-relative second URL overrides the base. `isAbsoluteURL` recognizes an optional scheme followed by `//`, not every URI scheme (`data:` is not classified as absolute by this helper).

Query values go directly into `new URLSearchParams(record)`: arrays become comma-separated strings, objects become their string representation, and null/undefined are not omitted. Pre-normalize values if you need repeated keys or omission. Existing query text is preserved and new parameters append before a fragment, choosing `?`, `&`, or no extra separator after a trailing `?`/`&`.

## Template resolvers {#templates}

| Public API                                                 | Behavior                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `UrlTemplateStyle.UriTemplate`                             | Default enum value 0; `{id}` placeholders.                                                                                               |
| `UrlTemplateStyle.Express`                                 | Enum value 1; `:id` at the start or after `/`.                                                                                           |
| `getUrlTemplateResolver(style?)`                           | Express only for the Express enum, otherwise the shared URI resolver.                                                                    |
| `UriTemplateResolver`, `uriTemplateResolver`               | Class and singleton implementing `UrlTemplateResolver`.                                                                                  |
| `ExpressUrlTemplateResolver`, `expressUrlTemplateResolver` | Corresponding colon-style implementation.                                                                                                |
| `extractPathParams(template)`                              | Parameter names in occurrence order, including repetitions.                                                                              |
| `resolve(template, pathParams?)`                           | `encodeURIComponent` of each value. Without a map/null, leaves template unchanged; with a map, a missing/undefined value throws `Error`. |
| `urlTemplateRegexResolve(template, regex, params?)`        | Same substitution rule for a caller-supplied capture group naming the key.                                                               |
| `urlTemplateRegexExtract(template, regex)`                 | Loops through `regex.exec`; use a global regex so matching progresses.                                                                   |

A present null value is encoded as `'null'`; slashes inside values become `%2F`. `UrlResolveInterceptor` applies the client's builder to `exchange.request.url`, then clears `request.urlParams` to avoid resolving twice. Its name/order constants are listed under [interceptors](./interceptors.md). Missing template parameters fail before network I/O when a map is supplied.

## Complete example {#example}

```ts
import { UrlBuilder, UrlTemplateStyle } from '@ahoo-wang/fetcher';

const urls = new UrlBuilder(
  'https://api.example.com/v1',
  UrlTemplateStyle.UriTemplate,
);
const url = urls.build('/users/{id}?active=true#details', {
  path: { id: 'a/b' },
  query: { page: 2, q: 'hello world' },
});
console.assert(
  url ===
    'https://api.example.com/v1/users/a%2Fb?active=true&page=2&q=hello+world#details',
);
```

## Public symbols and source {#symbols}

| Symbol                                                                       | Implementation                                                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| <a id="urlparams"></a>`UrlParams`                                            | [urlBuilder.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L27)                     |
| <a id="urlbuilder"></a>`UrlBuilder`                                          | [urlBuilder.ts:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L72)                     |
| <a id="urlbuildercapable"></a>`UrlBuilderCapable`                            | [urlBuilder.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L166)                   |
| <a id="urltemplatestyle"></a>`UrlTemplateStyle`                              | [urlTemplateResolver.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L20)   |
| <a id="geturltemplateresolver"></a>`getUrlTemplateResolver`                  | [urlTemplateResolver.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L63)   |
| <a id="urltemplateresolver"></a>`UrlTemplateResolver`                        | [urlTemplateResolver.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L92)   |
| <a id="urltemplateregexresolve"></a>`urlTemplateRegexResolve`                | [urlTemplateResolver.ts:151](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L151) |
| <a id="urltemplateregexextract"></a>`urlTemplateRegexExtract`                | [urlTemplateResolver.ts:174](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L174) |
| <a id="uritemplateresolver"></a>`UriTemplateResolver`                        | [urlTemplateResolver.ts:205](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L205) |
| <a id="uritemplateresolver-instance"></a>`uriTemplateResolver`               | [urlTemplateResolver.ts:297](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L297) |
| <a id="expressurltemplateresolver"></a>`ExpressUrlTemplateResolver`          | [urlTemplateResolver.ts:316](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L316) |
| <a id="expressurltemplateresolver-instance"></a>`expressUrlTemplateResolver` | [urlTemplateResolver.ts:397](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L397) |
| <a id="isabsoluteurl"></a>`isAbsoluteURL`                                    | [urls.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urls.ts#L27)                                 |
| <a id="combineurls"></a>`combineURLs`                                        | [urls.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urls.ts#L49)                                 |

[Package index](./index.md)
