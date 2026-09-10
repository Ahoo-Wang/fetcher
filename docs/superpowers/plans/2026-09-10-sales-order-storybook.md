# Sales Order Storybook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. 本任务默认建议在当前会话顺序执行；是否使用子代理由用户选择。

**Goal:** 以同一套可信订单数据和业务规则，重构 View Engine Storybook 的全链路入口、岗位章节、扩展演示和回归用例。

**Architecture:** 订单事实、业务命令和查询投影属于示例宿主；引擎继续负责视图配置和查询生命周期。完整工作台与章节复用同一示例，每次挂载隔离存储。复用 record-view 现有查询及视图宿主，并迁移旧示例调用者，不增加第三套查询实现。

**Tech Stack:** TypeScript、React、现有 View Engine/shadcn/Base UI、Wow 查询协议、Vitest、Storybook browser tests。

**Spec:** `docs/superpowers/specs/2026-09-10-sales-order-storybook-design.md`（用户已确认）。

## Global Constraints

- 当前仓库与 view-engine 版本均为 5.0.0；Node >=20.20.2，pnpm 10.34.5。
- 不新增依赖、不修改构建配置、不修改公开 API。业务代码不进入引擎核心。
- 业务运算使用整数分；查询快照提供人民币元数值。时间采用毫秒时间戳，展示时区 Asia/Shanghai；演示时钟固定为 2026-09-10 10:00。
- 订单状态、收款、履约、开票、售后分别表达；不以单个“处理中”替代。
- 故事默认内存隔离，刷新重置业务记录；持久化只在显式声明的专项验证。
- 公开展示故事保持初始状态；play 回归故事使用 `['!dev', '!autodocs', 'test']`。
- 改动前读取适用 AGENTS.md。中英文 wiki 同步，禁止手工修改生成文件。
- 默认不提交、推送或发布。用户授权提交后，必须先通过 `pnpm test:unit`，不按每个小步骤重复提交。
- 只记录实际验证结果；当前工作区未安装 Prettier，执行前检查依赖并用锁文件安装现有依赖。

## 文件分工与依赖

统一示例放在 `packages/view-engine/examples/react/sales-order/`，避免包示例反向依赖 stories。

| 文件                  | 职责                                     |
| --------------------- | ---------------------------------------- |
| `model.ts`            | 业务类型、金额和数量投影、不变量         |
| `fixtures.ts`         | 固定时钟、客户/SKU、18 笔场景样本        |
| `service.ts`          | 命令、岗位校验、请求去重和隔离存储       |
| `querySource.ts`      | 从旧 record-view 移入并参数化的查询实现  |
| `views.ts`            | 定义、岗位视图、字段与扩展引用           |
| `host.ts`             | 从旧 createHost 迁移的视图管理及权限服务 |
| `OrderWorkbench.tsx`  | 生命周期、角色切换、重置、ViewPage 组合  |
| `OrderForms.tsx`      | 创建及业务操作表单，类型化提交           |
| `OrderDetails.tsx`    | 商品、收付款、交付、票据与操作时间线     |
| `OrderExtensions.tsx` | 业务筛选、单元格、全局/批量/行操作       |

新测试放在 `packages/view-engine/test/salesOrder*.test.ts(x)`；故事放在 `stories/view-engine/orders/`。任务依赖为 1 → 2 → 3 → 4 → 5 → 6 → 7，任务完成前不删除旧入口。

### Task 1: 订单事实、投影与可复现样本

**Files:** Create `sales-order/model.ts`、`sales-order/fixtures.ts`（均相对上表示例目录）；Create `packages/view-engine/test/salesOrderModel.test.ts`。

**Interfaces:** 后续任务共同使用以下接口；RecordData/MaterializedSnapshot 沿用公开类型。

