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
import { ConditionCapable, Operator, OperatorLocale } from '@ahoo-wang/fetcher-wow';
import { SelectProps } from 'antd/es/select';
import React, { RefAttributes } from 'react';
import { StyleCapable } from '../types';


/**
 * @see {@link Schema}
 */
export interface FilterField extends NamedCapable {
  label: string;
  type: string;
  format?: string;
}

export interface FilterRef {
  getValue(): FilterValue | undefined;
}

export interface LabelProps extends StyleCapable {
}

export interface OperatorProps extends Omit<SelectProps<Operator>, 'value'> {
  locale?: OperatorLocale;
}

export interface ValueProps<ValueType = any> extends StyleCapable {
  defaultValue?: ValueType;
  placeholder?: string;
}

export interface FilterValue extends ConditionCapable {
}

export interface FilterProps<ValueType = any> extends AttributesCapable, RefAttributes<FilterRef> {
  field: FilterField;
  label?: LabelProps;
  operator: OperatorProps;
  value: ValueProps<ValueType>;
  onChange?: (value?: FilterValue) => void;
}

export type FilterComponent = React.FC<FilterProps>;