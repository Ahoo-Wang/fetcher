# Default View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在视图管理中设置、替换和取消当前用户在当前页面的默认视图，并在重新进入页面时恢复。

**Architecture:** 扩展现有 `ViewPreferenceService` 与 `ViewManagement`，复用本地用户偏好事务；HTTP 示例使用相同契约。引擎独立维护默认实例和当前选中实例，React 管理界面只调用引擎操作。无需新服务、存储迁移或依赖。

**Tech Stack:** TypeScript、React、现有 shadcn/Base UI、Vitest、Storybook/Playwright、Memory/IndexedDB 宿主；Node >=20.20.2，pnpm 10.34.5。

**Spec:** [2026-09-10-default-view-design.md](../specs/2026-09-10-default-view-design.md)

## Global Constraints

- “偏好按当前宿主用户作用域和 `definitionId` 隔离，每个作用域最多一个默认实例。”
- “当前可见的个人、共享、系统视图均可设为默认；不要求实例编辑权限。”
- “设置成功后更新默认标记，不切换当前视图，不提交或丢弃任何未保存修改，不触发记录查询。”
- “取消保存为 `null`，下次进入不自动选择实例，沿用现有加载语义。”
- “默认实例被删除或不可见时，沿用现有本地宿主规则，按用户排序回退到第一个可见实例；无可见实例时为 `null`。”
- “更改排序不隐式设置默认；普通视图切换也不改变默认偏好。”
- “不增加管理员全局默认、跨设备同步框架、额外依赖或构建配置。”
- 用户最新要求不考虑兼容性，保持架构和代码清洁。公开状态和能力新增属性为必填；移除仅为旧快照存在的默认值或分支。宿主服务的可选性仅表达真实能力边界，不新增兼容层。
- 读取适用 `AGENTS.md`；所有新增源码/测试保留 Apache 2.0 头，沿用严格 TS、类型导入与 `.js` 导入路径。
- 提交前必须通过 `pnpm test:unit`；不 push、发版或部署。阶段红灯不提交，最后通过完整检查再提交本功能。

## 工作目录与文件职责

仓库根目录为 `/Users/ahoo/.codex/worktrees/fcea/fetcher`；下文命令均从该目录执行。当前 HEAD 为 `84e07f00`，与本地 main 相同，已在独立 linked worktree，HEAD 未命名；执行时用 `using-git-worktrees` 检查已有隔离，不再创建第二个工作树。当前缺少 node_modules，之前 `pnpm test:unit` 因找不到 Vitest 而未启动测试。

| 部分               | 文件及职责                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 宿主契约与本地存储 | `packages/view-engine/src/record/ViewHost.ts` 声明方法；`StatefulViewHost.ts` 在已有事务中保存个人偏好                                                                                                                              |
| 引擎模型与生命周期 | 同目录 `recordModel.ts`、`ViewEngine.ts`、`engine/SessionStore.ts`、`engine/ViewLoader.ts`、`engine/ViewManagement.ts`                                                                                                              |
| 管理界面           | 同目录 `ViewManager.tsx`、`page/ViewManagerRow.tsx`；只有入口能力判断缺失时才修改 `page/ViewPageContent.tsx`                                                                                                                        |
| HTTP 示例          | `packages/view-engine/dev/http/HttpViewPreferenceService.ts`；`packages/view-engine/scripts/fixtures/view-service-server.mjs`                                                                                                       |
| 测试               | 复用 `test/memoryViewHost.test.ts`、`test/indexedDBViewHost.test.ts`、`test/httpViewHost.test.ts`、`test/viewEngine.capabilities.test.ts`、`test/viewPage.management.test.tsx`；新增 `test/engine/defaultView.test.ts` 集中引擎场景 |
| 浏览器示例         | `stories/view-engine/record-view/createHost.ts`、`Management.stories.tsx`、`management.play.ts`；`packages/view-engine/scripts/verify-view-host.mjs` 做真实 IndexedDB 重建验证                                                      |
| 文档               | `skills/fetcher-view-engine/references/api.md`、对应双语 wiki 页面、双语 HTTP 开发说明                                                                                                                                              |

