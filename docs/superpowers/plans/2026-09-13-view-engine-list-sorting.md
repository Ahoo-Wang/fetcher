# View Engine List Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用新版 dnd-kit 统一五类列表排序，删除重复 HTML5 拖拽机制，并保留业务准入和取消语义。

**Architecture:** 内部 provider 归一化手势、失效与提交，项目组件注册现有 DOM 和手柄。业务组件保持唯一列表状态和排序规则；同一提交入口服务方向键快捷移动和正式拖拽。

**Tech Stack:** React 19、TypeScript、@dnd-kit/react 0.5.0、@dnd-kit/dom 0.5.0、Vitest、Storybook、Playwright。

**Spec:** `docs/superpowers/specs/2026-09-13-view-engine-interaction-primitives-design.md`

## Global Constraints

- 用户选择当前会话顺序执行；错误边界阶段完成验收后执行本计划。
- `@dnd-kit/react` 固定 `0.5.0`，`@dnd-kit/dom` 固定 `0.5.0`；workspace catalog + `catalog:`，不引入 helpers 或 legacy API。
- Dashboard 的 react-grid-layout、持久化模型、查询 runtime、公开组件 API 保持原职责。
- hover 只改变库的视觉预览，提交时重查权限和最新对象；取消不能恢复旧业务对象快照。
- 错误边界与排序分别计算生产代码净减少，不用前者收益抵消后者膨胀。
- 提交前根 `pnpm test:unit` 通过；重型验证串行执行。
- 旧的四份未跟踪草稿不纳入提交；不开 PR、不推送、不合并。

## Task 1: 共享排序组合层与四类配置入口

**Files:**

- Modify: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `packages/view-engine/package.json`
- Create: `packages/view-engine/src/lib/ListOrder.tsx`
- Remove: `packages/view-engine/src/lib/useListOrder.ts`
- Modify: `packages/view-engine/src/record/table/useRecordColumnOrder.ts`, `packages/view-engine/src/record/RecordColumnSettings.tsx`
- Modify: `packages/view-engine/src/record/RecordCardSettings.tsx`, `packages/view-engine/src/record/page/RecordSortSettings.tsx`, `packages/view-engine/src/analysis/AnalysisEditor.tsx`
- Migrate test: `packages/view-engine/test/useListOrder.test.tsx` to `packages/view-engine/test/listOrder.test.tsx`
- Test: `packages/view-engine/test/recordColumnOrder.test.tsx`, `packages/view-engine/test/recordColumnSettings.test.tsx`, `packages/view-engine/test/analysisControls.test.tsx`

**Interfaces (内部，不导出到 react.ts):**

```tsx
type ListOrderProps<T extends { id: string }> = {
  items: readonly T[];
  owner: unknown;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  titleOf(item: T): string;
  canMove?(item: T, target: T): boolean;
  onChange(items: T[]): void | Promise<boolean>;
  children: ReactNode;
};
// Promise<boolean> 返回 false 表示宿主已经处理失败，不播报成功。
// 同步 void 表示配置更新已完成；抛错仍由原调用方错误通道处理。
function ListOrder<T extends { id: string }>(
  props: ListOrderProps<T>,
): ReactNode;
type ListOrderItemProps = {
  id: string;
  children(bindings: {
    ref(element: Element | null): void;
    handleRef(element: Element | null): void;
    handleProps: ButtonHTMLAttributes<HTMLButtonElement>;
    dragging: boolean;
  }): ReactNode;
};
function ListOrderItem(props: ListOrderItemProps): ReactNode;
```

- [ ] 记录本阶段基线提交与所有受影响生产文件的非注释行数；完成后统计同一文件集加新增文件，不能遗漏调用方膨胀。
- [ ] 用新组合层写最小真实测试 fixture，保留受控对象与方向键断言；缺失模块导致第一次测试失败只证明接线待实现，后续必须通过真实交互断言：

