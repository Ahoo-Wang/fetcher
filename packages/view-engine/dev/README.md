# HTTP development experiment

This directory is excluded from the published package. Its routes, envelopes, status mapping and authentication fixture are provisional, not the public ViewHost contract. Use it to test service/runtime boundaries and recovery.

### HTTP adapter and protocol

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

Development modules provide: `HttpViewDefinitionService`,
`HttpViewInstanceService`, `HttpViewPreferenceService` and
`HttpViewOperationService`. Use them directly without a ViewHost or frontend
runtime. `HttpViewTransport` shares authentication, timeouts and errors; its
options omit `resolveSource`. The shared `transport.permission` client owns
snapshot validation, versioning and subscriptions; its `refresh(signal?)` is the
application's own entry point and is not part of the `ViewHost` contract, which
sees only the synchronous `getInstance`, `getDefinition` and `subscribe`.

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

| Method | Path relative to `/view-service/definitions/{definitionId}` | Request                                                                                                                | `data` on success                                |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| GET    | `/`                                                         | Optional `readFence`                                                                                                   | `ViewDefinition`                                 |
| GET    | `/instances`                                                | `query`, `cursor`, `limit`, `readFence`                                                                                | `Page<ViewInstanceSummary>`                      |
| GET    | `/instances/{id}`                                           | Optional `readFence`                                                                                                   | `ViewInstance`                                   |
| POST   | `/instances`                                                | Instance without id/revision; `Idempotency-Key`; optional `X-Definition-Revision`                                      | `WriteObservation<ViewInstance>` (201 committed) |
| PUT    | `/instances/{id}`                                           | Complete instance whose id/revision match the path and `If-Match`; `Idempotency-Key`; optional `X-Definition-Revision` | `WriteObservation<ViewInstance>`                 |
| PATCH  | `/instances/{id}/name`                                      | `{ title }`; `If-Match`; `Idempotency-Key`                                                                             | `WriteObservation<ViewInstance>`                 |
| DELETE | `/instances/{id}`                                           | `If-Match`; `Idempotency-Key`                                                                                          | `WriteObservation<ViewDeleteReceipt>`            |
| GET    | `/preferences`                                              | Optional `readFence`                                                                                                   | `PreferenceState`                                |
| PUT    | `/preferences/order`                                        | `{ change: { scopeInstanceIds, orderedInstanceIds }, precondition }`; `Idempotency-Key`                                | `WriteObservation<PreferenceState>`              |
| PUT    | `/preferences/default`                                      | `{ instanceId: string \| null, precondition }`; `Idempotency-Key`                                                      | `WriteObservation<PreferenceState>`              |
| GET    | `/operations/{resource}/{requestId}`                        | `resource` is `instance` or `preference`; optional `targetId`                                                          | Stored `WriteObservation` of that earlier write  |
| GET    | `/permissions`                                              | —                                                                                                                      | Permission snapshot                              |

Definition and instance IDs must be nonblank, valid Unicode strings; the entire
ID cannot be `.` or `..`. The same rule applies to local metadata and HTTP inputs.
Resource clients encode valid IDs once, preserving Unicode and reserved characters.
The HTTP permission client keeps only the validated, currently accepted snapshot;
malformed, inconsistent or stale payloads reject with UNAVAILABLE, and `refresh()`
ignores older snapshots without exposing their raw payloads.

The GET root path is exactly the definition URL, without requiring a trailing slash. Every response is the envelope `{ data, permissions, error? }`; `permissions` is the caller's current snapshot whenever the session is authenticated. Reads put the resource in `data`. Writes put the `WriteObservation` in `data`: 201 for a committed create, 200 for other committed writes, 202 for `unknown` and `committed_pending_receipt`, and the mapped 4xx status for `rejected`, whose `issue` is repeated in `error`. Failures before dispatch (authentication, routing, malformed body, missing headers) are `{ data: null, error: { code, message }, permissions? }`. Responses and client fetches use `no-store`.

`If-Match` carries the instance revision as a JSON string; `Idempotency-Key` carries the `WriteContext.requestId`; `X-Definition-Revision` carries `ConfigurationWriteContext.definitionRevision`, and a value older than the stored definition revision rejects with DEFINITION_CHANGED. Preference writes do not use `If-Match`: their body `precondition` is `{ type: 'absent' }` before the first preference write and `{ type: 'matches', revision }` afterwards. The client rejects a missing revision with PRECONDITION_REQUIRED and a blank requestId with INVALID_ARGUMENT before sending anything.

The transport reads and writes differently. Reads reject with a `ViewServiceError`: UNAUTHENTICATED on 401, the envelope's code when it agrees with the status, otherwise UNAVAILABLE (network failure, timeout, invalid envelope). Writes always resolve to an observation: the service's own observation when it agrees with the status class (4xx means `rejected`), `rejected` UNAUTHENTICATED on 401, and `unknown` for a network failure, timeout, dropped response or a body that contradicts its status. The engine then keeps the request identity and reconciles instead of retrying blindly.

