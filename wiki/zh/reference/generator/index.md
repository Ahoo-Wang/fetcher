---
prev: false
title: 'Generator 参考'
description: 'Generator 参考 — Fetcher 5.0.0'
---

# Generator 参考

从 OpenAPI 文档生成 TypeScript 模型和装饰器客户端，可识别 Wow CQRS。包根仅导出 CodeGenerator、DEFAULT_CONFIG_PATH。

## 安装

```bash
pnpm add -D @ahoo-wang/fetcher-generator @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-openapi @ahoo-wang/fetcher-wow typescript
```

版本 **5.0.0** 自身声明 Node **>=18.20.8**，但 CLI 依赖 commander 14 要求 Node **>=20**。此工具链使用 Node **>=20.20.2**；仓库开发另固定 pnpm **10.34.5**。命令包含全部递归 peer（Generator → Wow/Decorator/EventStream/OpenAPI → Fetcher）及下文使用的编译器。ts-morph、commander、yaml 作为普通依赖自动安装。这些是生成阶段依赖；消费应用需把生成客户端导入的包作为运行时依赖安装，见[生成产物](./generated-output.md)。

## 最小示例

```bash
pnpm exec fetcher-generator generate -i ./openapi.json -o ./src/generated -t ./tsconfig.json
```

## 选择入口

可复现的构建步骤使用 CLI，需要自定义日志的 Node 脚本使用 `CodeGenerator.generate()`。两者都生成源码，不执行 API 操作。先准备完整的 [CLI 输入和 tsconfig](./cli.md)，重新生成前确认[输出所有权](./generated-output.md)。

## 专题

- [生成器 CLI](cli)
- [生成器配置](configuration)
- [程序化 API](programmatic-api)
- [生成产物与重新生成](generated-output)
- [Wow 聚合识别](wow-discovery)

[完整公开符号索引](./symbols.md)
