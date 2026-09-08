---
title: 'Shared domain types and utilities'
description: 'Shared domain types and utilities — @ahoo-wang/fetcher-wow 5.0.0'
---

# Shared domain types and utilities

The shared interfaces describe wire data without constructing it. Import them with `import type`. They do not validate a token, enforce tenancy, or authorize an operation; the server remains responsible for those checks.

| Family                                         | Fields / values                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Identifier, Version, Named, DescriptionCapable | id:string, version:number, name:string, description:string                                             |
| NamedBoundedContext / AliasBoundedContext      | contextName / contextAlias                                                                             |
| NamedAggregate / AliasAggregate                | Context identity plus aggregateName                                                                    |
| AggregateId                                    | aggregateId, tenantId, contextName, aggregateName (flat); AggregateIdCapable nests this as aggregateId |
| OwnerId, SpaceIdCapable, TenantId              | ownerId, spaceId, tenantId; DEFAULT_OWNER_ID is empty string                                           |
| *TimeCapable, EventIdCapable, *OperatorCapable | Named numeric timestamps or string event/operator identifiers                                          |
| StateCapable&lt;S&gt;, BodyCapable&lt;T&gt;    | state / body typed payload                                                                             |
| AbacTags                                       | Record of string keys to string[]; empty tags {}, wildcard values ['*']                                |
| FunctionInfo                                   | contextName, name, functionKind and processorName; COMMAND/ERROR/EVENT/SOURCING/STATE_EVENT            |
| ErrorInfo / BindingError                       | errorCode/errorMsg plus optional bindingErrors of name/msg                                             |
| RecoverableType                                | RECOVERABLE / UNKNOWN / UNRECOVERABLE classifications, not an automatic retry policy                   |
| DynamicDocument / DynamicDocumentArray         | Record&lt;string,any&gt; and array; schema-free response typing                                        |
| MessageHeaderSqlType                           | MAP / STRING representation labels                                                                     |

`ErrorCodes` lists wire identifiers such as Ok, NotFound, DuplicateRequestId and version conflicts. isSucceeded compares strictly with `Ok`; isError is its negation. A known error code does not choose recovery for the application. `UrlPathParams` accepts tenantId/ownerId/id and additional string-valued path slots. ResourceAttributionPathSpec defines empty, tenant, owner, tenant+owner templates. Empty ABAC/default-owner constants are data, not a bypass of permission checks.

`getPropertyValue<T>(object, propertyName, defaultValue?)` accepts a dotted string or string[] path. Dotted empty segments are removed; array paths preserve explicit segments. Empty path returns the object. Numeric segments index arrays; invalid index, missing/null intermediate or null final value returns the default. It reads ordinary object properties, including inherited properties, and does not catch throwing getters. Avoid using it as an untrusted-path authorization filter. No resources are allocated that require cleanup.

## Complete example

