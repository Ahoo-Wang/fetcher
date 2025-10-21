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

import { AttributesCapable, NamedCapable } from '@ahoo-wang/fetcher';
import { Condition, Operator, OperatorLocale } from '@ahoo-wang/fetcher-wow';
import { SelectProps } from 'antd/es/select';
import { ButtonProps } from 'antd';
import React, { RefAttributes } from 'react';

/**
 * @see {@link Schema}
 */
export interface ConditionField extends NamedCapable {
  label: string;
  type: string;
  format?: string;
}

export interface ConditionFilterRef {
  getValue(): ConditionFilterValue | undefined;
}

export interface LabelProps extends ButtonProps {

}

export interface OperatorProps extends Omit<SelectProps<Operator>, 'value'> {
  locale?: OperatorLocale;
}

export interface ValueProps<ValueType = any> {
  defaultValue?: ValueType;
  placeholder?: string;
}

export interface ConditionFilterValue {
  condition: Condition;
  friendly: string;
}

export interface ConditionFilterProps<ValueType = any> extends AttributesCapable, RefAttributes<ConditionFilterRef> {
  field: ConditionField;
  label: LabelProps;
  operator: OperatorProps;
  value: ValueProps<ValueType>;
  onChange?: (value?: ConditionFilterValue) => void;
}

export type ConditionFilterComponent = React.FC<ConditionFilterProps>;