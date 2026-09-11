# ViewPage 混合实例交互：对抗性验证

日期：2026-09-10。基线：`f01d2dd0`，功能源码未修改。

结论：目前不能宣称交互方案已通过验收。确认 1 个现有运行缺陷、4 个设计规则缺口。分析视图尚未实现，后四项是规格反例，不是已运行分析系统的缺陷。

## 1. P1：未确认的多值文本切换后丢失，并被误判为有效

证据级别：真实 ViewEngine + ViewPageContent + 内置过滤组件的 jsdom 运行复现。

步骤：实例 A 的订单编号 IN 过滤已有 `ORDER-001`；再输入 `ORDER-002`，不按回车；切到 B，再切回 A。

| 观察项        | 切换前    | 切换后实际 | 期望      |
| ------------- | --------- | ---------- | --------- |
| 未确认文字    | ORDER-002 | 空字符串   | ORDER-002 |
| filterValid   | false     | true       | false     |
| filterPending | true      | false      | true      |

根因链：`FilterTextValues.tsx:38` 将 text 存在局部 useState，onChange 只上报有效性；TextValues 注册仅在确认时提交 values。ViewPageContent 的 key=id 导致卸载重建，文字和 useFilterPanelEditors 的本地错误映射同时归零；其 effect 把重新计算的 true 上报回会话。会话虽保留旧 filterDraft，却没有这段原始输入，因而不能恢复。

影响：用户已明确输入的筛选内容消失，页面不再提示尚未应用。它不是“已保存配置未恢复”的问题，也不是所有过滤器都丢草稿。

修正规则：需要跨实例保留的行内原始输入必须每次变更进入实例草稿或可恢复编辑状态，不能只保存编译成功值及一个 valid 布尔量；恢复时从原始数据重算错误。明确带确认/取消的日期弹层继续遵循自己的暂存/取消语义，不把取消误当成自动提交。不通过隐藏 DOM 保活绕过状态归属问题。

## 2. P2：同口径刷新失败，缓存分支会隐藏错误

证据级别：原交互流程图的确定性反例。

步骤：分析 A 用 Q 查询成功得到 R；点击刷新仍执行 Q，但请求失败；切到 B 后返回 A。R 仍匹配已应用 Q，原流程图先判“存在匹配结果”，直接进入正常展示，无法到达下方“最近查询失败”分支。这与正文“失败时切回保留错误”冲突。

修正规则：最近一次请求状态与最后成功结果正交。先处理当前请求/最近失败状态，再决定是否附带旧结果；有缓存不能清除错误。失败页可同时显示 R、时间和重试按钮，成功刷新后才清除失败。当前有效请求仍在运行时不启动第二个请求。

## 3. P1：目标标题与可操作会话可能不一致

证据级别：新 openingId 方案与现有实例操作接口的接合缺口。

步骤：A 有未保存修改；打开需要远程加载的 B。页面先把标题与选中状态显示为 B，但现有 selectedInstanceId 仍为 A。若只换主体占位而保留按 selectedInstanceId 绑定的公共工具栏，用户会在“B”标题下保存/恢复/删除 A。B 加载失败时同样存在这个窗口。

现有代码只在 B 加载成功后切换 selectedInstanceId，本项不声称当前 UI 已经发生串操作；风险来自拟议的“立即显示目标”改造。

修正规则：openingId 存在或目标打开失败时，页面 activeSession 必须为 null；保存、另存、恢复、删除、刷新、布局与业务操作不渲染或不可用。目标配置验证完成后，标题、当前会话、权限投影和动作上下文作为同一次导航提交生效。A 已发出的写入继续归属于 A，但不能通过 B 页面再发起 A 的操作。未知 B 不伪造导航业务实例，列表中不能错误高亮 A。

验收需覆盖通过真实公共按钮触发动作，不能只断言 selectedInstanceId。

## 4. P1：旧结果上的排序可能作用于新口径

证据级别：保存独立成功结果 schema 与表头排序规则之间的缺口。

步骤：Q1 按状态分组、指标 m1=SUM(金额)，成功得到 R1。用户改成 Q2，删除 m1 或把它改为 AVG(金额)，应用后查询失败，页面保留 R1。此时点击 R1 的 m1 表头，原规格“表头按已应用口径排序”可能将旧别名注入 Q2；即使别名仍存在，统计语义也已改变。

修正规则：结果表发起查询的交互必须绑定成功结果的查询身份，并在执行时与当前已应用身份核对。语义不一致的旧结果只读，表头排序不可用并说明“请先成功应用当前配置”；刷新/重试通过当前口径工具栏触发。只有显示名称或列宽变化且统计身份一致时，才允许不重查地更新展示。不能只检查 alias 是否存在。

