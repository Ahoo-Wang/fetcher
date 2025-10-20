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

import { ConditionFilterProps } from './types';
import { conditionFilterRegistry } from './conditionFilterRegistry';
import { Input } from 'antd';
import { Operator, Condition } from '@ahoo-wang/fetcher-wow';
import { TagInput } from '../components';
import { OPERATOR_zh_CN } from './locale';
import { friendlyCondition } from './friendlyCondition';
import { UseConditionFilterStateReturn } from './useConditionFilterState';
import { AssemblyConditionFilter, AssemblyConditionFilterProps } from './AssemblyConditionFilter';

export const ID_CONDITION_FILTER = 'id';

export function IdConditionFilter(
  props: ConditionFilterProps<string | string[]>,
) {
  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;
  const assemblyConditionFilterProps: AssemblyConditionFilterProps<string | string[]> = {
    ...props,
    supportedOperators: [Operator.ID, Operator.IDS],
    validate: (operator: Operator, value: string | string[] | undefined) => {
      // Valid if operator exists, value exists, and arrays are non-empty
      if (!operator) return false;
      if (!value) return false;
      return !(Array.isArray(value) && value.length === 0);
    },
    friendly: (condition: Condition) => {
      return friendlyCondition(props.field.label, operatorLocale, condition);
    },
    valueInputSupplier: (filterState: UseConditionFilterStateReturn<string | string[]>) => {
      return filterState.operator === Operator.ID ? (
        <Input
          value={filterState.value}
          onChange={e => filterState.setValue(e.target.value)}
          allowClear
          {...props.value}
        />
      ) : (
        <TagInput
          value={filterState.value}
          onChange={filterState.setValue}
          {...props.value}
        />
      );
    },
  };
  return <AssemblyConditionFilter<string | string[]> {...assemblyConditionFilterProps}></AssemblyConditionFilter>;
}

IdConditionFilter.displayName = 'IdConditionFilter';

conditionFilterRegistry.register(ID_CONDITION_FILTER, IdConditionFilter);
