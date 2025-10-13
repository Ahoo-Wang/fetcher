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

import { ConditionFilterProps, ConditionFilterValue } from './types';
import { conditionFilterRegistry } from './conditionFilterRegistry';
import { Button, Input, Select, Space } from 'antd';
import { Operator, Condition } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { TagInput } from '../components';
import { OPERATOR_zh_CN } from './locale';
import { friendlyCondition } from './friendlyCondition';

export const ID_CONDITION_FILTER = 'id';

export function IdConditionFilter(props: ConditionFilterProps) {
  const defaultOperator = props.operator.defaultValue || Operator.ID;
  const [operator, setOperator] = useState<Operator>(defaultOperator);
  const [value, setValue] = useState(props.value.defaultValue);

  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;

  const buildConditionFilterValue = (): ConditionFilterValue | undefined => {
    if (!operator || !value || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }
    const condition: Condition = {
      operator,
      value,
    };
    const friendly = friendlyCondition(props.field.label, operatorLocale, condition);
    return { condition, friendly };
  };

  const handleOperatorChange = (newOperator: Operator) => {
    setOperator(newOperator);
    props.onChange?.(buildConditionFilterValue());
  };

  const handleValueChange = (newValue: any) => {
    setValue(newValue);
    props.onChange?.(buildConditionFilterValue());
  };
  const valueInput =
    operator === Operator.ID ? (
      <Input
        value={value}
        onChange={e => handleValueChange(e.target.value)}
        allowClear
        {...props.value}
      />
    ) : (
      <TagInput value={value} onChange={handleValueChange} {...props.value} />
    );
  return (
    <Space.Compact>
      <Button {...props.label}>{props.field.label}</Button>
      <Select
        defaultValue={Operator.ID}
        value={operator}
        onChange={handleOperatorChange}
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
