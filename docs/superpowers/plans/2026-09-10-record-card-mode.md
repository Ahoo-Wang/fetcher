# Record Card Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if the user selects delegation. Steps use checkbox syntax for tracking.

**Goal:** 支持可保存的卡片模式及 table/card 共用的定义级默认配置。

**Architecture:** 扩展现有展示联合类型，在 RecordView 内选择表格或卡片。默认初始化复用同一纯函数；继续使用 SessionStore、RecordSummaries、字段渲染器和操作扩展，不增加管理层、注册系统或缓存。

文件划分是实施起点，不是禁止重构的边界。若实际调用证明职责混杂、反向依赖或规则重复，可重构必要模块和层级；优先修正责任归属，不为减少差异保留架构问题。新边界必须由本次真实消费者支撑，不能退化为布局框架或泛化管理器。

**Tech Stack:** TypeScript、React 19、shadcn/Base UI、Tailwind 4、Vitest、Storybook/Playwright。

**Spec:** [已审阅设计](../specs/2026-09-10-record-card-mode-design.md)

## Global Constraints

- Node >=20.20.2；pnpm 10.34.5。5.0.0 尚未发布，公共联合类型及命名调整纳入该版本；保持根目录和各包版本 5.0.0，不运行版本升级脚本。
- 使用当前隔离工作树及 feat/record-card-mode 分支，保留已有设计修改。
- 不增加依赖，不修改构建配置或根 tsconfig；新增源码遵循 Apache 2.0 文件头。
- 使用已有 fve 命名空间、语义颜色及 Base UI 控件；首版不增加排序面板、拖拽卡片布局或整卡插件。
- 默认配置完整复制，不逐字段合并；持久化实例不能用默认值掩盖损坏配置。5.0.0 尚未发布，允许破坏性重构，不提供旧契约迁移、别名或过渡层。
- 架构清晰优先于少改文件：纯配置与校验不依赖 React/Host/引擎，组件不直接访问查询服务，生命周期由引擎统一维护。必要的层级重构已获授权，范围限本功能；产品行为、持久化契约或版本边界变化须明确说明。
- 切换布局不重新读取记录；返回表格允许重新查询汇总。隐藏操作保留 renderer。
- 核心及 React API 同步更新 skills/fetcher-view-engine/references/api.md；wiki 中英文成对更新，不手改生成文件。
- 每项使用现有测试框架完成失败复现、最小实现、通过验证。任何提交前 pnpm test:unit 必须通过；本计划不授权推送或发布。

## 文件与职责

| 文件                                                                   | 改动职责                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------ |
| src/record/recordModel.ts                                              | 卡片、默认配置和展示联合类型                           |
| src/record/resolveRecordPresentation.ts（新增）                        | 校验输入后选择默认配置，返回独立副本                   |
| src/record/recordPresentation.ts                                       | 纯展示规则、当前布局汇总指标；不依赖初始化或展示校验   |
| src/record/validation/presentationValidation.ts（新增）                | 从实例校验提取表格规则，增加卡片规则，供定义与实例共用 |
| src/record/validation/definitionValidation.ts、instanceValidation.ts   | 接入共用校验；保持信任边界                             |
| src/record/engine/RecordEdits.ts、ViewEngine.ts                        | 布局与卡片配置编辑入口                                 |
| src/record/engine/RecordSummaries.ts、recordRefreshPolicy.ts           | 接入布局变化，复用取消、失效与刷新规则                 |
| src/record/RecordCardList.tsx（新增）                                  | 卡片、选择、图片回退和字段/操作呈现                    |
| src/record/RecordCardSettings.tsx（新增）                              | 可取消的设置草稿，沿用现有 Popover/Select/Button       |
| src/record/RecordView.tsx、page/RecordToolbar.tsx、recordReactTypes.ts | 组合、默认控件和自定义工具栏回调                       |
| src/index.ts、src/react.ts                                             | 公开导出                                               |

除明确写出的根目录路径外，src/ 和 test/ 路径均相对于 packages/view-engine。先读所有触及文件与调用者，不改动相邻无关实现。

