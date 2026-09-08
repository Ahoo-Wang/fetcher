# Storybook 全量重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 用户若选择委派执行，可改用 superpowers:subagent-driven-development。

**Goal:** 将全部现有故事组织为可手动操作的接入文档，保留交互回归与开发验证覆盖。

**Architecture:** 全局配置只承载通用事项，模块显式安装 Provider 和场景说明。展示故事与复杂交互回归故事共享演示实现，通过原生标签隔离入口。保留公共包产物验证边界与现有工具链。

**Tech Stack:** TypeScript、React、Storybook 10.6.0、Vite、Vitest、Playwright、现有 ESLint 与 React Compiler 规则。

**Spec:** `docs/superpowers/specs/2026-09-08-storybook-restructure-design.md`

## Global Constraints

- 不修改包的运行时 API，不升级或新增依赖，不为目前没有故事的包补建示例。
- 不拆成多个 Storybook，不建立通用故事生成框架，不机械拆分小文件。
- 不增加旧故事地址兼容层；仓库内消费者必须同步迁移。
- 展示和回归共享实现，隔离执行入口；不删除现有断言来获得测试通过。
- 使用当前隔离 worktree，先检查工作区及适用的 AGENTS.md，不重置其他修改。
- View Engine 公共接入示例继续使用构建产物；保留其他包的当前源码别名。
- 单元测试与故事使用原有工具，不添加新测试框架。提交仅在用户要求时进行；提交前必须通过 `pnpm test:unit`。
- 本计划组织同一个 Storybook 的迁移，不拆成多个独立平台建设项目。

## 文件职责图

| 文件或目录                                                                       | 变更与职责                                                      |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `.storybook/preview.tsx`                                                         | 去掉标题判断和集中场景说明，保留通用参数、排序                  |
| `.storybook/preview.css`                                                         | 保留基础样式，精简首页和场景外壳的装饰性占用                    |
| `.storybook/manager.ts`                                                          | 更新首页目标；保持现有主题，不重新设计品牌                      |
| `stories/shared/ScenarioFrame.tsx`                                               | 从现有 preview 提取场景外壳，显式接收说明与 children            |
| `stories/shared/AntdProvider.tsx`                                                | 提取现有 Ant Design Provider 与主题配置                         |
| `stories/http/`、`stories/events/`、`stories/storage/`、`stories/react/`         | 模块演示、声明、夹具调用及交互测试                              |
| `stories/fixtures/http.ts`、`stories/fixtures/viewer.ts`                         | 现有确定性数据和请求替身，修复已验证的清理问题                  |
| `stories/view-engine/record-view/*.stories.tsx`                                  | 拆分查询、管理、表格、布局、运行时工具主题                      |
| `stories/view-engine/QuickStart.stories.tsx`、`Extensions.stories.tsx`           | 原公共包接入示例的展示入口                                      |
| `stories/view-engine/development/*.stories.tsx`                                  | LocalStorage、HTTP 验证入口，继续保留 View Engine lint 目录范围 |
| `stories/viewer/`                                                                | 现有组件与业务流程分类、模块 Provider、复杂测试入口             |
| 各模块 `*.test.stories.tsx`                                                      | 复用展示故事并安装原有复杂 play；不进入默认导航与文档           |
| `stories/Overview.stories.tsx`                                                   | 完整能力导航与接入入口                                          |
| `packages/view-engine/scripts/verify-view-host.mjs`、`verify-http-view-host.mjs` | 迁移故事地址                                                    |
| `packages/view-engine/test/reactLint.test.ts`                                    | 更新被改名的真实 Storybook 文件路径断言                         |
| `docs/superpowers/plans/2026-09-08-storybook-migration.md`                       | 实施期间逐故事记录旧 ID、新入口及测试去向，不参与运行时         |

## Task 1：覆盖基线与模块配置解耦

