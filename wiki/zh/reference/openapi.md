---
title: OpenAPI 参考
description: 为 OpenAPI 文档和扩展提供类型，而不增加运行时代码。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openapi`

这是 OpenAPI 3.x 文档的纯类型包。它没有运行时依赖，也不负责解析、校验或生成代码。

## 安装

```bash
pnpm add -D @ahoo-wang/fetcher-openapi
```

## 为文档提供类型

```ts
import type { OpenAPI, Operation, Schema } from '@ahoo-wang/fetcher-openapi';

export function operationIds(document: OpenAPI): string[] {
  return Object.values(document.paths).flatMap(pathItem =>
    Object.values(pathItem ?? {})
      .filter((value): value is Operation => typeof value === 'object')
      .flatMap(operation => operation.operationId ?? []),
  );
}

export const pageSchema: Schema = {
  type: 'object',
  properties: {
    total: { type: 'integer', format: 'int64' },
  },
};
```

## 导出分组

| 分组 | 代表类型                                                 |
| ---- | -------------------------------------------------------- |
| 文档 | `OpenAPI`、`Info`、`Tag`、`Server`                       |
| 路径 | `Paths`、`PathItem`、`Operation`                         |
| 输入 | `Parameter`、`RequestBody`、`MediaType`                  |
| 输出 | `Responses`、`Response`、`Header`、`Link`                |
| 模型 | `Schema`、`Discriminator`、`XML`                         |
| 复用 | `Components`、`Reference`                                |
| 安全 | `SecurityScheme`、`SecurityRequirement`、OAuth flow 类型 |
| 扩展 | `Extensible` 与 `x-*` 扩展支持                           |

## 文档契约

### Reference 与可复用 Component

在 OpenAPI 允许 `$ref` 的位置使用 `Reference`，把可复用的 Schema、Response、
Parameter、Request Body、Header、Security、Example、Link 和 Callback 放入
`Components`。Reference 只标识另一个文档节点；该包不会在运行时解引用。

### Schema 家族

| Schema 类型 | 重要字段                                               |
| ----------- | ------------------------------------------------------ |
| Primitive   | `type`、`format`、`enum`、`default`、数值或字符串约束  |
| Array       | `items`、长度约束、唯一性                              |
| Object      | `properties`、`required`、`additionalProperties`、组合 |
| Composition | `allOf`、`oneOf`、`anyOf`、`not`、`discriminator`      |

Operation 类型在一个 Path 与 HTTP Method 下连接 Parameter、Request Body、Response、
Callback、Security、Tag 和 Vendor Extension。

## 扩展与校验边界

`Extensible` 允许 `x-*` 属性，而不会放宽所有已知字段。转换文档时保留扩展；Generator
可能把它们作为契约使用。TypeScript 赋值只检查编译期形状，不能证明加载的 YAML 或
JSON 是合法 OpenAPI。

## 源码与 Agent 参考

- 公共导出：[`packages/openapi/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts)
- Agent 精确 API：[`skills/fetcher-openapi-types/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-types/references/api.md)
- Skill：[`$fetcher-openapi-types`](../skills/openapi-and-generation.md#fetcher-openapi-types)

使用 `import type`，让该包从生成的 JavaScript 中消失。这些接口只描述文档形状；不可信
JSON 或 YAML 必须先经专用校验器校验，才能作为 `OpenAPI` 对象使用。

目标是生成客户端代码时，请使用 [Generator 参考](./generator.md)。
