---
title: ViewHost 与服务边界
description: 定义、实例、偏好、权限与记录查询数据源的职责。
---

# ViewHost 与服务边界

`ViewHost` 是应用内组合门面。可选服务/方法分别启用能力，`resolveSource` 必填；它不规定统一的 REST Controller 或 URL 布局。读取接收选项对象，写入接收上下文并解析为 `WriteObservation`；下文的辅助函数与合同类型均由核心入口导出。

| 服务         | 方法                                                                                   | 返回值 / 职责                                                                                    |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `definition` | `load(definitionId, { readFence?, signal? })`                                          | `Promise<ViewDefinition>`                                                                        |
| `instance`   | `list(definitionId, { query?, cursor?, limit?, readFence?, signal? })`                 | `Promise<Page<ViewInstanceSummary>>`：一页目录元数据 `{ items, nextCursor, total? }`             |
| `instance`   | `load(instanceId, { readFence?, signal? })`                                            | `Promise<ViewInstance>`；唯一返回配置的读取                                                      |
| `instance`   | `create(input, { requestId, signal?, definitionRevision? })`                           | `WriteObservation<ViewInstance>`；输入省略 `id` 与 `revision`                                    |
| `instance`   | `save(instance, { requestId, signal?, definitionRevision? })`                          | `WriteObservation<ViewInstance>`，携带权威 revision                                              |
| `instance`   | `rename(instanceId, title, expectedRevision, { requestId, signal? })`                  | `WriteObservation<ViewInstance>`                                                                 |
| `instance`   | `delete(instanceId, expectedRevision, { requestId, signal? })`                         | `WriteObservation<ViewDeleteReceipt>`：仅 `{ id, revision }`                                     |
| `preference` | `load(definitionId, { readFence?, signal? })`                                          | `Promise<PreferenceState>`：`{ revision, order, defaultInstanceId, effectiveDefaultInstanceId }` |
| `preference` | `saveOrder(definitionId, { scopeInstanceIds, orderedInstanceIds }, precondition, ctx)` | `WriteObservation<PreferenceState>`；只重排当前用户顺序中作用集合内的槽位                        |
| `preference` | `saveDefault(definitionId, instanceId \| null, precondition, ctx)`                     | `WriteObservation<PreferenceState>`；`null` 表示不自动选择                                       |
| `permission` | `getInstance(summary)`                                                                 | 按 `ViewInstanceSummary` 同步返回 `ViewInstancePermissions`                                      |
| `permission` | `getDefinition()`                                                                      | 同步 `{ reorder?, setDefault?, createPersonal?, createShared? }`；缺失的授权视为未知             |
| `permission` | `subscribe(listener)`                                                                  | 通知授权变化；返回取消订阅函数                                                                   |
| `operation`  | `reconcile({ resource, definitionId, requestId, targetId? }, { readFence?, signal? })` | 只读返回早先写入的 `WriteObservation<unknown>`，绝不重放                                         |
| host         | `resolveSource(sourceId)`                                                              | `ViewSource` 或其 Promise（记录分页或分析聚合）                                                  |

## 读取与目录

`engine.load()` 分别读取定义、第一页目录和个人偏好。`state.status` 只反映定义是否就绪；`state.catalog { status, error, nextCursor, total, summaries }` 与 `state.preference { status, error, revision }` 各自维护状态，目录或偏好读取失败不会清除已打开的会话。`ViewInstanceSummary`（`summaryOf(instance)`）为 `{ id, definitionId, kind, title, scope, revision }`，不含配置；打开实例时再经 `instance.load` 点查。`engine.loadMoreInstances()` 追加下一页，`engine.loadSavedInstance(id)` 只读取实例而不打开。本地 `ViewEngineOptions.instances` 数组会替代全部宿主目录与偏好读取。

过期的目录游标以 `CURSOR_EXPIRED` 拒绝，应重新加载第一页。`readFence` 是 `visibility: 'pending'` 的 `committed` 写入返回的不透明令牌，原样传回同一服务即可让读取在该写入之后落定。读取失败以 `ViewServiceError` 拒绝，调用方保持当前状态。

## 写入与不确定结果

服务负责身份、所有权、权限和版本检查。引擎会复查界面权限，但不能代替后端鉴权。系统视图禁止改名与删除。save/rename 的返回值必须保持实例身份，并返回服务确认的配置与版本。

每次写入携带 `WriteContext { requestId, signal? }`；`create` 与 `save` 还接受 `ConfigurationWriteContext.definitionRevision`，配置基于更旧定义设计时以 `DEFINITION_CHANGED` 拒绝。结果是四种结局之一：`committed`（`value`、`revision`、`visibility: 'visible'` 或带 `readFence` 的 `'pending'`）、`committed_pending_receipt`（`targetId`、`revision`、`issue`）、`unknown`（`issue`）与 `rejected`（`issue { code, message }`）。预期失败以 `rejected` 结局返回而不是抛出；派发后的 Promise 拒绝只说明结局未能完成，按未知处理。使用 `committedWrite`、`rejectedWrite`、`unknownWrite` 构造结局，使用 `readWriteObservation` 校验入站结局。

同一次逻辑创建在不确定重试期间保留 `requestId`。服务必须按该 ID 去重，同一正文重放已存回执，不同正文以 `CONFLICT` 拒绝。界面取消或导航不能证明写入是否已提交。`operation.reconcile` 只读核对已存回执而不重放；`reloadInstance` 以同一键和正文经 `instance.create` 重放未知创建。

