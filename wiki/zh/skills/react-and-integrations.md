---
title: React 与集成
description: React 与集成 — Fetcher agent workflows
pageClass: skills-page
---

# React 与集成

从任务的输入和输出选择 Skill；同一应用可以组合多个包，但每次修改保持明确的职责边界。

| 任务           | Skill                                                                                                                    | API 参考                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| React 请求状态 | [`$fetcher-react-hooks`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-react-hooks/SKILL.md)             | [react](../reference/react/index.md)   |
| 数据视图       | [`$fetcher-viewer-components`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-viewer-components/SKILL.md) | [viewer](../reference/viewer/index.md) |
| CoSec 认证     | [`$fetcher-cosec-auth`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-cosec-auth/SKILL.md)               | [cosec](../reference/cosec/index.md)   |
| Wow 命令与查询 | [`$fetcher-wow-cqrs`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/SKILL.md)                   | [wow](../reference/wow/index.md)       |

## 提供这些上下文

组件拥有的状态、查询触发条件、API 客户端、认证/租户上下文、持久化回调和失败界面。后端支持 Viewer 契约时才使用对应集成，不把普通 REST 地址猜测成 Wow 接口。

## 验收结果

检查实际公开导入、完整示例、失败与清理路径。根据变更运行包测试或真实生成验证；涉及组件交互时在浏览器检查。不要将类型检查成功当作服务端协议兼容的证明。

[安装与完整目录](./index.md)