所有任务按顺序执行，共享契约不并行改写。执行者先阅读规格和本计划；代码块为具体实现/测试落点，插入相应现有模块，不复制周围无关代码。

### Task 1: 保存个人默认偏好

**Files:** 修改 `packages/view-engine/src/record/ViewHost.ts`、`packages/view-engine/src/record/StatefulViewHost.ts`；测试 `packages/view-engine/test/memoryViewHost.test.ts`。

**Interfaces:**

- Consumes: `ViewInstanceList.defaultInstanceId`、`StatefulViewHost.transaction`、`find`、`assertDefinition`。
- Produces: `ViewPreferenceService.saveDefault?(definitionId: string, instanceId: string | null): Promise<void>`，Memory/IndexedDB 继承其实现。

- [x] **Step 1: 准备现有依赖。** 执行 `pnpm install --frozen-lockfile`，保持 manifest、catalog 和 lockfile 不变。随后执行 `pnpm --filter @ahoo-wang/fetcher-view-engine... build`。安装失败时记录实际错误，不通过添加依赖或改配置绕过。

- [x] **Step 2: 在现有 Memory 测试文件增加失败用例。** 复用该文件的 `options`、`store`、`definition`、`instance`：

```ts
it('persists a personal default without editing views or another user', async () => {
  const host = new MemoryViewHost(options());
  const before = await host.instance.list(definition.id);
  await host.preference.saveDefault(definition.id, 'system');
  const restored = await new MemoryViewHost(options()).instance.list(
    definition.id,
  );
  expect(restored.defaultInstanceId).toBe('system');
  expect(restored.instances).toEqual(before.instances);
  const other = await new MemoryViewHost(options('bob')).instance.list(
    definition.id,
  );
  expect(other.defaultInstanceId).toBe(instance.id);
  await host.preference.saveDefault(definition.id, null);
  expect(
    (await host.instance.list(definition.id)).defaultInstanceId,
  ).toBeNull();
  await expect(
    host.preference.saveDefault(definition.id, 'unknown'),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  expect(
    (await host.instance.list(definition.id)).defaultInstanceId,
  ).toBeNull();
});
```

- [x] **Step 3: 验证红灯。** `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/memoryViewHost.test.ts`；应因缺少 `saveDefault` 失败，而非环境或解析错误。

- [x] **Step 4: 实现事务写入。** 在接口添加声明，在 `StatefulViewHost.preference` 添加：

```ts
saveDefault: async (id: string, instanceId: string | null): Promise<void> => {
  this.assertDefinition(id);
  await this.transaction(state => {
    if (instanceId !== null) this.find(state, instanceId);
    state.users[this.options.scopeKey].defaultInstanceId = instanceId;
  }, true);
},
```

`find` 已复用 `encodeViewResourceId` 并按当前用户过滤，不调用 `writable`。不将 `undefined` 合并为 `null`：HTTP 缺字段和无效输入必须拒绝。不改现有 list 回退，也不改 `localViewState.ts` 存储结构。

- [x] **Step 5: 增补输入与作用域边界并验证。** 在同一文件用 `it.each` 输入 `undefined`、`123`、`''` 和 `'.'`（仅测试边界使用类型断言）断言 `INVALID_ARGUMENT`；错误定义断言 `NOT_FOUND`。通过 `instance.create` 建立其他用户的个人实例并尝试设置，断言 `NOT_FOUND`；另建其他定义宿主确认其默认值不变。将默认改为个人实例后删除它，断言回退 system；将 `null` 保存后重复保存，断言仍不选择。复跑 Step 3 命令，预期全绿。

### Task 2: 引擎状态、能力与保存生命周期

**Files:** 修改 `packages/view-engine/src/record/recordModel.ts`、`ViewEngine.ts`、`engine/SessionStore.ts`、`engine/ViewLoader.ts`、`engine/ViewManagement.ts`；新增 `packages/view-engine/test/engine/defaultView.test.ts`；扩展 `packages/view-engine/test/viewEngine.capabilities.test.ts`。

