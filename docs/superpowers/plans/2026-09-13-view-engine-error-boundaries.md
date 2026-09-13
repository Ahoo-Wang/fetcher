# View Engine Error Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 用 react-error-boundary 删除 7 处自维护捕获状态机，并保留业务降级和编辑器恢复语义。

**Architecture:** 库拥有错误捕获与重置状态，业务组件拥有 fallback、恢复身份与有效性。仅在恢复通知需要等待成功提交时复用一个小型提交组件；保留 EditorSession/TransformEditorSession 的旧回调保护。

**Tech Stack:** React 19、TypeScript、react-error-boundary 6.1.5、Vitest、React Compiler、Storybook。

**Spec:** `docs/superpowers/specs/2026-09-13-view-engine-interaction-primitives-design.md`

## Global Constraints

- 用户已确认设计，并选择当前会话顺序执行；使用 executing-plans，不派发子代理。
- 基线为 main `022f1e69e33160b11e9431f00f1fee46b6b90c89`；工作分支 `refactor/view-engine-interaction-primitives`。
- `react-error-boundary` 固定 `6.1.5`，进入 workspace catalog；view-engine 使用 `catalog:`。
- 新依赖只进入 React 导入图；不得改写查询、保存、权限、资源预算或公共 API。
- 编辑器恢复必须等待成功提交，不得在 onReset 中提前报告有效。
- 每项必须净减少生产代码，计算包含适配层与调用方；测试、文档、生成物不计入。
- 提交前根 `pnpm test:unit` 必须通过。重型构建、单测、浏览器和性能任务串行运行。
- 四份 2026-09-12 未跟踪草稿不修改、不提交。不开 PR、不推送、不合并。

## Task 1: 常规渲染边界与依赖

**Files:**

- Modify: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `packages/view-engine/package.json`
- Modify: `packages/view-engine/src/record/RecordRendererBoundary.tsx`
- Modify: `packages/view-engine/src/analysis/AnalysisResultView.tsx`
- Modify: `packages/view-engine/src/analysis/AnalysisComponentChoice.tsx`
- Modify: `packages/view-engine/src/dashboard/DashboardPanelContent.tsx`
- Test: `packages/view-engine/test/recordTableRenderers.test.tsx`, `packages/view-engine/test/recordCardList.test.tsx`, `packages/view-engine/test/analysisChart.test.tsx`, `packages/view-engine/test/dashboard/reviewRecovery.test.tsx`
- Create test: `packages/view-engine/test/renderBoundaryRecovery.test.tsx`

**Interfaces:**

- 保留 `RecordRendererBoundary({children, label, resetKey?})` 的调用形式。
- 其余业务边界保留现有组件参数与父级 key；不产生新的公共导出。

- [x] 记录基线：`git rev-parse HEAD`、上述生产文件非注释行数、core 与 React 的生产消费构建/gzip 体积。锁定同一 fixture 后才比较后续结果。
- [x] 补充恢复行为测试；下例加入实际测试文件，使用现有 testing-library 和 Vitest imports：

```tsx
it('retries only when a reset key element changes', () => {
  const attempts = vi.fn();
  function Child() {
    attempts();
    throw new Error('broken');
  }
  const owner = {};
  const view = render(
    <RecordRendererBoundary label="金额" resetKey={[owner]}>
      <Child />
    </RecordRendererBoundary>,
  );
  const count = attempts.mock.calls.length;
  view.rerender(
    <RecordRendererBoundary label="金额" resetKey={[owner]}>
      <Child />
    </RecordRendererBoundary>,
  );
  expect(attempts).toHaveBeenCalledTimes(count);
  view.rerender(
    <RecordRendererBoundary label="金额" resetKey={[{}]}>
      <Child />
    </RecordRendererBoundary>,
  );
  expect(attempts.mock.calls.length).toBeGreaterThan(count);
  expect(screen.getByRole('alert').textContent).toContain('金额渲染失败');
});
```

- [x] 在原实现执行该测试作为等价迁移基线。若已有契约通过，不制造人为失败；新增失败反例必须先记录原实现的真实失败输出。
- [x] 添加 catalog `react-error-boundary: 6.1.5` 和包 dependencies `react-error-boundary: catalog:`，执行 `pnpm install`，检查锁文件没有无关升级。
- [x] 将常规边界换成直接组合，核心形状如下；保留所有实际 fallback 文案、类名与父级 key：

```tsx
export function RecordRendererBoundary({ children, label, resetKey }: Props) {
  return (
    <ErrorBoundary
      resetKeys={[
        Array.isArray(resetKey),
        ...(Array.isArray(resetKey) ? resetKey : [resetKey]),
      ]}
      fallback={<span role="alert">{label}渲染失败</span>}
    >
      {children}
    </ErrorBoundary>
  );
}
// 需要重试的原业务边界使用库提供的 resetErrorBoundary：
// fallbackRender={({resetErrorBoundary}) => <Button onClick={resetErrorBoundary}>重试显示面板</Button>}
```

