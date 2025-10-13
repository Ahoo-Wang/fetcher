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
import { Operator } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { TagInput } from '../components';
import { OPERATOR_zh_CN } from './locale';

export const ID_CONDITION_FILTER = 'id';

export function IdConditionFilter(props: ConditionFilterProps) {
  const [operator, setOperator] = useState(props.operator);
  const valueInput = operator === Operator.ID ? <Input placeholder={props.placeholder} allowClear />
    : <TagInput placeholder={props.placeholder} />;
  const operatorLocale = props.locale ?? OPERATOR_zh_CN;
  return (
    <Space.Compact>
      <Button>{props.field.label}</Button>
      <Select value={operator} onChange={setOperator}>
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