**Interfaces:**

- Consumes: Task 1 `saveDefault`、`EngineScope.version/current`、`InstanceWork.assertWritable`、`SessionStore.find/publish`。
- Produces: `ViewEngine.canSetDefaultInstance(): boolean`、`setDefaultInstance(instanceId: string | null): Promise<void>`；`ViewCapabilities.setDefault: boolean`；`ViewEngineState.defaultInstanceId: string | null`。

- [x] **Step 1: 写入测试。** 新测试文件使用 `import { expect, it, vi } from 'vitest'`、`import type { ViewHost } from '../../src/record/ViewHost.js'` 和 `import { deferred, setup, selected } from './fixtures.js'`：

```ts
it('changes only the default after the host confirms the write', async () => {
  const response = deferred<void>();
  const saveDefault = vi.fn(() => response.promise);
  const { engine, paged } = setup({
    host: { preference: { saveDefault } } as ViewHost,
  });
  await engine.load();
  engine.setColumns([
    { id: 'amount', kind: 'field', field: 'state.amount', width: 240 },
  ]);
  const before = selected(engine);
  const pending = engine.setDefaultInstance('shared');
  expect(engine.getSnapshot().defaultInstanceId).toBe('mine');
  await expect(engine.setDefaultInstance(null)).rejects.toThrow(/正在保存/);
  response.resolve();
  await pending;
  expect(saveDefault).toHaveBeenCalledWith('orders', 'shared');
  expect(engine.getSnapshot()).toMatchObject({
    defaultInstanceId: 'shared',
    selectedInstanceId: 'mine',
  });
  expect(selected(engine)).toBe(before);
  expect(paged).toHaveBeenCalledTimes(1);
  engine.dispose();
});
```

- [x] **Step 2: 红灯验证。** `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/engine/defaultView.test.ts`；预期失败于新增方法缺失。

- [x] **Step 3: 添加独立状态与公开方法。** `SessionStore` 初始 `defaultInstanceId: null`；`ViewLoader` 成功发布时同时写入 `defaultInstanceId: defaultId`。在模型添加上文两个必填属性，消费者直接读取完整快照。`ViewEngine` 添加委托：

```ts
canSetDefaultInstance(): boolean {
  return this.management.canSetDefaultInstance();
}
setDefaultInstance(instanceId: string | null): Promise<void> {
  return this.management.setDefaultInstance(instanceId);
}
```

能力快照增加 `setDefault: this.canSetDefaultInstance()`。沿用现有动态 Host 代理和订阅，不保存独立的 React 默认状态。

- [x] **Step 4: 在 ViewManagement 实现操作。** 使用此类私有的当前保存身份，不为一个操作引入队列或新的通用协调器：

```ts
private defaultWrite?: { version: number; id: string | null };

canSetDefaultInstance(): boolean {
  return !this.scope.disposed &&
    typeof this.host.preference?.saveDefault === 'function';
}

async setDefaultInstance(instanceId: string | null): Promise<void> {
  this.store.definition();
  if (!this.canSetDefaultInstance()) throw new Error('宿主未提供默认视图保存接口');
  if (instanceId !== null) this.work.assertWritable(this.store.session(instanceId));
  if (this.defaultWrite?.version === this.scope.version)
    throw new Error('默认视图正在保存');
  const request = { version: this.scope.version, id: instanceId };
  this.defaultWrite = request;
  try {
    await this.host.preference!.saveDefault!(this.definitionId, instanceId);
    if (!this.scope.current(request.version) || this.defaultWrite !== request) return;
    this.defaultWrite = undefined;
    this.store.publish({ defaultInstanceId: instanceId });
  } catch (error) {
    if (!this.scope.current(request.version) || this.defaultWrite !== request) return;
    throw Object.assign(new Error(`${message(error)}；请重试或重新加载核对默认视图`), { cause: error });
  } finally {
    if (this.defaultWrite === request) this.defaultWrite = undefined;
  }
}
```

