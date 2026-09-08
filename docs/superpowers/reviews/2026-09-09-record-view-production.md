# RecordView 库级生产交付验收

日期：2026-09-09。审查基线：`24ae764b`；本报告对应本次收尾提交中的文件。执行环境：macOS / arm64 / Apple M4 Pro，Node 24.11.0、pnpm 10.34.5。验收对象是可被业务集成的库，真实业务鉴权、数据库、部署与线上运行不在本次声明范围。

## 实际修复和交付

1. **重载取消的同步重入竞态**：先登记新 controller，再取消旧请求；取消和状态通知后复核所有权。abort listener 发起的更新 reload 不再被外层旧 reload 覆盖。
2. **释放后的多余查询**：汇总状态同步通知后再次检查生命周期；订阅者 dispose 或切换所有权后，不再调用过期的 paged/cursor 数据源。两个问题都有旧实现失败、修复后通过的真实引擎回归，共新增三条用例。
3. **可重复交付入口**：`pnpm verify:view-engine` 校验公开归档，启动隔离 Storybook，依次完成本地/HTTP 恢复及浏览器矩阵。正常退出、失败和信号中断清理所属进程组；测试包括父进程先退出、后代忽略 TERM 的强制收尾。分阶段日志和失败截图可由 CI 上传。
4. **验收基线**：100 行、30 个数据列、100 个筛选候选字段；三引擎、浅深色、1440px/390px、键盘输入/选择/焦点、加载/空值/错误/重试、20 次取消与卸载。原始测量与 axe 结果留档。
5. **下一阶段输入**：[分析视图契约说明](../specs/2026-09-09-analysis-view-handoff.md) 分离可复用能力与记录专属规则，以维度/指标 schema、持久化组件配置和聚合结果为起点，不提前引入分析运行时或图表依赖。

没有增加依赖、公共入口或分析代码，没有修改生产主题 CSS。普通记录行为、宿主职责和五类扩展入口保持原样。

## 验收矩阵

| 标准                                        | 实际证据                                                                                    | 结果                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| 字段路径、筛选/日期、表格、扩展、汇总正确性 | view-engine 84 文件、普通模式 535 项；全仓普通模式 3798 项                                  | 通过                    |
| React Compiler 行为与类型                   | 编译模式 535 项、包 `test:type`；独立验收 fixture 严格 TS 通过                              | 通过                    |
| 保存 JSON → 新宿主/引擎 → 组件恢复          | 本地恢复与真实 HTTP 测试服务；五类扩展、配置/业务数据分离、改名/另存/排序/删除              | 通过                    |
| 并发与权限                                  | 新旧请求所有权、版本冲突、响应丢失幂等、权限撤销/恢复、跨标签 Web Locks CAS 与排队取消      | 通过                    |
| 默认 UI 与可访问性                          | 三引擎 × 两种主题 × 两种宽度；真实 Checkbox Space、回车查询、Escape、弹层边界与原始 axe     | 通过，WebKit 例外见下文 |
| 资源释放                                    | 各引擎 20 次挂载/取消/卸载；active 查询和权限订阅归零；启动的验证进程均退出                 | 通过                    |
| 加载/失败恢复                               | 慢查询 Spin/busy → 数据；失败 → 重试；空结果显示独立图标                                    | 通过                    |
| 包与样式独立交付                            | 实际归档 5 个公开目标、281 个与 dist 一致的文件、2 个无 UI 的核心运行时模块；使用方类型检查 | 通过                    |
| 构建与展示回归                              | 全仓构建（含 Wiki）、Storybook 构建及索引检查；253 项 Storybook 交互                        | 通过                    |
| 工程门禁                                    | view-engine/Storybook lint、Prettier、diff 检查；进程生命周期 3 项                          | 通过                    |

完整单元命令合计 **4333 passed、1 skipped**，其中 535 项是编译模式复跑；不要把两种模式当作不同业务场景。Storybook **57 文件通过、2 文件排除，253 项通过**；HTTP 实验和规模场景由专门入口执行，未混入普通 Storybook 交互计数。

## 性能记录

每种操作先暖机一次，再保留 10 个样本；最近秩 p95 在此样本量下为最大样本。数值包括自动化通信、fixture 定时器和绘制等待，服务没有业务网络请求。1000ms 是这一固定负载的回归上限，不是消费方或生产网络的 SLA。

| 浏览器引擎 | 版本          | 刷新 p95 | 键盘选择 p95 | 字段面板开关 p95 |
| ---------- | ------------- | -------: | -----------: | ---------------: |
| Chromium   | 151.0.7922.34 | 394.12ms |     174.21ms |         123.36ms |
| Firefox    | 153.0         | 570.42ms |     296.22ms |         255.67ms |
| WebKit     | 26.5          | 363.26ms |     136.82ms |         150.67ms |

