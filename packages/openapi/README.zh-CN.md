# `@ahoo-wang/fetcher-openapi`

OpenAPI 3.x 文档的 TypeScript 类型。这是纯类型包：不增加运行时代码，也不解析、校验
或生成客户端。

## 安装

```bash
pnpm add -D @ahoo-wang/fetcher-openapi
```

没有 peer 或运行时依赖。

## 示例

```ts
import type { OpenAPI, Schema } from '@ahoo-wang/fetcher-openapi';

export function documentTitle(document: OpenAPI): string {
  return document.info.title;
}

export const identifier: Schema = {
  type: 'string',
  format: 'uuid',
};
```

## 核心能力

- 根文档、信息、服务器、路径与操作类型。
- 参数、请求体、响应、媒体类型与请求头。
- Components、引用、Schema、Discriminator 与 XML 元数据。
- 安全方案、OAuth flows、Tags 与 `x-*` 扩展。

把不可信文档作为类型化 OpenAPI 数据前，必须先完成运行时校验。

## 文档

- [生成客户端](https://fetcher.ahoo.me/zh/recipes/openapi-client)
- [OpenAPI 参考](https://fetcher.ahoo.me/zh/reference/openapi)

[English](./README.md) · [许可证](../../LICENSE)
