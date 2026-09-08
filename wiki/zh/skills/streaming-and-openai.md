---
title: 流式与 OpenAI
description: 流式与 OpenAI — Fetcher agent workflows
pageClass: skills-page
---

# 流式与 OpenAI

从任务的输入和输出选择 Skill；同一应用可以组合多个包，但每次修改保持明确的职责边界。

| 任务     | Skill                                                                                                            | API 参考                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| SSE 消费 | [`$fetcher-llm-streaming`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-llm-streaming/SKILL.md) | [eventstream](../reference/eventstream/index.md) |
| 对话补全 | [`$fetcher-openai-client`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openai-client/SKILL.md) | [openai](../reference/openai/index.md)           |

## 提供这些上下文

响应内容类型、SSE 帧样例、原始终止标记、预期 JSON 结构、取消所有者和服务端/浏览器边界。对话任务还需明确应用提供的兼容接口与模型。

## 验收结果

检查实际公开导入、完整示例、失败与清理路径。根据变更运行包测试或真实生成验证；涉及组件交互时在浏览器检查。不要将类型检查成功当作服务端协议兼容的证明。

[安装与完整目录](./index.md)
