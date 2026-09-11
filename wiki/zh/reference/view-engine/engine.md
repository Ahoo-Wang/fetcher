---
title: ViewEngine 生命周期与命令
description: 管理引擎生命周期，读取不可变快照并执行实例作用域命令。
---

# 记录与分析的共享生命周期

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { useViewEngine, ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function OrderPage({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ scopeKey, definitionId: 'orders', host });
  return <ViewPage {...binding} selectable />;
}
```

`useViewEngine(options)` 负责创建、加载和释放，包括 React StrictMode。必填的 `scopeKey` 与 `definitionId` 标识生命周期，任一变化都会替换引擎。可选的本地 `definition`/`instances`、`extensions` 中成对的编译器/编辑器注册、`limits`、`onDiagnostic` 用于初始化该生命周期。同范围的 host 更新保留编辑；其他初始化输入需要重新建立时，显式改变 React key。返回的 `ViewEngineBinding` 为 `{ engine: ViewEngine | null, extensions?, error? }`。

`ViewPage` 是纯 UI，接收 binding 或调用方持有的 engine，不会自行加载或释放引擎。`ViewPageContent` 要求非 null engine。两者组合导航、共享写入和选中的 `RecordView` 或 `AnalysisView`；后两者只渲染各自类型。无界面调用方创建 `new ViewEngine({ definitionId, host, definition?, instances?, filterCompilers?, analysisCompilers?, limits?, onDiagnostic? })`，调用 `load()`，范围结束时调用 `dispose()`。

### 定义与已保存实例

`ViewDefinition` 包含 `id`、`title`、`sourceId`、共享 `fields`，以及可选的 `timeZone`、`allowedOperators`、`filterEditors`。至少声明一种能力：

- `record: { rowKey, allowedLayouts, defaultPresentation?, recordActions? }`。`RecordViewDefinition` 将该能力标记为必需；rowKey 是自有属性路径，allowedLayouts 是非空且不重复的 table/card 列表。
- `analysis: AnalysisCapability` 授权 COUNT、字段分组、数值函数、时间粒度和上限。仅聚合的数据源不需要记录主键或分页方法。

`ViewInstance` 是 `RecordViewInstance | AnalysisViewInstance` 判别联合。两者都要求非空 `id`、`definitionId`、`title`、`revision` 和 `scope`。`kind: 'record'` 使用 `RecordViewConfig`（filters、sort、pagination、presentation）；`kind: 'analysis'` 使用下文的 `AnalysisViewConfig`。scope 支持个人或公共/系统/共享分类，不代表权限。创建输入只省略 ID 和 revision，由服务回执返回。

`ViewInstanceList` 包含可见实例与 `defaultInstanceId: string | null`，可以混合两类视图。默认偏好与当前选中项独立。结构可读取但当前不可执行的配置仍保留编辑入口，通过 `session.validation` 报错；单个失效实例不会阻断健康实例。

### 工作配置、已应用结果与保存

快照不可变。`ViewEngineState.version` 随发布递增，会话 `editVersion` 标识工作编辑版本。`RecordSession.queryAttempt` 捕获在途查询，`RecordSession.result` 将成功行绑定到当时的 config/filter/page/cursor 和 receivedAt；`AnalysisSession.compilation` 保存当前工作配置的不可变编译结果（计划或校验错误），供引擎和界面共享，避免渲染时重复编译；`AnalysisSession.pendingQuery` 捕获在途计划。展示来源和业务动作必须使用对应结果/请求快照，不能从工作编辑推断查询范围。渲染器和操作扩展使用当前实例元数据（包括未保存标题），查询配置仍绑定已执行结果。`ViewSession` 按 kind 区分；访问记录或分析专属字段前先收窄类型。共享字段包括 baseline、当前工作 instance、dirty、validation、writeStatus、writeError、requiresReload，以及可选 conflict。

记录会话保留 filterDraft、filterBaseline、appliedFilter、filterPending、页码/游标、行、汇总与选择。编辑工作筛选不会改变已应用查询或记录。filterPending 表示工作筛选与已应用范围不同，本身不阻止保存。分析会话独立保留成功 result 及查询/schema 来源；后续编辑或执行失败不会把旧行标记为新结果。

`save(id?)` 校验并保存当前工作内容，不执行查询。无效原始输入阻止保存；有效但未查询的编辑可以保存。回执推进保存基线，同时保留提交后的编辑。`saveAs({ title, scope }, id?)` 返回 `Promise<string | undefined>`：身份已知时返回创建 ID，创建核对可以跨越原选中实例。运行时行、选择、错误和倒计时不会作为配置保存。

### 命令与结果归属

`engine.analysis(id)` 将 `edit(updater)`、`run()`、`refresh()`、`clearSort()`、`setFilterValidity(valid)`、`restore()` 绑定到指定分析实例。edit/clearSort/restore 不查询；run 编译并校验完整结果后才发布。`engine.record(id)` 绑定 `edit(updater)`、`refresh()`、`setPage(page)`、`setPageSize(size)`、`applyFilter()`、`restore()`。实例生命周期被替换后，旧命令失效。编辑回调必须纯净，不得重入引擎命令。

`engine.analysis(id).refresh()` 请求安全的自动刷新：仅当当前查询仍与成功结果一致、编辑输入有效、写入空闲且没有冲突或待重载状态时执行；不满足条件则跳过，不提交草稿。`run()` 仍用于显式执行或重试。`AnalysisSession.queryValid` 统一由查询编译、编辑有效性和资源限制推导；仅展示配置错误不会使查询失效，但仍阻止保存。

两类会话都暴露 `editorEpoch`。采纳已审阅的远端版本会推进该代次并丢弃本地编辑器缓冲；普通重载和还原保留已约定的非破坏性输入行为。自定义已挂载编辑器应在 `(instance.id, editorEpoch)` 变化时重新绑定命令并重置本地缓冲，内置视图已处理。旧有效性回调在重置后被忽略，旧分析编辑和记录草稿编辑会被拒绝，不能覆盖刚采纳的远端配置。已发布的普通会话和待核对另存会话走同一最终校验路径。记录准入始终检查分页/布局判别字段及嵌套展示结构；失效字段或能力引用仍作为可恢复的语义错误处理。取消分析刷新时保留已有结果的成功状态，后续自动刷新可以继续。

记录操作统一通过 `engine.record(id)`：`setFilterDraft(configuration, valid?)`、`setFilterValidity(valid)`、`setFilterMode(mode)`、`applyFilter()`、`setSort(sort)`、`setColumns(columns)`、`setLayout(layout)`、`setCardConfig(card)`、`setPage(index)`、`setPageSize(size)`、`nextPage()`、`setSelection(keys)`、`refresh({ background? }?)`、`retryQuery()`、`refreshSummary()`。门面不再提供直接记录命令。共享操作为 setTitle、save、saveAs、restore、reloadInstance、renameInstance、deleteInstance、setDefaultInstance、reorderInstances。记录还原会恢复基线并查询；分析还原只恢复工作配置，不运行。

### 冲突、未知写入与运行上限

真实分歧在 session.conflict 中保留旧基线、本地编辑及最新远端文档。普通保存不能把旧内容静默附加到新 revision。页面提供使用最新版本、另存配置，以及有权限时覆盖。`useRemoteInstance(review, id?)` 与 `overwriteInstance(review, id?)` 要求确切的已审阅冲突快照；后续本地编辑或远端版本变化使旧确认失效。覆盖仍使用审阅过的远端 revision 做 CAS，远端元数据和当前权限始终有效。

未知写入结果单独处理：请求发出后的超时、网络错误或 UNKNOWN_OUTCOME 保留原操作，通过 reloadInstance 核对。未知创建重用原 requestId 与提交体，换新 requestId 可能产生重复。未知删除保留原身份与 revision。默认偏好、删除回执和跨标签页事务仍由宿主负责。内置内存/浏览器宿主是参考适配器，不是生产授权边界。

limits 默认：加载 15,000 ms，查询/写入 30,000 ms，4 个并发查询，5 份保留结果集，配置 262,144 字节。结果回收不会清除工作草稿或恢复状态。晚到读取不能覆盖新请求或不同结果范围；取消不作为用户查询失败。可选 onDiagnostic 只接收操作身份、类型、阶段、耗时及可选错误码，不携带查询/行内容，回调异常被隔离。部署时仍需核验宿主/后端契约和浏览器流程，具备这些 API 不代表生产验收完成。
