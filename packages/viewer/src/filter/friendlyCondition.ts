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

import { Condition, OperatorLocale } from '@ahoo-wang/fetcher-wow';

export function friendlyCondition(label: string, operatorLocale: OperatorLocale, condition: Condition) {
  const friendlyParts = [];
  friendlyParts.push(label);
  friendlyParts.push(operatorLocale[condition.operator!]);
  const value = condition.value;
  if (Array.isArray(condition.value)) {
    friendlyParts.push(value.join(', '));
  } else {
    friendlyParts.push(value);
  }
  return friendlyParts.join(' ');
}