```tsx
function Fixture({
  items,
  changed,
}: {
  items: { id: string }[];
  changed(items: { id: string }[]): void;
}) {
  return (
    <ListOrder
      owner="fixture"
      items={items}
      titleOf={item => item.id}
      onChange={changed}
    >
      <ol>
        {items.map(item => (
          <ListOrderItem key={item.id} id={item.id}>
            {bindings => (
              <li ref={bindings.ref}>
                <button ref={bindings.handleRef} {...bindings.handleProps}>
                  {item.id}
                </button>
              </li>
            )}
          </ListOrderItem>
        ))}
      </ol>
    </ListOrder>
  );
}
it('moves one step through the shared commit path', () => {
  const changed = vi.fn();
  render(<Fixture items={[{ id: 'a' }, { id: 'b' }]} changed={changed} />);
  fireEvent.keyDown(screen.getByRole('button', { name: 'a' }), {
    key: 'ArrowDown',
  });
  expect(changed).toHaveBeenCalledOnce();
  expect(
    changed.mock.calls[0][0].map((item: { id: string }) => item.id),
  ).toEqual(['b', 'a']);
});
```

- [ ] 添加精确 catalog 版本和包依赖，`pnpm install` 后核对依赖变更。读取实际安装的 index.d.ts/sortable.d.ts 与官方新版文档，不套用 legacy 的 active/over 接口。
- [ ] 组合 DragDropProvider、useSortable 与 KeyboardSensor/PointerSensor；项目通过 ref/handleRef 连接现有 li 与 Button，不额外包 DOM，不为 title 更新保存列表副本。
- [ ] 内部 committed ref 只在提交阶段更新；记录一次手势的 owner、ID 顺序、源 ID 和资格。onDragEnd 按以下顺序处理：

```tsx
if (event.canceled || !gesture.current) return;
const { source } = event.operation;
if (!isSortable(source)) return;
const operation = gesture.current;
gesture.current = null;
const { initialIndex, index } = source;
// 在调用下方原生重排之前，核对 operation.owner、最新 IDs 顺序、source.id、
// 初始 ID 与 initialIndex 对应关系，并通过最新 canMove。
const next = [...currentItems];
const [item] = next.splice(initialIndex, 1);
next.splice(index, 0, item);
```

- [ ] 方向键一步移动使用同一业务重排函数；正式拾起状态不执行一步移动。accept/onDragOver 拒绝非法预览；权限、owner、IDs 或资格改变时使手势 token 失效并取消库操作。
- [ ] 成功异步提交前不播报成功。完成时核对组件仍挂载、owner 和操作身份仍匹配；失败返回 false 不播报。焦点按 ID 回到现有手柄，移除时回到相邻手柄。
- [ ] 四类调用方替换 listProps/handleProps/dropBoundary，使用库预览替代旧手绘落点线。保留列固定区规则和 AnalysisEditor 的输出排序清理。输入框编辑、取消对话框和配置保存仍由原组件负责。
- [ ] 删除 useListOrder；更新测试为行为断言，不保留模拟 DataTransfer 的旧机制专用测试。
- [ ] 执行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/listOrder.test.tsx test/recordColumnOrder.test.tsx test/recordColumnSettings.test.tsx test/analysisControls.test.tsx`。对列表双实例、禁用、标题并发更新、移除项目、重排后晚到事件分别断言最终业务状态。

## Task 2: 管理视图排序与异步提交

**Files:**

- Modify: `packages/view-engine/src/view/ViewManagerGroup.tsx`, `packages/view-engine/src/view/ViewManagerRow.tsx`
- Test: `packages/view-engine/test/viewPage.ordering.test.tsx`, `packages/view-engine/test/viewPage.management.test.tsx`
- Consumes: Task 1 的 ListOrder/ListOrderItem。
- Produces: 五类入口全部复用同一机制，ViewManager 不再接收或分发 DragEvent。

- [ ] 原测试先记录分组、同组移动、持久化失败与 busy 时不能提交的基线。
- [ ] 删除 ViewManagerGroup 中 resolveDrop、dragged/drop 状态、手工 bounds 和原生事件；ViewManagerRow 通过项目绑定连接其现有 li 与手柄。
- [ ] 在 onChange 中从最新 engine.instanceIds 重建组内排序，保留其他组元素与现有 engine.reorderInstances 校验。异步返回语义使用现有 execute 回调适配，不修改所有管理操作的公共契约：

```tsx
let succeeded = false;
await execute(
  () => engine.reorderInstances(nextIds),
  () => {
    succeeded = true;
  },
);
return succeeded;
```

- [ ] 拖拽和键盘都在提交时调用 engine.canReorderInstances，busyRef 在异步边界生效；失败时采用最新引擎顺序而非起始快照。
- [ ] 管理对话框关闭或 owner 切换后晚到回执不更新旧焦点/播报；已发出的真实写入仍按原引擎回执契约收尾，不伪装取消服务端写入。
- [ ] 执行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/viewPage.ordering.test.tsx test/viewPage.management.test.tsx test/listOrder.test.tsx`。

