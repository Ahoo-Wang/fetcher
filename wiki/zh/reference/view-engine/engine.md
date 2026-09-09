---
title: ViewEngine 生命周期与命令
description: 管理引擎生命周期，读取不可变快照并执行实例作用域命令。
---

# ViewEngine 生命周期与命令

## 生命周期所有权

`new ViewEngine({ definitionId, host, definition?, instances?, filterCompilers? })` 创建无头运行时。调用 `await engine.load()`，结束时调用 `engine.dispose()`。React 应用通常交给 `ViewPage` 管理，已释放的引擎不能继续复用。

`getSnapshot()` 返回缓存的不可变 `ViewEngineState`，`subscribe(listener)` 返回取消订阅函数。状态包含 status/error/definition、实例 ID、当前实例与各实例会话。`getCapabilitiesSnapshot()` 通过同一订阅机制提供不可变权限/能力投影。不要直接修改快照。

## 会话状态

| 字段                                                            | 含义                                   |
| --------------------------------------------------------------- | -------------------------------------- |
| `baseline`、`instance`、`dirty`                                 | 已保存基线、当前实例、待保存差异       |
| `filterDraft`、`filterBaseline`、`filterPending`、`filterValid` | 编辑树、已应用树、查询差异和本地有效性 |
| `appliedFilter`                                                 | 编译表达式，查询范围无效时为 null      |
| `rows`、`total`、`page`、`cursor`、`nextCursor`                 | 当前记录结果与导航                     |
| `queryStatus`、`refreshing`、`queryError`                       | 读取状态；后台刷新可保留记录           |
| `pageSummary`、`allSummary`                                     | 独立跟踪的两个汇总范围                 |
| `writeStatus`、`writeError`、`requiresReload`                   | 写入进度、失败与协调要求               |
| `selectedRowKeys`                                               | 已加载记录内的选择                     |

## 命令

下表中可选 `id` 指定实例，省略时使用当前实例。异步操作返回 `Promise<void>`，调用方需处理失败。

| 命令                                                                                              | 作用                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `selectInstance(id)`                                                                              | 导航并加载对应记录                           |
| `setFilterDraft(draft, id?, valid?)`、`setFilterValidity(valid, id?)`、`setFilterMode(mode, id?)` | 编辑，不查询                                 |
| `applyFilter(expression?, id?)`                                                                   | 编译、应用并查询，显式表达式需与组件状态一致 |
| `setSort(sort, id?)`、`setPage(index, id?)`、`setPageSize(size, id?)`、`nextPage(id?)`            | 应用记录查询与导航变化                       |
| `setColumns(columns, id?)`                                                                        | 修改展示；汇总指标变化可能发起聚合           |
| `setSelection(keys, id?)`、`setTitle(title, id?)`                                                 | 修改本地选择或标题                           |
| `refresh(id?, { background? })`                                                                   | 查询当前已应用范围                           |
| `refreshSummary(id?)`                                                                             | 独立重试聚合范围                             |
| `save(id?)`、`saveAs({ title, scope }, id?)`                                                      | 经宿主服务保存                               |
| `renameInstance(title, id?)`、`deleteInstance(id?)`、`reorderInstances(ids)`                      | 管理服务端视图与用户偏好                     |
| `restore(id?)`                                                                                    | 恢复本地保存基线并查询                       |
| `reloadInstance(id?)`、`canReloadInstance(id?)`                                                   | 从宿主重载并协调实例                         |
| `getPermissions(id?)`、`canReorderInstances()`                                                    | 检查当前操作权限                             |
| `updateHost(host)`                                                                                | 更新同范围回调/策略并保留会话                |
| `dispose()`                                                                                       | 结束订阅并取消拥有的读取                     |

通过数据源的 QueryApi 方法读取并传递 AbortController，写入授权与持久化留在 ViewHost 服务。请求取消和旧响应丢弃保障结果所有权，不能撤销已经完成的业务写入。
