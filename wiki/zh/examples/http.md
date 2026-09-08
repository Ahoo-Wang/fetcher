---
title: 可运行的 HTTP 样例
description: 运行本地确定性服务，验证 Fetcher 的成功结果与 HTTP 失败行为。
---

# 可运行的 HTTP 样例

本仓库样例不访问外部网络。fixture 对 `GET /users/1` 返回 `{ "id": 1, "name": "Ada" }`，对其他请求返回确定的 JSON 404。

## 服务端

<<< @/examples/http/server.mjs

## 客户端

<<< @/examples/http/client.ts

客户端在 `get` 的第三个参数中选择 JSON 提取器，并确认 `/missing` 会产生 `ExchangeError`：其 cause 为 `HttpStatusValidationError`，响应状态为 `404`；其他错误继续抛出。

## 在本仓库运行

在仓库根目录使用仓库规定的 Node `>=20.20.2` 与 pnpm `10.34.5`：

```bash
pnpm --filter @ahoo-wang/fetcher build
pnpm exec tsc -p wiki/examples/http/tsconfig.json
node wiki/examples/http/server.mjs
```

保持该终端运行。在另一个终端执行：

```bash
node wiki/examples/http/dist/client.js
```

预期输出：

```text
Ada
```

在服务端终端按 `Ctrl+C` 停止 fixture。要将样例复制到独立项目，请继续阅读[第一个请求](../start/first-request.md)。
