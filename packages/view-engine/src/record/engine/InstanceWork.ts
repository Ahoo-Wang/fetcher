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

import type { RecordSession, ViewInstance } from '../recordModel.js';
import { ViewServiceError } from '../viewServiceContract.js';

/** Only a definitive service rejection proves a dispatched write did not commit. */
export function hasUnknownWriteOutcome(error: unknown): boolean {
  return (
    !(error instanceof ViewServiceError) ||
    error.code === 'UNKNOWN_OUTCOME' ||
    error.code === 'UNAVAILABLE'
  );
}

/** Per-instance coordination between durable writes and reload/reconciliation. */
export class InstanceWork {
  readonly createRequests = new Map<
    string,
    {
      requestId: string;
      submitted: ViewInstance;
      knownIds: ReadonlySet<string>;
    }
  >();
  readonly writes = new Map<string, symbol>();
  readonly unverifiedDeletes = new Map<string, string | undefined>();
  readonly reloads = new Map<string, AbortController>();
  readonly unverifiedCreates = new Map<
    string,
    {
      id: string | null;
      submitted: ViewInstance;
      knownIds: ReadonlySet<string>;
    }
  >();

  finishCreate(id: string): void {
    this.unverifiedCreates.delete(id);
    this.createRequests.delete(id);
  }

  preserveCreates(): void {
    for (const [id, request] of this.createRequests) {
      if (!this.unverifiedCreates.has(id))
        this.unverifiedCreates.set(id, {
          id: null,
          submitted: request.submitted,
          knownIds: request.knownIds,
        });
    }
  }

  assertWritable(session: RecordSession, replayingWrite = false): void {
    const id = session.instance.id;
    if (this.writes.has(id)) throw new Error('实例正在写入，请等待操作完成');
    if (this.reloads.has(id))
      throw new Error('实例正在重新加载，请等待加载完成');
    if (session.requiresReload && !replayingWrite)
      throw new Error('写入结果需要核对，请先重新加载实例');
  }

  cancelReloads(): void {
    this.reloads.forEach(controller => controller.abort());
    this.reloads.clear();
  }

  dispose(): void {
    this.cancelReloads();
    this.unverifiedCreates.clear();
    this.createRequests.clear();
    this.unverifiedDeletes.clear();
  }
}
