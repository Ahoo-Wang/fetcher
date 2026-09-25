---
title: 'URL construction and templates'
description: 'URL construction and templates — @ahoo-wang/fetcher 5.0.0'
---

# URL construction and templates

`UrlBuilder` combines a base URL, path substitutions, and a query record. It does not send a request and does not perform general RFC URI-template expansion.

## Builder {#builder}

`new UrlBuilder(baseURL: string, urlTemplateStyle?)` exposes mutable `baseURL` and `urlTemplateResolver`. `build(url: string, params?: UrlParams): string` resolves both parts; `resolveRequestUrl(request: FetchRequest)` delegates to `build`. `UrlBuilderCapable` requires a `urlBuilder`. `UrlParams.path` and `.query` are optional `Record<string, any>` values.

`combineURLs(baseURL, relativeURL)` trims trailing/leading slash runs at the join. Empty relative URL returns the base unchanged; an absolute or protocol-relative second URL overrides the base. `isAbsoluteURL` recognizes an optional scheme followed by `//`, not every URI scheme (`data:` is not classified as absolute by this helper).

Query values are serialized by `toSearchParams(query)`: `undefined`/`null` values are omitted, an array becomes one parameter per item (`ids=1&ids=2`, skipping null/undefined items), a `Date` becomes its ISO 8601 text, and anything else becomes `String(value)` (an object becomes its string representation). A `URLSearchParams` passed as `query` is taken as is. `formatUrlParam(value)` is the shared value-to-text rule (`Date` → `toISOString()`, otherwise `String(value)`). Existing query text is preserved and new parameters append before a fragment, choosing `?`, `&`, or no extra separator after a trailing `?`/`&`.

## Template resolvers {#templates}

| Public API                                                 | Behavior                                                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UrlTemplateStyle.UriTemplate`                             | Default enum value 0; `{id}` placeholders.                                                                                                                                                            |
| `UrlTemplateStyle.Express`                                 | Enum value 1; `:id` at the start or after `/`. The name is an identifier (`[A-Za-z_$][\w$]*`): `/files/:name.json` is the parameter `name`.                                                           |
| `getUrlTemplateResolver(style?)`                           | Express only for the Express enum, otherwise the shared URI resolver.                                                                                                                                 |
| `UriTemplateResolver`, `uriTemplateResolver`               | Class and singleton implementing `UrlTemplateResolver`.                                                                                                                                               |
| `ExpressUrlTemplateResolver`, `expressUrlTemplateResolver` | Corresponding colon-style implementation.                                                                                                                                                             |
| `extractPathParams(template)`                              | Parameter names in occurrence order, including repetitions.                                                                                                                                           |
| `resolve(template, pathParams?)`                           | `encodeURIComponent` of each value's `formatUrlParam` text. A placeholder with no value — absent map, missing key, `undefined` or `null` — throws `Error('Missing required path parameter: <name>')`. |
| `urlTemplateRegexResolve(template, regex, params?)`        | Same substitution rule for a caller-supplied capture group naming the key.                                                                                                                            |
| `urlTemplateRegexExtract(template, regex)`                 | Loops through `regex.exec`; use a global regex so matching progresses.                                                                                                                                |

A `Date` value becomes its ISO 8601 text; slashes inside values become `%2F`. `UrlResolveInterceptor` applies the client's builder to `exchange.request.url`, then clears `request.urlParams` to avoid resolving twice. Its name/order constants are listed under [interceptors](./interceptors.md). Missing template parameters fail before network I/O, with or without a map.

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
| <a id="urlparams"></a>`UrlParams`                                            | [urlBuilder.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L28)                     |
| <a id="urlbuilder"></a>`UrlBuilder`                                          | [urlBuilder.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L105)                   |
| <a id="tosearchparams"></a>`toSearchParams`                                  | [urlBuilder.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L77)                     |
| <a id="urlbuildercapable"></a>`UrlBuilderCapable`                            | [urlBuilder.ts:199](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlBuilder.ts#L199)                   |
| <a id="urltemplatestyle"></a>`UrlTemplateStyle`                              | [urlTemplateResolver.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L20)   |
| <a id="geturltemplateresolver"></a>`getUrlTemplateResolver`                  | [urlTemplateResolver.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L63)   |
| <a id="urltemplateresolver"></a>`UrlTemplateResolver`                        | [urlTemplateResolver.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L92)   |
| <a id="formaturlparam"></a>`formatUrlParam`                                  | [urlTemplateResolver.ts:149](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L149) |
| <a id="urltemplateregexresolve"></a>`urlTemplateRegexResolve`                | [urlTemplateResolver.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L165) |
| <a id="urltemplateregexextract"></a>`urlTemplateRegexExtract`                | [urlTemplateResolver.ts:186](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L186) |
| <a id="uritemplateresolver"></a>`UriTemplateResolver`                        | [urlTemplateResolver.ts:217](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L217) |
| <a id="uritemplateresolver-instance"></a>`uriTemplateResolver`               | [urlTemplateResolver.ts:309](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L309) |
| <a id="expressurltemplateresolver"></a>`ExpressUrlTemplateResolver`          | [urlTemplateResolver.ts:328](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L328) |
| <a id="expressurltemplateresolver-instance"></a>`expressUrlTemplateResolver` | [urlTemplateResolver.ts:411](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urlTemplateResolver.ts#L411) |
| <a id="isabsoluteurl"></a>`isAbsoluteURL`                                    | [urls.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urls.ts#L27)                                 |
| <a id="combineurls"></a>`combineURLs`                                        | [urls.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/urls.ts#L49)                                 |

[Package index](./index.md)
