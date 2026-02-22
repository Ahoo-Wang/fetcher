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

import { FilterProps } from './types';
import { Input } from 'antd';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { TagInput } from '../components';
import { AssemblyFilter, AssemblyFilterProps } from './AssemblyFilter';
import { UseFilterStateReturn } from './useFilterState';

export const TEXT_FILTER = 'text';

export function TextFilter(props: FilterProps) {
  const assemblyFilterProps: AssemblyFilterProps = {
    ...props,
    supportedOperators: [
      Operator.EQ,
      Operator.NE,
      Operator.CONTAINS,
      Operator.STARTS_WITH,
      Operator.ENDS_WITH,
      Operator.IN,
      Operator.NOT_IN,
    ],
    valueInputRender: (filterState: UseFilterStateReturn) => {
      switch (filterState.operator) {
        case Operator.IN:
        case Operator.NOT_IN: {
          return (
            <TagInput
              value={filterState.value}
              onChange={filterState.setValue}
              {...props.value}
            />
          );
        }
        default: {
          return (
            <Input
              style={{ width: '100%' }}
              value={filterState.value}
              onChange={e => filterState.setValue(e.target.value)}
              allowClear
              {...props.value}
            />
          );
        }
      }
    },
  };
  return <AssemblyFilter {...assemblyFilterProps}></AssemblyFilter>;
}

TextFilter.displayName = 'TextFilter';
