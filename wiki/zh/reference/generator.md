---
title: Generator 参考
description: 从本地或远程 OpenAPI 文档生成 Fetcher 和 Wow TypeScript 客户端。
---

# `@ahoo-wang/fetcher-generator`

Generator 把 OpenAPI JSON 或 YAML 文档转换为 TypeScript 模型、Decorator API
客户端，以及根据文档契约发现的 Wow 命令与查询客户端。

## 安装与运行

```bash
pnpm add -D @ahoo-wang/fetcher-generator
pnpm exec fetcher-generator generate \
  --input ./openapi.yaml \
  --output ./src/generated \
  --ts-config-file-path ./tsconfig.json
```

只有仓库明确审查生成代码差异时才提交生成结果；否则在 CI 或构建前生成，并把 OpenAPI
文档作为唯一事实来源。

## CLI 选项

| 选项                               | 必填 | 默认值                            |
| ---------------------------------- | ---- | --------------------------------- |
| `-i, --input <file>`               | 是   | 本地路径或 HTTP(S) URL            |
| `-o, --output <path>`              | 否   | `src/generated`                   |
| `-c, --config <file>`              | 否   | `./fetcher-generator.config.json` |
| `-t, --ts-config-file-path <file>` | 否   | ts-morph 项目默认值               |

传入应用的 `tsconfig.json`，让生成代码的导入和编译选项在实际消费环境中接受校验。

## 配置

```json
{
  "apiClients": {
    "Catalog": {
      "ignorePathParameters": ["tenantId", "ownerId"]
    }
  }
}
```

`apiClients` 把 OpenAPI tag 名映射到客户端配置。`ignorePathParameters` 默认包含
`tenantId` 和 `ownerId`。可选配置文件不存在时会记录日志，并使用默认值继续生成。

## 输出契约

Generator 会在发现的每个 bounded context 下生成模型与客户端，随后递归生成
`index.ts` 导出并格式化源码。生成的 API 客户端依赖对应 Fetcher 运行时包，因此应把
生成导入使用的包加入应用依赖。

Wow 发现规则中的后端 tags、响应引用、snapshot 路由和命令 request body 都是生成器
输入，而不是装饰性文档。每次契约变更后重新生成，并在发布前编译输出。

参阅[生成客户端](../recipes/openapi-client.md)，获取最小文档和可重复执行的包脚本。
