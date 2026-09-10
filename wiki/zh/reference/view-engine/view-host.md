---
title: ViewHost 与服务边界
description: 定义、实例、偏好、权限与记录查询数据源的职责。
---

# ViewHost 与服务边界

`ViewHost` 是应用内组合门面。可选服务/方法分别启用能力，`resolveSource` 必填；它不规定统一的 REST Controller 或 URL 布局。

| 服务         | 方法                                           | 返回值 / 职责                                            |
| ------------ | ---------------------------------------------- | -------------------------------------------------------- |
| `definition` | `load(definitionId, signal?)`                  | `Promise<ViewDefinition>`                                |
| `instance`   | `list(definitionId, signal?)`                  | `Promise<ViewInstanceList>`                              |
| `instance`   | `load(instanceId, signal?)`                    | `Promise<ViewInstance>`                                  |
| `instance`   | `create(instanceWithoutIdOrRevision, context)` | 返回创建后的权威实例，context 含 requestId 和可选 signal |
| `instance`   | `save(instance)`                               | 返回保存实例及权威 revision                              |
| `instance`   | `rename(instanceId, title, revision?)`         | 返回改名后的实例                                         |
| `instance`   | `delete(instanceId, revision?)`                | `Promise<void>`                                          |
| `preference` | `saveOrder(definitionId, instanceIds)`         | 保存当前用户的排序偏好                                   |
| `permission` | `getInstance(instance)`                        | 同步 `ViewInstancePermissions`                           |
| `permission` | `getDefinition()`                              | 同步 `{ reorder }` 投影                                  |
| `permission` | `load(definitionId, signal?)`                  | 初始化 getter，并返回 `ViewPermissionSnapshot`           |
| `permission` | `refresh(signal?)`、`subscribe(listener)`      | 刷新权限；subscribe 返回取消订阅函数                     |
| host         | `resolveSource(sourceId)`                      | `RecordQuerySource` 或其 Promise                         |

加载引擎时等待 `permission.load`；没有 load 时使用 `permission.refresh`。权限初始化失败不能进入 ready。getter 必须是纯函数，读取已初始化策略。后续变化需要发布通知或替换 host，仅修改不可观察的闭包不会通知 React。

## 写入与不确定结果

服务负责身份、所有权、权限和版本检查。引擎会复查界面权限，但不能代替后端鉴权。系统视图禁止改名与删除。save/rename 响应必须保持实例身份，并返回服务确认的配置与版本。

同一次逻辑创建在不确定重试期间保留 `ViewCreateContext.requestId`。服务必须按该 ID 去重，并拒绝同一 ID 搭配不同正文。界面取消或导航不能证明写入是否已提交，应通过权威回执/重载协调，不能盲目创建新的请求。

`ViewServiceError(code, message)` 区分 INVALID_ARGUMENT、UNAUTHENTICATED、FORBIDDEN、NOT_FOUND、CONFLICT、REVISION_CONFLICT、PRECONDITION_REQUIRED、CORRUPT_STATE、UNAVAILABLE、UNKNOWN_OUTCOME。这些是服务分类，不是公开的 HTTP 状态码映射。

save、rename 或 delete 发出后，UNKNOWN_OUTCOME、UNAVAILABLE 及未分类异常会标记 `requiresReload`，保留本地编辑并阻止该实例的其他写入。保存和改名需要 `reloadInstance()` 成功取得权威版本后才解除限制；实例不存在或不可访问时继续保留错误与编辑。宿主应使用对应的 `ViewServiceError` 代码报告明确拒绝。不确定的创建可使用原请求 ID 重试；不确定的删除可使用同一 ID、同一 revision 幂等重试。界面通过订阅 `getCapabilitiesSnapshot().instances[id].retryDelete` 判断此例外。

## 浏览器持久化与内存服务

浏览器使用 `/react` 入口的 `IndexedDBViewHost`；内存示例和 Node HTTP 测试服务使用核心入口的 `MemoryViewHost`。二者共享权限、版本检查、创建回执、用户隔离和排序规则，存储实现分别使用原生 IndexedDB 事务与 Map。

必填参数：`serviceKey`、`scopeKey`、`definition`、`instances`、`resolveSource`。可选权限参数：`instancePermissions`、`canReorder`、`permissionsRevision`。浏览器宿主还接受 `databaseName`，默认 `fve-view-state`；内存宿主接受 `store?: Map<string, string | null>`，仅显式共享同一个 Map 时共享服务状态。

```ts
import { IndexedDBViewHost } from '@ahoo-wang/fetcher-view-engine/react';

const host = new IndexedDBViewHost({
  serviceKey: 'demo-service',
  scopeKey: 'user-a',
  definition,
  instances,
  resolveSource,
});
```

浏览器的读取、CAS 和写回位于同一个 readwrite 事务内，提交后才返回成功，失败与取消回滚。`reset()` 原子清除该服务和定义下的用户视图、排序及回执；业务订单仍由独立数据源提供。内存服务的同步回调在一次 JS 调用栈内完成读取、校验和更新。

构建后运行 `pnpm verify:view-engine` 验证独立包、HTTP、跨标签 CAS、取消、重置及真实页面。客户端存储和开发服务不构成生产鉴权边界。