**Files:** 修改 `.storybook/preview.tsx`；创建两个 `stories/shared/` 文件及迁移清单；修改 HTTP、Hooks、Viewer 模块元数据。

**Interfaces:** `ScenarioFrame` 接收 `title/domain/summary/fixture/setup/observe: string` 和 `children: ReactNode`；`AntdProvider` 接收 `children: ReactNode`。不定义故事注册器。

- [x] 读取当前 `index.json` 并保存到 `/tmp/storybook-before.json`；记录所有 `type === 'story'` 的 ID、标题和名称到迁移清单。读取所有现有 play，记录行为组，不仅记录测试数量。

```bash
curl --fail --silent http://127.0.0.1:6006/index.json -o /tmp/storybook-before.json
pnpm test:storybook > /tmp/storybook-before-test.log 2>&1
```

- [x] 将现有 preview 的 Provider 原样搬到 `AntdProvider`，保留主题 token。将场景外壳搬到 `ScenarioFrame`；原 `sceneDefinitions` 每项说明移至其模块的元数据附近。示例的显式装饰器形状：

```tsx
decorators: [
  (Story, context) => (
    <AntdProvider>
      <ScenarioFrame title={context.name} {...scene}>
        <Story />
      </ScenarioFrame>
    </AntdProvider>
  ),
];
```

- [x] Viewer 显式使用 `AntdProvider`；View Engine 不使用它。删除全局 `context.title.startsWith(...)`、标题映射和业务 Provider。
- [x] 运行受影响模块的故事测试；浏览器对照 Fetcher、Hooks、Viewer、View Engine 各一个页面，确认移除全局 Provider 后仍可操作、主题和弹层正常。扫描确认没有遗漏依赖全局 Provider 的故事。

```bash
pnpm exec vitest run --project=storybook stories/http stories/react stories/viewer
pnpm exec eslint .storybook/preview.tsx stories/shared stories/http stories/react stories/viewer --max-warnings 0
```

## Task 2：展示初态和交互回归分离

**Files:** 各模块现有 `.stories.tsx`；就近新增 `.test.stories.tsx`；迁移清单。

**Interfaces:** 展示模块只导出原生 CSF meta 和故事；测试模块导入并展开展示故事，显式覆盖 tags 和 play。

- [x] 从每个故事中区分渲染断言和自动操作。保留无副作用断言；将点击、键入、选择、写入等复杂操作迁移到测试故事，保留原断言顺序。先用 BusinessRecords 做一个完整样板，再迁移其他模块。

```tsx
import meta, { BusinessRecords } from './Querying.stories.js';
import { playBusinessRecords } from './persistence.play.js';

export default {
  ...meta,
  title: 'View Engine/Record View/查询与分页/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export const QueryAndSave = {
  ...BusinessRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playBusinessRecords,
};
```

- [x] 验证安装版本真实生成的索引：测试故事不带 `dev/autodocs`，仍带 `test`；Vitest 能发现并执行。普通 Canvas 不自动改变筛选、创建订单或删除视图。
- [x] 给展示初态补一个有意义的浏览器断言：记录初始订单数与写入次数，等待初始化完成后断言写入次数仍为零。测试使用当前公开可观察输出，不为测试添加运行时 API。
- [x] 同页展示场景较多的 Docs 设置按主题选择代表场景，不能仅隐藏其他场景测试来缩短页面。需要手动进入失败状态的演示保留明确触发入口。
- [x] 对每个原故事在清单中记录展示和测试去向。执行全量 `pnpm test:storybook`，比较测试行为清单；允许数量变化但不允许丢失原行为。

## Task 3：夹具安装、卸载与文档隔离

**Files:** `stories/fixtures/http.ts`；`stories/viewer/FetcherViewer.stories.tsx`；使用夹具的 HTTP、Hooks、Viewer meta；就近测试故事。