```ts
type Role = 'sales' | 'manager' | 'delivery' | 'finance' | 'support';
type Stage =
  'all' | 'review' | 'release' | 'delivery' | 'settlement' | 'aftersales';
type Lifecycle =
  'draft' | 'submitted' | 'rejected' | 'confirmed' | 'cancelled' | 'closed';
interface Item {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}
interface AmountRecord {
  id: string;
  amountCents: number;
  reference: string;
  at: number;
}
interface QuantityLine {
  itemId: string;
  quantity: number;
}
interface Shipment {
  id: string;
  lines: QuantityLine[];
  tracking: string;
  at: number;
}
interface Receipt {
  shipmentId: string;
  accepted: QuantityLine[];
  rejected: QuantityLine[];
  at: number;
}
interface ReturnCase {
  id: string;
  requested: QuantityLine[];
  approved: boolean;
  received: QuantityLine[];
  at: number;
}
interface OrderDraft {
  customerId: string;
  ownerId: string;
  region: string;
  terms: 'prepaid' | 'credit';
  dueAt: number;
  paymentDueAt: number;
  items: Item[];
}
interface OrderFacts extends OrderDraft {
  id: string;
  lifecycle: Lifecycle;
  released: boolean;
  reconciled: boolean;
  prepared: QuantityLine[];
  shipments: Shipment[];
  receipts: Receipt[];
  returnedToWarehouse: { shipmentId: string; lines: QuantityLine[] }[];
  returns: ReturnCase[];
  receiptsOfMoney: AmountRecord[];
  refunds: AmountRecord[];
  invoices: AmountRecord[];
  credits: AmountRecord[];
  history: { action: string; actor: Role; at: number; reason?: string }[];
}
// export OrderState: 客户名称/ID、金额元、交期、明细数量和五个状态维度。
type OrderSnapshot = MaterializedSnapshot<OrderState> & RecordData;
function projectOrder(order: OrderFacts): OrderSnapshot;
function validateOrder(order: OrderFacts): void;
const DEMO_NOW = Date.parse('2026-09-10T10:00:00+08:00');
function createOrderFixtures(): OrderFacts[];
```

- [x] 写下金额反例测试（测试 imports 使用项目习惯），先确认因模块缺失失败。

```ts
it('projects a 1200 yuan partial return without losing original amounts', () => {
  const order = createOrderFixtures().find(o => o.id === 'SO-202609-1005')!;
  const { state } = projectOrder(order);
  expect(state.totalAmount).toBe(4800);
  expect(state.receivableAmount).toBe(3600);
  expect(state.refundDue).toBe(1200);
  expect(state.creditDue).toBe(1200);
});
```

- [x] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/salesOrderModel.test.ts`，记录预期失败。
- [x] 实现上述类型和投影。OrderState 明确包含 `customerId/customer/owner/region/terms/dueAt/paymentDueAt/items/lifecycle/paymentStatus/fulfillmentStatus/invoiceStatus/aftersaleStatus/totalAmount/receivableAmount/netReceived/amountDue/refundDue/netInvoiced/invoiceDue/creditDue`；items 包含 `id/productId/productName/quantity/price/totalPrice/prepared/shipped/signed/rejected/returned/remainingToShip`。所有累加先算整数分，最终除以 100。

```ts
const receivableCents =
  order.lifecycle === 'cancelled' ? 0 : originalCents - acceptedReturnCents;
