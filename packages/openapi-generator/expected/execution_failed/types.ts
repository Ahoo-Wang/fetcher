/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  RecoverableType,
  FunctionKind,
  FunctionInfo,
  BindingError,
  AggregateId,
  Operator,
  ConditionOptions,
  Projection,
  FieldSort,
  Pagination, Condition, DomainEventStream, ListQuery,
} from '@ahoo-wang/fetcher-wow';

export interface ApplyExecutionFailed {
  error: ErrorDetails;
  executeAt: number;
  recoverable: RecoverableType;
}

export interface ApplyExecutionSuccess {
  executeAt: number;
}

export interface ApplyRetrySpec {
  executionTimeout: number;
  maxRetries: number;
  minBackoff: number;
}

export interface ChangeFunction {
  contextName: string;
  functionKind: FunctionKind;
  name: string;
  processorName: string;
}

export interface CompensationPrepared {
  eventId: EventId;
  function: FunctionInfo;
  retryState: RetryState;
}

export interface CreateExecutionFailed {
  error: ErrorDetails;
  eventId: EventId;
  executeAt: number;
  function: FunctionInfo;
  recoverable: RecoverableType;
  retrySpec: null | RetrySpec;
}

export interface ErrorDetails {
  bindingErrors: BindingError[];
  errorCode: string;
  errorMsg: string;
  stackTrace: string;
  succeeded: boolean;
}

export interface EventId {
  aggregateId: AggregateId;
  id: string;
  version: number;
}

export interface ExecutionFailedAggregatedCondition extends Condition<ExecutionFailedAggregatedFields> {

}


export interface ExecutionFailedAggregatedDomainEventStream
  extends DomainEventStream<CompensationPrepared |
    ExecutionFailedApplied | ExecutionFailedCreated | ExecutionSuccessApplied
    | FunctionChanged | RecoverableMarked | RetrySpecApplied> {

}

export interface ExecutionFailedAggregatedDomainEventStreamPagedList {
  list: ExecutionFailedAggregatedDomainEventStream[];
  total: number;
}

export interface ExecutionFailedAggregatedDomainEventStreamServerSentEventNonNullData {
  data: ExecutionFailedAggregatedDomainEventStream;
  event: string | null;
  id: string | null;
  retry: number | null;
}

export enum ExecutionFailedAggregatedFields {
  aggregateId = 'aggregateId'
}

export interface ExecutionFailedAggregatedListQuery extends ListQuery {
  condition: ExecutionFailedAggregatedCondition;
  limit: number;
  projection: Projection;
  sort: FieldSort[];
}

export interface ExecutionFailedAggregatedPagedQuery {
  condition: ExecutionFailedAggregatedCondition;
  pagination: Pagination;
  projection: Projection;
  sort: FieldSort[];
}

export interface ExecutionFailedAggregatedSingleQuery {
  condition: ExecutionFailedAggregatedCondition;
  projection: Projection;
  sort: FieldSort[];
}

export interface ExecutionFailedApplied {
  error: ErrorDetails;
  executeAt: number;
  recoverable: RecoverableType;
}

export interface ExecutionFailedCreated {
  error: ErrorDetails;
  eventId: EventId;
  executeAt: number;
  function: FunctionInfo;
  recoverable: RecoverableType;
  retrySpec: RetrySpec;
  retryState: RetryState;
}

export interface ExecutionFailedState {
  error: ErrorDetails;
  eventId: EventId;
  executeAt: number;
  function: FunctionInfo;
  id: string;
  recoverable: RecoverableType;
  retrySpec: RetrySpec;
  retryState: RetryState;
  status: ExecutionFailedStatus;
  isBelowRetryThreshold: boolean;
  isRetryable: boolean;
}

export interface ExecutionFailedStateMaterializedSnapshot {
  aggregateId: string;
  aggregateName: string;
  contextName: string;
  deleted: boolean;
  eventId: string;
  eventTime: number;
  firstEventTime: number;
  firstOperator: string;
  operator: string;
  ownerId: string;
  snapshotTime: number;
  state: ExecutionFailedState;
  tenantId: string;
  version: number;
}

export interface ExecutionFailedStateMaterializedSnapshotPagedList {
  list: ExecutionFailedStateMaterializedSnapshot[];
  total: number;
}

export interface ExecutionFailedStateMaterializedSnapshotServerSentEventNonNullData {
  data: ExecutionFailedStateMaterializedSnapshot;
  event: string | null;
  id: string | null;
  retry: number | null;
}

export interface ExecutionFailedStatePagedList {
  list: ExecutionFailedState[];
  total: number;
}

export interface ExecutionFailedStateServerSentEventNonNullData {
  data: ExecutionFailedState;
  event: string | null;
  id: string | null;
  retry: number | null;
}

export interface ExecutionFailedStateSnapshot {
  contextName: string;
  aggregateName: string;
  tenantId: string;
  aggregateId: string;
  ownerId: string;
  version: number;
  eventId: string;
  firstOperator: string;
  operator: string;
  firstEventTime: number;
  state: object;
  deleted: boolean;
  snapshotTime: number;
}

export interface ExecutionFailedStateStateEvent {
  id: string;
  contextName: string;
  aggregateName: string;
  header: object;
  tenantId: string;
  aggregateId: string;
  ownerId: string;
  commandId: string;
  requestId: string;
  version: number;
  body: object[];
  createTime: number;
  firstOperator: string;
  firstEventTime: number;
  state: object;
  deleted: boolean;
}

export interface ExecutionFailedStatus {
}

export interface ExecutionSuccessApplied {
  executeAt: number;
}

export interface ForcePrepareCompensation {
}

export interface FunctionChanged {
  contextName: string;
  functionKind: FunctionKind;
  name: string;
  processorName: string;
}

export interface MarkRecoverable {
  recoverable: RecoverableType;
}

export interface PrepareCompensation {
}

export interface RecoverableMarked {
  recoverable: RecoverableType;
}

export interface RetrySpec {
  executionTimeout: number;
  maxRetries: number;
  minBackoff: number;
}

export interface RetrySpecApplied {
  executionTimeout: number;
  maxRetries: number;
  minBackoff: number;
}

export interface RetryState {
  nextRetryAt: number;
  retries: number;
  retryAt: number;
  timeoutAt: number;
}