```ts
import { getPropertyValue, ErrorCodes } from '@ahoo-wang/fetcher-wow';
import type { AggregateId, AbacTags } from '@ahoo-wang/fetcher-wow';
const identity: AggregateId = {
  aggregateId: '1',
  tenantId: 'tenant-a',
  contextName: 'accounts',
  aggregateName: 'user',
};
const tags: AbacTags = { department: ['sales'] };
console.assert(
  getPropertyValue({ rows: [{ name: 'Ada' }] }, 'rows.0.name') === 'Ada',
);
console.assert(
  getPropertyValue({ name: null }, 'name', 'unknown') === 'unknown',
);
console.assert(ErrorCodes.isSucceeded('Ok'));
console.log(identity, tags);
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./index#public-symbols). Runtime defaults and failure behavior are described above.

### DynamicDocument {#api-DynamicDocument}

```ts
export type DynamicDocument = Record<string, any>;
```

[packages/wow/src/query/types.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/types.ts#L14)

### DynamicDocumentArray {#api-DynamicDocumentArray}

```ts
export type DynamicDocumentArray = DynamicDocument[];
```

[packages/wow/src/query/types.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/types.ts#L16)

### AbacTagKey {#api-AbacTagKey}

```ts
export type AbacTagKey = string;
```

[packages/wow/src/types/abac.ts:13](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L13)

### AbacTagValue {#api-AbacTagValue}

```ts
export type AbacTagValue = string[];
```

[packages/wow/src/types/abac.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L14)

### AbacTags {#api-AbacTags}

```ts
export type AbacTags = Record<AbacTagKey, AbacTagValue>;
```

[packages/wow/src/types/abac.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L15)

### EMPTY_ABAC_TAGS {#api-EMPTY_ABAC_TAGS}

```ts
declare const EMPTY_ABAC_TAGS: AbacTags;
```

[packages/wow/src/types/abac.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L16)

### WILDCARD_ABAC_TAG_VALUES {#api-WILDCARD_ABAC_TAG_VALUES}

```ts
declare const WILDCARD_ABAC_TAG_VALUES: string[];
```

[packages/wow/src/types/abac.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L17)

### AbacTaggable {#api-AbacTaggable}

```ts
export interface AbacTaggable {
  tags: AbacTags;
}
```

[packages/wow/src/types/abac.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L19)

### ApplyAbacTags {#api-ApplyAbacTags}

```ts
export interface ApplyAbacTags extends AbacTaggable {}
```

[packages/wow/src/types/abac.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L24)

### AbacTagsApplied {#api-AbacTagsApplied}

```ts
export interface AbacTagsApplied extends AbacTaggable {}
```

[packages/wow/src/types/abac.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/abac.ts#L27)

### Identifier {#api-Identifier}

```ts
export interface Identifier {
  id: string;
}
```

[packages/wow/src/types/common.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/common.ts#L17)

### Version {#api-Version}

```ts
export interface Version {
  version: number;
}
```

[packages/wow/src/types/common.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/common.ts#L31)

### UrlPathParams {#api-UrlPathParams}

```ts
export interface UrlPathParams {
  tenantId?: string;
  ownerId?: string;
  id?: string;
  [key: string]: string | undefined;
}
```

[packages/wow/src/types/endpoints.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/endpoints.ts#L19)

### ResourceAttributionPathSpec {#api-ResourceAttributionPathSpec}

```ts
export enum ResourceAttributionPathSpec {
  NONE = '',
  TENANT = '/tenant/{tenantId}',
  OWNER = '/owner/{ownerId}',
  TENANT_OWNER = '/tenant/{tenantId}/owner/{ownerId}',
}
```

[packages/wow/src/types/endpoints.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/endpoints.ts#L57)

### RecoverableType {#api-RecoverableType}

```ts
export enum RecoverableType {
  RECOVERABLE = 'RECOVERABLE',
  UNKNOWN = 'UNKNOWN',
  UNRECOVERABLE = 'UNRECOVERABLE',
}
```

[packages/wow/src/types/error.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/error.ts#L22)

### BindingError {#api-BindingError}

```ts
export interface BindingError {
  name: string;
  msg: string;
}
```

[packages/wow/src/types/error.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/error.ts#L55)

### ErrorInfo {#api-ErrorInfo}

```ts
export interface ErrorInfo {
  errorCode: string;
  errorMsg: string;
  bindingErrors?: BindingError[];
}
```

[packages/wow/src/types/error.ts:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/error.ts#L66)

### ErrorCodes {#api-ErrorCodes}

```ts
export class ErrorCodes {
  static readonly SUCCEEDED = 'Ok';
  static readonly SUCCEEDED_MESSAGE = '';
  static readonly NOT_FOUND = 'NotFound';
  static readonly NOT_FOUND_MESSAGE = 'Not found resource!';
  static readonly BAD_REQUEST = 'BadRequest';
  static readonly ILLEGAL_ARGUMENT = 'IllegalArgument';
  static readonly ILLEGAL_STATE = 'IllegalState';
  static readonly REQUEST_TIMEOUT = 'RequestTimeout';
  static readonly TOO_MANY_REQUESTS = 'TooManyRequests';
  static readonly DUPLICATE_REQUEST_ID = 'DuplicateRequestId';
  static readonly COMMAND_VALIDATION = 'CommandValidation';
  static readonly REWRITE_NO_COMMAND = 'RewriteNoCommand';
  static readonly EVENT_VERSION_CONFLICT = 'EventVersionConflict';
  static readonly DUPLICATE_AGGREGATE_ID = 'DuplicateAggregateId';
  static readonly COMMAND_EXPECT_VERSION_CONFLICT =
    'CommandExpectVersionConflict';
  static readonly SOURCING_VERSION_CONFLICT = 'SourcingVersionConflict';
  static readonly ILLEGAL_ACCESS_DELETED_AGGREGATE =
    'IllegalAccessDeletedAggregate';
  static readonly ILLEGAL_ACCESS_OWNER_AGGREGATE =
    'IllegalAccessOwnerAggregate';
  static readonly ILLEGAL_ACCESS_SPACE_AGGREGATE =
    'IllegalAccessSpaceAggregate';
  static readonly INTERNAL_SERVER_ERROR = 'InternalServerError';
  static isSucceeded(errorCode: string): boolean;
  static isError(errorCode: string): boolean;
}
```

[packages/wow/src/types/error.ts:85](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/error.ts#L85)

### FunctionKind {#api-FunctionKind}

```ts
export enum FunctionKind {
  COMMAND = 'COMMAND',
  ERROR = 'ERROR',
  EVENT = 'EVENT',
  SOURCING = 'SOURCING',
  STATE_EVENT = 'STATE_EVENT',
}
```

[packages/wow/src/types/function.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/function.ts#L21)

### FunctionInfo {#api-FunctionInfo}

```ts
export interface FunctionInfo extends NamedBoundedContext, Named {
  functionKind: FunctionKind;
  processorName: string;
}
```

[packages/wow/src/types/function.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/function.ts#L51)

### FunctionInfoCapable {#api-FunctionInfoCapable}

```ts
export interface FunctionInfoCapable {
  function: FunctionInfo;
}
```

[packages/wow/src/types/function.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/function.ts#L59)

### BodyCapable {#api-BodyCapable}

```ts
export interface BodyCapable<T> {
  body: T;
}
```

[packages/wow/src/types/messaging.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/messaging.ts#L14)

### CreateTimeCapable {#api-CreateTimeCapable}

```ts
export interface CreateTimeCapable {
  createTime: number;
}
```

[packages/wow/src/types/modeling.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L19)

### DeletedCapable {#api-DeletedCapable}

```ts
export interface DeletedCapable {
  deleted: boolean;
}
```

[packages/wow/src/types/modeling.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L29)

### EventIdCapable {#api-EventIdCapable}

```ts
export interface EventIdCapable {
  eventId: string;
}
```

[packages/wow/src/types/modeling.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L39)

### EventTimeCapable {#api-EventTimeCapable}

```ts
export interface EventTimeCapable {
  eventTime: number;
}
```

[packages/wow/src/types/modeling.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L49)

### FirstEventTimeCapable {#api-FirstEventTimeCapable}

```ts
export interface FirstEventTimeCapable {
  firstEventTime: number;
}
```

[packages/wow/src/types/modeling.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L59)

### FirstOperatorCapable {#api-FirstOperatorCapable}

```ts
export interface FirstOperatorCapable {
  firstOperator: string;
}
```

[packages/wow/src/types/modeling.ts:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L69)

### AggregateNameCapable {#api-AggregateNameCapable}

```ts
export interface AggregateNameCapable {
  aggregateName: string;
}
```

[packages/wow/src/types/modeling.ts:79](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L79)

### NamedAggregate {#api-NamedAggregate}

```ts
export interface NamedAggregate
  extends NamedBoundedContext, AggregateNameCapable {}