const netReceivedCents = receivedCents - refundedCents;
const amountDue = Math.max(receivableCents - netReceivedCents, 0) / 100;
const refundDue = Math.max(netReceivedCents - receivableCents, 0) / 100;
```

- [x] 逐项落实 spec §4 的数量检查；拒收回仓释放可重发数量，历史 shipped 累计值不能直接当作已交付量。投影中 remainingToShip 使用订购量减去未回仓的已发数量。
- [x] 建立 1001–1008 锚点及 1009–1018：审核中、驳回、空收款账期、部分开票、已关闭、草稿、正常待签收、未到交期缺货、已结算待关闭、零收款取消。保证每笔商品总额自洽，1005 初始为已接受退货、尚未退款/冲减。
- [x] 添加两类反例：负数/非整数数量拒绝；不同商品分别匹配名称与数量的订单不应满足同元素查询。对所有样本运行 validateOrder，再运行上述测试至通过。

### Task 2: 业务命令、岗位与恢复

**Files:** Create `sales-order/service.ts`；Create `packages/view-engine/test/salesOrderService.test.ts`。

**Interfaces:** 消费 Task 1 类型；生产如下服务。命令联合中的每个 type 必须实现，无默认成功分支。

```ts
type Command =
  | { type: 'create'; draft: OrderDraft }
  | { type: 'edit'; orderId: string; draft: OrderDraft }
  | {
      type: 'submit' | 'approve' | 'release' | 'reconcile' | 'close';
      orderId: string;
    }
  | { type: 'reject' | 'cancel'; orderId: string; reason: string }
  | {
      type: 'receive' | 'refund' | 'invoice' | 'credit';
      orderId: string;
      amountCents: number;
      reference: string;
    }
  | { type: 'prepare'; orderId: string; lines: QuantityLine[] }
  | { type: 'ship'; orderId: string; lines: QuantityLine[]; tracking: string }
  | {
      type: 'receipt';
      orderId: string;
      shipmentId: string;
      accepted: QuantityLine[];
      rejected: QuantityLine[];
    }
  | {
      type: 'restock';
      orderId: string;
      shipmentId: string;
      lines: QuantityLine[];
    }
  | { type: 'requestReturn'; orderId: string; lines: QuantityLine[] }
  | { type: 'approveReturn'; orderId: string; returnId: string }
  | {
      type: 'receiveReturn';
      orderId: string;
      returnId: string;
      lines: QuantityLine[];
    }
  | { type: 'batchApprove' | 'batchRelease'; orderIds: string[] };
interface ServiceOptions {
  failFirstWrite?: boolean;
}
interface OrderService {
  read(): OrderSnapshot[];
  execute(
    command: Command,
    actor: Role,
    requestId: string,
  ): Promise<OrderSnapshot[]>;
}
function createOrderService(options?: ServiceOptions): OrderService;
```

- [x] 写失败测试：财务给 1003 收款 500000 分，主管放行后 released 为真；未补齐收款的 1003 放行失败且快照不变。

```ts
const service = createOrderService();
const command = {
  type: 'receive',
  orderId: 'SO-202609-1003',
  amountCents: 500000,
  reference: 'BANK-001',
} as const;
await service.execute(command, 'finance', 'receive-1');
await service.execute(command, 'finance', 'receive-1');
expect(
  service.read().find(o => o.aggregateId === command.orderId)!.state
    .netReceived,
).toBe(8000);
await expect(
  service.execute({ ...command, amountCents: 100 }, 'finance', 'receive-1'),
).rejects.toThrow();
```

- [x] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/salesOrderService.test.ts` 确认失败。
- [x] 使用 `switch(command.type)` 校验 spec §5：销售创建/编辑/提交/未发货取消；主管审核/放行；交付备货发货签收回仓；客服申请/审核退货，交付登记退货入库；财务收款、退款、票据、核对；主管关闭。动作失败带具体订单与原因。
- [x] 在副本上运算和 validateOrder，全部成功后一次替换存储；批量包含无效订单时不提交任何一笔。去重键包含 actor/requestId，回执保留规范请求体和结果；成功后才写回执。

```ts
const candidate = structuredClone(orders);
// 在 candidate 上执行已穷尽命令分支；全部 validateOrder 后才提交。
orders = candidate;
receipts.set(key, {
  body: JSON.stringify(command),
  result: structuredClone(result),
});
return structuredClone(result);
```

- [x] 补齐真实旅程测试：账期放行；1001 分批交付；1007 拒收重发；1005 退款/冲减后核对；1006 取消善后；有售后/未收款/未开票不能关闭；财务金额变更清除 reconciled；关闭后动作全部拒绝。再运行服务测试至通过。

