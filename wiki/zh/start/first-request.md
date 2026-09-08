---
title: 第一个请求
description: 运行类型化 JSON 请求，并验证 HTTP 404 失败分支。
---

# 第一个请求

先完成[安装](./installation.md)，再在 `fetcher-first-request` 目录中创建以下文件。

## 创建 `server.mjs`

<<< @/examples/http/server.mjs

## 创建 `client.ts`

<<< @/examples/http/client.ts

泛型描述预期的 TypeScript 结构，但不校验服务端数据。本例通过明确检查 id 与 name 建立运行时边界。`ResultExtractors.Json` 放在 `get` 的第三个参数中，这里才是请求选项的位置。

404 对外表现为 `ExchangeError`，其 `cause` 是 `HttpStatusValidationError`，`exchange.response.status` 保留 `404`。传输和解析失败不会命中该分支，因此会继续抛出。

## 创建 `tsconfig.json`

<<< @/examples/http/tsconfig.json

## 编译并运行

启动确定性的本地 fixture：

```bash
pnpm exec tsc -p tsconfig.json
node server.mjs
```

在同一目录的另一个终端执行：

```bash
node dist/client.js
```

客户端会验证固定用户与 404 分支，然后输出：

```text
Ada
```

在服务端终端按 `Ctrl+C` 停止服务。若服务未启动，客户端会因为传输错误继续抛出而非零退出。

仓库维护者可参阅[仓库 HTTP 样例](../examples/http.md)中的专用验证命令。