**Interfaces:** 保留 `installFetchFixture(): () => void` 和 `installViewerFetchFixture(scenario): () => void` 既有接口，除非复现证明接口本身必须调整。Fetcher 没有直接 fetch 注入选项，不发明不存在的参数。

- [x] 检查基线中的全局 fetch、注册器与存储修改；用已取消请求建立失败反例，修复后检查取消、恢复与重新安装。迁移后通过真实浏览器验证 iframe 文档与独立场景不串扰。未对旧版同文档串扰作运行时结论。
- [x] 对修改全局 fetch、默认注册器或固定存储键的场景显式使用独立 iframe 文档渲染，先验证已安装 Storybook 参数行为：

```ts
parameters: {
  docs: { story: { inline: false, height: '480px' } },
}
```

- [x] 复用既有 beforeEach cleanup，在同一 Canvas 重复运行测试以证明恢复正确；若仍有安装重叠，缩小到已复现生命周期修复，不建立全局模拟请求框架。
- [x] 对 delayedResponse 补齐成功、取消两条路径的 timer/listener 清理，检查信号已取消时不再调度响应。对应检查：取消后请求拒绝；重新挂载后的普通请求成功；没有上一实例的回调写入。
- [x] 验证 Viewer 重置仅恢复其拥有的存储键和注册器；LocalStorage 持久化实验不复用普通场景的清理行为。
- [x] 运行 HTTP、Hooks、Viewer 测试；手动打开同页两个示例及分别刷新，检查状态独立。浏览器控制台不得出现新未处理错误。

## Task 4：能力导航与 Record View 主题迁移

**Files:** `stories/http/`、新 `stories/events/`、`stories/storage/`；`stories/view-engine/record-view/`；其余 View Engine 和 Viewer 元数据；`.storybook/preview.tsx`。

**Interfaces:** 保留 `Scenario`、`DemoArgs` 和 `ScenarioOptions` 原有接口；只调整组合入口与测试引用。

- [x] 移动 EventBus/EventStream 到 `stories/events/`，Storage 到 `stories/storage/`，逐文件修正相对导入。保留现有导出名称以减少无关改动。
- [x] 按下表拆分 RecordView 原故事，每项保留原 render/args；复杂 play 已由 Task 2 迁出。共用 meta 只抽取实际重复的 appearance、layout 和样式入口，放在现有 `record-view` 目录。

| 新文件                               | 原故事                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `Querying.stories.tsx`               | BusinessRecords、CursorRecords、EmptyRecords、QueryFailure                      |
| `Management.stories.tsx`             | RestoreFocus、ManageViews                                                       |
| `Table.stories.tsx`                  | Summaries、LoadingSummaries、SummaryFailure、PinnedColumns、EmptySummary        |
| `Layout.stories.tsx`                 | CompactWorkbench、ResponsiveColumns、DarkRecords、ThemeSwitching、NarrowRecords |
| `Runtime.stories.tsx`                | RuntimeTools                                                                    |
| `Extensions.stories.tsx`（模块顶层） | LocalDefinitions，合并公共扩展示例                                              |

- [x] Select/DateTime 归入基础组件；FilterPanel 归入过滤器。Viewer 对应输入与过滤、单元格与表格、完整业务流程。每页仅承担一个主题，不新增空分类。
- [x] 更新导航排序，与设计文档的顶层顺序一致。不要通过排序配置再次引入运行时 Provider 判断。
- [x] 执行 `pnpm test:storybook` 与 `pnpm lint:view-engine`；读取新索引，逐项填写迁移清单，确认旧的 18 个 Record View 场景都有展示和测试位置。

## Task 5：公共接入与开发验证分层

**Files:** `QuickStart.stories.tsx`、`Extensions.stories.tsx`、`development/LocalStorage.stories.tsx`、`development/HttpService.stories.tsx`；原 LibraryDelivery 测试及 FilterPersistence 测试；两个 ViewHost 验证脚本；`test/reactLint.test.ts`。

