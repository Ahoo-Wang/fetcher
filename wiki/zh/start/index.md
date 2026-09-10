---
prev: false
title: 选择接入起点
description: 根据现有应用，从 HTTP、React 请求或本地数据表开始。
---

# 选择接入起点

Fetcher 在原生 Fetch 之上提供可复用的请求配置与结果处理。先选择需要得到的第一个结果；普通 HTTP 应用不需要 UI 框架或平台后端。

| 当前起点                             | 前提                                            | 第一个结果                                                                        |
| ------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| TypeScript 或 JavaScript HTTP 客户端 | 支持 Fetch 的运行环境及核心包                   | [安装](./installation.md)，然后对配套本地服务执行[第一个请求](./first-request.md) |
| 已有 React 应用                      | 兼容的 React、Fetcher peer 依赖和打包器         | [运行 React 示例](../examples/react.md)，展示加载、数据、错误与取消               |
| 已有 React 应用，需要数据表          | View Engine peer 依赖、支持 CSS 的打包器和本地行数据 | [创建第一张表](./first-view.md)，操作分页、排序与过滤                             |
| 无头记录引擎或 shadcn/Base UI        | 当前工作区/本地归档，UI 使用 React 19           | [View Engine 快速接入](../guides/view-engine/getting-started.md)                  |

可运行的 HTTP 和 Storybook 示例使用确定性夹具。移入应用时，必须提供示例中写明的路由与响应 JSON。安装客户端不会创建服务端。

已有 API 契约时，可以[声明服务方法](../guides/services/declarative-client.md)或[从 OpenAPI 生成](../guides/services/generated-client.md)。接入 Wow、CoSec 或远端 Viewer 前，先检查[集成前提](../guides/integrations/index.md)。

继续选择[下一项任务](./next-steps.md)，或先[评估架构](../architecture/index.md)再决定组件。