### Task 3: 共用查询、岗位视图与视图宿主

**Files:** Create `sales-order/querySource.ts`、`views.ts`、`host.ts`；Modify `stories/view-engine/record-view/querySource.ts`、`createHost.ts`；Create `packages/view-engine/test/salesOrderHost.test.ts`。

**Interfaces:**

```ts
interface QueryOptions {
  failFirstQuery?: boolean;
  failFirstSummary?: boolean;
}
function createOrderSource(
  read: () => RecordData[],
  options?: QueryOptions,
): RecordQuerySource;
const orderDefinition: ViewDefinition;
function createOrderViews(stage: Stage): ViewInstanceList;
function createOrderHost(
  service: OrderService,
  role: Role,
  stage: Stage,
  options?: QueryOptions,
): ViewHost;
```

- [x] 测试“先读取交付待办、主管放行 1002、再次读取同一 source 后包含 1002”。测试分页和 aggregate 使用相同筛选范围；写入后汇总反映新金额。
- [x] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/salesOrderHost.test.ts` 确认失败。
- [x] 将现有 matches/compare/paged/cursor/aggregate 从 stories 移至示例目录，存储改为注入 read；旧 source 暂时作适配器调用共用实现。保留错误/取消与未知操作符拒绝，不扩展成完整 Wow 执行器。

```ts
const records = read();
const matched = records.filter(record => matches(record, query.filter));
// 排序、分页、汇总沿用迁移前算法；同元素 matches 使用当前元素为根。
```

- [x] views 声明 §7 的字段、筛选、金额展示、table/card 和五类扩展引用。系统实例 ID 固定为 `orders-all/orders-review/orders-release/orders-delivery/orders-settlement/orders-aftersales`，标题使用业务待办；订单当前状态过滤与岗位不是同一概念。
- [x] 移植 createHost 的 revision、create requestId、rename/delete/reorder 校验，系统视图不可保存或删除；个人可管理自己的视图，主管可另存共享。role 切换重建视图宿主权限范围，但继续使用同一个业务 service。
- [x] 验证视图另存/重开、共享权限、冲突保留、客户候选及同元素反例；运行 host 测试和现有 record-view 回归，确保迁移未改变专项语义。

### Task 4: 可操作的全链路工作台

**Files:** Create `sales-order/OrderWorkbench.tsx`、`OrderForms.tsx`、`OrderDetails.tsx`、`OrderExtensions.tsx`；Modify `packages/view-engine/examples/react/OrderOperations.tsx`；Create `packages/view-engine/test/salesOrderWorkbench.test.tsx`。

**Interfaces:**

```ts
interface OrderWorkbenchProps extends QueryOptions, ServiceOptions {
  stage?: Stage;
  appearance?: 'light' | 'dark';
  initialRole?: Role;
  failRefreshAfterWrite?: boolean;
}
function OrderWorkbench(props: OrderWorkbenchProps): ReactNode;
function OrderDetails(props: { order: OrderSnapshot }): ReactNode;
function OrderForms(props: {
  commandType: Command['type'];
  order?: OrderSnapshot;
  onSubmit(command: Command): Promise<void>;
}): ReactNode;
// OrderExtensions 通过现有 Provider 获得 execute、岗位和当前选择；不使用模块全局 service。
```

- [x] 先写 UI 检查：创建表单输入 2 台、单价 1200，显示 2400；提交后订单出现在列表；非法金额展示错误且不发命令。
- [x] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/salesOrderWorkbench.test.tsx` 确认失败。
- [x] Workbench 用 useState 初始化 service；岗位切换只替换 host/页面 scope，重置通过 generation 重新挂载整个工作台。提供“演示岗位”“重置演示”、一段业务任务说明，其余由 ViewPage 展示。

```tsx
<ViewPage
  scopeKey={`orders:${role}`}
  definitionId={orderDefinition.id}
  host={host}
  extensions={extensions}
  selectable
  autoRefreshPaused={busy}
/>
```

