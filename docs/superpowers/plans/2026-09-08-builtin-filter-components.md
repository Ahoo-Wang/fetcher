# Built-in Filter Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 默认在当前会话顺序执行；用户选择委派时使用 superpowers:subagent-driven-development。

**Goal:** 交付本地多选、远程单选/多选、多值文本和日期时间区间，支持组件属性恢复并复用 Fetcher 生态基础能力。

**Architecture:** 基础控件与内置 FilterRegistration 分离，React 注册与纯编译能力共享确定的组件标识。远程执行复用 fetcher-react，分页复用 Wow CursorPage，业务服务注入运行时扩展。ViewHost 保持原有职责。

**Tech Stack:** TypeScript、React Compiler、现有 shadcn/Base UI、fetcher-react、fetcher-wow、Fetcher、Vitest、Storybook。

**Spec:** `docs/superpowers/specs/2026-09-08-builtin-filter-components-design.md`

## Global Constraints

- 不新增外部依赖，不复制通用防抖、异步执行或 HTTP 框架；内部依赖使用 workspace 协议。
- 不改动 ViewHost 服务划分；不破坏现有 React Hook 返回值及调用签名。
- 组件属性才是持久化模型，标签不参与编译；自动标签回填不触发 onChange、dirty 或记录查询。
- 首批不包含树选择、级联选择、图片/头像选择、创建候选、CSV 引号解析、开放区间和动态相对区间。
- 当前 worktree 已隔离，先检查工作区和适用的 AGENTS.md。不得覆盖用户改动。
- 本计划只交付筛选器，单元格组件是下一阶段；完成本计划不代表整个组件补齐需求完成。
- 公开 API 同步更新双语 README 和 skills API 参考；不自动提交或推送。用户要求提交时先通过全量单元测试。

## 文件职责与公共契约