```

[packages/wow/src/types/modeling.ts:89](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L89)

### AliasAggregate {#api-AliasAggregate}

```ts
export interface AliasAggregate
  extends AliasBoundedContext, AggregateNameCapable {}
```

[packages/wow/src/types/modeling.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L92)

### AggregateId {#api-AggregateId}

```ts
export interface AggregateId extends TenantId, NamedAggregate {
  aggregateId: string;
}
```

[packages/wow/src/types/modeling.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L98)

### AggregateIdCapable {#api-AggregateIdCapable}

```ts
export interface AggregateIdCapable {
  aggregateId: AggregateId;
}
```

[packages/wow/src/types/modeling.ts:109](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L109)

### OperatorCapable {#api-OperatorCapable}

```ts
export interface OperatorCapable {
  operator: string;
}
```

[packages/wow/src/types/modeling.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L122)

### DEFAULT_OWNER_ID {#api-DEFAULT_OWNER_ID}

```ts
declare const DEFAULT_OWNER_ID: '';
```

[packages/wow/src/types/modeling.ts:129](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L129)

### OwnerId {#api-OwnerId}

```ts
export interface OwnerId {
  ownerId: string;
}
```

[packages/wow/src/types/modeling.ts:134](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L134)

### SpaceIdCapable {#api-SpaceIdCapable}

```ts
export interface SpaceIdCapable {
  spaceId: string;
}
```

[packages/wow/src/types/modeling.ts:141](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L141)

### SnapshotTimeCapable {#api-SnapshotTimeCapable}

```ts
export interface SnapshotTimeCapable {
  snapshotTime: number;
}
```

[packages/wow/src/types/modeling.ts:148](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L148)

### TenantId {#api-TenantId}

```ts
export interface TenantId {
  tenantId: string;
}
```

[packages/wow/src/types/modeling.ts:158](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L158)

### StateCapable {#api-StateCapable}

```ts
export interface StateCapable<S> {
  state: S;
}
```

[packages/wow/src/types/modeling.ts:165](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/modeling.ts#L165)

### NamedBoundedContext {#api-NamedBoundedContext}

```ts
export interface NamedBoundedContext {
  contextName: string;
}
```

[packages/wow/src/types/naming.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/naming.ts#L17)

### AliasBoundedContext {#api-AliasBoundedContext}

```ts
export interface AliasBoundedContext {
  contextAlias: string;
}
```

[packages/wow/src/types/naming.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/naming.ts#L21)

### Named {#api-Named}

```ts
export interface Named {
  name: string;
}
```

[packages/wow/src/types/naming.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/naming.ts#L28)

### DescriptionCapable {#api-DescriptionCapable}

```ts
export interface DescriptionCapable {
  description: string;
}
```

[packages/wow/src/types/naming.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/naming.ts#L39)

### MessageHeaderSqlType {#api-MessageHeaderSqlType}

```ts
export enum MessageHeaderSqlType {
  MAP = 'MAP',
  STRING = 'STRING',
}
```

[packages/wow/src/types/bi.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/types/bi.ts#L14)

### getPropertyValue {#api-getPropertyValue}

```ts
export function getPropertyValue<T = any>(
  object: any,
  propertyName: string | string[],
  defaultValue?: T,
): T | undefined;
```

[packages/wow/src/getPropertyValue.ts:50](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/getPropertyValue.ts#L50)

## Related topics

[Client configuration and metadata](./configuration) · [Commands and wait results](./commands) · [Snapshot queries](./snapshot-queries) · [Filter expressions and legacy conditions](./filters) · [Projection, sorting and pagination](./query-options) · [Cursor queries](./cursor-queries) · [Aggregation builders](./aggregations) · [Events and historical state](./events-and-history)
