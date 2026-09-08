---
title: '共享领域类型与工具'
description: '共享领域类型与工具 — @ahoo-wang/fetcher-wow 5.0.0'
---

# 共享领域类型与工具

共享接口描述线上数据，不构造实例，应使用 `import type`。它们不验证令牌、不强制租户隔离、不授权操作，检查仍归服务端负责。

| 家族                                           | 字段 / 值                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Identifier、Version、Named、DescriptionCapable | id:string、version:number、name:string、description:string                                             |
| NamedBoundedContext / AliasBoundedContext      | contextName / contextAlias                                                                             |
| NamedAggregate / AliasAggregate                | 上下文身份加 aggregateName                                                                             |
| AggregateId                                    | 扁平 aggregateId、tenantId、contextName、aggregateName；AggregateIdCapable 在 aggregateId 中嵌套该对象 |
| OwnerId、SpaceIdCapable、TenantId              | ownerId、spaceId、tenantId；DEFAULT_OWNER_ID 为空字符串                                                |
| *TimeCapable、EventIdCapable、*OperatorCapable | 对应名称的数值时间戳或字符串事件/操作者 ID                                                             |
| StateCapable&lt;S&gt;、BodyCapable&lt;T&gt;    | state / body 类型化载荷                                                                                |
| AbacTags                                       | 字符串键到 string[] 的 Record；空 tags {}，通配值 ['*']                                                |
| FunctionInfo                                   | contextName、name、functionKind、processorName；COMMAND/ERROR/EVENT/SOURCING/STATE_EVENT               |
| ErrorInfo / BindingError                       | errorCode/errorMsg，可选 bindingErrors，其成员含 name/msg                                              |
| RecoverableType                                | RECOVERABLE / UNKNOWN / UNRECOVERABLE 分类，不是自动重试策略                                           |
| DynamicDocument / DynamicDocumentArray         | Record&lt;string,any&gt; 及数组，无 schema 的响应类型                                                  |
| MessageHeaderSqlType                           | MAP / STRING 表示标签                                                                                  |

`ErrorCodes` 列出 Ok、NotFound、DuplicateRequestId、版本冲突等线上标识。isSucceeded 严格比较 `Ok`，isError 取反。已知错误码不会替应用选择恢复策略。`UrlPathParams` 接受 tenantId/ownerId/id 和其他字符串路径槽；ResourceAttributionPathSpec 定义空、tenant、owner、tenant+owner 模板。空 ABAC/default-owner 常量只是数据，不绕过权限检查。

`getPropertyValue<T>(object, propertyName, defaultValue?)` 接受点分字符串或 string[] 路径。点分空段会去掉，数组路径保留显式段；空路径返回原对象。数字段索引数组，无效索引、缺失/null 中间值或 null 最终值返回默认值。读取普通对象属性（含继承属性），不捕获 getter 异常，不能用作不可信路径的授权过滤器。无需资源清理。

## 完整示例

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

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./index#public-symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

## 相关专题

[客户端配置与元数据](./configuration) · [命令与等待结果](./commands) · [快照查询](./snapshot-queries) · [过滤表达式与旧条件](./filters) · [投影、排序与分页](./query-options) · [游标查询](./cursor-queries) · [聚合构造器](./aggregations) · [事件与历史状态](./events-and-history)
