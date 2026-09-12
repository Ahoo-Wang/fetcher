# View Engine 行为锁定结构优化设计

状态：草案，待用户审阅。
基线：`891f441a`。范围：仅 `packages/view-engine` 内部结构、包级测试/lint 配置与增量类型导出；不改 Storybook、示例、wiki 与宿主接入（增量导出的文档同步除外）。

前置关系：本设计是 `2026-09-09-view-engine-architecture-refactor-design.md`（职责收敛重构，已交付）之后的第二轮结构工作。上一轮允许接口调整；本轮**行为锁定**：不改任何可观察行为，公共 API 仅允许纯增量。

动机：仪表盘视图（第三种 view kind）与 view-engine-server 两个后续子项目都将在 engine 写路径与 analysis 编辑域上开发。当前 `ViewReload.reloadInstance`（236 行）与 `ViewPersistence.write`（260 行）把门控、分发、对账熔在单方法里，正确性依赖隐式不变量；`AnalysisEditor.tsx`（1022 行，其中 `ComponentList` 约 647 行）是唯一巨石文件。在功能扩张前显式化这些不变量并划清编辑域边界，是本轮的全部目的。

## 1. 目标与约束

- 行为与公共 API 零变更，纯增量除外。不修改任何既有测试断言；`test`、`test:compiled`、`test:type` 全程保持绿。
- 沿用上一轮原则：不以减少单文件行数作为目标——拆分以"写路径不变量显式化、编辑域边界可独立测试"为准绳；不引入状态机或流程框架。
- 每阶段独立提交，先护栏后重构；任何阶段失败可独立回退。
- 失败恢复 catch 去重、判别 patch 去重只消除重复表达，不合并语义（save/saveAs/overwrite/reload 仍各自保持独立路径与既有次序）。

## 2. 范围

| 阶段 | 内容 | 风险 |
| --- | --- | --- |
| A 质量护栏 | coverage thresholds 基线 + eslint 类型检查收紧 | 无（只加约束） |
| B 分层修正 | viewServiceContract → contracts/；runtimeLimits → lib/ | 低（纯移动） |
| C 写路径分解 | write/reloadInstance 三段化 + 失败恢复去重 | 中（核心不变量） |
| D 编辑器拆分 | AnalysisEditor 按编辑域拆文件 | 中（渲染时序） |
| E 增量 API | 导出命令命名类型 + 文档同步 | 低 |

范围外：i18n、wiki 指南漂移修复、viewer 迁移指南（按路线图分别推迟到发布后）；仪表盘、view-engine-server（后续子项目）；一切行为调整。

## 3. Stage A：质量护栏

1. 先跑 `vitest run --coverage` 测出当前行/分支/函数/语句基线，在 `vitest.config.ts` coverage 段设置 thresholds = 基线（行/语句容差 -1%，分支/函数取整基线）。目的：重构期间覆盖率静默下滑即红。fixtures 与类型声明文件可列入排除。
2. `eslint.config.js` 的 typescript-eslint 从 recommended 升级 strictTypeChecked。若新发现项超过 50 处，降级为 recommendedTypeChecked 并追加高价值规则（至少 `no-unnecessary-type-assertion`、`no-floating-promises`）；发现项就地修复或逐条精确 disable，禁止文件级宽泛 disable。
3. 本阶段独立提交。它产生的修复（如有）必须同样不改变行为。

## 4. Stage B：分层修正（纯移动）

1. `src/record/viewServiceContract.ts` → `src/contracts/viewServiceContract.ts`。依据：它定义 `ViewServiceError`、服务错误码与资源 ID 编码，是服务契约而非 record 域件；现存 11 处跨层引用（contracts/ViewHost、engine×3、record×5、公共导出×2）皆因它放错位置。移动后更新 import，公共入口 re-export 路径同步，消费者无感知。
2. `src/engine/runtimeLimits.ts` → `src/lib/runtimeLimits.ts`。依据：`withDeadline`/`QueryBudget` 是通用 deadline/预算工具，且 `contracts/viewModel.ts:40` 反向依赖它造成 contracts→engine 类型级倒置；移入 lib/ 后倒置消除。该文件未进公共 API，11 处 src 引用 + 2 处 test 引用机械更新。
3. 附带：`src/engine/sessionValidation.ts` 为引擎内部件，与公共导出 `record/recordValidation.ts` 同名异实；改名以消除混淆（名称在实施计划中按其实际职责确定，如缓存语义），纯内部动作。
4. 本阶段不得有任何非 import 行为差异；`test/architecture.test.ts` 的入口闭包与无环断言必须保持绿。