**Interfaces:** 继续使用现有 `OrderExample`、`FilterPersistenceExample`、`HttpOrderExample`，不复制这些组件。验证脚本继续使用现有 URL override 和临时服务机制。

- [x] FiveExtensions 的最小展示用于快速开始；完整五类扩展与 FilterPersistence 放入扩展接入。FailureAndScopedRefresh、RefreshRecovery、NarrowDark 保留相应展示和回归入口。
- [x] LocalStorageViews 移至开发验证，保持 scopeKey、存储重置和初始侧栏参数。HttpViewService 独立文件，继续 `!test`，同时 `!autodocs`，避免普通文档挂载其服务请求。
- [x] 给实验 CSF meta 设置明确稳定 ID，以便脚本直接使用：

```ts
// LocalStorage.stories.tsx
id: 'development-local-storage',
title: '开发验证/本地视图恢复',
// 保留 export const LocalStorageViews

// HttpService.stories.tsx
id: 'development-http-service',
title: '开发验证/HTTP 视图服务实验',
// 保留 export const HttpViewService
```

- [x] 验证新索引后，将脚本 URL 中 ID 分别改为 `development-local-storage--local-storage-views`、`development-http-service--http-view-service`；保留 `viewService` 查询参数和环境变量覆盖。
- [x] 更新 React lint 回归测试中的实际 LibraryDelivery 文件引用到 `QuickStart.stories.tsx`。继续断言真实故事文件获得严格规则，禁止因文件移动删掉该断言。
- [x] 完成公共产物与真实恢复验证：

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
node packages/view-engine/scripts/verify-package.mjs
node packages/view-engine/scripts/verify-view-host.mjs
node packages/view-engine/scripts/verify-http-view-host.mjs
pnpm --filter @ahoo-wang/fetcher-view-engine test
```

## Task 6：首页、文档与完整验收

**Files:** `stories/Overview.stories.tsx`、`.storybook/manager.ts`、`.storybook/preview.css`；故事描述；迁移清单；受路由迁移影响的仓库文档。

**Interfaces:** 首页链接来自实际生成的故事索引；不维护运行时导航注册服务。manager 默认入口显式使用 Overview meta 的稳定 ID。

- [x] 首页使用短介绍和全能力入口；加入 View Engine、Viewer、开发验证卡片。说明开发验证需要的存储或服务条件，删除“所有场景都无需服务”一类不再准确的全局承诺。
- [x] 为首页 meta 保留 `id: 'overview'`，展示标题改为“开始使用”。manager 首页继续指向 `overview--docs`。链接测试从“恰好七个链接”改为能力入口存在并可解析。
- [x] 文档中的接入代码对应实际公开 API。对只显示 `<Scenario />` 的代码块提供真实最小使用示例或明确的示例源文件引用，避免把测试包装器当成 SDK 接入方式。
- [x] 验证首页链接目标在静态索引中存在，覆盖 query 参数解码和故事/文档路径：

```js
const route = new URL(href, origin).searchParams.get('path');
const id = route?.replace(/^\/(docs|story)\//, '');
assert.ok(id && index.entries[id], `Unknown Storybook link: ${href}`);
```

- [x] 全仓搜索已迁移的旧 ID，更新可执行脚本和现行指南；历史设计文档保持原样，迁移清单允许保留旧 ID 作为证据。
- [x] 执行以下验证，记录各命令退出码、行为覆盖差异和未完成项。不要通过降低可访问性等级、关闭 React 规则或删除失败故事解决问题。

```bash
pnpm exec eslint stories .storybook --max-warnings 0
pnpm lint:view-engine
pnpm build-storybook
pnpm test:storybook
git diff --check
```

- [x] 浏览器检查首页、全部一级入口、Record View 五个主题、Viewer 流程、持久化实验；覆盖 Docs 与 Canvas、宽屏/窄容器、深色、键盘焦点和弹层。证明展示故事不会自动写入数据，复杂回归仍执行。
- [x] 核对清单没有无去向的原故事、丢失的断言或失效链接；更新计划勾选状态并汇报证据。用户要求提交时先执行 `pnpm test:unit`，再检查差异并创建本地 conventional commit，不推送。

## 计划自检

- 全范围覆盖：Task 1/4/6 覆盖配置、所有模块和导航；Task 2 保留回归职责；Task 3 覆盖状态隔离；Task 5 覆盖公开接入与实验边界。
- 没有新增依赖或包运行时 API；共享设施只有实际重复的场景外壳与 Provider。
- 导入、路由、lint 实际文件断言和端到端入口均有迁移任务。
- 先验证版本支持的标签与 iframe 参数，再批量迁移；不会以仅构建通过代替浏览器验证。

## 实施记录

- 已迁移全部 121 个原故事，见相邻迁移清单；108 个回归故事使用独立测试入口，原 HTTP 实验仍通过专门脚本验证。
- 原生 Docs 模板会重复渲染主示例，最终使用 `.storybook/DocsPage.tsx` 将所有文档统一为一个主示例和独立场景链接。
- View Engine 主题页共用 `record-view/meta.ts`；本地扩展示例保留在该目录，避免搬动其既有宿主实现，导航仍归属扩展接入。
- 新增静态索引检查 `scripts/verify-storybook.mjs`，已接入 `build-storybook`。真实页面检查保留为 `scripts/verify-storybook-browser.mjs`。
- `stories/README.md` 记录示例、回归、全局夹具隔离及验证命令。
- 取消夹具的新增回归先失败后通过；远程搜索改为场景内完成按钮，不依赖测试模块的全局回调。
- 实现未提交；用户要求提交时再次核对工作区和提交前验证。

## 验证证据与已知限制

- 原基线：20 个文件、120 个浏览器测试通过；迁移后：53 个文件通过、228 个测试通过。另一个文件是明确排除默认测试的 HTTP 实验。
- `pnpm build-storybook` 通过，并验证 8 个首页链接、108 个回归入口的标签及 HTTP 实验的文档隔离。
- `node scripts/verify-storybook-browser.mjs` 已遍历全部 27 个 Docs 页面，检查导航、普通示例初态、iframe 隔离、窄屏和深色。没有记录到页面未处理错误。
- LocalStorage 与 HTTP 验证脚本通过，公共包打包验证通过；本次未改动包运行时源码或依赖。
- 默认系统时区 `America/Los_Angeles` 下，全量单元测试发现既有失败：`test/filterCoreDateTime.test.ts` 的纽约回拨日 `2026-11-01 01:30`、无 offsetMinutes 用例，预期 `1793511000000`，实际 `1793514600000`。对应测试及 `src/filter/filterScalar.ts` 与 HEAD 一致。
- `TZ=Asia/Shanghai pnpm test:unit` 全量通过，包括 view-engine 的 412 个测试双模式与类型检查。同一日期用例在该时区下通过。此差异没有通过修改断言、关闭规则或修改运行时来掩盖；它不属于本次 Storybook 重构范围。

## 后续继续：DST 差异已修复

用户要求继续后，单独修复 `filterScalar.ts` 的重复本地时刻解析：有效 offsetMinutes 优先，没有适用提示时校验回拨前偏移对应的候选，选择较早一次；不存在的本地时间仍拒绝。

新增三种系统时区的回归矩阵（UTC、上海、洛杉矶），覆盖纽约一小时回拨、Lord Howe 半小时回拨和有效/失效偏移提示，已先失败后通过。`TZ=America/Los_Angeles pnpm test:unit` 全量通过，view-engine 415 个测试双模式及类型检查通过；228 个 Storybook 测试与打包验证通过。上节的时区失败记录已由此修复消除，不再需要使用上海时区规避。

接入文档同步说明歧义时间选择规则，并更新重构后的 Storybook 导航名称。所有修改仍未提交。
