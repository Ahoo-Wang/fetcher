# View Engine List Sorting Implementation Plan

**Goal:** 用新版 dnd-kit 统一五类列表排序，减少维护机制与重复代码。

**Execution:** 用户选择当前会话顺序执行。每阶段独立 PR，CI 与审查问题处理完成后 squash 合并，再继续。错误边界 PR #1456 已合并；本阶段基线 main `c35d121c`。

## 已确认的设计调整

- 用户明确原交互仅作参考，view-engine 处于原型阶段，没有兼容债务。优先清晰模型，不保留旧 HTML5 事件或方向键即时提交。
- 单一权威数据源，手势期间只预览，放下后调用一次业务提交。键盘采用库原生 Space/Enter 拾起、方向键移动、放下与 Escape 取消。
- 列、摘要、排序优先级、分析输出、视图管理共用内部 ListOrder；业务层保留固定区、分组、授权和持久化规则。Dashboard 网格仍使用 react-grid-layout。
- 使用 @dnd-kit/react 与 @dnd-kit/dom 0.5.0。禁用默认 OptimisticSortingPlugin，保留库的 clone 预览、键盘、指针、滚动和无障碍支持。浏览器反例证明默认乐观 DOM 重排在异步写入失败后可能与数据不一致。
- ListOrderItem 直接持有原有 li，统一注册与落点样式，不额外套 DOM。onChange 的内部 move 元数据保留跨组交错序列的全局 splice 语义。
- owner、ID 序列、排序资格、禁用变化使手势失效。提交取最新对象，取消不恢复旧快照。异步回执不得更新已卸载或其他实例的反馈。
- 源代码净变化按基线同一组文件加新增文件统计，排除注释、空行、测试、文档；不删除必要保护或降低预算以通过门槛。

## Task 1 — 共享排序及调用方

- [x] 固定依赖版本、catalog 与 catalog:；只沿用已授权 Vite external 配置。
- [x] 删除 useListOrder 和 ViewManager 重复 HTML5 几何逻辑。
- [x] 接入五类配置入口，列业务规则保留纯函数。
- [x] 改用库原生键盘流程，删除旧方向键即时提交。
- [x] 保留最新对象、分组/固定区、一次提交、异步失败处理。
- [x] 完成生命周期和异步反例的组件回归，含编译模式。

## Task 2 — 浏览器和发布验证

- [x] 新增独立列表、换行、撤权、并发标题、移除、重排、异步失败的测试场景。
- [x] 真实浏览器验证鼠标、键盘、取消、弹窗、滚动与触摸模拟；明确模拟不等于真机验收。
- [x] 迁移旧 Storybook 机制专用断言，验证实际用户可见顺序和焦点。
- [x] 构建、类型、lint、根 pnpm test:unit、Storybook、verify:view-engine 串行通过。
- [x] 更新双语文档，执行文档测试与 wiki build。
- [x] 记录代码净变化、生产消费包体积、打包与 core 导入边界。

## Task 3 — 独立交付

本地自审与验收证据见[交付记录](../reviews/2026-09-13-view-engine-list-sorting.md)。提交前根 pnpm test:unit 必须通过；不包含四份旧仪表盘草稿。提交、推送并创建独立 PR 后，等待 CI 与审查问题处理完成，再按已获授权 squash 合并。

**Verification:** 复用根 verify:view-engine 编排；verify-list-order.mjs 是其中一项，不创建第二套性能预算。重型构建/单测/浏览器任务串行运行。已发出的服务器写入仍由原引擎回执契约处理，UI 取消不伪装撤销服务器写入。