| 文件                                                             | 职责                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/react/src/core/useExecutePromise.ts` 及既有测试        | 验证并修复共享取消/过期结果边界，不复制到组件             |
| `packages/view-engine/src/filter/filterTypes.ts`                 | 复用并扩展 FilterOption，保留字符串与数字值类型、可选分组 |
| `packages/view-engine/src/filter/filterOptionSource.ts`          | 纯类型及候选响应校验，不加载 React                        |
| `packages/view-engine/src/filter/builtinFilterCompilers.ts`      | 内置命名组件的纯编译、清空与查询属性提取                  |
| `packages/view-engine/src/filter/builtinFilterRegistrations.tsx` | 基础控件到 FilterRegistration 的薄适配                    |
| `packages/view-engine/src/filter/FilterMultiSelect.tsx`          | 本地多选交互，复用现有搜索/弹层样式                       |
| `packages/view-engine/src/filter/FilterRemoteSelect.tsx`         | 远程单选/多选交互，组合生态 Hook                          |
| `packages/view-engine/src/filter/useRemoteFilterOptions.ts`      | 仅候选分页、合并与标签回填状态；不重写通用异步执行        |
| `packages/view-engine/src/filter/FilterTextValues.tsx`           | 多值输入、分隔、去重、键盘行为                            |
| `packages/view-engine/src/filter/FilterDateTimeRange.tsx`        | 两端输入与完整性校验，复用现有日期/时间控件               |
| 现有配置编译、清空、编辑器解析、FilterLeafEditor                 | 注入内置能力，保留自定义注册契约和 own-property 检查      |
| `packages/view-engine/src/index.ts`、`src/react.ts`              | 分别导出纯类型/编译能力和 React 控件                      |
| `stories/view-engine/BuiltinFilters*.stories.tsx`                | 独立展示与回归入口                                        |
| `packages/view-engine/examples/react/BuiltinFiltersExample.tsx`  | 公共包接入与 LocalStorage 恢复示例                        |

命名使用 `select`、`multi-select`、`remote-select`、`remote-multi-select`、`text-values`、`datetime-range`。现有 `builtin` 默认编译行为不变。业务方显式注册同名能力时，渲染、编译与清空必须统一采用该注册；未注册时才使用内置项。未知名称仍报错。

候选接口复用现有分页结构：

```ts
type FilterOptionValue = string | number;
interface FilterOptionSource {
  search(
    query: Pick<CursorQuery, 'cursor' | 'size'> & { search: string },
    signal: AbortSignal,
  ): Promise<CursorPage<FilterOption<FilterOptionValue>>>;
  resolve(
    values: readonly FilterOptionValue[],
    signal: AbortSignal,
  ): Promise<{
    list: FilterOption<FilterOptionValue>[];
    missing: FilterOptionValue[];
  }>;
}
```

`FilterExtensions.optionSources` 是只读名称注册表，供叶编辑器使用；纯编译器不接触该注册表。`options.source` 指向名称，`options.debounceMs` 默认 300，`options.pageSize` 使用已有 Wow 默认游标大小并校验为合法正整数。

属性复用既有查询键：单选为 `value`，多选和多值文本为 `values`，区间为 `lowerBound/upperBound`。选择器额外保存 `selectedOptions` 标签快照数组；内置编译器校验并只把查询键交给 `compileBuiltinFilter`。清空移除查询值与选中快照，保留其他属性及节点绑定。

## Task 1：验证生态 Hook 并建立可靠复用边界

**Files:** 既有 `packages/react/test/core/useExecutePromise.test.ts`、`test/core/debounced/useDebouncedCallback.test.ts`；仅在复现失败后修改对应 src 文件。

**Interfaces:** 保持 `useExecutePromise` 的 execute/abort/reset 和 `useDebouncedCallback` 的 run/cancel 签名不变；复用 `useRequestId.invalidate()`。

- [x] 阅读 `packages/react/AGENTS.md`、Hook 实现和测试，确认 onSuccess 在请求新旧判定之后才执行。请求 supplier 内不得提前修改候选组件状态。
- [x] 加入“服务忽略取消”的反例，断言取消后的迟到成功和失败都不能触发回调或改变状态：

```ts
const success = vi.fn();
const pending = deferred<string>(); // 复用测试文件的 deferred，若无则用 Promise.withResolvers
const { result } = renderHook(() => useExecutePromise({ onSuccess: success }));
let execution: Promise<void>;
act(() => {
  execution = result.current.execute(() => pending.promise);
});
await act(async () => {
  result.current.abort();
});
await act(async () => {
  pending.resolve('stale');
  await execution;
});
expect(success).not.toHaveBeenCalled();
expect(result.current.loading).toBe(false);
```

- [x] 分别验证两次快速 execute、异步 onAbort、卸载和重新挂载。旧请求完成不得抢占新请求；取消待防抖任务后不能稍后发请求。delay=0 保持可用。
- [x] 先运行反例并确认失败原因；若需要修复，在共享 Hook 中同步失效请求令牌，再执行异步取消回调。新执行的排序以调用顺序为准，不以 onAbort 完成顺序为准。
- [x] 运行受影响 React Hook 测试及完整 React 包测试和构建。没有被复现的其他 Hook 行为不改。

```bash
pnpm --filter @ahoo-wang/fetcher-react exec vitest run test/core/useExecutePromise.test.ts test/core/debounced/useDebouncedCallback.test.ts
pnpm --filter @ahoo-wang/fetcher-react test
pnpm --filter @ahoo-wang/fetcher-react... build
```

## Task 2：纯内置编译与运行时候选契约

**Files:** 新 `filterOptionSource.ts`、`builtinFilterCompilers.ts`；修改 `filterTypes.ts`、`filterConfigurationCompiler.ts`、`filterConfigurationClear.ts`；新 `test/builtinFilterCompilers.test.ts`、`test/filterOptionSource.test.ts`。

**Interfaces:** 上文 FilterOptionSource；新增 `getBuiltinFilterCompiler(name): FilterCompiler | undefined`，对名称采用 own-property 检查。

- [x] 测试相同属性经保存/恢复后的编译一致：`{values: [1, '1'], selectedOptions: [{value: 1, label: '数字'}, {value: '1', label: '字符串'}]}` 保留两个不同 ID；标签变化不改变表达式。
- [x] 测试空选择编译为 undefined，非法 ID、NaN、错误标签和候选游标类型报错。resolve 的 list/missing 必须覆盖所请求 ID 且互不矛盾，不能把漏回项自动当成删除。
- [x] 实现纯编译适配：仅选择合法查询键传给已有 `compileBuiltinFilter`。多选支持 IN/NOT_IN；单选支持 EQ/NE；多值文本支持集合操作且只接收字符串；日期时间区间支持 BETWEEN。

```ts
// 展示元数据不传入既有 builtin 属性校验。
return compileBuiltinFilter({ values: validatedValues }, context);
```

- [x] 在现有配置编译和清空解析处统一采用“显式 own 注册 → 命名内置 → 未注册错误”，现有 `builtin` 路径不变。遍历所有调用者，避免只在 ViewEngine 初始化时注入，导致独立 FilterPanel 或清空漏掉默认能力。
- [x] 清空后节点 ID、field、operator、component 保留，选择值与标签快照移除。纯编译和清空不创建请求或执行回填。
- [x] 用配置级回归验证纯核心入口在未导入 React 时编译所有新内置名称；运行已有 filterConfiguration、filterCore 与扩展注册测试。

## Task 3：本地多选和多值文本

**Files:** 现有 FilterSelect/FilterSearchSelect；新 FilterMultiSelect/FilterTextValues；新 `test/filterMultiSelect.test.tsx`、`test/filterTextValues.test.tsx`。

**Interfaces:** 候选共享 `FilterOption<string | number>`；受控多选 value 为只读 ID 数组，onValueChange 返回新数组，不改写输入。多值文本沿用受控字符串数组。

- [x] 先测试分组、数字/字符串 ID、禁用已选项可移除、搜索不清空选择、连续勾选不关闭弹层。渲染原始数组保持不变，重复选项不生成重复选择。
- [x] 使用现有 Base UI Combobox 多选能力和包内按钮/InputGroup；复用 usePortalTheme。以原生选择状态呈现复选效果，不嵌套第二个互相争夺焦点的 checkbox。
- [x] 补齐紧凑摘要、全部已选查看、键盘移除和空值占位；首批不加入全选入口。
- [x] 多值输入的拆分规则用最小纯函数及回归固定：

```ts
const values = [
  ...new Set(
    text
      .split(/[\r\n,，;；]+/)
      .map(v => v.trim())
      .filter(Boolean),
  ),
];
// "001, 001；A B\nabc" => ["001", "A B", "abc"]
```

- [x] IME 组合期间不提交。Enter 有编辑文本时只提交条目并阻止查询；空编辑区的后续 Enter 保留面板查询行为。粘贴不转换数字、不解析 CSV 引号。
- [x] 运行上述控件测试与已有 FilterSelect/FilterSearchSelect 测试，检查主题与键盘路径。

## Task 4：远程单选/多选与分页

**Files:** 新 FilterRemoteSelect/useRemoteFilterOptions；修改 view-engine package.json 和 pnpm-lock.yaml 添加已有 `@ahoo-wang/fetcher-react` 内部依赖；新 `test/filterRemoteSelect.test.tsx`。

**Interfaces:** FilterRemoteSelect 接收 source、受控选择、标签快照、搜索/分页选项；useRemoteFilterOptions 只维护候选领域状态。单选/多选使用同一分页与回填实现。

- [x] 使用 deferred 响应先覆盖：旧搜索后返回、关闭后返回、下一页失败、重复游标、分页重复项、移除后迟到回填、源对象变化。测试不依赖服务遵守 AbortSignal。
- [x] 组合两个 `useExecutePromise` 实例，分别负责候选和回填；搜索使用 `useDebouncedCallback`，加载更多和重试直接 execute。共享 Hook 已处理的 requestId、mounted 和通用状态不再次实现。

```tsx
const query = useExecutePromise<
  CursorPage<FilterOption<FilterOptionValue>>,
  unknown
