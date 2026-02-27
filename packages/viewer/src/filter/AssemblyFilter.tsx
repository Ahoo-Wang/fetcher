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

import { FilterProps, FilterValueProps } from './types';
import { OPERATOR_zh_CN } from './operator';
import {
  ConditionValueParser,
  FilterValueConverter,
  OnOperatorChangeValueConverter,
  useFilterState,
  UseFilterStateReturn,
  ValidateValue,
} from './useFilterState';
import { Select, Space, Typography, theme } from 'antd';

const { useToken } = theme;
import { ReactNode } from 'react';
import { SelectOperator } from './operator';

export type ValueInputRender = (
  filterState: UseFilterStateReturn,
) => ReactNode | null;

export interface AssemblyFilterProps<
  ValuePropsType extends FilterValueProps = FilterValueProps,
> extends FilterProps<ValuePropsType> {
  supportedOperators: SelectOperator[];
  onOperatorChangeValueConverter?: OnOperatorChangeValueConverter;
  validate?: ValidateValue;
  conditionValueParser?: ConditionValueParser;
  filterValueConverter?: FilterValueConverter;
  valueInputRender?: ValueInputRender;
}

export function AssemblyFilter({ ref, ...props }: AssemblyFilterProps) {
  const supportedOperators =
    props.operator?.supportedOperators ?? props.supportedOperators;
  // Validate that supportedOperators is not empty
  if (!supportedOperators || supportedOperators.length === 0) {
    throw new Error('supportedOperators must be a non-empty array');
  }

  const operatorLocale = props.operator?.locale ?? OPERATOR_zh_CN;

  // Determine the initial operator
  let initialOperator = props.operator?.defaultValue;

  // If no operator is provided or it's not in supported operators, use the first supported operator
  if (!initialOperator || !supportedOperators.includes(initialOperator)) {
    initialOperator = supportedOperators[0];
  }
  const filterState = useFilterState({
    field: props.field.name,
    operator: initialOperator,
    value: props.value?.defaultValue,
    ref: ref,
    onOperatorChangeValueConverter: props.onOperatorChangeValueConverter,
    validate: props.validate,
    conditionValueParser: props.conditionValueParser,
    filterValueConverter: props.filterValueConverter,
    onChange: props.onChange,
  });

  const valueInput = props.valueInputRender?.(filterState);
  const options = supportedOperators.map(supportedOperator => ({
    value: supportedOperator,
    label: operatorLocale[supportedOperator],
  }));
  const { token } = useToken();
  return (
    <Space.Compact
      block
      style={{ ...props.style }}
      className={props.className}
    >
      <Typography
        style={{
          minWidth: 140,
          height: '32px',
          lineHeight: '32px',
          padding: '0 12px',
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
          borderRight: 'none',
          ...props.label?.style,
        }}
        className={props.label?.className}
      >
        {props.field.label}
      </Typography>
      <Select
        style={{ minWidth: 120 }}
        {...props.operator}
        onChange={filterState.setOperator}
        value={filterState.operator}
        options={options}
      ></Select>
      {valueInput}
    </Space.Compact>
  );
}
