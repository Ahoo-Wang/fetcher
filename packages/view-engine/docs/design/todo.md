# TODO

规则，先读再加：

- 只记**已经决定、但还没做**的事。尚无结论的产品问题不在这里，在 [decisions.md#搁置待议](decisions.md#搁置待议)。
- 每条都要写清 **为什么** / **做完的判据** / **落点**（design 里的哪一页，或哪个文件）。三者缺一就不是一条 TODO，是一句抱怨。
- 做完就**删掉**这一条，不打勾、不留归档。历史在 git 里。
- 改行为之前先看这里有没有对应项；有就接着做，别另起一条。

## 重构（小步，每步一个 PR，零行为变化）

- **R5 写入结局模型去重**——为什么：`useSaveCommands` 与 `useViewManager` 各写了一遍"结局怎么结清、哪种恢复算写了视图、什么时候禁用"。判据：`src/react/writes.ts` 给出 `settle` / `RecoveredWrite` / `savesView` / `blockedBy`，两个钩子共用，两边测试不变。落点：`src/react/`、[management.md#冲突与未知结果](management.md#冲突与未知结果)。
- **R6 文案目录分文件 + `MessageKey` 类型**——为什么：一份平铺的目录看不出哪些键还活着。判据：按前缀分文件并导出 `MessageKey`；同时删除死键 `label.save.rename`、`label.save.delete`、`label.rename.heading`、`label.rename.description`、`label.unknown.consequence`；`test/messages.test.tsx` 仍全绿。落点：`src/ui/messages.ts`、[ui/README.md#措辞与-messagesprovider](ui/README.md#措辞与-messagesprovider)。
- **R7 `runtime/viewEngine.ts` 抽 `writeLedger.ts`**——为什么：注册表与写入账本两件事同在一个类里；870 代码行，绊线里最大的一条豁免。判据：`writes` / `owners` / `pendingWrites` / `retry` / `abandon` / `resolveConflict` 移入 `writeLedger.ts`，`ViewEngine` 公开面不变；下线到 500 代码行以内并删除 `eslint.config.js` 里的 override。落点：`src/runtime/`、[runtime.md#viewengine](runtime.md#viewengine)。

## `max-lines` 存量豁免（拆到阈值以内就删掉 override）

绊线已落地：`src` 上限 500 代码行、`test` 上限 1200，只数代码行（跳过空行与注释）；vendored 的 `ui/components`、`ui/lib` 与纯文案目录 `ui/messages` 不在管辖内。下面八个文件（含上面的 R7）在落地当天就超线，上限被钉在当天的行数，只准降不准升。**新增一条 override 必须同时在这里新增一条 TODO**，否则绊线就成了摆设。

- **R8 `src/analysis/validate.ts` 下线**——为什么：骨架、预算、别名、元素域、指标、having、排序七套规则挤在 701 代码行里，加一条分析规则就得在这个文件里找位置。判据：按规则族拆成同目录的若干文件（如 `validateMetrics.ts`、`validateHaving.ts`、`validateBudget.ts`），`validateAnalysis` 的签名与 Issue 码不变，`test/analysis.test.ts` 不改断言；下线到 500 代码行以内并删除 `eslint.config.js` 里的 override。落点：`src/analysis/`、[kernels.md#analysis-内核的规则](kernels.md#analysis-内核的规则)。
- **R9 `src/ui/AnalysisChart.tsx` 下线**——为什么：Cartesian、Pie、Scatter、Heatmap、Funnel、MetricCard 六个家族的渲染器连同调色与坐标轴工具同居 599 代码行，改一个家族要通读全部。判据：每个家族一个文件（`charts/` 子目录），调色与坐标轴工具单独成文件，`AnalysisChart` 只剩按 family 分派；`test/analysisChart.test.ts` 不改断言；下线到 500 代码行以内并删除 override。落点：`src/ui/`、[ui/analysis.md#analysischart-与-shapechart](ui/analysis.md#analysischart-与-shapechart)。
- **R10 `src/runtime/dashboardRuntime.ts` 下线**——为什么：子运行时编排、轮询调度、全局筛选注入三件事同在一个类里，511 代码行。判据：面板解析与子运行时生命周期抽出独立模块，`DashboardRuntime` 接口不变；`test/dashboardRuntime.test.ts` 不改断言；下线到 500 代码行以内并删除 override。落点：`src/runtime/`、[runtime.md#dashboard](runtime.md#dashboard)。
- **R11 `test/analysis.test.ts` 下线**——为什么：1882 代码行、十个顶层 `describe`，从 `defaultAnalysisConfig` 一路盖到图表投影，跑一次全量才知道改坏了哪一层。判据：按顶层 `describe` 拆成 `analysisValidate` / `analysisCompile` / `analysisProject` 等文件，用例一条不删；下线到 1200 代码行以内并删除 override。落点：`test/`。
- **R12 `test/reactHooks.test.tsx` 下线**——为什么：十一个钩子的套件共 1766 代码行，一个钩子的失败要在整份输出里找。判据：按钩子拆文件（`useFilterEditor`、`useRecordTable`、`useSaveCommands`、`useViewList` 各自成文件），共用夹具进 `test/fixtures*`；下线到 1200 代码行以内并删除 override。落点：`test/`、[react.md](react.md)。
- **R13 `test/filter.test.ts` 下线**——为什么：校验、编译、时间解析、描述、树编辑五个主题合成 1467 代码行，时间用例尤其厚。判据：时间相关的 `describe` 独立成 `filterTime.test.ts`，树编辑与描述各自成文件，用例一条不删；下线到 1200 代码行以内并删除 override。落点：`test/`。
- **R14 `test/recordWorkbench.test.tsx` 下线**——为什么：渲染、交互、保存、视图管理、布局五个主题合成 1254 代码行，其中保存与视图管理本就属于别的套件。判据：保存与视图管理的 `describe` 并入对应套件，工作台文件只留渲染、交互与布局；下线到 1200 代码行以内并删除 override。落点：`test/`、[ui/README.md#工作台骨架](ui/README.md#工作台骨架)。

（架构测试里「`*Workbench.tsx` 不得绕过 `useWorkbench` 直接 import 装配用的钩子」那一条已随 R3 落地。）

## 功能（legacy 形态）

- **侧栏可折叠**——为什么：legacy 有，现在没有，窄屏上侧栏占掉结果的宽度。判据：折叠时标题栏最左出现展开按钮 + 定义标题 + 视图切换下拉（按受众分组、当前项打勾、系统标签、底部"管理视图"项）；筛选带增加"撤销筛选修改"（草稿筛选退回已应用）；对照 `view-engine-legacy` 截图。落点：`src/ui/ViewList.tsx`、`src/ui/ViewHeader.tsx`、[ui/README.md#工作台骨架](ui/README.md#工作台骨架)。
- **写入结局的 Storybook 故事**——为什么：conflict / unknown / rejected 三条路径只有单测走过，改 UI 时没人看得见它们。判据：`WriteOutcome`、管理器行内结局、删除冲突二次确认各有故事，夹具的假存储能注入 `CONFLICT` 与 `UNAVAILABLE`。落点：`stories/`、`test/fixtures/`、[management.md#冲突与未知结果](management.md#冲突与未知结果)。
- **文案支持中文**——为什么：目录只有英文默认句，宿主要中文得自己覆盖四百多个键，等于没有本地化。判据：`/ui` 导出完整的 `zhCN` 目录（`messages/zh-CN.ts`），`test/messages.test.tsx` 断言它与英文目录键集合一致、占位符成对；`ViewSurface` 的 `messages={zhCN}` 传入即生效；Record 工作台有一个中文文案故事。落点：`src/ui/messages/`，与 R6 的分文件、`MessageKey` 类型化同一个 PR 做。

## 小修

- **删除后重载列表的合同容易漏**——为什么：宿主直接经引擎删除实例时必须调用 `list.reload({ without: id })`，这条合同写在文档里而不是类型里。判据：评估改为引擎侧通知（架构决定，先记录，不急着改）；结论写进 [decisions.md](decisions.md)。落点：[react.md#useviewlist](react.md#useviewlist)。
- **筛选面板里 Enter 提交**——为什么：[ui/README.md#filterpanel-的布局](ui/README.md#filterpanel-的布局) 写了 Enter 提交（排除 IME 组字与内部弹层），重写后的 `FilterPanel` 没有这个处理器，是一处遗漏。判据：在条件的值输入里按 Enter 等于点击应用；IME 组字中、弹层（Select／Combobox／Popover／Dialog）内的 Enter 不触发；`test/filterPanel.test.tsx` 覆盖三种情况。落点：`src/ui/FilterPanel.tsx`。
