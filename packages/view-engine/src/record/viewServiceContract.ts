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

import type { ViewInstancePermissions } from './recordModel.js';

export const VIEW_SERVICE_STATUS = {
  INVALID_ARGUMENT: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  REVISION_CONFLICT: 412,
  PRECONDITION_REQUIRED: 428,
  CORRUPT_STATE: 500,
  UNAVAILABLE: 503,
  UNKNOWN_OUTCOME: 503,
} as const;
export type ViewServiceErrorCode = keyof typeof VIEW_SERVICE_STATUS;
export class ViewServiceError extends Error {
  readonly name = 'ViewServiceError';
  constructor(
    readonly code: ViewServiceErrorCode,
    message: string,
  ) {
    super(message);
  }
}
/** One logical create keeps this ID until a definitive outcome, including transport retries. */
export interface ViewCreateContext {
  requestId: string;
  signal?: AbortSignal;
}
export interface ViewPermissionSnapshot {
  /** Monotonic authority revision; stale HTTP responses cannot restore revoked grants. */
  revision: number;
  instances: Record<string, Required<ViewInstancePermissions>>;
  reorder: boolean;
}
/** Inject Web Locks in browsers or the service's transaction lock in tests. */
export type ViewStorageLock = <T>(
  name: string,
  operation: () => T,
  signal?: AbortSignal,
) => Promise<T>;
