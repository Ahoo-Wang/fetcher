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

import type { PreferenceState } from '../viewServiceContract.js';
import { assertObject } from './validationPrimitives.js';

function optionalId(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${label}必须为非空字符串或 null`);
  return value;
}

/** Trust boundary for a host preference document and its effective resolution. */
export function readPreferenceState(value: unknown): PreferenceState {
  assertObject(value, '个人偏好');
  const revision = optionalId(value.revision, '偏好 revision');
  if (
    !Array.isArray(value.order) ||
    value.order.some(id => typeof id !== 'string' || !id) ||
    new Set(value.order).size !== value.order.length
  )
    throw new Error('偏好顺序必须是不重复的实例 ID 数组');
  const defaultInstanceId = optionalId(value.defaultInstanceId, '默认视图');
  const effectiveDefaultInstanceId = optionalId(
    value.effectiveDefaultInstanceId,
    '有效默认视图',
  );
  return {
    revision,
    order: [...(value.order as string[])],
    defaultInstanceId,
    effectiveDefaultInstanceId,
  };
}
