---
next: false
title: 集成决策
description: 按契约与维护责任比较客户端风格和表格层。
---

# 集成决策

选择符合现有服务的最简单一层。当更高一层能消除已经存在的重复工作时再采用，并将配置成本和后端契约纳入决策。

## 直接、声明式还是生成式客户端

| 选择           | 适用情况                      | 你负责什么                                        | 不适用情况                                  |
| -------------- | ----------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 直接 `Fetcher` | 少量调用或端点特有行为        | 路径、请求选项、结果选择、边界验证                | 大量重复端点声明容易各自漂移                |
| 装饰器服务     | 稳定方法适合集中声明服务      | metadata/编译器配置、参数注解、端点准确性         | 不希望引入装饰器配置，或 API 主要是临时调用 |
| 生成式服务     | 实际维护的契约是 OpenAPI 文档 | 生成命令/配置、审查和编译产物、规范变化后重新生成 | 规范缺失或不准确；文档没有表达服务语义      |

它们共享运行请求边界：核心实现请求/提取（[packages/fetcher/src/fetcher.ts:230](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L230)），装饰器有 metadata 运行依赖（[packages/decorator/package.json:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/package.json#L56)），生成器是 CLI（[packages/generator/src/cli.ts:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/cli.ts#L8)）。OpenAPI 导出类型定义（[packages/openapi/src/index.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L21)）。注解和生成类型都不会在运行时验证响应，也不会补全缺失的服务端语义。

从 [HTTP 请求](../guides/http/requests.md)开始，再使用[声明式客户端](../guides/services/declarative-client.md)或[生成式客户端](../guides/services/generated-client.md)中的已验证工作流。配置细节见[装饰器参考](../reference/decorator/index.md)和[生成器参考](../reference/generator/index.md)。[peer 图](./package-boundaries.md)应与预期执行代码分别检查。

## View、Viewer 还是 FetcherViewer

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../guides/view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

| 选择            | 数据与状态契约                                           | 适用情况                          | 代价或不匹配点                                 |
| --------------- | -------------------------------------------------------- | --------------------------------- | ---------------------------------------------- |
| `View`          | 接收 `PagedList`，发出交互变更，可采用受控状态           | 单个表格/视图，数据归应用所有     | 应用必须实现筛选、排序和分页                   |
| `Viewer`        | 增加保存视图集合和选择，加载/保存回调交给应用            | 用户在现有数据服务上切换/保存视图 | 应用实现持久化、错误处理和成功回调时机         |
| `FetcherViewer` | 加载定义/视图和行数据，通过约定后端协议发送 Wow 视图命令 | 服务实现该协议和身份模型          | 需要兼容端点和投影行为；不是通用 REST 配置组件 |

前两者责任见 [packages/viewer/src/view/View.tsx:417](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L417) 和 [packages/viewer/src/viewer/Viewer.tsx:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L140)；远端行加载见 [packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L53)。FetcherViewer 创建/更新确认与删除的范围不同，向用户承诺保存结果前应阅读[状态与资源](./state-and-resources.md)。

本地表格使用[本地数据](../guides/viewer/local-data.md)，在应用内实现[分页排序](../guides/viewer/pagination-and-sorting.md)。需要持久化时增加[保存视图](../guides/viewer/saved-views.md)。具备后端契约时再采用[远端数据](../guides/viewer/remote-data.md)。属性见 [View/Viewer 参考](../reference/viewer/view-and-viewer.md)和 [FetcherViewer 参考](../reference/viewer/fetcher-viewer.md)。

## 服务专用集成

| 集成            | 所需契约                              | 服务/应用保留的责任                 |
| --------------- | ------------------------------------- | ----------------------------------- |
| Wow             | 命令结果/阶段及支持的查询 DSL         | 授权、租户隔离、幂等、投影新鲜度    |
| CoSec           | token 存储、归属头、刷新端点/会话规则 | 身份生命周期、重放安全、服务端授权  |
| SSE / OpenAI 流 | 兼容事件流和载荷格式                  | 部分结果 UX、取消及必要时的重连策略 |

客户端条件描述发送的查询，不是访问控制。命令阶段描述协议进度，不是通用一致性保证。CoSec 带保护的刷新实现专用于其认证 exchange（[packages/cosec/src/authorizationResponseInterceptor.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L80)），SSE 提取则要求可读响应体（[packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)）。

继续阅读 [Wow](../guides/integrations/wow.md)、[CoSec](../guides/integrations/cosec.md)及[流处理](../guides/streaming/index.md)。跨身份共享这些集成前阅读[运行环境](./runtime-support.md)；增加重试前阅读[失败模型](./failure-model.md)。
