---
title: '程序化 API'
description: '程序化 API — Fetcher 5.0.0'
---

# 程序化 API

::: warning 仅适用于 5.x
本页只适用于 5.x 线（npm 5.1.x，分支 [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)）。从 6.0 起，`@ahoo-wang/fetcher-generator` 位于 Wow 仓库（[`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)），文档见 [wow.ahoo.me](https://wow.ahoo.me)；它在 Wow 仓库的后继包尚未发布到 npm，随 Wow 首个稳定版发布。
:::

包根恰好导出 `CodeGenerator` 与 `DEFAULT_CONFIG_PATH`。可执行文件单独通过 `fetcher-generator` binary 暴露。不要从包根或未公开子路径导入内部 AggregateResolver、ModelGenerator、GenerateContext、ConsoleLogger、setupCLI、解析辅助函数或内部选项类型。

## CodeGenerator

| 成员                             | 参数/默认值                                                                                                          | 返回与效果                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `constructor(options)`           | 必填 inputPath:string、outputDir:string、logger；可选 configPath 及 ts-morph ProjectOptions（包括 tsConfigFilePath） | 同步创建内部 Project；项目选项无效可能抛错                                                  |
| `generate()`                     | 无参数                                                                                                               | Promise&lt;void&gt;；加载规范/配置、解析聚合、写模型/客户端/index、格式化并保存其拥有的输出 |
| `generateIndex(directory)`       | 必填 ts-morph Directory                                                                                              | void；递归创建/替换内部项目中的 index.ts 导出，本身不保存                                   |
| `optimizeSourceFiles(directory)` | 必填 Directory                                                                                                       | void；格式化、整理/修复 import；生成期间只处理记录的生成文件，本身不保存                    |
| `DEFAULT_CONFIG_PATH`            | 常量                                                                                                                 | `./fetcher-generator.config.json`                                                           |

内部 Project 是 private。后两个方法是接受 Directory 的公开编排辅助方法，不是独立持久化 API。通常应用应调用 generate()。没有 close/dispose、取消信号、watch 或结构化诊断返回值。同一实例/输出目录不要并发调用 generate()，没有锁定契约。

## 完整脚本

logger 必须实现全部五个方法。`ConstructorParameters` 能获得支持的选项形状，无需导入未导出的类型名。

```ts
import { CodeGenerator } from '@ahoo-wang/fetcher-generator';

type Options = ConstructorParameters<typeof CodeGenerator>[0];
const logger: Options['logger'] = {
  info: console.log,
  success: console.log,
  error: console.error,
  progress: (message, level = 0) => console.log(level, message),
  progressWithCount: (current, total, message) =>
    console.log(current, total, message),
};
const generator = new CodeGenerator({
  inputPath: './openapi.json',
  outputDir: './src/generated',
  tsConfigFilePath: './tsconfig.json',
  logger,
});
try {
  await generator.generate();
} catch (error) {
  console.error('Generation failed', error);
  process.exitCode = 1;
}
```

<span id="default_config_path"></span>

**`DEFAULT_CONFIG_PATH`** — [packages/generator/src/index.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/5.x/packages/generator/src/index.ts#L35)

<span id="codegenerator-api"></span>

**`CodeGenerator`** — [packages/generator/src/index.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/5.x/packages/generator/src/index.ts#L53)