在方法入口补充 `instanceId !== null && (typeof instanceId !== 'string' || !instanceId.trim())` 校验，抛出“默认视图必须是有效实例 ID 或 null”。不能省略：`store.session(undefined)` 会使用当前选择，不能将错误输入变成合法目标。

`deleteInstance` 在派发宿主删除前增加同一生命周期、同一目标的保存检查：

```ts
if (
  this.defaultWrite?.version === this.scope.version &&
  this.defaultWrite.id === id
)
  throw new Error('默认视图正在保存，请等待操作完成');
```

成功删除发布时增加：

```ts
defaultInstanceId: this.store.getSnapshot().defaultInstanceId === id
  ? (instanceIds[0] ?? null)
  : this.store.getSnapshot().defaultInstanceId,
```

已有删除写锁使“删除先开始，默认保存后开始”被 `assertWritable` 拒绝。完整重载可以使旧保存身份失效，旧 finally 不能清除新生命周期的请求。不要添加“值相同直接 return”：未知结果后，重新保存原默认值也必须实际到达宿主。

- [x] **Step 5: 增加生命周期失败测试。** 使用上述 `deferred` 测试骨架分别 `response.reject(new Error('offline'))`、`engine.dispose()`、`await engine.load()` 后再 resolve，断言失败/迟到响应不覆盖默认值。重载后发起新请求，先完成旧请求，再尝试第三个请求，断言新请求仍持有重入保护。使用 fixture 的 `managementPermissions` 和 `instance.delete: vi.fn()` 测试两个删除/设置顺序均拒绝冲突；成功删除默认与非默认分别验证回退和不变。用 mock 宿主返回 `null` 验证清除后的重载不查询记录。无保存服务时报错；`updateHost` 增删该能力时快照随订阅更新。系统视图即使 save/rename/delete 全 false 仍允许设置。

- [x] **Step 6: 绿灯验证。** `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/engine/defaultView.test.ts test/engine/management.test.ts test/engine/unifiedRecovery.test.ts test/viewEngine.capabilities.test.ts`。检查新增测试包含真实失败条件，不把捕获异常视为成功。

### Task 3: HTTP 示例端到端契约

**Files:** 修改 `packages/view-engine/dev/http/HttpViewPreferenceService.ts`、`packages/view-engine/scripts/fixtures/view-service-server.mjs`、`packages/view-engine/test/httpViewHost.test.ts`、`packages/view-engine/dev/README.md`、`packages/view-engine/dev/README.zh-CN.md`。

**Interfaces:**

- Consumes: Task 1 `saveDefault` 和既有 HTTP transport、认证用户宿主、错误状态映射。
- Produces: 同 `/order` 定义路由层级的 `PUT /default`，正文 `{ instanceId: string | null }`；成功沿用现有服务 envelope 与 200 状态，不另创 204 协议。

- [x] **Step 1: 在 HTTP 测试添加往返。** 复用已存在的 `client`、`server` 和 fixture：

```ts
it('round trips a private default preference over HTTP', async () => {
  const alice = client();
  const bob = client('bob-token');
  await alice.preference.saveDefault(definition.id, null);
  expect(
    (await client().instance.list(definition.id)).defaultInstanceId,
  ).toBeNull();
  expect((await bob.instance.list(definition.id)).defaultInstanceId).toBe(
    instance.id,
  );
  await alice.preference.saveDefault(definition.id, instance.id);
  expect((await client().instance.list(definition.id)).defaultInstanceId).toBe(
    instance.id,
  );
  await expect(
    alice.preference.saveDefault(definition.id, 'unknown'),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
```

- [x] **Step 2: 验证失败。** `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/httpViewHost.test.ts`；预期新增测试因缺少适配方法或路由失败。

- [x] **Step 3: 添加 transport 方法与服务器路由。** 客户端：

```ts
readonly saveDefault = async (id: string, instanceId: string | null): Promise<void> => {
  this.transport.assertDefinition(id);
  await this.transport.request('/default', 'PUT', { instanceId });
};
```

服务器在现有 `/order` 分支之后、NOT_FOUND 之前插入：

