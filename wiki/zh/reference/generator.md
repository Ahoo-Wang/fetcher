---
title: Generator 参考
description: 从本地或远程 OpenAPI 文档生成 Fetcher 和 Wow TypeScript 客户端。
pageClass: reference-page
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

## 生成流水线

1. 解析本地文件或远程 OpenAPI 文档。
2. 根据文档契约解析 Bounded Context 与 Aggregate。
3. 加载可选 Generator 配置。
4. 生成 Model、普通 API Client 和发现到的 Wow Client。
5. 递归创建 `index.ts` 导出。
6. 整理、格式化并保存 TypeScript Project。

Generator 拥有输出目录。把手写 Adapter 放在目录外，让重新生成可以直接替换生成文件，
无需合并策略。

## Wow 发现契约

| Client               | 必需的 OpenAPI 证据                                                        |
| -------------------- | -------------------------------------------------------------------------- |
| Command              | 根级 Aggregate Tag、内联 Request Body，以及引用 `wow.CommandOk` 的成功响应 |
| Single Snapshot      | 匹配 `.snapshot_state.single` 的 Operation                                 |
| Count                | 匹配 `.snapshot.count` 的 Operation                                        |
| Query 与 Aggregation | Resolver 可识别的 Wow Snapshot 路由与响应形状                              |
| 普通 API             | 未被 Wow 专用 Resolver 接管的 Tagged Operation                             |

缺少任一 Marker 时，Operation 可能变成普通 API Method 或被跳过。检查生成目录与日志，
不要只根据进程退出判断成功。

## 程序化 API 与失败

`new CodeGenerator(options).generate()` 向构建工具暴露同一流水线。构造参数对象包含
`inputPath`、`outputDir`、`tsConfigFilePath`、可选 `configPath` 和 Logger。内部的
`GeneratorOptions` 名称没有从包根导出；消费者应依赖构造函数推断的结构类型，而不是
导入该名称。

输入无效、TypeScript 配置不可读或模型生成失败会拒绝生成。默认
`fetcher-generator.config.json` 不存在时只记录日志并以 `{}` 继续；仅当项目确实不需要
Generator 配置时才把该消息视为无害。

## 源码与 Agent 参考

- 公共导出：[`packages/generator/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts)
- Agent 精确 API：[`skills/fetcher-openapi-generator/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-generator/references/api.md)
- Skill：[`$fetcher-openapi-generator`](../skills/openapi-and-generation.md#fetcher-openapi-generator)

参阅[生成客户端](../recipes/openapi-client.md)，获取最小文档和可重复执行的包脚本。
