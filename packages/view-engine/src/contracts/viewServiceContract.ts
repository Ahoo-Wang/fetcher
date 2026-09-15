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

/** Structured reasons shared by host rejections, unknown outcomes and engine issues. */
export type ViewServiceErrorCode =
  | 'INVALID_ARGUMENT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'REVISION_CONFLICT'
  | 'DEFINITION_CHANGED'
  | 'PRECONDITION_REQUIRED'
  | 'CURSOR_EXPIRED'
  | 'CORRUPT_STATE'
  | 'UNAVAILABLE'
  | 'UNKNOWN_OUTCOME';

const ERROR_CODES: readonly ViewServiceErrorCode[] = [
  'INVALID_ARGUMENT',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'REVISION_CONFLICT',
  'DEFINITION_CHANGED',
  'PRECONDITION_REQUIRED',
  'CURSOR_EXPIRED',
  'CORRUPT_STATE',
  'UNAVAILABLE',
  'UNKNOWN_OUTCOME',
];

export class ViewServiceError extends Error {
  readonly name = 'ViewServiceError';
  constructor(
    readonly code: ViewServiceErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** A coded, displayable problem attached to a write outcome. Never a program branch on prose. */
export interface OperationIssue {
  readonly code: ViewServiceErrorCode;
  readonly message: string;
}

/** Every write carries an intent-stable request identity; retries of the same intent reuse it. */
export interface WriteContext {
  readonly requestId: string;
  readonly signal?: AbortSignal;
}
/** Configuration writes also record which definition revision the configuration was designed against. */
export interface ConfigurationWriteContext extends WriteContext {
  readonly definitionRevision?: string;
}

/** Read ports accept an opaque service-issued fence to settle write visibility. */
export interface ReadOptions {
  readonly readFence?: string;
  readonly signal?: AbortSignal;
}
export interface ListOptions extends ReadOptions {
  readonly query?: string;
  readonly cursor?: string | null;
  readonly limit?: number;
}
/** One catalog page. `total` is only present when the service can compute it within the caller's access scope. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly total?: number;
}

/** Creation requires absence; updates require the exact revision last read. */
export type WritePrecondition =
  | { readonly type: 'absent' }
  | { readonly type: 'matches'; readonly revision: string };
export const ABSENT_PRECONDITION: WritePrecondition = Object.freeze({
  type: 'absent',
});
export function preconditionFor(revision: string | null): WritePrecondition {
  return revision === null
    ? ABSENT_PRECONDITION
    : { type: 'matches', revision };
}

export type WriteVisibility =
  | { readonly visibility: 'visible' }
  | { readonly visibility: 'pending'; readonly readFence: string };

/**
 * Mutually exclusive write outcomes. Hosts return these instead of rejecting for expected
 * failures; a rejected promise after dispatch only means the observation did not complete.
 */
export type WriteObservation<T> =
  | ({
      readonly outcome: 'committed';
      readonly value: T;
      readonly revision: string;
    } & WriteVisibility)
  | {
      readonly outcome: 'committed_pending_receipt';
      readonly targetId: string;
      readonly revision: string;
      readonly issue: OperationIssue;
    }
  | { readonly outcome: 'unknown'; readonly issue: OperationIssue }
  | { readonly outcome: 'rejected'; readonly issue: OperationIssue };

/** Locates an earlier write for read-only reconciliation. */
export interface OperationReference {
  readonly resource: 'instance' | 'preference';
  readonly definitionId: string;
  readonly requestId: string;
  readonly targetId?: string;
}

export interface ViewDeleteReceipt {
  readonly id: string;
  readonly revision: string;
}

/** Reorders only the listed slots; omitted IDs and the default keep their positions. */
export interface ViewOrderChange {
  readonly scopeInstanceIds: readonly string[];
  readonly orderedInstanceIds: readonly string[];
}

/** Stored preference plus its current effective resolution against visible instances. */
export interface PreferenceState {
  /** null when the user has no preference document yet; creation uses the `absent` precondition. */
  readonly revision: string | null;
  readonly order: readonly string[];
  readonly defaultInstanceId: string | null;
  readonly effectiveDefaultInstanceId: string | null;
}

export function committedWrite<T>(
  value: T,
  revision: string,
): WriteObservation<T> {
  return { outcome: 'committed', value, revision, visibility: 'visible' };
}
export function rejectedWrite<T = never>(
  code: ViewServiceErrorCode,
  message: string,
): WriteObservation<T> {
  return { outcome: 'rejected', issue: { code, message } };
}
export function unknownWrite<T = never>(
  message: string,
  code: ViewServiceErrorCode = 'UNKNOWN_OUTCOME',
): WriteObservation<T> {
  return { outcome: 'unknown', issue: { code, message } };
}
/** Normalize a thrown value into an issue; unknown errors default to an uncertain outcome code. */
export function issueOf(
  error: unknown,
  fallback: ViewServiceErrorCode = 'UNKNOWN_OUTCOME',
): OperationIssue {
  if (error instanceof ViewServiceError)
    return { code: error.code, message: error.message };
  return {
    code: fallback,
    message: error instanceof Error ? error.message : String(error),
  };
}
export function isViewServiceErrorCode(
  value: unknown,
): value is ViewServiceErrorCode {
  return (
    typeof value === 'string' &&
    ERROR_CODES.includes(value as ViewServiceErrorCode)
  );
}

function readIssue(value: unknown): OperationIssue {
  if (
    !value ||
    typeof value !== 'object' ||
    !isViewServiceErrorCode((value as { code?: unknown }).code) ||
    typeof (value as { message?: unknown }).message !== 'string'
  )
    throw new Error('写入结果缺少有效的问题码或说明');
  const { code, message } = value as OperationIssue;
  return { code, message };
}

/** Trust boundary for inbound write outcomes; structural only, the value itself is validated by the caller. */
export function readWriteObservation<T>(value: unknown): WriteObservation<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('写入结果必须是对象');
  const observation = value as Record<string, unknown>;
  switch (observation.outcome) {
    case 'committed': {
      if (typeof observation.revision !== 'string' || !observation.revision)
        throw new Error('已提交的写入结果缺少 revision');
      if (!('value' in observation))
        throw new Error('已提交的写入结果缺少回执');
      if (observation.visibility === 'visible')
        return {
          outcome: 'committed',
          value: observation.value as T,
          revision: observation.revision,
          visibility: 'visible',
        };
      if (
        observation.visibility === 'pending' &&
        typeof observation.readFence === 'string' &&
        observation.readFence
      )
        return {
          outcome: 'committed',
          value: observation.value as T,
          revision: observation.revision,
          visibility: 'pending',
          readFence: observation.readFence,
        };
      throw new Error('已提交的写入结果缺少可见性或读取屏障');
    }
    case 'committed_pending_receipt':
      if (
        typeof observation.targetId !== 'string' ||
        !observation.targetId ||
        typeof observation.revision !== 'string' ||
        !observation.revision
      )
        throw new Error('待回执的写入结果缺少目标身份或版本');
      return {
        outcome: 'committed_pending_receipt',
        targetId: observation.targetId,
        revision: observation.revision,
        issue: readIssue(observation.issue),
      };
    case 'unknown':
      return { outcome: 'unknown', issue: readIssue(observation.issue) };
    case 'rejected':
      return { outcome: 'rejected', issue: readIssue(observation.issue) };
    default:
      throw new Error('写入结果的 outcome 无效');
  }
}

/**
 * Slot reorder used by every preference implementation: scope IDs not yet in the explicit
 * order are appended in scope order first, then the scoped slots are refilled with the
 * requested order. Example: [A,B,C,D] with scope [A,C] and order [C,A] yields [C,B,A,D].
 */
export function applyOrderChange(
  current: readonly string[],
  change: ViewOrderChange,
): string[] {
  const { scopeInstanceIds, orderedInstanceIds } = change;
  const scope = new Set(scopeInstanceIds);
  if (
    scopeInstanceIds.some(id => typeof id !== 'string' || !id) ||
    orderedInstanceIds.some(id => typeof id !== 'string' || !id) ||
    scope.size !== scopeInstanceIds.length ||
    new Set(orderedInstanceIds).size !== orderedInstanceIds.length ||
    orderedInstanceIds.length !== scope.size ||
    orderedInstanceIds.some(id => !scope.has(id))
  )
    throw new ViewServiceError(
      'INVALID_ARGUMENT',
      '排序作用集合与目标顺序必须是相同且不重复的 ID 集合',
    );
  const base = [
    ...current,
    ...scopeInstanceIds.filter(id => !current.includes(id)),
  ];
  const queue = [...orderedInstanceIds];
  return base.map(id => (scope.has(id) ? queue.shift()! : id));
}

export function encodeViewResourceId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value === '.' ||
    value === '..'
  )
    throw new ViewServiceError(
      'INVALID_ARGUMENT',
      '视图资源 ID 不能为空或点路径段',
    );
  try {
    return encodeURIComponent(value);
  } catch {
    throw new ViewServiceError(
      'INVALID_ARGUMENT',
      '视图资源 ID 包含无效 Unicode',
    );
  }
}