```js
} else if (request.method === 'PUT' && path[3] === 'default' && path.length === 4) {
  result = await host.preference.saveDefault(definition.id, body?.instanceId);
  control.mutations++;
```

不接受正文的用户归属，不绕过现有认证、Origin 检查或宿主事务。`body?.instanceId` 缺失传递 undefined，由共享验证拒绝。

- [x] **Step 4: 验证边界和文档。** 通过现有客户端/原生 fetch 向新增路由发送 `{}`、数值 ID、其他用户个人 ID、非法认证 token；断言现有错误 envelope 和对应状态码，拒绝请求不增加 `control.mutations`。扩展当前错误 definition/路径编码测试到 saveDefault。双语路由表增加 `/default`、用户作用域、null 语义及失败可重试说明，然后复跑 Step 2 命令。

### Task 4: 管理界面和真实浏览器恢复

**Files:** 修改 `packages/view-engine/src/record/ViewManager.tsx`、`packages/view-engine/src/record/page/ViewManagerRow.tsx`、必要时 `page/ViewPageContent.tsx`；修改 `packages/view-engine/test/viewPage.management.test.tsx`、`test/indexedDBViewHost.test.ts`；修改 `stories/view-engine/record-view/createHost.ts`、`Management.stories.tsx`、`management.play.ts`；修改 `packages/view-engine/scripts/verify-view-host.mjs`。

**Interfaces:**

- Consumes: Task 2 引擎 API、快照、能力；现有 `execute(action)` 忙碌/错误处理。
- Produces: 默认标记、设置/取消按钮、失败重试；Memory story 与真实 IndexedDB 重载均可复现产品流程。

- [x] **Step 1: 先增加界面失败用例。** 在现有管理测试中复用 ViewPage、setup 与 Testing Library 导入：

```tsx
it('sets and clears the system default without changing the current view', async () => {
  const { host, paged } = setup();
  host.preference!.saveDefault = vi.fn().mockResolvedValue(undefined);
  render(
    <ViewPage scopeKey="default-test" definitionId="orders" host={host} />,
  );
  await screen.findByRole('cell', { name: '42' });
  fireEvent.click(screen.getAllByRole('button', { name: '管理视图' })[0]);
  const manager = within(
    await screen.findByRole('dialog', { name: '管理视图' }),
  );
  fireEvent.click(
    manager.getByRole('button', { name: '将所有订单设为默认视图' }),
  );
  await waitFor(() =>
    expect(host.preference!.saveDefault).toHaveBeenLastCalledWith(
      'orders',
      'system',
    ),
  );
  const cancel = await manager.findByRole('button', {
    name: '取消所有订单的默认视图',
  });
  expect(manager.getAllByText('默认')).toHaveLength(1);
  fireEvent.click(cancel);
  await waitFor(() =>
    expect(host.preference!.saveDefault).toHaveBeenLastCalledWith(
      'orders',
      null,
    ),
  );
  await waitFor(() => expect(manager.queryByText('默认')).toBeNull());
  expect(paged).toHaveBeenCalledTimes(1);
});
```

- [x] **Step 2: 红灯验证。** `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/viewPage.management.test.tsx`。

- [x] **Step 3: 添加按钮与状态读取。** `ViewManagerRow` 复用 `useViewCapabilities(engine)` 返回值，将当前局部实例能力改为该快照 `.instances[id]`。通过 `useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot)` 读取默认状态，不用独立 useState；渲染：

```tsx
const isDefault = state.defaultInstanceId === id;
const defaultLabel = isDefault
  ? `取消${title}的默认视图`
  : `将${title}设为默认视图`;
```

```tsx
{
  isDefault && (
    <span className="fve:shrink-0 fve:text-xs fve:text-muted-foreground">
      默认
    </span>
  );
}
{
  viewCapabilities.setDefault === true && (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={defaultLabel}
      title={defaultLabel}
      disabled={writing}
      onClick={() =>
        void execute(() => engine.setDefaultInstance(isDefault ? null : id))
      }
    >
      <StarIcon aria-hidden="true" fill={isDefault ? 'currentColor' : 'none'} />
    </Button>
  );
}
```

