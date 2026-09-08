---
prev: false
title: 'Openapi 参考'
description: 'Openapi 参考 — Fetcher 5.0.0'
---

# Openapi 参考

用于编写规范和生成器输入的静态 OpenAPI 文档类型。不包含运行时解析器、校验器、客户端或引用解析器。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-openapi
```

版本 **5.0.0** 对消费者声明 Node **>=18.20.8**；仓库开发另需 Node **>=20.20.2** 和 pnpm **10.34.5**。

## 最小示例

```ts
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';
const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Example', version: '1' },
  paths: {},
};
console.log(document.openapi);
```

## 选择入口

编写完整文档时导入 `OpenAPI`，描述可复用载荷时用 `Schema`/`Reference`，描述文档安全元数据时用安全类型。这些仅是类型，没有可调用的解析器、HTTP 客户端或校验器。生成可执行客户端请用 [Generator](../generator/index.md)。

## 专题

- [文档与操作](documents-and-operations)
- [Schema 与引用](schemas-and-references)
- [安全与扩展](security-and-extensions)

[完整公开符号索引](./symbols.md)
