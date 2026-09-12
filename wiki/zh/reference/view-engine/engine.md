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
  return <ViewPage {...binding} record={{ selectable: true }} />;
}
```

`useViewEngine(options)` 负责创建、加载和释放，包括 React StrictMode。必填的 `scopeKey` 与 `definitionId` 标识生命周期，任一变化都会替换引擎。可选的本地 `definition`/`instances`、`extensions` 中成对的编译器/编辑器注册、`limits`、`onDiagnostic` 用于初始化该生命周期。同范围的 host 更新保留编辑；其他初始化输入需要重新建立时，显式改变 React key。返回的 `ViewEngineBinding` 为 `{ engine: ViewEngine | null, extensions?, error? }`。

`ViewPage` 是纯 UI，接收 binding 或调用方持有的 engine，不会自行加载或释放引擎。`ViewPageContent` 要求非 null engine。两者组合导航、共享写入和选中的 `RecordView` 或 `AnalysisView`；后两者只渲染各自类型。无界面调用方创建 `new ViewEngine({ definitionId, host, definition?, instances?, filterCompilers?, analysisCompilers?, limits?, onDiagnostic? })`，调用 `load()`，范围结束时调用 `dispose()`。

### 定义与已保存实例

`ViewDefinition` 包含 `id`、`title`、`sourceId`、共享 `fields`，以及可选的 `timeZone`、`allowedOperators`、`filterEditors`。至少声明一种能力：

- `record: { rowKey, allowedLayouts, defaultPresentation?, recordActions? }`。`RecordViewDefinition` 将该能力标记为必需；rowKey 是自有属性路径，allowedLayouts 是非空且不重复的 table/card 列表。
- `analysis: AnalysisCapability` 授权 COUNT、字段分组、数值函数、时间粒度和上限。仅聚合的数据源不需要记录主键或分页方法。

`ViewInstance` 是 `RecordViewInstance | AnalysisViewInstance | DashboardViewInstance` 判别联合。两者都要求非空 `id`、`definitionId`、`title`、`revision` 和 `scope`。`kind: 'record'` 使用 `RecordViewConfig`（filters、sort、pagination、presentation）；`kind: 'analysis'` 使用下文的 `AnalysisViewConfig`。scope 支持个人或公共/系统/共享分类，不代表权限。创建输入只省略 ID 和 revision，由服务回执返回。

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

## 独立运行位置

`commands.restore()` 恢复位置本地基线，不保存受管理实例。记录恢复会刷新自己的查询，分析恢复不执行查询。释放位置也会清除其查询元数据。

引擎加载后，`engine.openPosition(instance, definition)` 创建独立的记录或分析运行位置。每次打开的 `identity.id` 不同，`identity.instanceId` 保留保存身份。使用 `getSnapshot()` 读取状态、`subscribe(listener)` 订阅，记录通过 `commands.refresh()` 查询，分析首次执行通过 `commands.run()`。分析的 `refresh()` 保留既有安全自动刷新策略。打开位置本身不查询。

各位置使用自己的定义，重复引用同一保存实例时也有独立的分页、选择和结果。位置不加入实例导航，不占用普通历史结果缓存预算。所在界面关闭时调用 `dispose()`，旧命令随后拒绝执行。位置会话暴露 `positionId`，该值不持久化。`engine.save(identity.id)` 不允许保存运行位置；持久化配置应编辑原来的受管理实例。

## 仪表盘组合

定义声明 `dashboard: true` 后可保存 `DashboardViewInstance`。纯仪表盘定义不需要 `sourceId`；记录/分析能力仍要求数据源。`config` 为 `{ schemaVersion: 1, panels, filters }`。面板保存 `{ id, instanceId, layout: { x, y, w, h } }`：稳定面板 ID 与整数网格坐标/尺寸。网格为 12 列，x/y 非负，w 为 1–12，x+w ≤ 12，h 为 1–100，y+h ≤ 10000。引用必须解析为记录或分析实例；重复引用有独立运行位置。

```ts
const definition = {
  id: 'overview',
  title: '业务概览',
  fields: [],
  dashboard: true as const,
};
const engine = new ViewEngine({
  definitionId: definition.id,
  definition,
  host,
});
await engine.load();
const draftId = engine.createDashboard({
  title: '销售概览',
  scope: { type: 'personal' },
});
const dashboard = engine.dashboard(draftId);
dashboard.edit(config => ({
  ...config,
  panels: [
    {
      id: 'orders-panel',
      instanceId: 'saved-orders',
      layout: { x: 0, y: 0, w: 12, h: 18 },
    },
  ],
}));
await engine.save(draftId); // 首次真实创建，由宿主提供保存身份与 revision。
```

`permission.getDefinition()` 必须明确授予 `createPersonal` / `createShared`，缺省拒绝。未保存会话标记 `persisted: false`，不会进入权威 `instanceIds`；创建草稿不写入。保存、另存、版本冲突及未知创建核对复用统一实例服务，只保存仪表盘配置，不保存引用的子配置。

`engine.dashboard(id)` 返回 `DashboardRuntime`，提供稳定的 `getSnapshot` / `subscribe`，以及 `edit`、`setFilter`、`setEditorValidity`、`apply`、`refresh(panelId?)`、`reloadReference(panelId)`、`suspend`、`resume`、`dispose`。引擎负责导航暂停/恢复与释放。`DashboardView` 只展示调用方拥有的运行对象；`ViewPage` 将其接入既有导航与保存操作。`RecordContent` 通过会话、定义和绑定命令复用表格、卡片、业务操作与分页，不依赖页面导航。

快照分别保存 `config` 草稿和 `applied` 已应用配置，并提供 `pending`、包含 dirty/写入状态的 `session`、`editable`、校验及逐面板状态。查询应用全局草稿；刷新沿用已应用快照；保存不查询。暂停释放运行位置/结果，返回时重新授权并使用保留的子版本；显式重载引用才采用最新保存配置。布局调整保留位置身份，不发查询。

每个全局项保存 `{ id, filters: FilterConfiguration, bindings, excludedPanelIds }`，每个面板必须恰好绑定一次或明确不参与。字段绑定为 `{ panelId, kind: 'fields', fields, semanticCompatibility: true }`，元素完整路径与 SEARCH 字段列表必须全部映射。转换绑定为 `{ panelId, kind: 'transform', name, options? }`；在 `ViewEngineOptions.dashboardTransforms` 注册同步纯函数，接收只读 `{ expression, source, target, instance, options }`。转换缺失或无效时阻断整个受影响面板，不删去 OR 分支。最终作用域为原子视图条件 AND 所有参与的全局条件。

可选 `host.dashboard.search({ query, cursor? }, signal?)` 返回 `{ items: [{ id, definitionId, title, kind }], nextCursor }`，每次最多 100 个候选。使用前重新加载并授权；未提供 search 时隐藏添加/替换入口。`host.dashboard.openOriginal({ instanceId, definitionId })` 提供原视图导航。`extensions.dashboard.transforms[name]` 提供 `label`、可选 `applicable`、`hasOptions`，以及接受 `value`、`onChange`、`onValidityChange` 的受控 `Editor`；执行仍在核心注册表。`useViewEngine` 在访问生命周期开始时捕获配对注册表。未知扩展保留展示，不静默改写。

布局采用 react-grid-layout，支持二维移动与宽高缩放。手势结束才提交预览，Escape 取消当前手势。布局撤销、重做和取消仅影响几何配置；有标签控件提供非拖拽等效操作。窄容器单列堆叠且不回写桌面坐标。布局变化保留查询位置且不发起取数；原子视图的配置编辑与保存仍在面板外完成。

### 预算与兼容

`RuntimeLimits` 默认：`maxDashboardPanels=12`、`maxDashboardFilters=32`、`maxDashboardResultRows=12000`、`maxDashboardResultBytes=16777216`、`maxDashboardMetadataBytes=127926272`（每引擎 122 MiB）。结果行数/字节在发布前累计当前仪表盘所有面板；元数据接纳按整个引擎保留的配置/引用 JSON 字节计数。`scripts/verify-dashboard-budget.mjs` 实测 1/6/20 个仪表盘 × 12 面板、重复/不同引用及 262144 字节子配置；默认值取最坏测量负载向上取整至 MiB 后的两倍，不代表传输或堆内存上限。

仪表盘数据请求共享引擎并发预算和 48 项 FIFO 等待队列；独立记录/分析入口仍保持即时 BUSY。引用加载独立并发 4、等待 24，每次真实实例/定义/数据源加载分别计执行期限。等待会话使用 `queryStatus: 'waiting'`；诊断 queued/started/终态分开报告等待与执行耗时，不含筛选值或记录。全局和合并表达式分别限制深度 32、节点 512；传输响应体上限仍由宿主保障。

Stateful/Memory/Local 与示例 HTTP 宿主接受 `supportedFormats: { record: true, analysis: true, dashboard: 1 }`，缺省表示旧客户端；HTTP 适配器发送 `X-View-Formats`。所有实例响应统一投影：隐藏的仪表盘默认项返回 null 而不改变真实偏好，删除回执可重放，旧客户端排序保留隐藏位置；不支持的单实例读写在变更前拒绝。先部署宿主格式投影，再允许创建仪表盘；客户端回退时保留投影。

本地测试、模拟实例服务持久化与只读 Wow 查询是不同证据。真实触摸、读屏、业务用户走查及生产宿主授权/回退准入仍需在消费应用验证。

动作渲染器提供可选的 `isCurrent()`。异步写入前应立即检查：位置、结果快照、已应用口径和批量选择可能已经过期。应用不同口径会卸载旧结果的动作扩展及其对话框；同口径刷新失败仍保留恢复操作。

本地仪表盘草稿在导航与管理器中显示为独立的未保存分组，仍不进入权威 `instanceIds`，不参与已保存视图的排序或默认设置。`createDashboard()` 在创建本地状态前同时检查创建授权和宿主 `instance.create` 服务。
