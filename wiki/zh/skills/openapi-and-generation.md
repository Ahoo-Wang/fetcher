---
title: OpenAPI 与生成
description: OpenAPI 与生成 — Fetcher agent workflows
pageClass: skills-page
---

# OpenAPI 与生成

从任务的输入和输出选择 Skill；同一应用可以组合多个包，但每次修改保持明确的职责边界。

| 任务         | Skill                                                                                                                    | API 参考                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| OpenAPI 类型 | [`$fetcher-openapi-types`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-types/SKILL.md)         | [openapi](../reference/openapi/index.md)     |
| 客户端生成   | [`$fetcher-openapi-generator`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-generator/SKILL.md) | [generator](../reference/generator/index.md) |

## 提供这些上下文

输入文档、输出目录、tsconfig 与预期客户端操作。区分静态 OpenAPI 建模和生成任务。要求真实生成并检查输出，猜测客户端名称不构成验证。

## 验收结果

检查实际公开导入、完整示例、失败与清理路径。根据变更运行包测试或真实生成验证；涉及组件交互时在浏览器检查。不要将类型检查成功当作服务端协议兼容的证明。

[安装与完整目录](./index.md)