从现有 `lucide-react` 导入 StarIcon。按钮不包在 rename/delete 权限分支内，更新时保留同一个 DOM 按钮以保留焦点。默认标记在无保存能力时仍显示。`ViewManager` 描述追加“默认视图仅对你生效，下次进入时自动打开。”；入口可见性如受权限条件控制，条件加入 `capabilities.setDefault === true`，保证只具默认偏好能力的宿主可打开管理。

- [x] **Step 4: 扩展界面失败/忙碌测试。** 使用 `saveDefault.mockRejectedValueOnce(new Error('保存失败'))` 验证旧标记不变、role=alert、点击同一按钮重试成功；使用 Task 2 deferred 测试未完成时按钮禁用、Escape/完成不能关闭、完成后焦点仍在原按钮。删除 saveDefault 后断言操作隐藏但加载默认标记存在。复跑 Step 2 和现有 capabilities/ordering 测试。

- [x] **Step 5: 更新 Storybook 宿主及交互。** 在 `createHost.ts` 闭包中声明 `let defaultInstanceId = initialInstances.defaultInstanceId`；list 中返回：

```ts
defaultInstanceId: defaultInstanceId === null ? null
  : saved.has(defaultInstanceId) ? defaultInstanceId
  : (instanceOrder.find(id => saved.has(id)) ?? null),
```

在其 `preference` 中增加：

```ts
async saveDefault(definitionId, id) {
  await pause();
  if (definitionId !== definition.id) throw new Error('订单视图定义不存在。');
  if (id !== null) loadInstance(id);
  defaultInstanceId = id;
},
```

远程列表场景负责保存后重载演示；静态 `local` 场景不伪装成持久化服务。`Management.stories.tsx` 文案增加个人默认操作；在既有 `playManageViews` 打开管理后增加设置系统项、断言唯一默认标记、以键盘 Enter 取消的操作，再继续原有改名/删除流程。使用 DOM 中实际名称，不猜订单标题。现有 `Management.test.stories.tsx` 已绑定此 play，无需复制新 story。

- [x] **Step 6: 用现有 IndexedDB 测试端口验证事务。** 在 `indexedDBViewHost.test.ts` 中复用 `databasePort`、`createHost`，发起 `saveDefault(definition.id, null)`，依次调用 open/readSuccess，检查 store.put 的 JSON 内当前用户默认值为 null；在 commit 前 promise 未完成，commit 后完成。用写入 JSON 创建新 databasePort 后读取列表，断言 null，避免仅证明内存快照更新。

- [x] **Step 7: 验证真实 IndexedDB 和浏览器交互。** 在 `verify-view-host.mjs` 现有 `openManager`/`closeManager`/`reload` 流程中，定位真实“本地验证视图”行，点击设为默认，重新加载页面并断言默认标记仍在该行；取消并再次重载，断言不存在默认标记且未自动选择。保留现有系统保护和删除验证。这个脚本已采用隔离浏览器 profile，不用单测 mock 代替原生数据库。

