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

## LocalStorageViewHost

必填配置为 `serviceKey`、`scopeKey`、`definition`、`instances`、`resolveSource`、`storage`、`lock`。可选策略回调为 `instancePermissions`、`canReorder`、`permissionsRevision`。storage 提供 getItem/setItem/removeItem，同一存储键的所有客户端必须共用独占锁域。

```ts
const host = new LocalStorageViewHost({
  serviceKey: 'demo-service:tenant-a',
  scopeKey: 'user-a',
  definition,
  instances,
  resolveSource,
  storage: localStorage,
  lock: (name, operation, signal) =>
    navigator.locks.request(name, { signal }, operation),
});
```

该浏览器开发夹具验证恢复、隔离、版本和原子写入；`reset()` 重置测试服务状态。它不保存业务记录，也不提供可信的生产鉴权。

构建工作区并在 6006 端口启动 Storybook 后，运行 `node packages/view-engine/scripts/verify-view-host.mjs` 验证本地服务与浏览器恢复；`pnpm verify:view-engine` 是包、服务和浏览器验收的组合入口。`dev` 下的 HTTP 夹具不进入发布包。