>({
  onSuccess: page => mergeAcceptedPage(page),
});
// mergeAcceptedPage 是当前候选 Hook 内的同步分页合并回调，不是新的通用服务。
void query.execute(controller =>
  source.search({ search, cursor, size }, controller.signal),
);
```

- [x] 关键词变化先 cancel 防抖并 abort 在途请求，再清空候选分页并调度新的首屏请求；delay=0 直接执行。IME compositionend 后才调度最终词。
- [x] 成功页用类型保真的 Map 按 ID 合并，保留先出现位置并更新标签。游标必须推进，重试只能重试失败页；首屏空、首屏错、后续页错分开呈现。
- [x] onSuccess 的分页合并必须同步完成，不能在其中 await 后再更新状态。响应校验应在 supplier 返回前完成，错误进入共享 Hook 的 error 路径。
- [x] 已选项先展示快照，resolve 的新标签只更新本组件缓存，不能调用属性 onChange。明确 missing 标记不可用但不移除值；回填 error 允许重试。
- [x] source 变化时废弃对应会话、候选和回填；ViewPage scopeKey 重挂载继续负责访问隔离。独立使用 FilterPanel 时，文档要求访问范围变化使用 React key 重建；不尝试从可变鉴权闭包推断身份。
- [x] 关闭时取消候选和待执行防抖；已完成页可保留。卸载时共享 Hook 清理在途请求，标签回填与候选取消互不干扰。
- [x] 运行测试及 React Compiler lint。验证打包后的 React 依赖边界；不得通过跨包 src 导入绕过依赖或新增全局缓存。

## Task 5：区间与内置编辑器接入

**Files:** 新 FilterDateTimeRange、builtinFilterRegistrations；修改 filterReactTypes、resolveFilterEditor、FilterLeafEditor、react.ts/index.ts；新 `test/filterDateTimeRange.test.tsx`、`test/builtinFilterRegistration.test.tsx`。

**Interfaces:** `FilterExtensions.optionSources?: Readonly<Record<string, FilterOptionSource>>`；相同只读表可选传给 FilterEditorProps，叶编辑器转交，纯核心接口不包含运行时源。

- [x] 日期区间先测试未设置、单端、未完成时间、逆序、等值端点、DST gap 与重复时刻 offset 保留。两端完整才调用既有 BETWEEN 编译路径。
- [x] 复用 FilterDatePicker/FilterTimeInput；日期只保存 YYYY-MM-DD，日期时间保留原始 date/time/offsetMinutes。不自动补到日末，不交换逆序值。
- [x] 编写薄注册适配，将 props.value/values/lowerBound/upperBound 与受控组件连接；selection 事件写入 selectedOptions 快照，自动回填不写入。
- [x] resolveFilterEditor 采用与核心相同优先级；独立 FilterPanel 不依赖 ViewPage 预注册。自定义覆盖项的 render/compile/clear 必须来自同一注册对象。
- [x] 缺少 source 名称或注册时就地报告配置错误，阻止把失败视为未设置。已保存组件属性形状非法同样报错。
- [x] 验证未知名称仍报错，继承属性名不能被读取；已有自定义筛选器、模式转换、清空和 Enter 查询测试全部保留。

## Task 6：公开包接入、恢复示例和完整验证

**Files:** 新 BuiltinFiltersExample；stories/view-engine/BuiltinFilters.stories.tsx 与 BuiltinFilters.test.stories.tsx；现有包验证脚本；双语 README 与 skills/fetcher-view-engine/references/api.md。

**Interfaces:** 候选适配器使用上文 FilterOptionSource；ViewHost 及 LocalStorageViewHost 接口保持不变。

- [x] 示例通过现有 Fetcher 或 Wow 客户端请求候选，用实例既有鉴权/拦截器，传递原始 AbortSignal。将业务响应映射为 CursorPage，不建立新的 HTTP 客户端。
- [x] Storybook 覆盖本地分组多选、跨页选择、搜索/回填独立失败、数字 ID、粘贴多值、区间无效、暗色窄容器。普通展示不自动操作，复杂 play 独立。
- [x] 恢复回归顺序：选择跨页项 → 保存 JSON → 卸载并创建新 host/engine → 立即显示标签快照 → 回填返回新标签 → query/dirty 不变 → 用户修改选择才产生草稿变化。
- [x] 增加保存/恢复的空值、多选和区间公开核心示例；验证 core tarball 不引入 React/DOM。React 入口安装内部生态依赖后可独立运行。
- [x] 文档写明数据源注册、CursorPage 复用、分隔规则、游标重试、访问范围 key、标签快照与运行时缓存的区别。更新公共导出和内置名称清单。
- [x] 执行所有检查并保留真实退出码，不靠放宽 lint、跳过失败故事或固定系统时区掩盖问题：

```bash
pnpm --filter @ahoo-wang/fetcher-react test
pnpm --filter @ahoo-wang/fetcher-view-engine test
pnpm lint:view-engine
pnpm --filter @ahoo-wang/fetcher-view-engine... build
node packages/view-engine/scripts/verify-package.mjs
pnpm test:storybook
pnpm build-storybook
node scripts/verify-storybook-browser.mjs
node packages/view-engine/scripts/verify-view-host.mjs
git diff --check
```

- [x] 用户要求提交时运行 `pnpm test:unit`，按实际完成范围提交；完成后继续单元格阶段的设计，不将其默认为已交付。

## 自检与执行说明

基础设施复用落在 Task 1/4/6，纯编译与恢复在 Task 2/5/6，控件交互在 Task 3/4/5。所有阶段都有独立测试边界；先验证共享 Hook，不把已存在的通用能力复制到 view-engine。

Task 1 中 deferred 可以直接使用项目已有测试辅助函数；若没有，使用本地 Promise 捕获 resolve/reject 的短写法，避免提高库的运行时版本要求。Task 4 的 mergeAcceptedPage 明确为该文件内部同步回调，其输入是已校验 CursorPage。

实现前读取 spec 与本计划。设计已获确认，下一步只需确定顺序执行或委派执行方式；本节为初始执行说明；实际完成状态见末尾实施记录。

## 实施记录与验证

- 筛选器阶段完成；单元格组件仍是下一阶段，本记录不表示单元格已实现。修改尚未提交。
- 复用 fetcher-react 的异步执行和防抖，修复主动取消后的迟到响应及异步取消回调重排两处共享问题；没有增加第二套请求序号或通用异步框架。
- 打包检查发现 React 总入口会加载无关集成并阻止 Node 正常退出，因此新增公开 ESM `/core` 子路径。原根入口 ESM/UMD 不变，view-engine 使用 `/core`。同步补齐了 Storybook 子路径别名。
- 新控件共用 FilterChoiceSelect；旧 FilterSelect/FilterSearchSelect API 保留。通过 select 配置的单选和新多选/远程选择支持分组；字段未显式限制 operators 时使用适用默认值。
- 远程组件使用 CursorPage，单选和多选通过判别联合区分。回填失败不删除选择，缺失状态文字不写回标签快照，搜索变化重置分页历史。
- 示例通过 Fetcher 的公开拦截器能力读取确定性 data URL，避免全局 fetch 替换。只有该夹具移除 URL 模板解析；真实 HTTP 接入保留原配置。
- 真实浏览器验证跨页选择、保存和刷新后的 ID/标签恢复；原 LocalStorage 与 HTTP 端到端验证也通过。
- 全量测试使用 `VITEST_MAX_WORKERS=2 npm_config_workspace_concurrency=1 pnpm test:unit` 通过，保持原有超时与全部断言；普通并发运行曾遇到资源争用导致的类型契约超时，没有放宽检查。
- view-engine 430 个测试在两种编译模式下通过；React 包 522 个测试和类型检查通过。
- 237 个 Storybook 测试通过，静态构建与索引检查通过（112 个回归入口）；静态产物上的全部文档和新增浏览器刷新检查通过。
- 打包验证包括 8 个 React 接入示例、命名内置编译器、单选/多选公开类型及无 React 的核心入口。构建、严格 lint 和差异检查通过。