- [x] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/renderBoundaryRecovery.test.tsx test/recordTableRenderers.test.tsx test/recordCardList.test.tsx test/analysisChart.test.tsx test/dashboard/reviewRecovery.test.tsx`，要求通过。

## Task 2: 编辑器错误与成功提交后的恢复

**Files:**

- Modify: `packages/view-engine/src/filter/FilterEditorSession.tsx`
- Modify: `packages/view-engine/src/filter/FilterLeafEditor.tsx`
- Modify: `packages/view-engine/src/dashboard/DashboardFilterSettings.tsx`
- Create: `packages/view-engine/src/lib/RenderCommit.tsx`
- Test: `packages/view-engine/test/filterPanelEditorLifetime.test.tsx`, `packages/view-engine/test/filterPanelValidity.test.tsx`, `packages/view-engine/test/filterPanelExtensions.test.tsx`, `packages/view-engine/test/dashboard/filterSettings.test.tsx`
- Extend test: `packages/view-engine/test/renderBoundaryRecovery.test.tsx`

**Interfaces:**

- `RenderCommit({children, onCommit}: {children: ReactNode; onCommit(): void}): ReactNode`，只负责一次成功提交后的通知。
- 保留 `EditorBoundary` 的 editor/session/operator/mode/onError/onRecover/onFallback 参数。
- 转换器输入有效性与渲染成功共同决定现有 `runtime.setEditorValidity(key, valid)`；不得用恢复事件覆盖子编辑器报告的 false。

- [x] 在恢复测试中加入 StrictMode、持续抛错、成功挂载时 onValidityChange(false)、reset 后抛错、旧编辑器晚到回调四种场景。断言恢复未提前报告、旧回调不修改当前配置、输入 false 仍阻止保存。
- [x] 执行原测试记录行为；对新发现的失败记录预期断言和失败原因，再修改实现。
- [x] 使用下面的提交组件，回调仅清理当前 owner 的渲染错误；业务错误记录可用 ref 保留，但不复制 ErrorBoundary 的 didCatch 状态：

```tsx
export function RenderCommit({
  children,
  onCommit,
}: {
  children: ReactNode;
  onCommit(): void;
}) {
  useLayoutEffect(onCommit, [onCommit]);
  return children;
}
```

- [x] 筛选边界 onError 保存失败消息并调用现有 onError；成功提交读取并清空记录，再调用原 onRecover(message)。保留 FilterLeafEditor 中按错误身份清理的逻辑，拒绝清除更新后的输入错误。
- [x] 转换器注册组件继续通过 TransformEditorSession 发出已提交回调。在同一个绑定范围合并“输入有效性”和“渲染可用性”，错误只改变后者。恢复回调发生在子组件 layout effects 之后，因此不覆盖子组件最新输入 false。
- [x] 保留两个 EditorSession 类完整的 committed owner / generation / unmount 保护；只删除其相邻的自维护错误边界类。
- [x] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/renderBoundaryRecovery.test.tsx test/filterPanelEditorLifetime.test.tsx test/filterPanelValidity.test.tsx test/filterPanelExtensions.test.tsx test/dashboard/filterSettings.test.tsx`，要求通过。

## Task 3: 布局失败恢复与阶段验收

**Files:**

- Modify: `packages/view-engine/src/dashboard/DashboardLayoutBoundary.tsx`
- Test: `packages/view-engine/test/dashboard/layoutLoading.test.tsx`
- Run existing: `packages/view-engine/scripts/verify-dashboard-layout.mjs`, `packages/view-engine/scripts/verify-package.mjs`, `scripts/verify-view-engine.mjs`
- Create evidence: `docs/superpowers/reviews/2026-09-13-view-engine-interaction-primitives.md`

**Interfaces:**

- 保留 `DashboardLayoutBoundary(DashboardLayoutProps & {onAvailabilityChange(available: boolean): void})`。
- lazy 资源仍由该业务组件拥有；不增加或重建查询 runtime。

- [x] 重放 `test/dashboard/layoutLoading.test.tsx` 中连续失败、恢复、卸载重挂载和 focus 断言，记录查询次数与配置不变。
- [x] 改为函数组件组合 ErrorBoundary、Suspense 和原简洁布局。lazy 状态使用工厂初始化；按钮同时创建新资源并重置边界：

```tsx
const [Layout, setLayout] = useState(loadLayout);
// 放在 fallback 的重试按钮事件中：
setLayout(loadLayout);
resetErrorBoundary();
region.current?.focus();
```

- [x] 可用性通知归属于成功提交/失败的当前布局区域；挂载 Suspense 等待时保持 loading 行为，重复失败保持简洁布局。恢复通知不得污染已卸载 runtime。
- [x] 执行源码测试、包构建、compiled 测试、类型、lint，再执行根全量单元测试：

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run --mode compiled test/renderBoundaryRecovery.test.tsx test/filterPanelEditorLifetime.test.tsx test/dashboard/filterSettings.test.tsx test/dashboard/layoutLoading.test.tsx
pnpm --filter @ahoo-wang/fetcher-view-engine test:type
pnpm lint:view-engine
npm_config_workspace_concurrency=1 pnpm test:unit
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm test:storybook
VIEW_ENGINE_BROWSER_CHANNEL=chrome VIEW_ENGINE_BROWSERS=chromium VIEW_ENGINE_ARTIFACTS=/tmp/fve-boundary-acceptance pnpm verify:view-engine
```

- [x] 用 `rg -n getDerivedStateFromError packages/view-engine/src` 确认 7 个自维护捕获实现归零。检查 RenderCommit 的新增代码计入净变化；保留既有性能预算、发布包隔离与真实 chunk 失败验证。
- [x] 在证据文档记录命令、实际计数、生产代码净变化、构建/gzip 变化、未验证的真实触摸/读屏边界。若净增加生产代码或出现语义退化，修订实现，不宣称完成。
- [x] 格式检查与 `git diff --check` 通过后，仅提交本阶段文件：`git commit -m 'refactor(view-engine): reuse React error boundaries'`。记录阶段提交作为排序计划的对照边界，不推送。

## Self-review

- 设计第 3 节由三个任务覆盖；成功提交恢复和旧回调隔离由 Task 2 覆盖。
- chunk 故障、core/UI 隔离、性能与净代码变化由 Task 3 覆盖。
- 本阶段无公共 API/产品用法变更，不为了文档改写引擎说明；若实际需要改变公共调用方式，先修订设计并同步双语 wiki 和 API 参考。