每次选择采样都断言 checked 翻转；刷新确认新请求完成及 busy 解除。未提交筛选编辑不发查询，并且代表性文本列的 100 个 Profiler 单元格提交次数不变。这不是全渲染器或整堆内存的零开销证明。

## 可访问性例外与边界

Chromium、Firefox 的检查范围内没有 axe 违规。WebKit 的四个字段弹层状态各报告四个隐藏的 Base UI 焦点哨兵，共 **16 条 `aria-command-name`**；原始结果完整保留。

[Base UI #5237](https://github.com/mui/base-ui/issues/5237) 将这类行为标为 expected behavior。分类仅匹配该引擎、该规则、单一 DOM 节点、Base UI 标记、button role、tabindex 和隐藏样式；其他节点/规则仍阻断验收。真实键盘进入、最后一个 Checkbox 后 Tab 到“清空条件”、Escape 回到入口均有断言。直接对一个外部哨兵合成 focus 可退回 body，已作为依赖边界保留，不声称 VoiceOver 已认证。

最初的 WebKit 黑字/暗底截图来自未结束的级联颜色过渡；等待三批动画仍有 3415 个运行中的过渡。有界等待所有有限动画结束并跨帧复核后，同一份生产 CSS 的双向主题切换通过，故没有改色值或禁用动画来掩盖问题。

未测试真实 iOS/Android 设备或人工读屏；未执行远端 GitHub Actions 或 Windows 进程回收。CI 已接入相同命令，远端结果须在后续 PR 中验证。

## 复现与证据

```bash
pnpm build
PLAYWRIGHT_BROWSERS_PATH=/tmp/fve-production-browsers pnpm exec playwright install chromium firefox webkit
VITEST_MAX_WORKERS=4 pnpm test:unit
pnpm lint:view-engine
PLAYWRIGHT_BROWSERS_PATH=/tmp/fve-production-browsers pnpm test:storybook
pnpm build-storybook
node --test scripts/owned-process.test.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/fve-production-browsers VIEW_ENGINE_BROWSERS=chromium,firefox,webkit VIEW_ENGINE_ARTIFACTS=/tmp/view-engine-acceptance pnpm verify:view-engine
git diff --check
```

本次实际产物位于 `/Users/ahoo/.codex/visualizations/2026/09/05/01a06f1e-d229-74f2-ae9d-2df623cfc66a/record-production-2026-09-09/`：各阶段日志，以及按引擎保存的 `readiness.json`、`axe-*.json`、浅深色/窄屏/加载/错误截图。已查看最终 WebKit 窄屏深色弹层与 Chromium 加载截图。全仓日志 `/tmp/fve-production-{build,unit,lint,storybook,storybook-build,lifecycle,gate}.log` 保留在当前机器。

最终公开包验收归档 SHA-256：`577fd16195a2e898223910b18d7f0c2ac308fce99de95fcdf675896df879c337`。三浏览器门禁之后仅调整 README 命令顺序，并重新通过公开归档校验；281 个 dist 文件保持一致，最终日志为 `package-final.log`。本次 runner 及六个阶段进程结束后均不存在；隔离 Storybook 端口为 53675，未占用用户原有的 6006 服务。

## 自主决策与成本

| 决策                                                   | 理由                                | 若需求改变的成本                                 |
| ------------------------------------------------------ | ----------------------------------- | ------------------------------------------------ |
| 保留现有隔离分支/工作区，本地提交后供 review           | 用户要求自主收尾和次日审查          | 后续再选择合并或 PR；本次不推送                  |
| 所有提交集中在整体验证后                               | 遵守全仓单测提交前必须通过的要求    | 中间任务从差异与报告复核，提交粒度按最终责任拆分 |
| 独立只读审查与单个实施代理并行，根任务承担 UX 验收     | 分离代码归属，避免重复实施          | 重叠文件由根任务协调，最终统一检查               |
| 对 WebKit 哨兵保留精确例外和键盘证据                   | 避免破坏依赖的读屏焦点机制          | 真实 VoiceOver 仍需消费方人工检查或等待上游变化  |
| 时间样本只等待一次完整查询和两帧，内容另验             | 消除重复测试通信造成的假超标        | 指标包含自动化开销，不能直接宣传为用户端延迟     |
| 主题检查等待有限动画真正稳定                           | WebKit 过渡链会跨多批继续产生       | 验收稍慢，截图覆盖稳定状态而非过渡中间帧         |
| 使用 Playwright 自带浏览器，系统 Chrome 由显式变量选择 | CI 可重复，减少对机器预装软件的依赖 | 本地须安装浏览器，缓存目录需可写                 |

运行时、交付脚本、浏览器验收均已完成独立分项审查并关闭发现的问题。最终整体差异复核通过，无 Critical / Important；唯一 Minor（安装浏览器应先于 Storybook 测试）已修正文档顺序。提交记录以本报告所在提交为准。