命名约定：resolveRecordPresentation 只解析配置；setCardConfig 只修改配置；RecordCardList 是列表；RecordCardFieldConfig 是字段展示配置。page/RecordToolbar.tsx 从现有 page/RecordTableToolbar.tsx 重命名，不复制组件。公开属性 renderTableToolbar → renderToolbar、上下文 RecordTableToolbarRenderContext → RecordToolbarRenderContext 在未发布的 5.0.0 内一次调整，不提供兼容双入口；同时更新 ViewPage.tsx、RecordView.tsx、测试、导出和文档。工具栏操作统一为 toolbarActions、recordActions.toolbar、ToolbarActionsRendererProps，不保留旧字段或类型别名。同步 RecordActions.tsx、RecordCell.tsx、recordReactTypes.ts、定义校验及所有调用者。

## Task 1: 展示契约、默认值与信任边界

**Files:** 修改上表模型、展示函数、定义/实例校验与核心导出；新增 resolveRecordPresentation.ts、validation/presentationValidation.ts、test/recordPresentation.test.ts；扩展 test/recordValidation.test.ts。

**Interfaces:** 在 recordModel.ts 定义，后续任务直接使用，不各自创造类型：

```ts
export interface RecordTableConfig {
  columns: RecordColumn[];
}
export type RecordCardFieldConfig = Pick<
  Extract<RecordColumn, { kind: 'field' }>,
  'id' | 'field' | 'title' | 'renderer'
>;
export interface RecordCardConfig {
  title: RecordCardFieldConfig;
  cover?: { field: string };
  fields: RecordCardFieldConfig[];
  actions?: { visible?: boolean; renderer?: RendererReference };
}
export interface RecordPresentationDefaults {
  table?: RecordTableConfig;
  card?: RecordCardConfig;
}
export interface RecordTablePresentation {
  layout: 'table';
  table: RecordTableConfig;
  card?: RecordCardConfig;
}
export interface RecordCardPresentation {
  layout: 'card';
  table?: RecordTableConfig;
  card: RecordCardConfig;
}
export type RecordPresentation =
  | RecordTablePresentation
  | RecordCardPresentation;
```

ViewDefinition 增加 defaultPresentation?: RecordPresentationDefaults；RecordViewConfig.presentation 改为 RecordPresentation。内部共用校验函数为 validateRecordTableConfig(value: unknown, definition: DeepReadonly<ViewDefinition>): asserts value is RecordTableConfig，以及 validateRecordCardConfig(value: unknown, definition: DeepReadonly<ViewDefinition>): asserts value is RecordCardConfig。初始化函数实现在 resolveRecordPresentation.ts，从核心导出：

```ts
export function resolveRecordPresentation(
  definition: DeepReadonly<ViewDefinition>,
  layout: RecordPresentation['layout'],
  existing?: DeepReadonly<RecordPresentationDefaults>,
): RecordPresentation;
```

- [ ] 在 recordPresentation.test.ts 导入上述新函数，复用 test/engine/fixtures.ts 的 definition，先增加以下用例：

```ts
it('initializes only the requested layout and preserves its config on return', () => {
  const first = resolveRecordPresentation(definition, 'card');
  expect(first.table).toBeUndefined();
  if (first.layout !== 'card') throw new Error('expected card');
  expect(first.card.title.field).toBe(definition.rowKey);
  const table = resolveRecordPresentation(definition, 'table', first);
  if (table.layout !== 'table') throw new Error('expected table');
  expect(table.table.columns.map(column => column.id)).toEqual(
    definition.fields.map(field => field.field),
  );
  const back = resolveRecordPresentation(definition, 'card', table);
  expect(back.card).toEqual(first.card);
  expect(back.card).not.toBe(first.card);
});
```

