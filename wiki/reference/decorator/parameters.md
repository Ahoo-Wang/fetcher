---
title: 'Parameter binding'
description: 'Parameter binding — @ahoo-wang/fetcher-decorator 5.0.0'
---

# Parameter binding

Parameter decorators bind arguments by index, not by their declared TypeScript type. Explicit names survive minification and are the reliable choice for path/query/header fields.

## Binding matrix {#bindings}

`parameter(type: ParameterType, name = '')` returns a legacy method-parameter decorator. `ParameterMetadata` stores `type`, optional `name`, `index`, and optional `explicit` (whether the name was given to the decorator rather than inferred); `PARAMETER_METADATA_KEY` is the Symbol used on the target/property.

Arguments are bound by shape. Only a plain object (an object literal, parsed JSON or `Object.create(null)`, from any realm, a same-origin iframe's included; see fetcher's [`isPlainObject`](../fetcher/requests.md#realm)) is spread into its keys, each set as an own field, so a `__proto__` key or name is sent like any other; any other value, including an array, a `Date` or a class instance, is bound to the parameter's name (explicit, else inferred, else `param${index}`) and serialized by fetcher.

| Factory / ParameterType            | Other argument (scalar, array, `Date`, instance)                                                     | Plain object argument                                         | Nullish behavior                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `path(name = '')` / PATH           | Bind to the parameter name                                                                           | Spread entries, ignoring provided name                        | Skip a null/undefined argument or entry                                                                     |
| `query(name = '')` / QUERY         | Bind to the parameter name; an array repeats the key (`ids=1&ids=2`), a `Date` is sent as ISO 8601   | Spread entries                                                | Skip a null/undefined argument or entry                                                                     |
| `header(name = '')` / HEADER       | Set the header named after the parameter; an array is joined with `, `, a `Date` is sent as ISO 8601 | Set one header per entry, case-insensitively                  | Skip entire null/undefined argument; a null/undefined entry deletes that header, a Fetcher default included |
| `body()` / BODY                    | Whole request body                                                                                   | Whole request body                                            | Assigned as supplied before request merging                                                                 |
| `request()` / REQUEST              | Expect `ParameterRequest`                                                                            | Merge into resolved request last                              | Falsy argument becomes empty request                                                                        |
| `attribute(name = '')` / ATTRIBUTE | Stored under the parameter name                                                                      | Explicit name: stored whole under it; unnamed: entries merged | Undefined is skipped; null is stored like any other value                                                   |

An explicitly named `@attribute('user')` stores its value under `user` whatever it is. An unnamed `@attribute()` merges a `Map` or plain object entry by entry and stores anything else under the inferred name.

Arguments are processed left-to-right; later bindings win. Body and request bindings are single selected values, so the last such parameter wins rather than merging multiple request arguments. Unannotated ordinary arguments are ignored.

`ParameterRequest<BODY>` extends `FetchRequestInit<BODY>` and `PathCapable`. Its `path` changes the endpoint path; use `urlParams.path` for replacement values. It can override method, headers, body, timeout, signal, and native Fetch fields, following [mergeRequest](../fetcher/requests.md#merge), including its nullish fallback rules. An empty-string parameter path does not override a nonempty endpoint path.

The replacement method receives only the actual argument list; default parameter expressions in the original placeholder method do not execute. Pass defaults explicitly or configure `urlParams` metadata.

## Names and reflection {#names}

`getParameterNames(func): string[]` parses `Function.toString()`, caches by function in a WeakMap, and returns an empty array on parsing failure; non-functions throw TypeError before parsing. Only the signature is read, never the body; an arrow whose lone parameter has no parentheses (`value => value`, `async value => …`) is read too. It splits on top-level commas (commas and brackets inside defaults, strings, template and regular expression literals, and comments do not split; a `/` after an operand is read as division) and strips annotations and defaults. Names follow the ECMAScript identifier rules, so a Unicode name such as `搜索` or `café` is kept whole and a `\u` escape is decoded. A destructured parameter yields `''`, which keeps later names at their index; a rest parameter yields its name without `...`. Minified names are not a stable naming contract.

`getParameterName(target, propertyKey, index, providedName?)` returns a truthy explicit name first, then an inferred name, otherwise undefined (a destructured parameter has no inferred name). Bound values without a resolved name fall back to `param${index}`. An unnamed `@path()` whose inferred name matches no placeholder of the path template (read in the fetcher's `urlTemplateStyle`) logs a warning once per endpoint: that is what a minifier renaming the parameter looks like. A plain-object argument (spread into its keys) does not warn. Placeholders with no parameter are not reported, since an interceptor may fill them (cosec fills `{tenantId}`/`{ownerId}`); if nothing does, resolving the URL fails with `Missing required path parameter`.

## Cancellation and inherited metadata {#cancellation}

An `AbortSignal` or `AbortController` argument, from any realm (a same-origin iframe's included), is recognized before decorator metadata, even without a decorator. If multiple are supplied the last of each kind wins; a request parameter can override them. A signal or controller applies together with the Fetcher timeout, whichever fires first, as described in [cancellation](../fetcher/errors-and-cancellation.md).

Parameter metadata uses copy-on-write when inherited, so decorating an override does not mutate the parent's Map. An override without its own endpoint decorator keeps its own implementation, and so do the subclasses that inherit it; `@api` does not replace it with the parent's request. Class binding walks inherited string- and symbol-named methods. Static methods are not part of that binding traversal. Keep explicit parameter names on inherited/overridden endpoints too.

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
| <a id="parameter_metadata_key"></a>`PARAMETER_METADATA_KEY` | [parameterDecorator.ts:172](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L172) |
| <a id="parameter"></a>`parameter`                           | [parameterDecorator.ts:212](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L212) |
| <a id="path"></a>`path`                                     | [parameterDecorator.ts:279](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L279) |
| <a id="query"></a>`query`                                   | [parameterDecorator.ts:311](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L311) |
| <a id="header"></a>`header`                                 | [parameterDecorator.ts:343](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L343) |
| <a id="body"></a>`body`                                     | [parameterDecorator.ts:361](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L361) |
| <a id="parameterrequest"></a>`ParameterRequest`             | [parameterDecorator.ts:373](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L373) |
| <a id="request"></a>`request`                               | [parameterDecorator.ts:393](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L393) |
| <a id="attribute"></a>`attribute`                           | [parameterDecorator.ts:429](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/parameterDecorator.ts#L429) |
| <a id="getparameternames"></a>`getParameterNames`           | [reflection.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L55)                   |
| <a id="getparametername"></a>`getParameterName`             | [reflection.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/reflection.ts#L101)                 |

[Package index](./index.md)
