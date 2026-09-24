---
title: '旧条件操作符语言包'
description: '旧条件操作符语言包 — @ahoo-wang/fetcher-wow 5.0.0'
---

# 旧条件操作符语言包

::: warning 仅适用于 5.x
本页只适用于 5.x 线（npm 5.1.x，分支 [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)）。从 6.0 起，`@ahoo-wang/fetcher-wow` 位于 Wow 仓库（[`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)），文档见 [wow.ahoo.me](https://wow.ahoo.me)；它在 Wow 仓库的后继包尚未发布到 npm，随 Wow 首个稳定版发布。
:::

两个子路径导出是已弃用旧 `Condition` 操作符的标签字典，不从包根入口导出，不改变请求序列化、服务端行为或 Viewer UI 语言。每个字典把所有 `Operator` 成员映射为字符串；不提供回退语言解析器或 Provider。

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

[字典类型 OperatorLocale](./filters#api-OperatorLocale) · [条件构建器](./filters)

字典声明均为 `export const <语言名>: OperatorLocale`。完整键集合由 [Operator](./filters#api-Operator) 定义；每个值只用于展示，可读取但不会修改条件语义。两个入口没有默认导出。
