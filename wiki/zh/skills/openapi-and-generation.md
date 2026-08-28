---
title: OpenAPI 与生成 Skills
description: 为 OpenAPI TypeScript 类型和生成式客户端选择 Fetcher Skill。
pageClass: skills-page
---

# OpenAPI 与生成 Skills

类型包描述 OpenAPI 文档；Generator 消费文档并写出 Fetcher 模型和客户端。二者
解决不同问题。

## `$fetcher-openapi-types`

**适用于：** 类型化 OpenAPI 3 文档、Schema、Path、Operation、Parameter、
Response、Component、Security、Reference 和扩展字段。

```text
$fetcher-openapi-types 为用户端点创建类型安全的 OpenAPI 文档。
把可复用 Schema 和 Response 放进 components，并使用 Reference。
```

这个包没有运行时行为。不要用它的类型替代对不可信 JSON 的运行时校验。

继续阅读 [OpenAPI 参考](../reference/openapi.md)。

## `$fetcher-openapi-generator`

**适用于：** Generator CLI 选项、配置、输出结构、安全再生成、程序化
`CodeGenerator`，以及 Wow 客户端发现规则。

```text
$fetcher-openapi-generator 根据 ./openapi.yaml 生成 TypeScript 模型和客户端，
输出到 ./src/generated 并使用 ./tsconfig.json。验证输出可以构建，
并说明所有被跳过的 Operation。
```

Skill 会检查真实输入文档和生成结果，而不是从约定猜测路由。对于 Wow Fixture，
它还理解命令、快照、计数和聚合的发现形状。

继续阅读 [Generator 参考](../reference/generator.md)或
[生成客户端场景](../recipes/openapi-client.md)。

## 选择规则

| 结果                            | Skill                        |
| ------------------------------- | ---------------------------- |
| 编写或转换内存中的 OpenAPI 文档 | `$fetcher-openapi-types`     |
| 根据 YAML、JSON 或 URL 生成源码 | `$fetcher-openapi-generator` |
| 不生成代码，直接调用 API        | `$fetcher-integration`       |