- [x] 创建/编辑表单提供客户、商品行、数量、价格、日期和结算方式；金额类动作填写金额和凭证；物流类填写逐行数量和运单；驳回/取消填写原因。使用现有组件和可访问标签，提交前校验并由 service 再校验。
- [x] 详情提供商品、收付款、发货签收、退货、票据及时间线；操作由岗位和真实前置条件决定，禁用按钮旁说明原因。批量只开放审核与放行。
- [x] 改造 OrderOperations 为最小 execute 回调上下文，保留 written 闭包和绑定 refresh；请求 ID 用 crypto.randomUUID，一次逻辑操作及其重试复用同 ID。
- [x] 扩展交期风险筛选：保存风险枚举，compile 基于 dueAt 和 remainingToShip 对应可查询字段，全部条件使用 DEMO_NOW；clear 只清选择值。履约/回款单元格使用快照。区域扩展包装 defaultContent，自定义卡片保留动作/选择。
- [x] 验证操作失败保留表单；写成功刷新失败仅重试读取；切换岗位不重复写入，按发起岗位记录事件。运行 UI 测试至通过。

### Task 5: 业务章节与浏览器旅程

**Files:** Create `stories/view-engine/orders/Lifecycle.stories.tsx`、`Review.stories.tsx`、`Release.stories.tsx`、`Delivery.stories.tsx`、`Settlement.stories.tsx`、`Aftersales.stories.tsx`、`Views.stories.tsx`、`Extensions.stories.tsx`；对应创建 `.test.stories.tsx` 与 `lifecycle.play.ts`、`delivery.play.ts`、`settlement.play.ts`、`views.play.ts`。

**Interfaces:** 所有章节仅消费 OrderWorkbenchProps；stage 和 initialRole 选择同一模型中的待办，不复制业务逻辑。

- [x] 先定义 Lifecycle 展示故事和独立回归，源码面板使用实际 Workbench raw import。

```ts
const meta = {
  title: 'View Engine/全链路体验',
  component: OrderWorkbench,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrderWorkbench>;
export const CompleteOrder: StoryObj<typeof meta> = {
  name: '完成一笔销售订单',
};
// 回归文件 import 展示故事，再添加以下 tags 与 play。
const regressionTags = ['!dev', '!autodocs', 'test'];
```

- [x] 在 play 中逐步操作创建、角色切换、审核、收款、放行、发货、签收、开票、核对、关闭。通过 getByRole/name 操作并检查业务文本；用详情断言金额和单据，不以诊断计数代替成功。

```ts
await userEvent.click(canvas.getByRole('button', { name: '创建订单' }));
await expect(
  await canvas.findByRole('dialog', { name: '创建销售订单' }),
).toBeVisible();
// 表单各字段按上述固定标签填写，确认后锁定新订单编号，后续操作均以该编号定位。
```

- [x] 运行 `pnpm exec vitest run --project=storybook stories/view-engine/orders/Lifecycle.test.stories.tsx`；先记录缺失步骤的失败，再补齐相应 UI，直到完整旅程通过。
- [x] 添加各章节故事的角色/目标/预期说明，默认保留初始状态；1001 分批交付、1005 退货财务善后、1007 拒收重发独立回归，数值按 spec 锚点断言。
- [x] Views 流程覆盖手动查询、客户候选、同元素、列排序/固定、分页汇总、另存/重开、权限和 table/card 往返。Extensions 展示 JSON 引用与运行时注册边界、defaultContent 包装、本地定义与异步加载；测试保存再打开的筛选语义。
- [x] 独立失败故事覆盖首次查询失败、刷新失败、汇总失败、批量拒绝、保存冲突；验证页面初始状态、重置和两次挂载隔离。
- [x] 运行 `pnpm exec vitest run --project=storybook stories/view-engine/orders`，所有新业务旅程通过后进入入口迁移。

