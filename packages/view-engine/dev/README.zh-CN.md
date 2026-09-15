# HTTP 开发实验

本目录不进入发布包。路径、响应格式、状态码映射和测试身份仍属实验，不构成公共 ViewHost 协议；用于验证服务与运行时边界及恢复能力。

### HTTP 适配器与协议

```tsx
import { HttpViewHost } from './http/index.js';

const host = new HttpViewHost({
  baseUrl: 'https://example.test/view-service/',
  definitionId: orderDefinition.id,
  headers: () => applicationAuthHeaders(),
  resolveSource: id => businessSources[id],
  timeoutMs: 10000,
});
// ViewPage: host + definitionId + an access-scoped scopeKey; no local definition/instances props.
```

开发目录包含资源客户端：`HttpViewDefinitionService`、`HttpViewInstanceService`、`HttpViewPreferenceService` 与 `HttpViewOperationService`，可以直接使用，不依赖 ViewHost 或前端运行时。`HttpViewTransport` 共享认证、超时和错误处理，其配置不包含 `resolveSource`。共享的 `transport.permission` 客户端负责快照校验、版本控制与订阅；其 `refresh(signal?)` 是应用自己的入口，不属于 `ViewHost` 合同，合同只看到同步的 `getInstance`、`getDefinition` 与 `subscribe`。

```ts
import { HttpViewTransport, HttpViewInstanceService } from './http/index.js';

const transport = new HttpViewTransport({
  baseUrl: 'https://example.test/view-service/',
  definitionId: 'orders',
  headers: () => applicationAuthHeaders(),
});
const instance = new HttpViewInstanceService(transport);
const page = await instance.list('orders', { limit: 50 });
```

以下路径相对于 `/view-service/definitions/{definitionId}`：

| 方法   | 路径                                 | 请求                                                                                              | 成功时的 `data`                                  |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| GET    | 定义根路径                           | 可选 `readFence`                                                                                  | `ViewDefinition`                                 |
| GET    | `/instances`                         | `query`、`cursor`、`limit`、`readFence`                                                           | `Page<ViewInstanceSummary>`                      |
| GET    | `/instances/{id}`                    | 可选 `readFence`                                                                                  | 完整 `ViewInstance`                              |
| POST   | `/instances`                         | 不含 id/revision 的实例；`Idempotency-Key`；可选 `X-Definition-Revision`                          | `WriteObservation<ViewInstance>`（提交成功 201） |
| PUT    | `/instances/{id}`                    | 完整实例，id/revision 须与路径和 `If-Match` 一致；`Idempotency-Key`；可选 `X-Definition-Revision` | `WriteObservation<ViewInstance>`                 |
| PATCH  | `/instances/{id}/name`               | `{ title }`；`If-Match`；`Idempotency-Key`                                                        | `WriteObservation<ViewInstance>`                 |
| DELETE | `/instances/{id}`                    | `If-Match`；`Idempotency-Key`                                                                     | `WriteObservation<ViewDeleteReceipt>`            |
| GET    | `/preferences`                       | 可选 `readFence`                                                                                  | `PreferenceState`                                |
| PUT    | `/preferences/order`                 | `{ change: { scopeInstanceIds, orderedInstanceIds }, precondition }`；`Idempotency-Key`           | `WriteObservation<PreferenceState>`              |
| PUT    | `/preferences/default`               | `{ instanceId: string \| null, precondition }`；`Idempotency-Key`                                 | `WriteObservation<PreferenceState>`              |
| GET    | `/operations/{resource}/{requestId}` | `resource` 为 `instance` 或 `preference`；可选 `targetId`                                         | 该次早先写入已存的 `WriteObservation`            |
| GET    | `/permissions`                       | —                                                                                                 | 权限快照                                         |

定义与实例 ID 必须为非空白的有效 Unicode 字符串，不能整体为 `.` 或 `..`。本地元数据与 HTTP 输入遵循相同规则；合法 ID 仅编码一次，保留 Unicode 和保留字符。HTTP 权限客户端只保留已校验、当前已接受的权限快照；无效、不一致或过期的正文以 `UNAVAILABLE` 拒绝，`refresh()` 忽略旧快照，不向调用方暴露其原始正文。