- [ ] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/recordPresentation.test.ts`，确认缺少初始化 API 导致失败。
- [ ] 提取原表格校验，不改变其规则。卡片校验检查对象、id、字段、封面 string 类型、唯一摘要 id、visible 布尔值和 renderer JSON 引用；标题仅允许已定义字段或 rowKey。actions 存在时必须能找到显式或定义级引用，包括隐藏状态。renderer 业务选项继续在组件中验证。
- [ ] 初始化先验证提供的配置容器与所有已提供的 table/card，再按 existing → defaultPresentation → 内置配置选取并深拷贝。只有 undefined 表示缺失；null、错误类型及非法结构必须在选择默认值前拒绝，包括未启用布局的已提供配置。默认表格生成全部顶层字段，默认卡片用固定 id `title`、rowKey 字段及空 fields。核心实现形状：

```ts
for (const candidate of [existing, definition.defaultPresentation]) {
  if (candidate === undefined) continue;
  assertObject(candidate, '展示配置');
  if (candidate.table !== undefined)
    validateRecordTableConfig(candidate.table, definition);
  if (candidate.card !== undefined)
    validateRecordCardConfig(candidate.card, definition);
}
const table =
  existing?.table !== undefined
    ? existing.table
    : layout === 'table'
      ? (definition.defaultPresentation?.table ?? {
          columns: definition.fields.map(field => ({
            id: field.field,
            kind: 'field' as const,
            field: field.field,
          })),
        })
      : undefined;
const card =
  existing?.card !== undefined
    ? existing.card
    : layout === 'card'
      ? (definition.defaultPresentation?.card ?? {
          title: { id: 'title', field: definition.rowKey },
          fields: [],
          ...(definition.recordActions?.row ? { actions: {} } : {}),
        })
      : undefined;
```

选择后再次校验当前布局必填配置及存在的其他配置，以验证内置生成值；返回值使用已有 copy，layout 不属于 table/card 时拒绝。初始化面向已通过定义校验的 ViewDefinition，不重复验证整份定义，但独立验证上述配置输入。依赖方向固定为 resolveRecordPresentation → presentationValidation → recordPresentation → 模型及纯工具；recordPresentation 不反向导入初始化或校验。定义和实例校验直接引用 presentationValidation，不经聚合导出 recordValidation.ts，也不调用初始化函数修补输入。

- [ ] 用相同测试文件补充两种布局、三层优先级、深拷贝、无字段时 table 失败但 card 主键标题可用、非法 existing 不回退、未定义主键标题、操作区三态与非法 JSON。通过 unknown 信任边界用例覆盖 existing 为 null、existing.table/card 为 null、默认 table/card 为 null，以及未启用布局的非法配置；预期均抛错，且不修改输入。undefined 缺失仍正常回退。实例校验检查当前布局配置必填，另一布局存在时也验证；默认配置校验在定义加载处完成。
- [ ] 执行上述测试及 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/recordValidation.test.ts test/recordValidation.boundaries.test.ts`。更新 API 参考中的类型和默认值章节。

## Task 2: 引擎编辑、保存和汇总生命周期

**Files:** 修改 RecordEdits.ts、ViewEngine.ts、recordPresentation.ts、recordRefreshPolicy.ts；按实际接入需要调整 RecordSummaries.ts。新增 test/engine/cardPresentation.test.ts，扩展 test/summary/lifecycle.test.ts、test/engine/save.test.ts。

**Interfaces:** ViewEngine 和 RecordEdits 提供 `setLayout(layout: RecordPresentation['layout'], id?: string): void` 与 `setCardConfig(card: DeepReadonly<RecordCardConfig>, id?: string): void`。setCardConfig 更新配置但不强制切换 layout。沿用现有 errors、dirty、保存和恢复机制。

- [ ] 复用 test/engine/fixtures.ts 的 setup、selected、deferred，先写：

```ts
it('keeps current rows and selection when switching layout', async () => {
  const { engine, paged } = setup();
  try {
    await engine.load();
    engine.setSelection(['a']);
    const before = selected(engine);
    engine.setLayout('card');
    expect(paged).toHaveBeenCalledTimes(1);
    expect(selected(engine).rows).toEqual(before.rows);
    expect(selected(engine).selectedRowKeys).toEqual(['a']);
    expect(selected(engine).dirty).toBe(true);
  } finally {
    engine.dispose();
  }
});
```

