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


import { ConditionFilterComponent } from './types';

export class ConditionFilterRegistry {

  private readonly filters: Map<string, ConditionFilterComponent> = new Map<string, ConditionFilterComponent>();

  register(type: string, filter: ConditionFilterComponent) {
    this.filters.set(type, filter);
  }

  unregister(type: string) {
    return this.filters.delete(type);
  }

  get(type: string): ConditionFilterComponent | undefined {
    return this.filters.get(type);
  }

}

export const conditionFilterRegistry = new ConditionFilterRegistry();