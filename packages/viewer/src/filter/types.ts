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
import { ConditionCapable, ConditionOptions } from '@ahoo-wang/fetcher-wow';
import { SelectProps } from 'antd/es/select';
import React, { RefAttributes } from 'react';
import { StyleCapable } from '../types';
import { SelectOperator, SelectOperatorLocale } from './operator';

/**
 * @see {@link Schema}
 */
export interface FilterField extends NamedCapable {
  label: string;
  type?: string;
  format?: string;
}

export interface FilterRef {
  getValue(): FilterValue | undefined;

  reset(): void;
}

export interface FilterLabelProps extends StyleCapable {}

export interface FilterOperatorProps
  extends Omit<SelectProps<SelectOperator>, 'value' | 'options' | 'mode'> {
  locale?: SelectOperatorLocale;
  supportedOperators?: SelectOperator[];
}

export interface FilterValueProps extends StyleCapable {
  defaultValue?: any;
  placeholder?: string;

  [key: string]: any;
}

export interface FilterValue extends ConditionCapable {}

export interface FilterProps<
  ValuePropsType extends FilterValueProps = FilterValueProps,
> extends AttributesCapable,
    RefAttributes<FilterRef>,
    StyleCapable {
  field: FilterField;
  label?: FilterLabelProps;
  operator?: FilterOperatorProps | null;
  value?: ValuePropsType | null;
  onChange?: (value?: FilterValue) => void;
  conditionOptions?: ConditionOptions;
}

export type FilterComponent = React.FunctionComponent<FilterProps>;
