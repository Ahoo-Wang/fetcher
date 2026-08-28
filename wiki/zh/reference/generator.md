---
title: Generator 参考
description: 从 OpenAPI JSON 或 YAML 文档生成 TypeScript 模型以及 Fetcher 或 Wow 客户端。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-generator`

从本地或远程 OpenAPI 文档生成 TypeScript Model、普通 Decorator API Client，以及可识别的 Wow Command/Query Client。Generator 拥有输出树：手写代码放在输出目录外，契约变更后重新生成。

## 安装与运行

```bash
pnpm add -D @ahoo-wang/fetcher-generator
pnpm exec fetcher-generator generate \
  --input ./openapi.yaml \
  --output ./src/generated \
  --ts-config-file-path ./tsconfig.json
```

该包要求 Node.js `>=18.20.8`。生成结果可按源契约导入 Fetcher、Decorator、EventStream、OpenAPI 与 Wow 包；安装生成文件实际导入的运行时包（[`package.json:30`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/package.json#L30)、[`package.json:61`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/package.json#L61)）。

## CLI 契约

`fetcher-generator` 只有一个 `generate` 命令。输入接受文件路径或 HTTP(S) URL；不支持的 URL Protocol 以及被阻止的私网/Link-local 远程地址以 `2` 退出。`SIGINT` 以 `130` 退出，生成错误以 `1` 退出（[`clis.ts:90`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L90)、[`clis.ts:123`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L123)）。

| 选项 | 必填 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `-i, --input <file>` | 是 | — | 本地 OpenAPI 文件或通过输入 Guard 的 HTTP(S) URL。 |
| `-o, --output <path>` | 否 | `src/generated` | 生成根目录。 |
| `-c, --config <file>` | 否 | `./fetcher-generator.config.json` | JSON 或 YAML 配置路径。 |
| `-t, --ts-config-file-path <file>` | 否 | ts-morph 默认值 | TypeScript Project 配置路径。 |
| `-v, --version` | 否 | — | 输出包版本。 |

以上是完整已声明的命令选项（[`cli.ts:17`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/cli.ts#L17)）。

## 配置与优先级

CLI 将 `--config` 传给 `CodeGenerator`；未传入时，`DEFAULT_CONFIG_PATH` 为 `./fetcher-generator.config.json`。配置解析/加载失败会记录日志，并以 `{}` 继续生成（[`index.ts:27`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L27)、[`index.ts:99`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L99)）。

```json
{
  "apiClients": {
    "Catalog": {
      "ignorePathParameters": ["tenantId", "ownerId"]
    }
  }
}
```

| 设置 | 作用范围 | 默认值 / 优先级 |
| --- | --- | --- |
| `apiClients.<tag>.ignorePathParameters` | 该精确 Tag 的普通 API Client | Tag 数组替换默认值。 |
| 无 Tag 配置 | 普通 API Client | 忽略 `tenantId`、`ownerId`。 |
| Command Client | Wow Command Client | 始终忽略 `tenantId`、`ownerId`；`apiClients` 不覆盖它。 |
| 配置缺失或无效 | 整次运行 | 记录解析失败，随后使用空配置。 |

Parser 按内容而非扩展名推断 JSON/YAML（[`parsers.ts:25`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/parsers.ts#L25)）；参数行为实现于 [`generateContext.ts:53`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/generateContext.ts#L53)。

## 输出与流水线

真实运行 `test/demo.spec.json` 的输出形状如下（名称由文档中的 Context 与 Aggregate Tag 决定）：

```text
src/generated/
├── index.ts
└── example/
    ├── boundedContext.ts
    ├── CartApiClient.ts
    ├── OrderApiClient.ts
    ├── types.ts
    ├── index.ts
    ├── cart/{commandClient,queryClient,types,index}.ts
    └── order/{commandClient,queryClient,types,index}.ts
