---
title: 'URL 构建与模板'
description: 'URL 构建与模板 — @ahoo-wang/fetcher 5.0.0'
---

# URL 构建与模板

`UrlBuilder` 组合基础 URL、路径替换值和查询记录，不发起请求，也不实现通用 RFC URI-template 展开。

## 构建器 {#builder}

`new UrlBuilder(baseURL: string, urlTemplateStyle?)` 提供可修改的 `baseURL` 和 `urlTemplateResolver`。`build(url: string, params?: UrlParams): string` 解析路径与查询；`resolveRequestUrl(request: FetchRequest)` 委托给 `build`。`UrlBuilderCapable` 要求 `urlBuilder` 字段。`UrlParams.path`、`.query` 均为可选 `Record<string, any>`。

`combineURLs(baseURL, relativeURL)` 去掉拼接处前后多余斜杠。相对 URL 为空时原样返回基础地址；第二个 URL 是绝对地址或协议相对地址时覆盖基础地址。`isAbsoluteURL` 识别可选 scheme 后跟 `//` 的形式，并不识别所有 URI scheme，例如不会把 `data:` 当作绝对地址。

查询值直接交给 `new URLSearchParams(record)`：数组转为逗号分隔字符串，对象转为字符串表示，null/undefined 不会省略。需要重复键或省略空值时先自行规范化。已有查询保留，新参数追加在 fragment 前；根据已有 `?`、结尾 `?`/`&` 选择分隔符。

## 模板解析器 {#templates}

| 公开 API                                                   | 行为                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `UrlTemplateStyle.UriTemplate`                             | 默认枚举值 0，使用 `{id}`。                                                                            |
| `UrlTemplateStyle.Express`                                 | 枚举值 1，匹配开头或 `/` 后的 `:id`。                                                                  |
| `getUrlTemplateResolver(style?)`                           | 仅 Express 枚举返回 Express，其余返回共享 URI 解析器。                                                 |
| `UriTemplateResolver`、`uriTemplateResolver`               | 实现 `UrlTemplateResolver` 的类与单例。                                                                |
| `ExpressUrlTemplateResolver`、`expressUrlTemplateResolver` | 对应冒号风格实现。                                                                                     |
| `extractPathParams(template)`                              | 按出现顺序返回参数名，保留重复。                                                                       |
| `resolve(template, pathParams?)`                           | 对每个值执行 `encodeURIComponent`。未传映射或为 null 时保留模板；传映射后缺失/undefined 值抛 `Error`。 |
| `urlTemplateRegexResolve(template, regex, params?)`        | 使用调用者提供的正则捕获组确定键名，执行同样的替换规则。                                               |
| `urlTemplateRegexExtract(template, regex)`                 | 循环调用 `regex.exec`，必须使用 global 正则以推进匹配。                                                |

存在的 null 值编码为 `'null'`，值内斜杠编码为 `%2F`。`UrlResolveInterceptor` 使用客户端构建器改写 `exchange.request.url`，随后清空 `request.urlParams` 避免重复解析。名称和顺序常量见[拦截器](./interceptors.md)。传入参数映射时，缺失模板参数在网络 I/O 前失败。

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

[包索引](./index.md)
