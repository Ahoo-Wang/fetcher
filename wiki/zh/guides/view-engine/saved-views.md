---
title: 保存与管理视图
description: 区分组件配置、服务写入、用户偏好与运行时状态。
---

# 保存与管理视图

## 保存实例配置

数据视图实例保存 `config.filters`、`sort`、`pagination` 和 `presentation`，其中 filters 保存组件属性。当前页/cursor、记录、选择、加载状态、错误、刷新倒计时和展开状态属于运行时。

编辑筛选不立即查询；查询应用筛选，保存独立校验并持久化当前工作配置。有效但未查询的修改可以保存，无效原始输入需先修正。保存不会改变现有结果；重新打开恢复已保存配置，再由数据源执行。

## 接入已实现的服务

`ViewHost.definition` 加载共享元数据；`instance` 分页列出目录摘要，并负责实例的点查、保存、创建、改名与删除；`preference.load` 读取当前用户的顺序与默认项，`saveOrder` 保存顺序，可选 `saveDefault` 保存默认项；`permission` 提供同步授权和变化通知；可选 `operation.reconcile` 只读核对早先写入的回执。`resolveSource` 继续作为本地业务查询客户端的连接点。参阅[签名与返回值](../../reference/view-engine/view-host.md)。

保存、创建、改名解析为 `WriteObservation`，其 committed 值是服务端确认的实例及新 `revision`；预期失败以带 `ViewServiceError` 错误码的 `rejected` 结局返回。服务端必须检查所有权、权限与版本，UI 能力检查不能替代鉴权。每次写入都携带 `requestId`，创建在不确定重试期间保留它以支持幂等恢复。读请求可取消；界面生命周期结束不代表服务写入已回滚。

## 范围与权限

界面分为个人视图和公共视图两组。公共系统视图带“系统”标签，不允许改名或删除；公共共享视图按权限开放操作。点击编辑图标才进入名称输入；统一管理还支持删除、排序，并在提供 `saveDefault` 时支持设置或取消默认项。

```ts
if (engine.canSetDefaultInstance()) {
  await engine.setDefaultInstance('my-view');
  await engine.setDefaultInstance(null);
}
```

`my-view` 必须是当前实例列表中的 ID。任意可见的个人、共享或系统视图都可设为默认，无需编辑权限。偏好按用户和定义隔离。设置或取消默认项不会切换当前视图、查询记录，也不会提交或丢弃未保存草稿；null 表示下次进入时不自动选择。排序是独立偏好，绝不改变默认项。删除默认实例时，已存偏好不变，`effectiveDefaultInstanceId` 变为 null；服务不会自行选择替代项，删除后的选中回退是引擎本地行为。显式 null 和其他用户仍可见的同 ID 个人实例保持不变。

授权通过 `permission.getInstance(summary)` 与 `permission.getDefinition()` 同步读取，引擎从不拉取权限。权限变化应通过 `permission.subscribe` 发布（内置宿主调用 `publishPermissions()`），或在同一范围内替换宿主/更新回调。切换用户、租户需要新的 `scopeKey`。

## 选择存储环境

浏览器视图配置使用 `IndexedDBViewHost`。内存示例和 Node 服务使用 `MemoryViewHost`，可显式传入共享 Map；默认每个宿主拥有独立的内存状态。两种宿主执行相同的分页目录、带 `absent`/`matches` 前提的用户偏好文档和显式 null 默认项规则，业务数据仍经独立数据源查询。完整参数及验证入口见 [ViewHost](../../reference/view-engine/view-host.md)。

删除解析为 `{ id, revision }` 回执；默认标记以偏好文档为准而不来自删除结果，已有视图草稿不会被全量重载覆盖。

冲突恢复要求明确审阅后选择：使用最新版本、另存，或基于已审阅 revision 覆盖。未知创建核对保留原 requestId。参见[引擎恢复](../../reference/view-engine/engine.md)。
