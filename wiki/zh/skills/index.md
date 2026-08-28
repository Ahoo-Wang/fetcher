---
title: Fetcher Skills
description: 在 Codex 和其他兼容编码 Agent 中使用理解 Fetcher 包边界的 Skills。
pageClass: skills-page
---

# Fetcher Skills

Fetcher 提供十二个面向具体任务的 Agent Skill。每个 Skill 都包含明确的触发边界、
对应包的实施工作流，以及根据公共导出核对过的 API 参考。它们让 Agent 直接按
Fetcher 的真实约束工作，而不是重新猜测整个生态。

::: tip Skills 与文档各司其职
使用本站理解和审查实现；需要 Agent 执行任务时使用 Skill，让它选择正确的包和工作流。
:::

## 两分钟开始使用

Codex 会从 `.agents/skills` 发现仓库级 Skill。在 Fetcher 克隆目录中，把需要的
Skill 链接到该目录：

```bash
mkdir -p .agents/skills
ln -s ../../skills/fetcher-integration .agents/skills/fetcher-integration
ln -s ../../skills/fetcher-react-hooks .agents/skills/fetcher-react-hooks
```

Codex 支持指向 Skill 目录的符号链接。新增 Skill 未出现时再重启 Codex。完整的
发现位置与行为见
[OpenAI 官方 Skills 文档](https://developers.openai.com/codex/skills/)。

在 Codex CLI 或 IDE 扩展中，用 `$` 显式调用 Skill：

```text
$fetcher-integration 创建一个 10 秒超时的命名客户端，
返回类型化 JSON，并为 401 增加类型安全的恢复拦截器。
```

当任务匹配 `description` 时，Agent 也可以自动选择 Skill；包边界很重要时，优先
显式调用。

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

每个 Fetcher Skill 都有三层：

| 文件                 | 加载时机           | 用途                         |
| -------------------- | ------------------ | ---------------------------- |
| `SKILL.md`           | Skill 激活时       | 触发边界与实施工作流         |
| `references/api.md`  | 需要精确 API 时    | 签名、默认值、示例和边界情况 |
| `agents/openai.yaml` | Host 展示 Skill 时 | 显示名称与默认提示词         |

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
