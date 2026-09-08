# Builtin Cell Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. 用户已选择当前任务内顺序执行。

**Goal:** 六类常用单元格无需业务注册即可使用，支持独立组合和持久化恢复。

**Architecture:** 沿用 RecordCell 的配置与扩展选择。内部适配器连接轻量独立组件；共用格式化及现有 UI primitives，不增加 host 或异步框架。

**Tech Stack:** TypeScript、React Compiler、shadcn/Base UI、Intl、Vitest、Playwright。

**Spec:** `docs/superpowers/specs/2026-09-08-builtin-cell-components-design.md`

## Global Constraints

- Node >=20.20.2，pnpm 10.34.5；不新增依赖，不修改构建配置。
- 保留前阶段筛选器改动；不提交、不推送。
- JSON renderer.name/options 可恢复；自有业务注册优先；保持 core 不依赖 React。
- 空值、非法链接、时区、复制失败、键盘和主题必须验证。

## Task 1: 单元格和内置注册

**Files:** 新增 `src/record/cells/{TextCell,TagsCell,StatusCell,LinkCell,DateTimeCell,NumberCell,builtinCellRenderers}.tsx`；新增 `src/record/recordValueFormat.ts`、`src/record/cells/cellValue.ts`；修改 `src/record/table/RecordCell.tsx`、`src/record/recordModel.ts`、`src/react.ts`、`src/styles.css`。路径均相对于 packages/view-engine。

**Interfaces:** 六个独立组件采用 `{value, ...options}`。`BUILTIN_CELL_RENDERERS: Readonly<Record<string, ComponentType<CellRendererProps>>>` 是模块级静态注册表，用于内部回退，避免 React Compiler 将工厂返回值视为渲染时创建的组件；`formatRecordNumber` 的 field 参数收窄为 `Pick<ViewFieldDefinition, 'numberFormat'>`，原调用仍适用。`formatRecordValue(value, field)` 内部复用旧显示分派。`CellValue` 为 string/number/boolean，`CellOption` 为 value/label，`CellTone` 为 neutral/success/warning/danger/info。

- [x] 添加 `test/builtinCells.test.tsx`，通过现有 RecordCell 验证无注册表配置：

```tsx
render(
  <RecordCell
    {...props}
    column={{
      kind: 'field',
      id: 'status',
      field: 'status',
      renderer: { name: 'status' },
    }}
  />,
);
expect(screen.getByText('已付款').closest('[data-slot="badge"]')).toBeTruthy();
```

- [x] 执行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/builtinCells.test.tsx`，确认因缺失内置组件失败。
- [x] 实现六组件、选项校验、共享格式化和内部适配。注册查找保留自有属性检查：

```ts
const Renderer =
  registry && Object.prototype.hasOwnProperty.call(registry, reference.name)
    ? registry[reference.name]
    : Object.prototype.hasOwnProperty.call(
          BUILTIN_CELL_RENDERERS,
          reference.name,
        )
      ? BUILTIN_CELL_RENDERERS[reference.name]
      : undefined;
```

- [x] 验证原型名、显式覆盖、币种/百分比、日期 0/无效日期、复制原值/失败/值切换、标签折叠及危险协议。
- [x] 执行针对测试、compiled 模式和 `pnpm --filter @ahoo-wang/fetcher-view-engine test:type`；按真实失败修复，不弱化断言。

## Task 2: 公开示例、恢复和文档

**Files:** 新增 `examples/react/BuiltinCellsExample.tsx`、`stories/view-engine/BuiltinCells.stories.tsx` 和 `.test.stories.tsx`；修改 `scripts/verify-package.mjs`、仓库 `scripts/verify-storybook-browser.mjs`、双语 README、`skills/fetcher-view-engine/references/api.md`。

**Interfaces:** 示例消费公开 `/react` 导出的六组件及 ViewPage，复用 LocalStorageViewHost；展示与回归 Story 分离。BrowserStorage 场景使用独立 scopeKey。现有脚本从 dist 验证公开导出与类型，不使用 src 深导入。

- [x] 加入公开导出断言：

```js
for (const name of [
  'TextCell',
  'TagsCell',
  'StatusCell',
  'LinkCell',
  'DateTimeCell',
  'NumberCell',
])
  assert.equal(typeof ui[name], 'function');
```

- [x] 示例提供长文本、数字/字符串标签、状态、网址、日期、人民币、百分比和无效值；保存列可见性后以新 host 重开验证同一 renderer/options。
- [x] 浏览器验证数量按钮键盘打开、Escape 返回焦点、暗色窄容器、真实刷新恢复；检查 axe 结果与截图。
- [x] 更新中英文接入示例及 API 表，明确 NumberCell 金额/百分比配置、链接协议和复制原值规则。

## Task 3: 完整验证

- [x] `pnpm lint:view-engine`
- [x] `VITEST_MAX_WORKERS=2 pnpm --filter @ahoo-wang/fetcher-view-engine test`
- [x] `pnpm --filter @ahoo-wang/fetcher-view-engine build`
- [x] `node packages/view-engine/scripts/verify-package.mjs`
- [x] `pnpm test:storybook`；`pnpm build-storybook`；运行静态浏览器验证脚本。
- [x] `git diff --check`，自审新增接口与实际代码一致，记录结果。用户要求提交时另跑根 `pnpm test:unit`。

## 自检

Task 1 覆盖六类组件和边界；Task 2 覆盖公开入口、可恢复性和浏览器交互；Task 3 覆盖打包与回归。没有添加 host 职责、第三方依赖或扩大到可编辑表格。

## 验证记录

- 源码测试 453 项，未编译和 React Compiler 模式均通过；类型检查与 lint 通过。新增 23 项单元格回归覆盖配置、字符串/数字身份、复制、协议与时区等边界。完整日志：`/tmp/builtin-cells-tests-final2.log`。
- 全部 Storybook 浏览器测试 245 项通过（原有 HTTP 实验测试文件仍按配置隔离），新增 8 个展示/交互案例。`/tmp/builtin-cells-storybook-full.log`。
- Storybook 静态构建、8 个导航目标、115 个隐藏回归场景索引通过。静态浏览器检查覆盖全部 Docs、独立 iframe、旧筛选器恢复以及新单元格 renderer/options 与列可见性刷新恢复。`/tmp/builtin-cells-static-browser.log`。
- 真实浏览器验证剪贴板内容、复制后视图不变脏、长文本按钮边界、键盘与 Esc 焦点、深色弹层、390px 布局、LocalStorageViewHost 新实例及浏览器刷新。`/tmp/builtin-cells-browser-final.log`。桌面、深色窄屏和窄屏表格截图已目视检查。
- 打包验证检查 5 个入口、公开组件类型、9 个 React 示例模块、core 无 React 依赖及产物一致性。最终日志：`/tmp/builtin-cells-package-final.log`。源码类型收窄修正后重新构建并复跑内置单元格浏览器场景。
- 审查三项问题均修复并独立定向复核。保留既有工作树与两个阶段全部改动，未提交、未推送；提交时仍需遵循根 pnpm test:unit 检查。
