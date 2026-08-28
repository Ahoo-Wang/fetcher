---
title: Fetcher Skills
description: 在 Codex 和其他兼容编码 Agent 中使用理解 Fetcher 包边界的 Skills。
pageClass: skills-page
---

# Fetcher Skills

Fetcher 在本仓库维护十二个面向具体任务的 Agent Skill，并通过
[Ahoo Skills Marketplace](https://github.com/Ahoo-Wang/skills)统一发布为
`ahoo-fetcher-skills` 插件。安装一个插件即可获得覆盖整个 Fetcher 生态的包边界、
工作流和 API 参考。

::: tip Skills 与文档各司其职
使用本站理解和审查实现；需要 Agent 执行任务时使用 Skill，让它选择正确的包和工作流。
:::

## 安装 Fetcher 插件

[Ahoo Skills](https://github.com/Ahoo-Wang/skills) 是统一分发仓库，按源项目发布
拆分插件；Fetcher 对应 `ahoo-fetcher-skills`。

### Codex

```bash
codex plugin marketplace add Ahoo-Wang/skills --ref main
codex plugin add ahoo-fetcher-skills@ahoo-skills
```

### Claude Code

```bash
/plugin marketplace add https://github.com/Ahoo-Wang/skills
/plugin install ahoo-fetcher-skills
```

Marketplace 每六小时同步一次源仓库，每次同步提交都会形成新的插件版本。在
Claude Code 中运行 `/plugin update` 即可拉取最新同步副本。安装与更新规则以
[Ahoo Skills 安装说明](https://github.com/Ahoo-Wang/skills/blob/main/README.zh-CN.md#L47-L66)为准。

## 调用 Skill

安装插件后，用 `$` 显式调用其中一个 Skill：

```text
$fetcher-integration 创建一个 10 秒超时的命名客户端，
返回类型化 JSON，并为 401 增加类型安全的恢复拦截器。
```

当任务匹配 `description` 时，Agent 也可以自动选择 Skill；包边界很重要时，优先
显式调用。

## 源码与分发

| 层级        | 位置                                                                                                                 | 用途                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 源码        | [`fetcher/skills`](https://github.com/Ahoo-Wang/fetcher/tree/main/skills)                                            | 编写和审查 Fetcher 自有 Skill 内容 |
| 分发        | [`plugins/ahoo-fetcher-skills`](https://github.com/Ahoo-Wang/skills/tree/main/plugins/ahoo-fetcher-skills)           | Agent 实际安装的生成式插件         |
| Marketplace | [`.agents/plugins/marketplace.json`](https://github.com/Ahoo-Wang/skills/blob/main/.agents/plugins/marketplace.json) | 发布可安装的 Codex 插件集合        |

Skill 应在 Fetcher 仓库修改，而不是直接编辑生成的分发副本。Ahoo Skills 会浅克隆本仓库、
镜像 `skills/plugins.json`，并按同步周期重新生成插件。具体流程见
[Ahoo Skills 源码同步说明](https://github.com/Ahoo-Wang/skills/blob/main/README.zh-CN.md#L68-L80)。

## 选择 Skill

| 目标                                  | Skill                        | 包参考                                 |
| ------------------------------------- | ---------------------------- | -------------------------------------- |
| 配置请求、URL、拦截器、超时与结果提取 | `$fetcher-integration`       | [Fetcher](../reference/fetcher.md)     |
| 声明类型安全的服务类                  | `$fetcher-decorator-service` | [Decorator](../reference/decorator.md) |
| 协调本地或跨标签页类型化事件          | `$fetcher-eventbus`          | [事件总线](../reference/eventbus.md)   |
| 持久化浏览器或内存中的类型化状态      | `$fetcher-storage`           | [Storage](../reference/storage.md)     |
| 消费 SSE 与 Token 流                  | `$fetcher-llm-streaming`     | [事件流](../reference/eventstream.md)  |
| 调用 OpenAI Chat 与流式 API           | `$fetcher-openai-client`     | [OpenAI](../reference/openai.md)       |
| 用 TypeScript 描述 OpenAPI 3 文档     | `$fetcher-openapi-types`     | [OpenAPI](../reference/openapi.md)     |
| 根据 OpenAPI 生成客户端               | `$fetcher-openapi-generator` | [Generator](../reference/generator.md) |
| 使用 React Hooks 管理请求状态         | `$fetcher-react-hooks`       | [React](../reference/react.md)         |
| 构建数据探索界面                      | `$fetcher-viewer-components` | [Viewer](../reference/viewer.md)       |
| 增加 CoSec 认证与 Token 刷新          | `$fetcher-cosec-auth`        | [CoSec](../reference/cosec.md)         |
| 构建 Wow 命令与查询客户端             | `$fetcher-wow-cqrs`          | [Wow](../reference/wow.md)             |

## Skill 的结构

每个 Fetcher Skill 都有三个核心层级，部分 Skill 还包含 `evals/` Fixture：

| 文件                 | 加载时机           | 用途                         |
| -------------------- | ------------------ | ---------------------------- |
| `SKILL.md`           | Skill 激活时       | 触发边界与实施工作流         |
| `references/api.md`  | 需要精确 API 时    | 签名、默认值、示例和边界情况 |
| `agents/openai.yaml` | Host 展示 Skill 时 | 显示名称与默认提示词         |
| `evals/`             | 校验 Skill 时      | 可选的激活或行为测试 Fixture |

短工作流防止无关包进入变更；API reference 比 Wiki 更深入，是 Agent 查询精确签名
时的事实来源。

## 提示词模式

告诉 Agent 明确的结果与约束：

```text
$fetcher-openapi-generator 根据 ./openapi.yaml 生成客户端。
把生成代码放在 src/generated，复用现有 tsconfig，
不要修改规范，并验证生成包可以构建。
```

如果运行环境、错误、认证或兼容性要求会改变实现，就明确写出。无需粘贴 Skill
可以从自身 reference 加载的 API 签名。

## 按工作流浏览

- [HTTP 与服务](./http-and-services.md)
- [流式与 OpenAI](./streaming-and-openai.md)
- [OpenAPI 与生成](./openapi-and-generation.md)
- [React 与集成](./react-and-integrations.md)