A permission snapshot is `{ revision, reorder, setDefault, createPersonal?, createShared?, instances: { [id]: { save, rename, delete, saveAsPersonal, saveAsShared } } }` with explicit booleans. Older authority revisions cannot restore revoked grants. An HTTP 401 clears cached grants and fences off older in-flight permission responses before parsing the body, including text or malformed JSON responses. It reports UNAUTHENTICATED regardless of the response-body format. Applications call the HTTP permission client's `refresh(signal?)` on an authority-change event; the engine never awaits permissions during load and only reads `getInstance`/`getDefinition` synchronously. This is not a polling or push-transport implementation. Identity/access-scope changes still require a new ViewPage scopeKey.

| Code                  | HTTP | Meaning                                                                                                                                              |
| --------------------- | ---: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| INVALID_ARGUMENT      |  400 | Invalid input                                                                                                                                        |
| UNAUTHENTICATED       |  401 | Missing/invalid server session                                                                                                                       |
| FORBIDDEN             |  403 | Authenticated but operation denied                                                                                                                   |
| NOT_FOUND             |  404 | Missing or invisible resource                                                                                                                        |
| CONFLICT              |  409 | Reused request ID with different content                                                                                                             |
| REVISION_CONFLICT     |  412 | Instance revision or preference precondition does not match                                                                                          |
| DEFINITION_CHANGED    |  412 | Configuration was designed against an older definition revision                                                                                      |
| PRECONDITION_REQUIRED |  428 | Missing write revision or preference precondition                                                                                                    |
| CURSOR_EXPIRED        |  410 | Catalog cursor is no longer valid; reload the first page                                                                                             |
| CORRUPT_STATE         |  500 | Invalid stored service document                                                                                                                      |
| UNAVAILABLE           |  503 | Service/storage unavailable; also used locally for failed/timed-out reads                                                                            |
| UNKNOWN_OUTCOME       |  503 | Write receipt unavailable; the client reports an `unknown` observation after write timeout, cancellation after dispatch, or an invalid/lost response |

`If-Match` revision failures use 412, following [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match). Authentication is derived from a server-owned session, never a posted scopeKey/owner field. The included HTTP server uses explicit fake bearer sessions solely for contract verification; production authentication and persistence implementations must honor the same interface rather than deploy those fake sessions.

`ViewHost.instance.create(input, {requestId, signal?})` requires one ID per logical create. Same user/key and canonical body replay the stored receipt; changed content returns CONFLICT. The view and receipt are committed in the same transaction. ViewEngine retains the ID on unknown failures and blocks changing that pending request's content; retry or explicit reload reconciles the created instance. It never treats a transport failure as proof that a write did not happen. Direct clients must retain their request ID when retrying, including after reconstructing a client. Fixture receipts live until the administrative reset.

Personal ordering is a slot reorder: `saveOrder(definitionId, { scopeInstanceIds, orderedInstanceIds }, precondition, ctx)` refills only the scoped slots, every scoped ID must be visible, and no other user's order is modified. Instance writes use revision CAS. These are separate, explicit concurrency semantics.

The default preference is private to the authenticated user. Any visible view can be selected without edit permission; `null` disables automatic selection. Both preference writes return the new `PreferenceState`; a retry with the same requestId replays the stored receipt, and `GET /operations/preference/{requestId}` (`operation.reconcile`) reads it without replaying.

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
pnpm storybook
# In another terminal:
node packages/view-engine/scripts/verify-http-view-host.mjs
# Manual Storybook service:
node packages/view-engine/scripts/verify-http-view-host.mjs --serve
```

The fixture allows only the origin in `VIEW_ENGINE_E2E_BASE_URL` (default `http://127.0.0.1:6006`). Set it when using another Storybook address, including `http://localhost:6006`. Requests from other browser origins are rejected before preflight or mutations.

The successful `DELETE /instances/{id}` envelope contains the `ViewDeleteReceipt` `{ id, revision }` from the deletion transaction; idempotent repeats return the stored receipt. It says nothing about the personal default, which stays in the preference document.

### Cross-definition dashboards

`HttpViewHost` is a definition-scoped client, not a global resource directory; its routes do not extend to other definitions. For a cross-definition dashboard, configure one HTTP client per target definition and compose the existing public `ViewHost` at the application boundary. Import `ViewHost` and `ViewServiceError` from the core package. The example assumes `rootClient` and `ordersClient` are already configured.

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

Recreate all clients and the composed host when the user/tenant access scope changes. Instance IDs must be unique within the composed host. Resolve ownership from the application's authorized resource directory; do not guess it from ID text or probe every definition. Forward cancellation signals, keep list/write/preference operations on the root client, and keep its permission snapshot separate from reference clients. The [real HTTP regression](../test/dashboard/httpCompatibility.test.ts) uses a pure dashboard definition and a separate record service, verifies panel queries and root-only saves, and checks that child grants do not overwrite root grants.
