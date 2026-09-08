---
prev: false
title: 架构与选型
description: 选择满足当前需求的最小客户端层，并明确应用仍需承担的责任。
---

# 架构与选型

从解决当前问题的一层开始。`Fetcher` 发送 HTTP 请求，提供共享默认配置、拦截器和结果提取；它不要求 React、Wow 后端或认证服务。配置与请求管线见 [packages/fetcher/src/fetcher.ts:145](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L145)。

| 需要决定什么                  | 阅读                                   | 决策结果                                                |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------- |
| 应用需要哪些包？              | [包边界](./package-boundaries.md)      | 区分运行客户端、peer 安装要求和开发工具                 |
| 客户端运行在哪里？            | [运行环境](./runtime-support.md)       | 明确浏览器能力、Node 要求和 SSR 身份作用域              |
| 通用行为放在哪一层？          | [请求生命周期](./request-lifecycle.md) | 区分请求/响应拦截与结果提取                             |
| 谁管理数据和清理？            | [状态与资源](./state-and-resources.md) | 明确 Hook 状态、表格数据、视图持久化和资源释放          |
| 请求拒绝意味着什么？          | [失败模型](./failure-model.md)         | 区分传输、状态、解码、取消和流失败                      |
| 选择哪种 API 风格或表格组件？ | [集成决策](./integration-decisions.md) | 比较直接调用、声明/生成服务及 View/Viewer/FetcherViewer |

## 为具体责任增加一层

普通端点从 [HTTP 指南](../guides/http/index.md) 开始；端点声明重复时阅读[服务指南](../guides/services/index.md)；组件需要请求状态时阅读 [React 指南](../guides/react/index.md)。[Viewer 指南](../guides/viewer/index.md) 从应用拥有的数据开始，远端保存视图是另一项集成选择。

每增加一层都会引入契约。SSE 需要可读事件流；FetcherViewer 需要对应的视图定义、查询和命令后端。安装客户端不会创造这些服务端能力。实际远端行数据查询见 [packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L53)。

## 在边界内理解保证

TypeScript 类型描述数据，但不会在运行时验证响应。UI 防止旧结果覆盖不等于服务端授权。命令已处理也不代表所有投影立即更新。验证、权限、幂等和数据新鲜度应由拥有这些能力的服务确定，再通过合适的客户端接入。[API 参考](../reference/index.md) 说明各导出 API，这些架构页解释其责任止于何处。