GET 根路径就是定义 URL 本身，不要求结尾斜杠。所有响应都是 `{ data, permissions, error? }` 信封；会话有效时 `permissions` 总是调用方当前的权限快照。读取把资源放在 `data`。写入把 `WriteObservation` 放在 `data`：创建提交成功 201，其他提交成功 200，`unknown` 与 `committed_pending_receipt` 202，`rejected` 使用对应错误码映射的 4xx，并把 `issue` 同时放入 `error`。派发前的失败（认证、路由、正文无效、缺少请求头）为 `{ data: null, error: { code, message }, permissions? }`。响应和客户端请求均禁止缓存。

`If-Match` 以 JSON 字符串携带实例 revision；`Idempotency-Key` 携带 `WriteContext.requestId`；`X-Definition-Revision` 携带 `ConfigurationWriteContext.definitionRevision`，比已存定义更旧时以 DEFINITION_CHANGED 拒绝。偏好写入不使用 `If-Match`：正文中的 `precondition` 在首次偏好写入前为 `{ type: 'absent' }`，之后为 `{ type: 'matches', revision }`。客户端在发送前就以 PRECONDITION_REQUIRED 拒绝缺失的 revision，以 INVALID_ARGUMENT 拒绝空白 requestId。

传输层对读写的处理不同。读取以 `ViewServiceError` 拒绝：401 为 UNAUTHENTICATED，信封错误码与状态码一致时使用该错误码，其余（网络失败、超时、信封无效）为 UNAVAILABLE。写入总是解析为结局：服务端结局与状态码类别一致时（4xx 即 `rejected`）原样返回，401 为 `rejected` UNAUTHENTICATED，网络失败、超时、响应丢失或正文与状态码矛盾时为 `unknown`。引擎随后保留请求身份并核对，而不是盲目重试。

权限快照为 `{ revision, reorder, setDefault, createPersonal?, createShared?, instances: { [id]: { save, rename, delete, saveAsPersonal, saveAsShared } } }`，所有授权字段均为显式 boolean。旧策略版本不能恢复已撤销权限；HTTP 401 在解析响应正文之前清空权限并阻止更早的响应恢复授权；即使正文为文本或无效 JSON，也返回 `UNAUTHENTICATED`。应用在权限变化事件中调用 HTTP 权限客户端自己的 `refresh(signal?)`；引擎加载时不等待权限，只同步读取 `getInstance`／`getDefinition`。这里不内置轮询或推送传输。用户或访问范围改变仍必须切换 ViewPage.scopeKey。

| 错误码                | HTTP | 含义                                                                          |
| --------------------- | ---: | ----------------------------------------------------------------------------- |
| INVALID_ARGUMENT      |  400 | 输入不合法                                                                    |
| UNAUTHENTICATED       |  401 | 会话缺失或无效                                                                |
| FORBIDDEN             |  403 | 身份有效但不允许该操作                                                        |
| NOT_FOUND             |  404 | 资源不存在或不可见                                                            |
| CONFLICT              |  409 | 幂等键复用于不同内容                                                          |
| REVISION_CONFLICT     |  412 | 实例 revision 或偏好前提不匹配                                                |
| DEFINITION_CHANGED    |  412 | 配置基于更旧的定义 revision 设计                                              |
| PRECONDITION_REQUIRED |  428 | 写入缺少版本前提或偏好前提                                                    |
| CURSOR_EXPIRED        |  410 | 目录游标已失效，需重新加载第一页                                              |
| CORRUPT_STATE         |  500 | 服务存储文档损坏                                                              |
| UNAVAILABLE           |  503 | 服务／存储不可用；客户端也用于读取失败或超时                                  |
| UNKNOWN_OUTCOME       |  503 | 写入回执不明；客户端在发送后的超时、取消、响应丢失／无效时返回 `unknown` 结局 |