- [ ] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/engine/cardPresentation.test.ts`，确认新方法尚不存在。
- [ ] setLayout 调用 Task 1 初始化函数，使用 SessionStore.updateInstance 更新 presentation；不调用 RecordQueries.change/run。相同布局和相同配置直接返回，避免重复发布。随后按现有 setColumns 模式比较汇总 key，并用现有 sync 同步。setCardConfig 用同一实例更新边界，不启动记录查询。
- [ ] 修改当前指标提取与刷新暂停条件：

```ts
if (presentation.layout === 'card') return [];
// 在 getRecordRefreshBlockReason 内替换原 summary 分支：
if (
  session.instance.config.presentation.layout === 'table' &&
  session.allSummary.status === 'loading'
)
  return 'summary';
```

RecordSummaries.sync 的现有空指标路径应清理页汇总、invalidate 全量请求。若测试发现遗漏，仅在此共享入口修复，不分别在筛选、分页、UI 中增加取消逻辑。返回 table 使用当前条件重算，接受 aggregate 读取；不得重新 paged/cursor。

- [ ] 使用 deferred aggregate 复现悬挂汇总，断言切到 card 后 abort、后台记录刷新可继续、晚到响应不回写；card 初始加载/筛选/分页/refreshSummary 无 aggregate；返回 table 有指标才补算。分别验证游标与页码、查询在途、重入订阅切换实例时不误改另一 session。
- [ ] 验证保存、另存为、恢复包含两种展示配置，预设更新不覆盖现有配置；恢复到无 card 基线后再切换才初始化。运行该任务新增测试和 `test/summary`、`test/engine/save.test.ts`、`test/engine/editQueryOwnership.test.ts`，更新 API 方法与汇总行为说明。
- [ ] 增加双向往返还原用例：先配置非默认的表格列顺序、显隐、宽度、固定及汇总，再 table → card → table，断言 table 配置深相等；对卡片标题、封面、摘要顺序及操作区做同样验证。已应用但未保存的设置也需保留，切换不得调用 restore 或覆盖已有配置。复用实例中的 table/card 两份配置，不增加按布局保存的 session、历史栈或还原管理器。

## Task 3: 卡片结果与设置界面

**Files:** 新增 RecordCardList.tsx、RecordCardSettings.tsx；修改 recordReactTypes.ts、RecordView.tsx、page/RecordToolbar.tsx、src/react.ts；新增 test/recordCardList.test.tsx、test/recordCardSettings.test.tsx，扩展 test/recordRegions.test.tsx。

**Interfaces:** `RecordCardListProps` 使用 Pick<RecordTableProps, 'definition' | 'instance' | 'appliedFilter' | 'rows' | 'extensions' | 'querying' | 'queryError' | 'onQueryRetry' | 'selectable' | 'selectedRowKeys' | 'onSelectionChange' | 'refresh' | 'className'>；`RecordCardSettingsProps` 为 definition、card、同步 onChange(card: RecordCardConfig): void、disabled?。onChange 直接调用绑定实例的 engine.setCardConfig，失败须抛出；不得包装进吞掉异常的 RecordView.run，也不接受异步提交。RecordToolbarRenderContext 增加 setLayout、setCardConfig，与引擎签名相同但省略 id，回调绑定当前实例。

- [ ] 使用 test/fixtures/recordTable.ts 的 definition/instance/props 构造 card presentation，先写卡片列表、选择、标题回退、隐藏操作保留引用的测试；无新组件时执行测试确认失败。
- [ ] RecordCardList 使用 ol/li、现有 Checkbox/Button 和 CSS Grid。RecordCell 用于普通字段与操作，不引入新 registry；卡片字段转换只加 kind，操作配置转换成 kind: actions 的列。每个扩展放在 RecordRendererBoundary 内。标题主键未列入字段列表时，共享 RecordCell 从 rowKey 构造最小运行时字段描述（字段路径和主键标签），继续执行显式 renderer；不修改宿主 ViewDefinition。核心映射：

```tsx
const column: RecordColumn = { ...configuredField, kind: 'field' };
const missing =
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');
const fallbackTitle = String(rowKey);
const actionsVisible =
  card.actions !== undefined && card.actions.visible !== false;
