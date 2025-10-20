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
import { useImperativeHandle, useState } from 'react';
import { TagInput } from '../components';
import { OPERATOR_zh_CN } from './locale';
import { friendlyCondition } from './friendlyCondition';

export const ID_CONDITION_FILTER = 'id';

function buildConditionFilterValue(props: ConditionFilterProps, operator: Operator, value: any): ConditionFilterValue | undefined {
  if (!operator || !value || (Array.isArray(value) && value.length === 0)) {
    return undefined;
  }
  const condition: Condition = {
    operator,
    value,
  };
  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;
  const friendly = friendlyCondition(props.field.label, operatorLocale, condition);
  return { condition, friendly };
}

export function IdConditionFilter(props: ConditionFilterProps<string | string[]>) {
  const [operator, setOperator] = useState<Operator>(props.operator.value || Operator.ID);
  const [value, setValue] = useState(props.value.value);

  const operatorLocale = props.operator.locale ?? OPERATOR_zh_CN;
  const onOperatorChange = (newOperator: Operator) => {
    setOperator(newOperator);
    props.onChange?.(buildConditionFilterValue(props, newOperator, value));
  };
  useImperativeHandle(props.ref, () => ({
    getValue(): ConditionFilterValue | undefined {
      return buildConditionFilterValue(props, operator, value);
    },
  }));
  const onValueChange = (newValue: any) => {
    setValue(newValue);
    props.onChange?.(buildConditionFilterValue(props, operator, newValue));
  };
  const valueInput =
    operator === Operator.ID ? (
      <Input
        value={value}
        onChange={e => onValueChange(e.target.value)}
        allowClear
        {...props.value}
      />
    ) : (
      <TagInput value={value} onChange={onValueChange} {...props.value} />
    );
  return (
    <Space.Compact>
      <Button {...props.label}>{props.field.label}</Button>
      <Select
        value={operator}
        onChange={onOperatorChange}
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