## Task 3: 浏览器反例、复杂度门槛与文档

**Files:**

- Create: `stories/view-engine/ListOrder.test.stories.tsx`
- Modify relevant existing: `stories/view-engine/record-view/pinnedColumns.play.ts`
- Modify: `docs/superpowers/reviews/2026-09-13-view-engine-interaction-primitives.md`
- Modify: `wiki/reference/view-engine/engine.md`, `wiki/zh/reference/view-engine/engine.md`
- Generated via scripts: `wiki/llms-full.txt`, `wiki/llms.txt`

**Interfaces:** 使用 Task 1 fixture 的相同受控数据模型；浏览器测试调用真实 Pointer/Keyboard 事件，不 mock dnd-kit。

- [ ] 在新 story 中提供两个独立列表、固定项目、可变标题和撤权按钮。固定结果断言为稳定 ID 序列；输入与手柄明确分离。
- [ ] 编写真实浏览器用例：鼠标重排、Space/Enter 拾起与放下、Escape 取消、方向键一步移动、滚动容器、弹窗中拖动、拖动期间撤权/移除/标题变化。断言一次提交、最新标题、焦点和中文播报。
- [ ] 使用 Playwright touch-enabled context 或 Chromium 输入协议执行触摸模拟，记录点击、滚动与按住拖动的区别。禁止把 jsdom fireEvent 结果宣称为触摸验证。
- [ ] 在同一 fixture 上记录基线和新实现的交互耗时与生产消费包体积。复用已有 verify:view-engine 的性能预算及打包验证，不创建第二套性能框架。
- [ ] 顺序执行：

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run --mode compiled test/listOrder.test.tsx test/recordColumnOrder.test.tsx test/viewPage.ordering.test.tsx
pnpm --filter @ahoo-wang/fetcher-view-engine test:type
pnpm lint:view-engine
npm_config_workspace_concurrency=1 pnpm test:unit
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm test:storybook
VIEW_ENGINE_BROWSER_CHANNEL=chrome VIEW_ENGINE_BROWSERS=chromium VIEW_ENGINE_ARTIFACTS=/tmp/fve-sorting-acceptance pnpm verify:view-engine
```

- [ ] 更新双语文档：保留方向键快捷移动，新增拾起/放下/取消说明；描述五类通用排序与 Dashboard 网格的不同职责。
- [ ] 执行 `pnpm --dir wiki generate:llms`、`node --test wiki/test/documentation.test.mjs`、`pnpm --dir wiki build`。
- [ ] 检查 useListOrder 已移除，ViewManager 不再实现 bounds/HTML DragEvent；新 source 内没有 getDerivedStateFromError。计算本阶段生产代码净变化，包括新适配和所有调用方。
- [ ] 若本阶段不满足净减少/行为/性能门槛，保留已验收错误边界交付并报告排序未完成；不通过删除保护或修改预算使其通过。
- [ ] 格式和 diff 检查通过，仅提交排序、依赖、测试和文档文件：`git commit -m 'refactor(view-engine): unify list sorting with dnd-kit'`。

## Self-review

- 设计 4.1 的五类入口分别由 Task 1/2 覆盖；网格保留。
- 4.3/4.4 的提交语义和外部更新由 shared provider、ViewManager 与真实浏览器用例共同验证。
- 4.5 的鼠标、触摸、双键盘模式、中文播报、焦点和 reduced-motion 都属于 Task 3 的交互验收，不由单元测试替代。
- 排序净变化使用错误边界完成提交作为基线，两阶段不合并计算收益。
