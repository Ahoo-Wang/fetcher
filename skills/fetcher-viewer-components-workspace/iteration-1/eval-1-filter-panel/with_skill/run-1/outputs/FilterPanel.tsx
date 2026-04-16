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

import type { FilterPanelProps } from '@ahoo-wang/fetcher-viewer';
import {
  FilterPanel,
  Operator,
  useFilterState,
  TextFilter,
  NumberFilter,
  SelectFilter,
} from '@ahoo-wang/fetcher-viewer';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';

export function ExampleFilterPanel() {
  const [condition, setCondition] = useState<Condition | undefined>();

  const usernameFilterState = useFilterState({
    field: 'username',
    operator: Operator.CONTAINS,
    value: undefined,
  });

  const ageFilterState = useFilterState({
    field: 'age',
    operator: Operator.GT,
    value: undefined,
  });

  const statusFilterState = useFilterState({
    field: 'status',
    operator: Operator.IN,
    value: undefined,
  });

  const filters: FilterPanelProps['filters'] = [
    {
      key: 'username',
      type: 'text',
      field: {
        name: 'username',
        label: 'Username',
        type: 'string',
      },
      operator: {
        defaultValue: Operator.CONTAINS,
      },
      value: {},
    },
    {
      key: 'age',
      type: 'number',
      field: {
        name: 'age',
        label: 'Age',
        type: 'number',
      },
      operator: {
        defaultValue: Operator.GT,
      },
      value: {},
    },
    {
      key: 'status',
      type: 'select',
      field: {
        name: 'status',
        label: 'Status',
        type: 'string',
      },
      operator: {
        defaultValue: Operator.IN,
      },
      value: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    },
  ];

  return (
    <FilterPanel
      filters={filters}
      onSearch={(finalCondition) => {
        setCondition(finalCondition);
      }}
      searchButton={{ children: 'Search' }}
      resetButton={{ children: 'Reset' }}
    />
  );
}