执行：

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/viewPage.management.test.tsx test/viewPage.capabilities.test.tsx test/viewPage.ordering.test.tsx test/indexedDBViewHost.test.ts
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm test:storybook stories/view-engine/record-view/Management.test.stories.tsx
pnpm storybook
```

Storybook 运行于 6006 后，在另一终端执行 `node packages/view-engine/scripts/verify-view-host.mjs`。仅停止本次启动的服务。记录真实浏览器输出；不要把 test:unit 当成浏览器测试。

### Task 5: 文档、回归与交付

**Files:** 修改 `skills/fetcher-view-engine/references/api.md`；修改 `wiki/reference/view-engine/{view-host,engine,models,components}.md` 与 `wiki/zh/reference/view-engine/` 对应四页；修改 `wiki/guides/view-engine/saved-views.md` 和中文对应页；更新本计划及规格状态。

**Interfaces:**

- Consumes: Tasks 1–4 的最终公开 API 与通过验证的实际行为。
- Produces: 与源代码一致的双语文档、测试证据和可审阅差异。

- [x] **Step 1: 对照公开导出更新文档。** 检查 `packages/view-engine/src/index.ts` 及导出的 ViewHost/ViewEngine/model；在 API 表列出 saveDefault、canSetDefaultInstance、setDefaultInstance、setDefault 能力和独立默认字段。中英文 saved-views 均明确 null 取消、失效回退、设置不切换当前项、无保存能力的宿主可省略接口。示例采用：

```ts
if (engine.canSetDefaultInstance()) {
  await engine.setDefaultInstance('my-view');
  await engine.setDefaultInstance(null);
}
```

说明 `my-view` 必须来自当前实例列表；不把示例 ID 当成普遍存在的数据。不能手改生成的 llms 或 dist。

- [x] **Step 2: 运行文件级格式检查与完整验证。** 用 `git ls-files --modified --others --exclude-standard` 收集本任务路径，传给已安装的 Prettier 做文件级格式化，检查差异；禁止根 `pnpm format` 或带全仓 --fix 的 lint。

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm --filter @ahoo-wang/fetcher-view-engine lint:check
pnpm lint:view-engine:stories
pnpm test:unit
pnpm --dir wiki generate:llms
node --test wiki/test/documentation.test.mjs
pnpm --dir wiki build
git diff --check
```

完整 test:unit 已包含包测试、编译模式和声明的类型检查，不再无理由重复。浏览器验证复用 Task 4 结果，只有后续相关源码变动才重跑。wiki 构建正常产生的生成文件通过差异检查处理，不手工修补。

- [x] **Step 3: 自查规格覆盖和提交边界。** 检查用户/定义隔离、当前选择与默认分离、可见系统项、取消、删除/不可见回退、无保存能力的宿主、失败重试、迟到响应、HTTP 和真实 IndexedDB 证据。更新规格“已实现”的状态仅在对应验证实际通过之后。任何失败必须先定位，不能改测试断言来掩盖。

- [x] **Step 4: 本地提交与交付。** 仅当完整 `pnpm test:unit` 已通过才将本任务的具体文件暂存并提交 `feat(view-engine): support personal default views`；不使用 `git add .`。遵循现有工作树环境限制，不擅自移动用户任务。最终回复说明设置默认的行为、验证结果和仍受阻项目；不声称已发布。

## 计划自查结果

- 规格的持久化、UI、生命周期、宿主能力边界和文档要求分别落在 Tasks 1–5。
- 所有新方法统一使用 saveDefault / canSetDefaultInstance / setDefaultInstance，模型统一使用 defaultInstanceId，能力统一使用 setDefault。
- 静态宿主输入不被当成可重新读取的远程列表；持久化验收使用真实可重新创建的宿主。
- 未新增依赖、迁移、全局队列、管理员偏好或与本功能无关的重构。
- 实现和分项审查已完成；实际验证记录见下文。

## 实际执行记录

- 默认状态和能力字段按用户要求使用必填契约，移除了为手工旧快照保留的兼容写法。
- 组合操作验证发现删除默认后排序会使回退漂移；正式宿主在删除事务内保存各用户的回退，新用户初始化也解析有效默认，示例宿主同步处理。相关单测和 Chrome 回归先确认失败、再确认修复。
- 现有依赖 frozen install、工作区包构建、当前 view-engine 构建和类型检查通过；未修改依赖或构建配置。
- 完整 `pnpm test:unit` 在 `npm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=4` 下退出 0；首次无限制并行出现三个超时，同一源码的三文件隔离重跑 12/12 通过。受控运行包含 view-engine 源码及编译模式各 1052 项通过；viewer 保留原有 1 项跳过。
- 包级 lint、Storybook lint、2 项 Chrome 管理交互及真实 IndexedDB 恢复脚本通过；浏览器使用已安装 Chrome，独立 Storybook 端口 6007。
- 使用现有脚本更新公开符号索引与 LLM 文档；文档检查 11/11 和 wiki 构建通过。所有分项审查及两轮定向问题修正复审已通过，最后整体审查已通过，无遗留发现。
