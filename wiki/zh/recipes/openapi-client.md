---
title: 生成 OpenAPI 客户端
description: 根据本地或远程 OpenAPI 文档生成 Fetcher TypeScript 模型与客户端。
---

# 生成 OpenAPI 客户端

OpenAPI 已经是源契约时使用生成器。生成代码应该可重复生成，不应手工编辑。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator
pnpm add -D @ahoo-wang/fetcher-generator
```

## 生成

```bash
pnpm exec fetcher-generator generate \
  -i ./openapi.yaml \
  -o ./src/generated \
  -t ./tsconfig.json
```

输入可以是本地 JSON/YAML 文件，也可以是 HTTP/HTTPS URL。默认输出为 `src/generated`；显式提供路径能让 CI 与本地执行保持一致。

## 配置

可选配置参数为：

```bash
-c ./fetcher-generator.config.json
```

不提供 `-c` 时，生成器查找 `./fetcher-generator.config.json`。`Configuration file parsing failed: ENOENT` 表示缺少可选配置，生成器会使用空配置继续执行。

## 使用生成代码

生成目录包含根据文档生成的模型、客户端和 Index 文件。通过生成的 Index 导入，不要依赖生成器内部路径：

```ts
import { UserApiClient, type User } from './generated';

const client = new UserApiClient();
const user: User = await client.getUser('42');
```

具体名称由 OpenAPI operationId 和 Schema 决定。首次生成后先检查 Index，再编写应用导入。

## 安全地重新生成

1. 将 OpenAPI 文档或稳定的源 URL 放进版本控制/配置。
2. 始终生成到同一个目录。
3. 格式化并类型检查结果。
4. 审查 Operation/Schema 重命名产生的 Diff。
5. 不要在生成目录编写自定义应用代码。

## 定位失败

- 输入文档错误：检查 `-i`，远程输入还要检查网络访问。
- TypeScript Project 初始化错误：检查 `-t` 是否指向现有 tsconfig。
- 缺少预期客户端：检查 operationId、Tag、响应 Schema 和生成器发现规则。
- 生成成功不等于远程服务实现了文档，仍需单独做生成客户端集成测试。

运行 `pnpm exec fetcher-generator generate --help` 查看当前 CLI 契约。