```

- [ ] 标题缺失直接显示 fallbackTitle，非缺失才调用 RecordCell；图片 alt 复用同一判断，非缺失使用 formatRecordValue。封面在 RecordCardList 内用小的局部图片组件保存失败状态，以 src 为 key 重置；`new URL(value, 'https://view-engine.invalid/')` 检查 http/https 协议，禁止 mailto/tel/data/javascript；不改变 LinkCell 的链接协议规则。配置缺失不渲染封面，值缺失/地址非法/加载失败显示占位。
- [ ] 查询状态沿用 RecordQueryStatus 的文字及优先级；该组件带 TableRow，不能直接放入列表。卡片用现有 Spinner/Button 和少量条件渲染实现空/错/重试，不为了两处 markup 增加通用状态框架。查询失败但有旧行时继续展示旧行。
- [ ] RecordCardSettings 使用现有 Popover/Select/Button，在打开时复制 card 为本地草稿；应用一次 onChange，取消或关闭丢弃草稿。标题下拉包含未定义于 fields 的 rowKey，封面仅列出 string 字段；摘要支持增删、上下移动，沿用现有生成 id 工具；保留未被修改的 title/renderer。操作开关仅修改 visible：

```ts
const next = {
  ...draft,
  actions: { ...draft.actions, visible },
};
```

有 actions 或默认行操作时提供开关；无引用不可开启。设置组件负责捕获应用错误并保留弹层与草稿，仅提交成功时关闭：

```tsx
function apply() {
  setError(null);
  try {
    onChange(draft);
  } catch (error) {
    setError(error instanceof Error ? error.message : '应用设置失败');
    return;
  }
  setOpen(false);
}
```

错误通过弹层内 role="alert" 展示。取消仍丢弃草稿；按实例 id 重置设置，避免切换实例后提交旧草稿。页面上的布局按钮继续使用 RecordView.run 处理页面错误；设置组件不依赖该包装、不持有引擎、不增加通用提交管理器。删除和移动字段后保持合理键盘焦点。

- [ ] RecordView 根据 layout 选择 RecordTable/RecordCardList，保留过滤、刷新控制和分页组件的挂载位置。顶部全局工具栏使用 DropdownMenuRadioGroup 表达布局选择，触发器显示当前模式，布局控件不因切换而卸载；卡片设置替换列设置。自定义 toolbar 的 defaultContent 和回调一起更新。
- [ ] 补充可访问名称、全选/部分选、0 与 false 标题、长文本、图片错误恢复、自定义字段失败隔离、无默认操作时隐藏/保存/重载/重新开启测试。执行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/recordCardList.test.tsx test/recordCardSettings.test.tsx test/recordRegions.test.tsx`，再执行包 typecheck 与 lint。
- [ ] 增加设置提交失败用例：onChange 首次同步抛错，断言弹层、原草稿和错误信息保留，实例未改变；第二次成功后关闭。另测取消及切换实例丢弃旧草稿，验证 RecordView 到设置的真实回调没有吞掉 engine.setCardConfig 错误。

## Task 4: 浏览器验证、文档与版本交付

**Files:** 新增 stories/view-engine/RecordCardList.stories.tsx、RecordCardList.test.stories.tsx；修改 packages/view-engine/README.md、README.zh-CN.md、skills/fetcher-view-engine/references/api.md；更新 wiki/guides/view-engine/getting-started.md、table-and-runtime.md、saved-views.md、extensions.md 及对应 wiki/zh 页面；根目录及各包 package.json 的版本保持 5.0.0。

- [ ] Storybook 复用已有本地 host 和订单字段示例，定义 table/card 预设；实例使用 resolveRecordPresentation 初始化。展示有封面、无封面、自定义行操作、窄屏、明暗主题，不创建新示例服务器。
- [ ] 添加浏览器交互，使用项目既有 story 测试导入，至少断言：

```tsx
await userEvent.click(
  canvas.getByRole('button', { name: '卡片', exact: true }),
);
await expect(canvas.getByRole('list', { name: '记录卡片' })).toBeVisible();
await userEvent.click(
  canvas.getByRole('button', { name: '表格', exact: true }),
);
await expect(canvas.getByRole('table')).toBeVisible();
```

