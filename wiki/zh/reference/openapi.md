---
title: OpenAPI 参考
description: 为 OpenAPI 文档和扩展提供类型，而不增加运行时代码。
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

使用 `import type`，让该包从生成的 JavaScript 中消失。这些接口只描述文档形状；不可信
JSON 或 YAML 必须先经专用校验器校验，才能作为 `OpenAPI` 对象使用。

目标是生成客户端代码时，请使用 [Generator 参考](./generator.md)。
