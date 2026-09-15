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

import type {
  ViewDefinition,
  ViewInstance,
  ViewCreateInput,
} from '../contracts/viewModel.js';
import { validateViewInstance } from '../contracts/validation/instanceValidation.js';
import {
  readWriteObservation,
  type WriteObservation,
} from '../contracts/viewServiceContract.js';

export type StoredInstance = ViewInstance & { ownerKey: string | null };
/** One user's preference document; absent until the first preference write. */
export interface StoredPreference {
  revision: string;
  order: string[];
  defaultInstanceId: string | null;
}
/** Exact receipt of an accepted write, keyed by scope, resource and request identity. */
export interface StoredReceipt {
  resource: 'instance' | 'preference';
  action: 'create' | 'save' | 'rename' | 'delete' | 'saveOrder' | 'saveDefault';
  targetId: string | null;
  input: unknown;
  observation: WriteObservation<unknown>;
}
export interface ServiceState {
  instances: StoredInstance[];
  /** Users whose personal seed instances were already inserted. */
  seeded: string[];
  preferences: Record<string, StoredPreference>;
  receipts: Record<string, StoredReceipt>;
}

/** Validate persisted service state independently of storage and locking. */
export function validateLocalViewState(
  state: ServiceState,
  definition: ViewDefinition,
): void {
  if (
    !state ||
    typeof state !== 'object' ||
    !Array.isArray(state.instances) ||
    !Array.isArray(state.seeded) ||
    state.seeded.some(key => typeof key !== 'string') ||
    !state.preferences ||
    typeof state.preferences !== 'object' ||
    Array.isArray(state.preferences) ||
    !state.receipts ||
    typeof state.receipts !== 'object' ||
    Array.isArray(state.receipts)
  )
    throw new Error('服务存储格式无效');
  const known = new Set<string>();
  for (const item of state.instances) {
    validateViewInstance(item, definition);
    if (
      !item.revision ||
      (item.scope.type === 'personal'
        ? typeof item.ownerKey !== 'string'
        : item.ownerKey !== null)
    )
      throw new Error('实例归属或版本无效');
    const key = JSON.stringify([item.ownerKey, item.id]);
    if (known.has(key)) throw new Error('实例重复');
    known.add(key);
  }
  for (const preference of Object.values(state.preferences))
    if (
      !preference ||
      typeof preference.revision !== 'string' ||
      !preference.revision ||
      !Array.isArray(preference.order) ||
      preference.order.some(id => typeof id !== 'string') ||
      new Set(preference.order).size !== preference.order.length ||
      !(
        preference.defaultInstanceId === null ||
        typeof preference.defaultInstanceId === 'string'
      )
    )
      throw new Error('用户偏好无效');
  for (const receipt of Object.values(state.receipts)) {
    if (
      !receipt ||
      (receipt.resource !== 'instance' && receipt.resource !== 'preference') ||
      typeof receipt.action !== 'string' ||
      !(receipt.targetId === null || typeof receipt.targetId === 'string')
    )
      throw new Error('写入回执无效');
    readWriteObservation(receipt.observation);
  }
}

export function createViewInput({
  definitionId,
  kind,
  title,
  scope,
  config,
}: ViewCreateInput): ViewCreateInput {
  return { definitionId, kind, title, scope, config } as ViewCreateInput;
}