设置弹层通过 ownerDocument 查询，验证应用/取消、选择后切换保留、保存重载、隐藏操作后重新开启，以及键盘焦点。截图检查 375px 与桌面宽度、明暗主题、长标题和损坏图片；记录真实浏览器结果。

- [ ] README 和 wiki 给出可复制的 defaultPresentation 示例：table.columns 使用已有字段；card.title 带 id/field，cover.field 指向图片字段，fields 使用稳定 id，actions.visible 与 renderer 分开。示例明确 defaults 只初始化缺失配置，不覆盖用户配置；卡片不展示汇总，返回表格重算。
- [ ] 文档仅介绍未发布 5.0.0 的最终 API、数据契约和类型收窄用法，不写迁移指南。同步源码、导出、消费示例及测试；旧工具栏名称只在本计划的重命名定位处出现，不在产品 API 中保留兼容入口。
- [ ] 验证只含 card 的实例可持久化并重载，首次切到 table 才补默认列；往返保留两份配置。类型检查覆盖布局收窄，检查 RecordTable 及其调用者不再从未收窄的联合实例读取 table。无效持久化数据明确拒绝，不自动迁移或删除。
- [ ] 确认版本保持 5.0.0，并执行构建与验收：

```bash
git diff --stat
pnpm -r --filter './packages/*' build
pnpm --filter @ahoo-wang/fetcher-view-engine test
pnpm lint:view-engine
pnpm test:storybook -- stories/view-engine/RecordCardList.test.stories.tsx
pnpm --dir wiki generate:llms
node --test wiki/test/documentation.test.mjs
pnpm --dir wiki build
pnpm test:unit
git diff --check
```

不因本次功能调整版本或依赖范围；lockfile 如有必要变化，检查并说明原因。格式化限改动文件；若 prettier 不可用，不把安装格式化工具变成本功能依赖。

- [ ] 按规格逐项复查默认值、标题、操作状态、取消/晚到汇总和持久化；在本计划末尾记录实际检查及未完成项。所有必需检查通过后再准备提交，不推送、不发布。
- [ ] 对触及模块逐条核对运行时 import 与调用方向：无循环或纯配置层反向依赖 UI/Host；默认选择、校验和汇总取消规则各有单一归属；表格/卡片共享规则不通过相互依赖具体布局实现。若为满足这些条件调整了模块划分，在本计划记录实际文件、原问题及对应回归验证，不新增架构审查框架。

## 计划自审

- 默认值与信任边界、最终类型契约由 Task 1/4 覆盖；引擎与汇总由 Task 2 覆盖；渲染、设置、扩展与可访问性由 Task 3/4 覆盖。
- table/card 配置类型、初始化及编辑方法在前置任务中一次定义；后续任务不增加平行模型。
- 初始化、校验和展示规则单向依赖；已有汇总规则不反向依赖初始化。
- 显式配置先验证再回退，null 不等于缺失；生成结果仍须校验。
- 设置提交的错误归属明确：引擎抛错、回调透传、设置组件保留草稿并显示错误。
- 首版不缓存停用布局的汇总，不新增通用渲染器、操作管理器或配置继承框架。
- 实现已完成；下面记录实际验证结果，前文保留实施步骤作为设计依据。


## 实施结果（2026-09-10）

- [x] 配置与校验：新增独立的 resolveRecordPresentation、共用展示校验和 table/card 联合；卡片不依赖表格配置，默认输入先校验再选择并返回可编辑副本。
- [x] 引擎：setLayout、setCardConfig、setColumns 共用私有展示更新入口；卡片停用汇总，往返保留两种模式配置及共享查询状态。
- [x] UI：RecordCardList、RecordCardSettings、RecordToolbar 与公开命名接入；继承已有字段/操作扩展、主题和分页。
- [x] 验证与文档：增加配置、在途查询、汇总、设置、存储往返测试及 Chrome 回归；更新 API、README、双语 wiki 和生成内容。

实际检查：

