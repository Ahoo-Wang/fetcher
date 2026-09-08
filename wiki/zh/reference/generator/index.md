---
title: 'Generator 参考'
description: 'Generator 参考 — Fetcher 5.0.0'
---

# Generator 参考

从 OpenAPI 文档生成 TypeScript 模型和装饰器客户端，可识别 Wow CQRS。包根仅导出 CodeGenerator、DEFAULT_CONFIG_PATH。

## 安装

```bash
pnpm add -D @ahoo-wang/fetcher-generator
```

版本基线：**5.0.0**。本包声明 Node **>=18.20.8**；仓库贡献者工具链另行规定。按所选运行时集成安装需要的 peer 包。

## 最小示例

```bash
pnpm exec fetcher-generator generate -i ./openapi.json -o ./src/generated -t ./tsconfig.json
```

## 专题

- [生成器 CLI](/zh/reference/generator/cli)
- [生成器配置](/zh/reference/generator/configuration)
- [程序化 API](/zh/reference/generator/programmatic-api)
- [生成产物与重新生成](/zh/reference/generator/generated-output)
- [Wow 聚合识别](/zh/reference/generator/wow-discovery)

## 公开符号索引

| 符号                  | 参考                                                 |
| --------------------- | ---------------------------------------------------- |
| `CodeGenerator`       | [程序化 API](/zh/reference/generator/programmatic-api#codegenerator-api)   |
| `DEFAULT_CONFIG_PATH` | [程序化 API](/zh/reference/generator/programmatic-api#default_config_path) |

[packages/generator/src/index.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L35)