## 5. P2：相对时间查询 JSON 相同，不代表结果仍属于“今天”

证据级别：公开 DSL 源码支持的规格反例。

`filter.today` 返回包含 TODAY、field 和选项的表达式，没有执行日期。时间由服务执行时解释。步骤：23:59 查询“今天”并缓存，次日 00:01 切回；仅比较 query JSON 会命中昨天结果，但当前配置摘要仍写“今天”。仅显示一个更新时间不足以把它当作当前结果。

修正规则：缓存匹配至少包含定义/编译语义身份以及 query；定义变化需使结果重新验证。对于包含任意嵌套相对时间条件的已应用表达式，首版在重新进入实例时重新查询，不引入前端日历边界计算或后台定时器。旧结果按执行时间标为历史结果，成功后替换；一直停留页面时也展示执行时间，不承诺实时性。相对时间 query 仍原样保存，不在浏览器提前固化成绝对时间。

本项不把一般业务数据变化全部解释为缓存失效：静态条件仍采用上次结果加手动刷新，用户可明确看到结果时间。

## 6. 未被击穿但不能过度推断的部分

- 47 条既有针对性测试通过，覆盖保存期间继续编辑、另存完成不抢新选择、迟到查询、回调重入、删除协调和编辑权限投影等路径。
- 请求令牌与 lifecycle 已有实现基础，不能在架构重构时仅保留 AbortController 而删掉返回时核验。
- 当前权限服务描述写入/管理能力。它不证明缓存的读取授权持续有效；宿主明确通知访问范围变化时必须销毁旧引擎，认证/授权失败也不能按普通网络错误无限展示旧数据。不能声称库能发现宿主未通知的服务端权限撤销。
- 大批量访问实例会积累结果内存。首版不承诺无限结果保留，不因此引入新的缓存框架；如实际规模要求结果淘汰，必须保留草稿并在回访时明确重查，不能悄悄删除编辑内容。
- 本轮没有运行真实浏览器的焦点、弹层、IME 或路由离开验证，也没有真实聚合后端验证。

## 7. 执行记录与复现

执行成功：`pnpm install --frozen-lockfile`；未修改 lockfile 或新增依赖。依赖构建 `pnpm --filter '@ahoo-wang/fetcher-view-engine^...' build` 成功，包含 8 个依赖工作区；不是整个 monorepo 构建。

执行的针对性命令：

```sh
pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run \
  test/viewSwitching.adversarial.test.tsx \
  test/engine/navigation.test.ts test/engine/save.test.ts \
  test/engine/saveAs.test.ts test/engine/writeRecovery.test.ts \
  test/engine/deletion.test.ts test/engine/reentrantQueries.test.ts \
  test/engine/reentrantWrites.test.ts test/viewEngine.capabilities.test.ts \
  --coverage.enabled=false
```

结果：9 个文件，8 通过、1 失败；48 个用例，47 通过、1 失败；耗时 2.91 秒。失败用例包含上表三个 soft assertions，分别证明文字丢失、valid 变 true、pending 变 false。命令退出码 1。该失败是缺陷确认，不是修复后的绿测。

复现源码保存在 `assets/view-switching-repro.tsx.txt`，没有留在默认测试发现目录，避免将此次审查实验混入正式套件。该文件是测试源码文本，运行前复制到它原来的位置：

```sh
# 从仓库根目录执行；已有同名文件时直接退出，失败后也清理临时副本。
(
  set -e
  repro_path=packages/view-engine/test/viewSwitching.adversarial.test.tsx
  test ! -e "$repro_path"
  cp docs/superpowers/reviews/assets/view-switching-repro.tsx.txt "$repro_path"
  trap 'rm "$repro_path"' EXIT
  pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/viewSwitching.adversarial.test.tsx --coverage.enabled=false
)
```

未运行 `pnpm test:unit`、全包类型检查、compiled 测试或浏览器验收。生产源码未修复，未提交。上一阶段“依赖未安装”的环境阻塞在本轮已解除。

## 8. 进入实现前的判定

架构方向保留。交互规格必须纳入 2—5 的动作/状态守卫；第 1 项在实现阶段先修复共享编辑状态，再复用到分析。完善设计文字或流程图不等于运行缺陷已修复。后续至少把本次红测转成正式回归，并新增目标加载时按钮绑定、同口径刷新失败、旧 schema 排序和相对时间回访测试。
