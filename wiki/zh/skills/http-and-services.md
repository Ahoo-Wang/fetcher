---
title: HTTP 与服务
description: HTTP 与服务 — Fetcher agent workflows
pageClass: skills-page
---

# HTTP 与服务

从任务的输入和输出选择 Skill；同一应用可以组合多个包，但每次修改保持明确的职责边界。

| 任务        | Skill                                                                                                                    | API 参考                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| HTTP 客户端 | [`$fetcher-integration`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/SKILL.md)             | [fetcher](../reference/fetcher/index.md)     |
| 声明式服务  | [`$fetcher-decorator-service`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-decorator-service/SKILL.md) | [decorator](../reference/decorator/index.md) |
| 事件投递    | [`$fetcher-eventbus`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-eventbus/SKILL.md)                   | [eventbus](../reference/eventbus/index.md)   |
| 值存储      | [`$fetcher-storage`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-storage/SKILL.md)                     | [storage](../reference/storage/index.md)     |

## 提供这些上下文

Base URL、已有具名或直接 Fetcher、请求与响应结构、头部所有权、超时和取消要求。涉及事件或存储时说明生命周期，以及其他标签页是否需要参与。

## 验收结果

检查实际公开导入、完整示例、失败与清理路径。根据变更运行包测试或真实生成验证；涉及组件交互时在浏览器检查。不要将类型检查成功当作服务端协议兼容的证明。

[安装与完整目录](./index.md)