### Task 6: 旧入口、示例消费者与中英文文档迁移

**Files:** Modify `.storybook/preview.tsx`、`stories/Overview.stories.tsx`、`stories/view-engine/QuickStart.stories.tsx`、`QuickStart.test.stories.tsx`、`Extensions.stories.tsx`、`Extensions.test.stories.tsx`、`RecordCardList.stories.tsx`、`libraryDelivery.play.ts`、`filterPersistence.play.ts`、`OrderCardActions.test.stories.tsx`、`record-view/*.stories.tsx`；Modify `packages/view-engine/examples/react/OrderExample.tsx`、`orders.ts`、`orderService.ts`、`OrderExtensions.tsx`、`FilterPersistenceExample.tsx`；Modify `stories/docs/RecordViewExample.tsx`、`packages/view-engine/test/orderCardExample.test.tsx`、`recordViewExampleLifecycle.test.tsx`、`wiki/examples/view-engine.md`、`wiki/zh/examples/view-engine.md`。检查并迁移 `packages/view-engine/dev/HttpOrderExample.tsx` 及其订单定义消费者。

**Interfaces:** 统一到 Task 1–4 接口；最小 RecordViewExample 保持现有 props 与独立可复制性，仅采用统一业务字段和订单语义。开发 HTTP 适配器保留传输职责。

- [x] 先用引用搜索生成待迁移清单，保留 `.test.stories` 的每项原断言意图。导航与示例并行迁移，不能仅更名掩盖老业务状态。

```bash
rg -n 'DEMO-|ORDER-|processed|processOrders|OrderExample|createOrderService|orderDefinition' stories packages/view-engine/examples packages/view-engine/dev packages/view-engine/test wiki
```

- [x] 更新顺序为“全链路体验、接单与审核、收款与放行、备货与交付、对账与结算、售后与关闭、我的工作视图、扩展接入、专项场景”；Overview 链接改为真实新 ID。
- [x] 旧 QuickStart 保留最小接入作为扩展文档中的子例；复杂五类扩展迁到新工作台。旧 record-view 展示中仍有独有能力的移入专项，重复主线的删除并迁移测试 imports。
- [x] 订单商品封面案例保留为卡片专项；基础控件、主题、操作符、异常数据不强制改成业务流程。HTTP 实验保持原稳定 ID 与 `!test/!autodocs` 隔离，不改 `.storybook/main.ts` 和校验脚本来规避失败。
- [x] OrderExample 迁到共用模型/服务，保留本地视图恢复和开发宿主注入能力；验证 FilterPersistenceExample 依赖的 ID/字段更新。无消费者后删除旧 orders/orderService/OrderExtensions 实现，避免用永久适配层维护 pending/processed。
- [x] 更新文档金额示例、使用步骤及源码 include，保持 RecordViewExample 实际代码可复制。同步中英文，生成内容仅通过工具生成。

```bash
pnpm exec vitest run --project=storybook stories/view-engine
pnpm --dir wiki generate:llms
node --test wiki/test/documentation.test.mjs
pnpm --dir wiki build
```

- [x] 全量引用搜索确认未遗留失效源码路径、旧订单状态或故事 ID；只删除确认被替代的内容。

### Task 7: 综合验证与交付

**Files:** 仅修复上述受影响文件；不扩大核心范围。

