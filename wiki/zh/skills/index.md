---
prev: false
title: 使用 Fetcher Skills
description: 使用 Fetcher Skills — Fetcher agent workflows
pageClass: skills-page
---

# 使用 Fetcher Skills

Skills 将包边界、实现流程与 API 参考交给编码 Agent。本站文档帮助你理解和审阅结果；Skill 帮助 Agent 按这些边界执行工作。

## 安装插件

Fetcher 的 skills/plugins.json 将这些技能发布为 ahoo-fetcher-skills。按 [Ahoo Skills 安装指南](https://github.com/Ahoo-Wang/skills#installation)安装对应插件。

```bash
codex plugin marketplace add Ahoo-Wang/skills --ref main
codex plugin add ahoo-fetcher-skills@ahoo-skills
```

Claude Code 使用 `/plugin marketplace add https://github.com/Ahoo-Wang/skills` 和 `/plugin install ahoo-fetcher-skills`。安装后的版本由分发仓库管理，不假定与当前源码立即一致。

## 选择任务边界

| 任务           | Skill                                                                                                                    | API 参考                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| HTTP 客户端    | [`$fetcher-integration`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/SKILL.md)             | [fetcher](../reference/fetcher/index.md)         |
| 声明式服务     | [`$fetcher-decorator-service`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-decorator-service/SKILL.md) | [decorator](../reference/decorator/index.md)     |
| 事件投递       | [`$fetcher-eventbus`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-eventbus/SKILL.md)                   | [eventbus](../reference/eventbus/index.md)       |
| 值存储         | [`$fetcher-storage`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-storage/SKILL.md)                     | [storage](../reference/storage/index.md)         |
| SSE 消费       | [`$fetcher-llm-streaming`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-llm-streaming/SKILL.md)         | [eventstream](../reference/eventstream/index.md) |
| 对话补全       | [`$fetcher-openai-client`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openai-client/SKILL.md)         | [openai](../reference/openai/index.md)           |
| OpenAPI 类型   | [`$fetcher-openapi-types`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-types/SKILL.md)         | [openapi](../reference/openapi/index.md)         |
| 客户端生成     | [`$fetcher-openapi-generator`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-generator/SKILL.md) | [generator](../reference/generator/index.md)     |
| React 请求状态 | [`$fetcher-react-hooks`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-react-hooks/SKILL.md)             | [react](../reference/react/index.md)             |
| 数据视图       | [`$fetcher-viewer-components`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-viewer-components/SKILL.md) | [viewer](../reference/viewer/index.md)           |
| CoSec 认证     | [`$fetcher-cosec-auth`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-cosec-auth/SKILL.md)               | [cosec](../reference/cosec/index.md)             |
| Wow 命令与查询 | [`$fetcher-wow-cqrs`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/SKILL.md)                   | [wow](../reference/wow/index.md)                 |

## 写一个可验证的请求

```text
$fetcher-openapi-generator 从 ./openapi.yaml 生成客户端到 src/generated，
使用现有 tsconfig，不修改输入契约，并验证生成代码的类型检查。
```

给出输入、目标目录、已有客户端、运行环境和验收标准。Skill 的 references/api.md 是 Agent 可按需加载的详细材料；人类参考页同样提供准确 API 契约，不要求读者转去 Skill 才能完成开发。

源文件在本仓库 skills/；分发副本由 Ahoo Skills 生成。修改源文件并通过对应验证，不直接修改生成副本。

先用[可运行示例](../examples/index.md)与[任务指南](../guides/index.md)提供明确输入和预期结果，再通过[架构说明](../architecture/index.md)审查边界。
