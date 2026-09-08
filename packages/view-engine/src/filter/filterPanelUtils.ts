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

import { FilterOperator, type FilterExpression } from '@ahoo-wang/fetcher-wow';

import type { DeepReadonly } from '../lib/types.js';
import type { FilterPanelProps } from './filterReactTypes.js';
import {
  compileFilterDraft,
  createFilterDraft,
  newFilterDraft,
} from './filterCore.js';
import { sameFilterQuery } from './filterTree.js';

export const logicalOperators = [
  FilterOperator.AND,
  FilterOperator.OR,
  FilterOperator.NOR,
] as const;
export const groupLabels = {
  AND: '满足全部条件',
  OR: '满足任一条件',
  NOR: '全部条件均不满足',
};
export const filterLayout =
  'fve:grid fve:grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))] fve:items-start fve:gap-2';
export function message(error: unknown) {
  return (
    (error instanceof Error ? error.message : String(error)) ||
    '筛选器处理失败。'
  );
}
export function without(values: Record<string, string>, id: string) {
  if (!(id in values)) return values;
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== id),
  );
}

export function readValue(value: DeepReadonly<FilterExpression> | null) {
  try {
    if (value === null) throw new TypeError('筛选条件尚未编译');
    return { draft: createFilterDraft(value), error: undefined };
  } catch (error) {
    return {
      draft: newFilterDraft(FilterOperator.MATCH_ALL),
      error: message(error),
    };
  }
}

export function readInitialFilterPanelState(props: FilterPanelProps) {
  const loaded = readValue(props.value);
  if (props.draft) loaded.error = undefined;
  const restored =
    props.draft && !loaded.error
      ? compileFilterDraft(
          props.draft,
          props.fields,
          props.allowedOperators,
          props.extensions?.filters,
          props.editors,
        )
      : undefined;
  return {
    ...loaded,
    baseline:
      restored?.expression && sameFilterQuery(restored.expression, props.value)
        ? props.draft!
        : loaded.draft,
  };
}
