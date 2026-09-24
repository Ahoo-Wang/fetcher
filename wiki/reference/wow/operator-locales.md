---
title: 'Legacy operator locales'
description: 'Legacy operator locales — @ahoo-wang/fetcher-wow 5.0.0'
---

# Legacy operator locales

::: warning 5.x only
This page applies to the 5.x line only (npm 5.1.x, branch [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)). From 6.0, `@ahoo-wang/fetcher-wow` lives in the Wow repository ([`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)) and is documented at [wow.ahoo.me](https://wow.ahoo.me); its Wow-repository successor is not on npm yet and ships with Wow's first stable release.
:::

The two subpath exports are label dictionaries for the deprecated legacy `Condition` operators. They are not exported by the package root and do not change request serialization, server behavior or Viewer UI language. Each dictionary maps every `Operator` member to a string; there is no fallback language resolver or provider.

## en_US {#api-en_US}

```ts
import { en_US } from '@ahoo-wang/fetcher-wow/query/locale/en_US';
console.log(en_US.EQ); // Equals
```

[packages/wow/src/query/locale/en_US.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/5.x/packages/wow/src/query/locale/en_US.ts#L17)

## zh_CN {#api-zh_CN}

```ts
import { zh_CN } from '@ahoo-wang/fetcher-wow/query/locale/zh_CN';
console.log(zh_CN.EQ);
```

[packages/wow/src/query/locale/zh_CN.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/5.x/packages/wow/src/query/locale/zh_CN.ts#L17)

[Dictionary type OperatorLocale](./filters#api-OperatorLocale) · [Condition builders](./filters)

Both dictionaries are declared as `export const <locale>: OperatorLocale`. The full key set is defined by [Operator](./filters#api-Operator); values are display labels and do not modify condition semantics. Neither entry has a default export.