- `pnpm --filter @ahoo-wang/fetcher-view-engine... build` 通过，后续受影响包重建通过。
- `VITEST_MAX_WORKERS=4 pnpm test:unit` 通过；view-engine 普通与 React Compiler 模式各 120 文件、950 测试通过，并通过类型检查。
- 默认高并发首次运行有架构扫描 5 秒和类型消费检查 20 秒超时；单独架构检查 3 测试通过，限制并发后全量通过。未修改超时或跳过断言。
- `pnpm lint:view-engine` 通过。
- `VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm exec vitest run --project=storybook stories/view-engine/RecordCardList.test.stories.tsx` 两项通过，包含 axe、往返切换、配置保留和键盘焦点。默认 Playwright bundled Chromium 未安装，使用本机 Chrome。
- 1280px 浅色与 375px 深色截图已人工检查，卡片无横向溢出。
- `node --test wiki/test/documentation.test.mjs` 10 项通过，`pnpm --dir wiki build` 通过。
- 根目录和包版本维持 5.0.0；未改依赖、构建配置，未提交功能代码、推送或发布。


收尾复查：独立审查发现的主键标题 renderer 忽略问题已修复；共享 RecordCell 为 intrinsic rowKey 提供最小字段描述，保留显式 renderer，宿主定义不变。另将展示更新的校验置于快照比较前，拒绝 options getter 且不调用它。两项均有失败复现和通过回归。最终 `VITEST_MAX_WORKERS=4 pnpm test:unit` 已重新完整通过（普通/compiled 各 950 项），未放宽断言或修改超时。

## 顶部切换与自定义内容增量（2026-09-10）

- 展示切换移到 RecordGlobalToolbar，新 RecordLayoutSwitch 仅负责控件呈现；复用原引擎回调，按视图容器 40rem 阈值在分段按钮和带当前名称的下拉框之间切换。
- 新增运行时 renderCard / RecordCardRenderContext，经过 ViewPage/RecordView 传给列表，并复用 RecordRegion 隔离错误。选择控件仍由列表管理，defaultContent 可组合，没有新增整卡注册表或持久化函数。
- 修正无封面显示、字段耗尽禁用和应用文案；加入自定义内容与 LocalStorageViewHost 保存示例。
- 同步核心类型消费、交互回归及双语/API 文档。全仓 `VITEST_MAX_WORKERS=4 pnpm test:unit` 通过，view-engine 普通/compiled 各 955 项；Chrome 4项故事回归、lint、包构建和 wiki build 通过。
- in-app Browser 实际检查顶部切换、自定义内容和窄容器下拉；保存示例切换到表格并保存，浏览器 reload 后保持表格，确认持久化链路。
- 独立复查未发现确定问题；字段耗尽后删除的焦点疑虑已被真实回归反证，保留测试而未添加冗余焦点逻辑。


## 订单操作示例与统一下拉修订（2026-09-10）

按用户最新要求，顶部展示方式统一下拉，不再按宽度使用分段按钮；删除仅为分段切换存在的 CSS 容器查询。当前规则取代前一增量中的40rem断点方案。

主 Cards 故事改用已有 OrderExample，卡片预设启用行操作；OrderRowActions 同时提供详情 Popover 和实际处理，默认/自定义卡片共用。顶部创建、批量处理、单笔处理均调用既有订单服务及重试机制，处理成功后刷新待办队列。基础配置示例另保留为 Configuration；持久化示例继续区分视图配置保存与本地业务数据。

已观察主预览中的详情/处理、批量处理、创建及顶部模式下拉。相关3组 Chrome 故事共12项通过，包含旧扩展示例回归；独立只读复查无实质问题。

本轮最终验证：`VITEST_MAX_WORKERS=4 pnpm test:unit` 通过，view-engine 普通与 compiled 各121文件、956项；3组 Chrome 故事共12项通过。包构建、lint、wiki build和差异检查通过；版本保持5.0.0，未提交或发布。


### 展示能力与工具栏验证

已实现必填 allowedLayouts、单模式隐藏切换、卡片角标选择和顶部图标操作。
验证：view-engine 121 文件 / 959 测试通过（普通与 compiled）；类型检查、包构建、lint、6 项卡片浏览器测试、双语文档检查与 wiki 构建通过。实际预览确认卡片无选择空白行。未提交或发布。
