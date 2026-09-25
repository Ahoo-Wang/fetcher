---
title: 'URL 构建与模板'
description: 'URL 构建与模板 — @ahoo-wang/fetcher 5.0.0'
---

# URL 构建与模板

`UrlBuilder` 组合基础 URL、路径替换值和查询记录，不发起请求，也不实现通用 RFC URI-template 展开。

## 构建器 {#builder}

`new UrlBuilder(baseURL: string, urlTemplateStyle?)` 提供可修改的 `baseURL` 和 `urlTemplateResolver`。`build(url: string, params?: UrlParams): string` 解析路径与查询；`resolveRequestUrl(request: FetchRequest)` 委托给 `build`。`UrlBuilderCapable` 要求 `urlBuilder` 字段。`UrlParams.path`、`.query` 均为可选 `Record<string, any>`。

`combineURLs(baseURL, relativeURL)` 去掉拼接处前后多余斜杠。相对 URL 为空时原样返回基础地址；第二个 URL 是绝对地址或协议相对地址时覆盖基础地址。`isAbsoluteURL` 识别可选 scheme 后跟 `//` 的形式，并不识别所有 URI scheme，例如不会把 `data:` 当作绝对地址。

查询值由 `toSearchParams(query)` 序列化：`undefined`/`null` 值被省略，数组按每项生成一个参数（`ids=1&ids=2`，跳过 null/undefined 项），`Date` 转为 ISO 8601 文本，其余值转为 `String(value)`（对象为其字符串表示）。作为 `query` 传入的 `URLSearchParams` 原样使用。`formatUrlParam(value)` 是共用的值转文本规则（`Date` → `toISOString()`，其余 `String(value)`）。已有查询保留，新参数追加在 fragment 前；根据已有 `?`、结尾 `?`/`&` 选择分隔符。

## 模板解析器 {#templates}

| 公开 API                                                   | 行为                                                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UrlTemplateStyle.UriTemplate`                             | 默认枚举值 0，使用 `{id}`。                                                                                                                                                 |
| `UrlTemplateStyle.Express`                                 | 枚举值 1，匹配开头或 `/` 后的 `:id`。参数名是标识符（`[A-Za-z_$][\w$]*`）：`/files/:name.json` 的参数是 `name`。                                                            |
| `getUrlTemplateResolver(style?)`                           | 仅 Express 枚举返回 Express，其余返回共享 URI 解析器。                                                                                                                      |
| `UriTemplateResolver`、`uriTemplateResolver`               | 实现 `UrlTemplateResolver` 的类与单例。                                                                                                                                     |
| `ExpressUrlTemplateResolver`、`expressUrlTemplateResolver` | 对应冒号风格实现。                                                                                                                                                          |
| `extractPathParams(template)`                              | 按出现顺序返回参数名，保留重复。                                                                                                                                            |
| `resolve(template, pathParams?)`                           | 对每个值的 `formatUrlParam` 文本执行 `encodeURIComponent`。占位符没有值——未传映射、缺少键、`undefined` 或 `null`——时抛 `Error('Missing required path parameter: <name>')`。 |
| `urlTemplateRegexResolve(template, regex, params?)`        | 使用调用者提供的正则捕获组确定键名，执行同样的替换规则。                                                                                                                    |
| `urlTemplateRegexExtract(template, regex)`                 | 循环调用 `regex.exec`，必须使用 global 正则以推进匹配。                                                                                                                     |

`Date` 值转为 ISO 8601 文本，值内斜杠编码为 `%2F`。`UrlResolveInterceptor` 使用客户端构建器改写 `exchange.request.url`，随后清空 `request.urlParams` 避免重复解析。名称和顺序常量见[拦截器](./interceptors.md)。无论是否传入参数映射，缺失模板参数都在网络 I/O 前失败。

## 完整示例 {#example}

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

## 公开符号与源码 {#symbols}

| 符号                                                                         | 实现                                                                                                                          |
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

[包索引](./index.md)
