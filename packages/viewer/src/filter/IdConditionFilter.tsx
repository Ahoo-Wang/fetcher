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
import { Button, Input, Select, Space } from 'antd';
import { Operator, Condition } from '@ahoo-wang/fetcher-wow';
import { TagInput } from '../components';
import { OPERATOR_zh_CN } from './locale';
import { friendlyCondition } from './friendlyCondition';
import { useConditionFilterState } from './useConditionFilterState';

export const ID_CONDITION_FILTER = 'id';

export function IdConditionFilter(props: ConditionFilterProps<string | string[]>) {
  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;
  const filterState = useConditionFilterState({
    field: props.field.name,
    operator: props.operator.value || Operator.ID,
    value: props.value.value,
    ref: props.ref,
    validate: (operator: Operator, value: string | string[] | undefined) => {
      return !(!operator || !value || (Array.isArray(value) && value.length === 0));
    },
    friendly: (condition: Condition) => {
      return friendlyCondition(props.field.label, operatorLocale, condition);
    },
    onChange: props.onChange,
  });
  const valueInput =
    filterState.operator === Operator.ID ? (
      <Input
        value={filterState.value}
        onChange={e => filterState.setValue(e.target.value)}
        allowClear
        {...props.value}
      />
    ) : (
      <TagInput value={filterState.value} onChange={filterState.setValue} {...props.value} />
    );
  return (
    <Space.Compact>
      <Button {...props.label}>{props.field.label}</Button>
      <Select
        value={filterState.operator}
        onChange={filterState.setOperator}
        {...props.operator}
      >
        <Select.Option value={Operator.ID}>
          {operatorLocale[Operator.ID]}
        </Select.Option>
        <Select.Option value={Operator.IDS}>
          {operatorLocale[Operator.IDS]}
        </Select.Option>
      </Select>
      {valueInput}
    </Space.Compact>
  );
}

IdConditionFilter.displayName = 'IdConditionFilter';

conditionFilterRegistry.register(ID_CONDITION_FILTER, IdConditionFilter);