If-Match 版本不匹配使用 412，依据 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match)。身份从服务端会话解析，不从正文 scopeKey 或 owner 字段取得。测试服务器使用明确的假 bearer 会话；生产实现应替换身份提供方与存储实现，不应部署这些测试会话。

`ViewHost.instance.create(input, {requestId, signal?})` 要求每个逻辑创建保留同一个请求 ID。同一用户、同一键和同一规范化正文重放已存回执；正文变化返回 CONFLICT。实例与回执在同一个事务内提交。引擎在结果不明时保留 ID，阻止修改尚未确认请求的内容；原请求重试或显式重载可以核对已创建实例，不会把传输失败当成“肯定未写入”。直接使用客户端的调用者在重试、重建客户端后也必须保留原 ID。测试服务回执保留到管理重置为止。

个人排序是槽位重排：`saveOrder(definitionId, { scopeInstanceIds, orderedInstanceIds }, precondition, ctx)` 只重排作用集合内的位置，作用集合内的 ID 必须全部可见，不修改其他用户顺序。实例写入使用 revision CAS，两者是明确不同的并发语义。

默认视图偏好仅属于当前认证用户。任一可见视图都可设为默认，无需编辑权限；`null` 表示不自动选择。两种偏好写入都返回新的 `PreferenceState`；同一 requestId 重试会重放已存回执，`GET /operations/preference/{requestId}`（`operation.reconcile`）可只读核对而不重放。

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
pnpm storybook
# In another terminal:
node packages/view-engine/scripts/verify-http-view-host.mjs
# Manual Storybook service:
node packages/view-engine/scripts/verify-http-view-host.mjs --serve
```

夹具仅允许 `VIEW_ENGINE_E2E_BASE_URL` 的来源，默认 `http://127.0.0.1:6006`。使用其他 Storybook 地址（包括 `http://localhost:6006`）时需设置该变量；其他浏览器来源会在预检或写入前被拒绝。

`DELETE /instances/{id}` 的成功 envelope 包含来自删除事务的 `ViewDeleteReceipt` `{ id, revision }`，重复删除返回已存回执。它不涉及个人默认视图，默认视图仍保存在偏好文档中。

### 跨定义仪表盘

`HttpViewHost` 是按单一定义隔离的客户端，不是全局资源目录，其路由不会扩展到其他定义。跨定义仪表盘应为目标定义配置对应 HTTP 客户端，并在应用接入层组合现有公共 `ViewHost`。从核心包导入 `ViewHost` 与 `ViewServiceError`；下例假设已分别配置好 `rootClient` 和 `ordersClient`。

```ts
// rootClient and ordersClient each use their own definitionId and transport.
const definitions = new Map([
  ['overview', rootClient],
  ['orders', ordersClient],
]);
const owners = new Map([
  ['dashboard', rootClient],
  ['saved-orders', ordersClient],
]);
function clientFor(registry: ReadonlyMap<string, HttpViewHost>, id: string) {
  const client = registry.get(id);
  if (!client)
    throw new ViewServiceError('NOT_FOUND', 'Resource not registered');
  return client;
}
const host: ViewHost = {
  definition: {
    load: (id, options) =>
      clientFor(definitions, id).definition.load(id, options),
  },
  instance: {
    list: rootClient.instance.list,
    load: (id, options) => clientFor(owners, id).instance.load(id, options),
    create: rootClient.instance.create,
    save: rootClient.instance.save,
    rename: rootClient.instance.rename,
    delete: rootClient.instance.delete,
  },
  preference: rootClient.preference,
  permission: rootClient.permission,
  resolveSource: rootClient.resolveSource,
};
```

用户/租户访问范围变化时，重新创建所有客户端和组合宿主。组合宿主内的实例 ID 必须唯一。归属应由应用的已授权资源目录解析，不从 ID 文本猜测，也不逐一定义探测。转发取消信号，将列表、写入和偏好操作保留在根客户端，根权限快照与引用客户端保持独立。[真实 HTTP 回归](../test/dashboard/httpCompatibility.test.ts)使用纯仪表盘定义与独立记录服务，验证面板查询、仅保存根实例，以及子定义授权不会覆盖根授权。