```

1. 读取本地或远程文本，解析 JSON 或 YAML。
2. 从根 Tag 与 Operation 解析 Aggregate 定义。
3. 加载可选配置。
4. 生成 Model、普通 API Client 与识别出的 Wow Client。
5. 为每个非空生成目录创建 `index.ts`。
6. 格式化 Import/源码，并保存 ts-morph Project。

顺序定义于 [`CodeGenerator.generate():80`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L80)；递归索引生成会排除已有 `index.ts` 并重写生成索引（[`index.ts:187`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L187)）。

## 程序化 API

包根只导出 `CodeGenerator` 与 `DEFAULT_CONFIG_PATH`（[`index.ts:27`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L27)）。`GeneratorOptions`、`Logger`、Parser、Resolver 都是源码内部模块：不要将其作为包根 API 导入。

```ts
import { CodeGenerator } from '@ahoo-wang/fetcher-generator';

const logger = {
  info: console.info,
  success: console.info,
  error: console.error,
  progress: console.info,
  progressWithCount: console.info,
};

await new CodeGenerator({
  inputPath: './openapi.yaml',
  outputDir: './src/generated',
  tsConfigFilePath: './tsconfig.json',
  logger,
}).generate();
```

构造函数要求输入/输出路径与 Logger，此外接受 ts-morph Project Options 及可选 `configPath`；保存后 `generate()` resolve 为 `void`（[`types.ts:21`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/types.ts#L21)、[`index.ts:54`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L54)）。

## Wow 发现矩阵

| 生成关注点 | 必需文档证据 |
| --- | --- |
| Aggregate 候选 | 根级 Tag 必须恰为 `contextAlias.aggregateName`。 |
| Command | 三段式 `operationId`、非 `wow.command.send` Operation、`#/components/responses/wow.CommandOk` 的 `$ref` Response，以及内联 JSON Request Body Reference。 |
| Single Snapshot State | `operationId` 以 `.snapshot_state.single` 结尾，且 OK JSON Schema 为 Reference。 |
| Query Fields | `operationId` 以 `.snapshot.count` 结尾；Request Body 提供 Schema Reference 类型的 `x-wow-query-fields`，或旧格式 `content.application/json.schema.properties.field` Reference。 |
| 完整 Wow Aggregate | 同时有 State 和 Fields 结果；否则从已解析 Aggregate 排除。 |
| 普通 API Client | 未被 Aggregate/Actuator/wow Filter 接管的带 Tag Operation。 |

Command 只附加到匹配的 Operation Tag；State 或 Fields 不完整时，Aggregate 会从已解析结果排除（[`aggregateResolver.ts:85`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L85)、[`aggregateResolver.ts:110`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L110)、[`aggregateResolver.ts:261`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L261)）。

## 可复现故障定位

```bash
pnpm --filter @ahoo-wang/fetcher-generator build
cd packages/generator
node dist/cli.js generate \
  -i test/demo.spec.json \
  -o /tmp/fetcher-reference-generator-check \
  -t tsconfig.json
find /tmp/fetcher-reference-generator-check -type f -print -quit
```

| 现象 | 检查 |
| --- | --- |
| `Invalid input` / 退出 `2` | 使用非空本地路径或通过 Guard 的 HTTP(S) URL；私网/Link-local 远程地址会被拒绝。 |
| `Configuration file parsing failed` | 仅在确实不需要配置时无害；否则用 `-c` 传入可读 JSON/YAML。 |
| Parse/Generation Error / 退出 `1` | 检查输入内容、Path/URL 可达性与传入的 TypeScript 配置。 |
| 退出 `0` 但缺少 Wow Client | 按发现矩阵检查、查看生成树和日志；缺少 State 或 Fields 会排除 Aggregate。 |
| 生成代码无法在应用中编译 | 传入消费方 `tsconfig` 并安装生成文件导入的包。 |

仓库 E2E Test 使用该 Fixture，并同时断言 API 与 Wow Command 输出（[`e2e.test.ts:125`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/test/e2e.test.ts#L125)）。

## 源码参考

- [CLI：`packages/generator/src/cli.ts:17`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/cli.ts#L17)
- [公共 API/流水线：`packages/generator/src/index.ts:27`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L27)
- [配置：`packages/generator/src/types.ts:21`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/types.ts#L21)
- [输入/退出状态：`packages/generator/src/utils/clis.ts:90`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L90)
- [Wow Resolver：`packages/generator/src/aggregate/aggregateResolver.ts:52`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L52)