## 5. Stage C：写路径分解

### 5.1 ViewPersistence.write（260 行 → 编排 ≤60 行）

按既有骨架拆为私有函数（不新增导出，不改类结构）：

| 函数 | 承载现行为（基线行号） |
| --- | --- |
| `prepareWrite(session, options, review)` | 85-126：validation、assertWritable、conflict review、权限、scope 限制、submitted 构建与 validateViewInstance |
| `dispatchWrite(submitted, options)` | 127-199：beginWrite、状态 patch、create（UNKNOWN_OUTCOME 检查、beginCreate、receipt 重放语义）与 save 两条 withDeadline 分发 |
| `reconcileCreate(saved, …)` | 202-284：receipt/ID/原样保存契约校验、选区迁移（advanceSelection 双查）、isDeleted 短路、publish |
| `reconcileSave(saved, latest)` | 285-303：baseline patch |
| `reconcileWriteFailure(error, ctx)` | 304-323 catch：货币守卫 → finishWrite → patch{writeError, writeStatus idle, 条件 requiresReload} → rethrow |

约束：

- `received`/`dispatched` 标志进入 `ctx` 传递；`current()` 货币闭包语义（`scope.current(lifecycle) && writeToken(id) === token`）逐字保留，检查点的相对次序不得移动。
- `reconcileWriteFailure` 同时服务 `ViewManagement.renameInstance`/`deleteInstance` 的 catch（现存 4 处重复恢复模式）；finish 动作与 patch 形状参数化，单一实现承载"货币守卫 + 错误落盘 + rethrow"骨架。`ViewReload` 的 finishReload 变体共享骨架、参数化 finish，不强行合并分支语义。
- record/analysis 判别展开（`ViewPersistence.ts:288-298`、`ViewManagement.ts:99-108`、`ViewEngine.ts:492-494`）收敛为 `sessionState.ts` 导出的单个帮助函数（如 `baselinePatch(saved, instance)`），以 `saved.kind` 判别返回既有 patch 联合类型；三处调用点替换（调用点清单在实施计划中逐条核对）。

### 5.2 ViewReload.reloadInstance（236 行 → 编排 ≤60 行）

| 函数 | 承载现行为（基线行号） |
| --- | --- |
| `beginReloadGate(id, controller)` | 97-126：sessionForReload、canReloadInstance、writeToken 冲突、beginReload、previous.abort、queries.cancel |
| `fetchReloadResult(unverified, session, controller)` | 127-196：list 查找 / create 原请求重放 / 直接 load 三种分发模式（含重放前权限复查） |
| `validateReloadResult(result, session, unverified)` | 197-211：validateViewInstance、kind 不变断言、copy |
| `reconcileUnverifiedCreate(baseline, …)` | 213-302：selectCopy 迁移、rebase-or-inherit、pendingCreates 摘除与 publish |
| `reconcileReloadedInstance(baseline, latest)` | 303-317：followUp + rebaseSession patch |
| 失败恢复 | 318-330：与 5.1 共享骨架（finishReload 参数化） |

- 内联 9 处 `!this.scope.current(lifecycle) || this.work.reloadToken(id) !== controller` 收敛为单一 `currency()` 闭包（对齐 ViewPersistence 的 `current()` 模式）；收敛只允许发生在语义完全相同的检查点。
- 行 331 `void followUp?.().catch(() => {})` 的"成功路径尾部触发"时序原样保留（不得移入 finally 或 publish 回调）。

### 5.3 验收

- `test/engine/` 32 个行为分组文件（reentrantWrites/writeRecovery/unifiedRecovery/createRecovery/reconciliation/operationInvariants/runtimeBudget 等）全部绿；不修改任何既有断言。
- 提取出的纯函数可选择性补充直接单元测试（增量，不改既有文件）。