- [x] 检查依赖：`node --version`、`pnpm --version`。缺少 node_modules 时执行 `pnpm install --frozen-lockfile`；不更新锁文件解决环境错误。
- [x] 运行受影响包的公开构建与测试：

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm --filter @ahoo-wang/fetcher-view-engine test
pnpm lint:view-engine
pnpm test:storybook
pnpm build-storybook
pnpm test:unit
```

- [x] 使用实际浏览器检查主入口、交付、财务、售后四处；保存桌面/窄屏和明暗主题截图。验证弹层不裁切、键盘能完成主要操作、错误与成功反馈可感知。
- [x] 对照 spec §10 逐项记录通过证据，特别核对同一订单跨岗位继续、退款不重复、保存视图不保存业务数据、故事重置/隔离。
- [x] 文件范围格式检查和 `git diff --check`；遇到失败只重跑关联检查，最后报告剩余限制。
- [x] 向用户交付可运行入口、变更摘要与实际测试结果；仅在另有提交授权且 `pnpm test:unit` 通过后提交。

## 计划自检

- 业务模型与 18 笔样本：Task 1；动作、岗位、数量/金额和去重：Task 2。
- 查询、汇总、保存、权限、候选：Task 3；交互、详情、扩展及失败恢复：Task 4。
- 全链路、章节和浏览器业务断言：Task 5；专项保留、旧消费者、文档与导航：Task 6。
- 实际浏览器、构建、测试、文档与交付：Task 7。
- 本计划只描述示例层重构；实施中发现需要改公开 API 或构建配置，先报告具体证据及范围影响，不静默扩大。

## 执行结果（2026-09-10）

- [x] Task 1–6：订单事实与样本、业务命令、共用查询宿主、交互工作台、业务章节及专项迁移完成。
- [x] Task 7：普通/编译模式测试、浏览器、构建、文档与视觉验证完成。
- 视图管理复用已有 LocalStorageViewHost 并注入内存存储，没有复制第二套版本/权限逻辑；持久化专项使用浏览器 localStorage 与 Web Locks。
- 交期风险由宿主投影为 deliveryRisk，组件只编译绑定字段的 EQ，遵守自定义筛选不得改变绑定字段/条件容器的现有契约。
- 取消事实单独保留 cancelledAt，关闭后不恢复应收；只读复核发现的日期清空崩溃已用失败回归证实并修复。
- `npm_config_workspace_concurrency=1 pnpm test:unit` 通过；默认并行运行曾因机器资源竞争触发两项测试超时，未修改测试超时或项目配置。
- View Engine 普通与编译模式各 999 项通过，类型检查通过；全仓 Storybook 324 项通过（2 个开发文件按配置跳过）。日期修复另有真实 React 回归。
- `pnpm build`、`pnpm build-storybook`、最终 `storybook build --docs` 与导航校验通过；11 项文档检查及中英文 wiki 构建通过。
- 本地视图恢复、HTTP 服务（含重试、撤权、跨页面 CAS 和排队取消）、主题验证脚本均通过。HTTP CAS 在并行重验证中曾有一次竞争断言异常，独立重跑通过；未修改核心锁或 CAS 实现。
- 已实际检查桌面主入口、交付列表、财务与售后详情、392px 深色布局。
- 未新增依赖、未修改引擎公开 API、未提交或发布。

## 产品 Review 修复结果（2026-09-10）

- 售后订单在退款、冲减、核对后继续留在队列，直到关闭；补充公开售后入口的完整回归。
- 写入成功但刷新失败时，在详情内展示错误和重试；恢复前限制岗位切换，避免旧引擎失效或重复写入。
- 按审核、放行、交付、财务和售后配置决策字段；详情顶部展示下一步及处理岗位，交接保留当前订单。
- 扩展章节提供定义、注册和宿主的对应源码；公开入口与回归使用同一阶段配置。
- 区分无需收款、无需开票、待冲减、售后已结清与待关闭，修正零义务和未结清状态。
- 修复弹层内容切换后的焦点恢复竞争，防止快速输入的物流单号或财务凭证丢失。
- 本轮 View Engine 普通与编译模式各 1003 项、Storybook 327 项通过；包类型检查、示例严格类型检查、lint、Storybook 构建和导航校验、文档检查及 wiki 构建通过。
- 本地持久化和 HTTP 验证通过；跨标签 CAS 首次偶发失败，独立重跑通过，未修改底层并发实现。
- 已实际检查售后队列、详情岗位交接、弹层内失败恢复；本轮未重新运行全仓单元测试，未提交。