偏好写入使用前提而非实例 revision：`PreferenceState.revision` 为 null 时用 `{ type: 'absent' }`，之后用 `{ type: 'matches', revision }`（`preconditionFor(revision)`），不匹配以 `REVISION_CONFLICT` 拒绝。`saveOrder` 是槽位重排：`applyOrderChange` 只重填作用集合内的槽位，作用集合外的 ID 保持原位，作用集合内的 ID 必须全部可见，不修改其他用户顺序。实例写入使用 revision CAS，两者是不同的并发语义。

删除回执只有 `{ id, revision }`，不涉及个人默认视图。随后引擎在本地选中列表中的第一个实例，若 `state.defaultInstanceId` 指向被删实例则清空，且不写偏好。删除调用方范围内不可见的实例以 `NOT_FOUND` 拒绝；同一 `requestId` 重放返回已存回执。

`ViewServiceError(code, message)` 区分 INVALID_ARGUMENT、UNAUTHENTICATED、FORBIDDEN、NOT_FOUND、CONFLICT、REVISION_CONFLICT、DEFINITION_CHANGED、PRECONDITION_REQUIRED、CURSOR_EXPIRED、CORRUPT_STATE、UNAVAILABLE、UNKNOWN_OUTCOME。这些是服务分类，不是公开的 HTTP 状态码映射。

save、rename 或 delete 发出后，`unknown` 或 `committed_pending_receipt` 结局、Promise 拒绝或超时会标记 `requiresReload`，保留本地编辑并阻止该实例的其他写入。保存和改名需要 `reloadInstance()` 成功取得权威版本后才解除限制。`rejected` 结局把说明写入 `writeError`，保留草稿，`requiresReload` 保持 false。不确定的创建可使用原请求 ID 重试；不确定的删除可使用同一 ID、同一 revision 重试。界面通过订阅 `getCapabilitiesSnapshot().instances[id].retryDelete` 判断此例外。

## 权限

引擎从不拉取权限。宿主或应用负责加载、缓存和排序，然后提供同步的 `getInstance(summary)` 与 `getDefinition()`，并通过 `subscribe` 通知。加载不等待策略；策略不可用只会限制管理操作。`canSetDefaultInstance()` 与 `canReorderInstances()` 要求存在对应偏好写入端口，且没有 `getDefinition` 或其明确授予 `true`。后续变化需要发布通知或通过 `updateHost` 替换宿主，仅修改不可观察的闭包不会通知 React。切换用户或租户需要新的 `scopeKey`。

## 浏览器持久化与内存服务

浏览器使用 `/react` 入口的 `IndexedDBViewHost`；内存示例和 Node HTTP 测试服务使用核心入口的 `MemoryViewHost`。二者共享权限、版本检查、创建回执、用户隔离、目录和偏好规则，存储实现分别使用原生 IndexedDB 事务与 Map。

必填参数：`serviceKey`、`scopeKey`、`definition`、`instances: ViewInstance[]`、`resolveSource`。可选 `defaultInstanceId`（null 或初始实例 ID）是尚无偏好文档的用户的起始视图。可选权限回调：`instancePermissions(summary)`、`canReorder`、`canSetDefault`、`definitionPermissions`；回答变化后调用 `host.publishPermissions()`。浏览器宿主还接受 `databaseName`，默认 `fve-view-state`；内存宿主接受 `store?: Map<string, string | null>`，仅显式共享同一个 Map 时共享服务状态。

```ts
import { IndexedDBViewHost } from '@ahoo-wang/fetcher-view-engine/react';

const host = new IndexedDBViewHost({
  serviceKey: 'demo-service',
  scopeKey: 'user-a',
  definition,
  instances,
  defaultInstanceId: null,
  resolveSource,
});
```

浏览器的读取、CAS 和写回位于同一个 readwrite 事务内，提交后才返回成功，失败与取消回滚。`reset()` 原子清除该服务和定义下的用户视图、偏好及回执；业务订单仍由独立数据源提供。内存服务的同步回调在一次 JS 调用栈内完成读取、校验和更新。

`list` 支持标题子串 `query`、1–200 的 `limit`（默认 50）以及不透明游标；查询条件或用户偏好版本变化后游标失效。写入对 FORBIDDEN、REVISION_CONFLICT、NOT_FOUND、INVALID_ARGUMENT、CONFLICT、DEFINITION_CHANGED 解析为 `rejected` 结局；空白 `requestId` 以 INVALID_ARGUMENT 拒绝 Promise。存储失败时写入解析为 `rejected` UNAVAILABLE，读取以 UNAVAILABLE 拒绝；存储 JSON 损坏时读取以 CORRUPT_STATE 拒绝。回执在同一存储上重建宿主后仍然保留。

`saveDefault` 保存按当前用户和定义隔离的偏好。它接受无需编辑权限的任意当前可见个人、共享或系统实例，也接受 `null`；null 表示下次进入时不自动选择。设置默认项不会切换当前项或查询记录，后续排序也不会改变默认项。`preference.load` 每次都按调用方当前可见范围解析 `effectiveDefaultInstanceId`：已存默认项不再可见时为 null，宿主不会自行选择替代项，显式 null 保持 null。首次偏好写入前 `revision` 为 null，已存默认项即宿主的 `defaultInstanceId`。

构建后运行 `pnpm verify:view-engine` 验证独立包、HTTP、跨标签 CAS、取消、重置及真实页面。客户端存储和开发服务不构成生产鉴权边界。

重新加载不会自动覆盖远端内容分歧。检查 session.conflict，明确采用远端或携带已审阅快照确认覆盖。已发出的写入超时仍是未知结果，读取超时可以独立重试。参见[生命周期与上限](./engine.md)。