## 6. Stage D：AnalysisEditor 拆分（1022 行 → 单文件 ≤400 行）

保持公共面不变：`AnalysisEditor` 仍自 `./AnalysisEditor.js` 导出，`react.ts` 不动。按编辑域拆分：

| 新文件 | 内容 | 现行位置（基线行号） |
| --- | --- | --- |
| `analysisEditorLabels.ts` | groupNames/names/dateLabels/analysisOutputs（纯数据与函数） | 75-121, 156-163 |
| `AnalysisComponentList.tsx` | 列表容器：useListOrder、增删与预算、折叠摘要 chips、expandedId/openedIds 状态所有者 | 164-810 的容器职责 |
| `AnalysisComponentForm.tsx` | 展开态单项编辑表单（字段/分组/函数/表达式/桶宽/别名/标题/删除），受控于 List 的 expandedId | 240-810 主体 |
| `AnalysisSortEditor.tsx` | 高级设置 fieldset（排序编辑 + limit） | 约 865-1022 |
| `AnalysisEditor.tsx`（保留） | 顶层组合、scope 上下文 try/catch、OverlayScope | 811-872 |

约束：

- 只移动 JSX 与就近 handler；`expandedId/openedIds` 状态所有者留在 List，Form 经 props 受控，不引入新状态管理。
- `if (props.visible === false && expandedId !== null) setExpandedId(null)` 渲染期收敛写法原样保留（React Compiler 与 OverlayScope 依赖现有行为）。
- 每拆一个文件即跑 `test/analysisEditor.test.tsx`（25 用例）与 analysisControls/analysisView 相关测试；不修改既有断言。

## 7. Stage E：增量 API 与文档

1. `engine.record(id)` / `engine.analysis(id)` 当前返回推断类型（`ViewEngine.ts:298-353`），提取为命名接口（命名在实施计划中对齐现有风格，如 `RecordInstanceCommands`/`AnalysisInstanceCommands`），从 core 入口 `export type`。方法签名逐字不变。
2. 按仓库规则同步 `skills/fetcher-view-engine/references/api.md` 与 wiki reference symbols 清单，双语同步。
3. 不顺带修复 wiki 指南漂移（已按路线图推迟到发布后）。

## 8. 整体验收

- 每阶段结束：`pnpm --filter @ahoo-wang/fetcher-view-engine test`（含 compiled 与 type）绿；全部完成后根 `pnpm test:unit` 通过。
- Stage A 后 coverage thresholds 与 lint 收紧持续生效且不红。
- 公共行为零变化：全仓不出现对既有测试断言的修改（新增测试除外）；diff 审查确认无快照/文案/时序变更。
- 结构目标：write/reloadInstance 编排函数各 ≤60 行；AnalysisEditor.tsx ≤400 行；contracts→engine 反向 import 清零。
- 增量导出同步 api.md/symbols 文档。

## 9. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 写路径拆分移动隐式时序（token/货币检查次序） | 拆分以"逐行搬运 + 命名"为默认手法；检查点相对次序不变列入审查清单；32 个行为分组测试为回归规格 |
| 严格 lint 发现项超预期 | 预设降级策略（Stage A 第 2 条），不阻塞阶段推进 |
| AnalysisEditor 拆分引入渲染差异 | 每拆一个文件即跑 25 用例；渲染期 setState 与 OverlayScope 行为原样保留；compiled 模式测试兜底 |
| coverage 基线恰逢波动文件 | thresholds 取基线留 -1% 容差；排除清单仅限测试夹具与类型声明 |

## 10. 设计自审

- 行为锁定与增量 API 约束贯穿各阶段；唯一 API 变更是纯增量的类型导出。
- 不与 2026-09-09 规格冲突：该轮收敛职责与配置树（已完成）；本轮只显式化其产出的不变量，不重新分散状态。
- 拆分以不变量显式化与编辑域边界为目的，行数上限仅作粗验收参照而非目标本身。
- 无占位符；所有现行为以行号锚定到基线 `891f441a`，实施计划阶段逐条核对。
