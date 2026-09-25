---
title: 'Parameter binding'
description: 'Parameter binding — @ahoo-wang/fetcher-decorator 5.0.0'
---

# Parameter binding

Parameter decorators bind arguments by index, not by their declared TypeScript type. Explicit names survive minification and are the reliable choice for path/query/header fields.

## Binding matrix {#bindings}

`parameter(type: ParameterType, name = '')` returns a legacy method-parameter decorator. `ParameterMetadata` stores `type`, optional `name`, `index`, and optional `explicit` (whether the name was given to the decorator rather than inferred); `PARAMETER_METADATA_KEY` is the Symbol used on the target/property.

Arguments are bound by shape. Only a plain object (an object literal or `Object.create(null)`) is spread into its keys; any other value, including an array, a `Date` or a class instance, is bound to the parameter's name (explicit, else inferred, else `param${index}`) and serialized by fetcher.

| Factory / ParameterType            | Other argument (scalar, array, `Date`, instance)                                                     | Plain object argument                                         | Nullish behavior                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `path(name = '')` / PATH           | Bind to the parameter name                                                                           | Spread entries, ignoring provided name                        | Skip a null/undefined argument or entry                                         |
| `query(name = '')` / QUERY         | Bind to the parameter name; an array repeats the key (`ids=1&ids=2`), a `Date` is sent as ISO 8601   | Spread entries                                                | Skip a null/undefined argument or entry                                         |
| `header(name = '')` / HEADER       | Set the header named after the parameter; an array is joined with `, `, a `Date` is sent as ISO 8601 | Set one header per entry, case-insensitively                  | Skip entire null/undefined argument; a null/undefined entry deletes that header |
| `body()` / BODY                    | Whole request body                                                                                   | Whole request body                                            | Assigned as supplied before request merging                                     |
| `request()` / REQUEST              | Expect `ParameterRequest`                                                                            | Merge into resolved request last                              | Falsy argument becomes empty request                                            |
| `attribute(name = '')` / ATTRIBUTE | Stored under the parameter name                                                                      | Explicit name: stored whole under it; unnamed: entries merged | Undefined is skipped; null is stored like any other value                       |

An explicitly named `@attribute('user')` stores its value under `user` whatever it is. An unnamed `@attribute()` merges a `Map` or plain object entry by entry and stores anything else under the inferred name.

Arguments are processed left-to-right; later bindings win. Body and request bindings are single selected values, so the last such parameter wins rather than merging multiple request arguments. Unannotated ordinary arguments are ignored.

`ParameterRequest<BODY>` extends `FetchRequestInit<BODY>` and `PathCapable`. Its `path` changes the endpoint path; use `urlParams.path` for replacement values. It can override method, headers, body, timeout, signal, and native Fetch fields, following [mergeRequest](../fetcher/requests.md#merge), including its nullish fallback rules. An empty-string parameter path does not override a nonempty endpoint path.

The replacement method receives only the actual argument list; default parameter expressions in the original placeholder method do not execute. Pass defaults explicitly or configure `urlParams` metadata.

## Names and reflection {#names}

`getParameterNames(func): string[]` parses `Function.toString()`, caches by function in a WeakMap, and returns an empty array on parsing failure; non-functions throw TypeError before parsing. It splits on top-level commas (commas and brackets inside defaults, strings and comments do not split) and strips annotations and defaults. A destructured parameter yields `''`, which keeps later names at their index; a rest parameter yields its name without `...`. Minified names are not a stable naming contract.

`getParameterName(target, propertyKey, index, providedName?)` returns a truthy explicit name first, then an inferred name, otherwise undefined (a destructured parameter has no inferred name). Bound values without a resolved name fall back to `param${index}`. A path-template placeholder, read in the fetcher's `urlTemplateStyle`, that has no path parameter once every layer (`@request` included) is merged logs a warning; resolving the URL then fails with `Missing required path parameter` unless an interceptor supplies it.

## Cancellation and inherited metadata {#cancellation}

An `AbortSignal` or `AbortController` argument is recognized before decorator metadata, even without a decorator. If multiple are supplied the last of each kind wins; a request parameter can override them. A signal or controller applies together with the Fetcher timeout, whichever fires first, as described in [cancellation](../fetcher/errors-and-cancellation.md).

Parameter metadata uses copy-on-write when inherited, so decorating an override does not mutate the parent's Map. An override without its own endpoint decorator keeps its own implementation; `@api` does not replace it with the parent's request. Class binding walks inherited string-named methods. Symbol-named methods and static methods are not part of that binding traversal. Keep explicit parameter names on inherited/overridden endpoints too.

## Complete example {#example}

```ts
import {
  api,
  post,
  path,
  query,
  body,
  request,
  autoGeneratedError,
  type ParameterRequest,
} from '@ahoo-wang/fetcher-decorator';

type User = { id: string; name: string };
@api('/users')
class Users {
  @post('/{id}')
  update(
    @path('id') id: string,
    @query('notify') notify: boolean,
    @body() value: { name: string },
    @request() options?: ParameterRequest,
    signal?: AbortSignal,
  ): Promise<User> {
    throw autoGeneratedError(id, notify, value, options, signal);
  }
}
const users = new Users();
async function updateUser() {
  const controller = new AbortController();
  return users.update(
    '1',
    true,
    { name: 'Ada' },
    { headers: { 'X-Trace-Id': 'demo' } },
    controller.signal,
  );
}
void updateUser;
```

## Public symbols and source {#symbols}

| Symbol                                                      | Implementation                                                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| <a id="parametertype"></a>`ParameterType`                   | [parameterDecorator.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L19)   |
| <a id="parametermetadata"></a>`ParameterMetadata`           | [parameterDecorator.ts:136](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L136) |
| <a id="parameter_metadata_key"></a>`PARAMETER_METADATA_KEY` | [parameterDecorator.ts:168](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L168) |
| <a id="parameter"></a>`parameter`                           | [parameterDecorator.ts:206](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L206) |
| <a id="path"></a>`path`                                     | [parameterDecorator.ts:273](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L273) |
| <a id="query"></a>`query`                                   | [parameterDecorator.ts:305](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L305) |
| <a id="header"></a>`header`                                 | [parameterDecorator.ts:337](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L337) |
| <a id="body"></a>`body`                                     | [parameterDecorator.ts:355](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L355) |
| <a id="parameterrequest"></a>`ParameterRequest`             | [parameterDecorator.ts:367](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L367) |
| <a id="request"></a>`request`                               | [parameterDecorator.ts:387](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L387) |
| <a id="attribute"></a>`attribute`                           | [parameterDecorator.ts:423](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L423) |
| <a id="getparameternames"></a>`getParameterNames`           | [reflection.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L51)                   |
| <a id="getparametername"></a>`getParameterName`             | [reflection.ts:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L97)                   |

[Package index](./index.md)
