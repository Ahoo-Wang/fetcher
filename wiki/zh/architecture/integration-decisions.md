---
next: false
title: 集成决策
description: 按契约与维护责任比较客户端风格和服务集成。
---

# 集成决策

选择符合现有服务的最简单一层。当更高一层能消除已经存在的重复工作时再采用，并将配置成本和后端契约纳入决策。

## 直接、声明式还是生成式客户端

| 选择           | 适用情况                      | 你负责什么                                        | 不适用情况                                  |
| -------------- | ----------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 直接 `Fetcher` | 少量调用或端点特有行为        | 路径、请求选项、结果选择、边界验证                | 大量重复端点声明容易各自漂移                |
| 装饰器服务     | 稳定方法适合集中声明服务      | metadata/编译器配置、参数注解、端点准确性         | 不希望引入装饰器配置，或 API 主要是临时调用 |
| 生成式服务     | 实际维护的契约是 OpenAPI 文档 | 生成命令/配置、审查和编译产物、规范变化后重新生成 | 规范缺失或不准确；文档没有表达服务语义      |

它们共享运行请求边界：核心实现请求/提取（[packages/fetcher/src/fetcher.ts:230](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L230)），装饰器有 metadata 运行依赖（[packages/decorator/package.json:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/package.json#L58)），5.x 的生成器是 CLI（[packages/generator/src/cli.ts:8](https://github.com/Ahoo-Wang/fetcher/blob/5.x/packages/generator/src/cli.ts#L8)）。OpenAPI 导出类型定义（[packages/openapi/src/index.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L21)）。注解和生成类型都不会在运行时验证响应，也不会补全缺失的服务端语义。

从 [HTTP 请求](../guides/http/requests.md)开始，再使用[声明式客户端](../guides/services/declarative-client.md)或[生成式客户端](../guides/services/generated-client.md)中的已验证工作流。配置细节见[装饰器参考](../reference/decorator/index.md)和[生成器参考](../reference/generator/index.md)。生成器属于 5.x 线；从 6.0 起它位于 [Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)。[peer 图](./package-boundaries.md)应与预期执行代码分别检查。

## 数据视图

Fetcher main 不提供表格或数据视图组件。`@ahoo-wang/fetcher-viewer`（View、Viewer、FetcherViewer）冻结在 5.x 线（npm 5.1.x，分支 [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x/packages/viewer)）；它的[指南](../guides/viewer/index.md)与[参考](../reference/viewer/index.md)为存量用户保留。接替它的是 [Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)中的 `@ahoo-wang/wow-view-engine`，尚未发布。现在新建表格时，把 [React 请求状态](../guides/react/index.md)与应用已在使用的表格组件组合起来，筛选、排序和分页留在数据服务中完成。

## 服务专用集成

| 集成              | 所需契约                              | 服务/应用保留的责任                 |
| ----------------- | ------------------------------------- | ----------------------------------- |
| Wow（5.x 客户端） | 命令结果/阶段及支持的查询 DSL         | 授权、租户隔离、幂等、投影新鲜度    |
| CoSec             | token 存储、归属头、刷新端点/会话规则 | 身份生命周期、重放安全、服务端授权  |
| SSE / OpenAI 流   | 兼容事件流和载荷格式                  | 部分结果 UX、取消及必要时的重连策略 |

客户端条件描述发送的查询，不是访问控制。命令阶段描述协议进度，不是通用一致性保证。CoSec 带保护的刷新实现专用于其认证 exchange（[packages/cosec/src/authorizationResponseInterceptor.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L80)），SSE 提取则要求可读响应体（[packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)）。

继续阅读 [CoSec](../guides/integrations/cosec.md)及[流处理](../guides/streaming/index.md)。Wow 客户端属于 5.x 线（[Wow 指南](../guides/integrations/wow.md)）；从 6.0 起文档位于 [wow.ahoo.me](https://wow.ahoo.me)。跨身份共享这些集成前阅读[运行环境](./runtime-support.md)；增加重试前阅读[失败模型](./failure-model.md)。
