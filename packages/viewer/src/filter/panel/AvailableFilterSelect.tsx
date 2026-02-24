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

import { FilterField, FilterOperatorProps, FilterValueProps } from '../types';
import { FilterType } from '../TypedFilter';
import { Checkbox, Flex, Typography } from 'antd';
import { StyleCapable } from '../../types';
import {
  RefAttributes,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { ActiveFilter } from './FilterPanel';

export interface AvailableFilter {
  field: FilterField;
  component: FilterType;
  value?: FilterValueProps;
  operator?: FilterOperatorProps;
}

export interface AvailableFilterGroup {
  label: string;
  filters: AvailableFilter[];
}

export interface AvailableFilterSelectRef {
  getValue(): AvailableFilter[];
}

export interface AvailableFilterSelectProps
  extends StyleCapable, RefAttributes<AvailableFilterSelectRef> {
  filters: AvailableFilterGroup[];
  activeFilters?: ActiveFilter[];
}

const EMPTY_ACTIVE_FILTERS: ActiveFilter[] = [];

export function AvailableFilterSelect(props: AvailableFilterSelectProps) {
  const { filters, activeFilters = EMPTY_ACTIVE_FILTERS, ref } = props;
  const activeFilterFieldNames = useMemo(() => {
    return activeFilters?.map(activeFilter => activeFilter.field.name).sort();
  }, [activeFilters]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(
    activeFilterFieldNames,
  );

  useImperativeHandle(ref, () => ({
    getValue(): AvailableFilter[] {
      return props.filters.flatMap(group =>
        group.filters.filter(
          filter =>
            selectedFilters.includes(filter.field.name) &&
            !activeFilters.some(
              activeFilter => activeFilter.field.name === filter.field.name,
            ),
        ),
      );
    },
  }));
  const handleCheck = (filter: AvailableFilter, checked: boolean) => {
    if (checked) {
      setSelectedFilters([...selectedFilters, filter.field.name]);
    } else {
      setSelectedFilters(
        selectedFilters.filter(name => name !== filter.field.name),
      );
    }
  };

  useEffect(() => {
    setSelectedFilters(activeFilterFieldNames);
  }, [activeFilterFieldNames]);
  return (
    <>
      {filters.map(group => (
        <div key={group.label}>
          <Typography.Title level={5}>{group.label}</Typography.Title>
          <Flex gap="middle" wrap>
            {group.filters.map(filter => (
              <Checkbox
                key={filter.field.name}
                checked={selectedFilters.includes(filter.field.name)}
                onChange={e => {
                  handleCheck(filter, e.target.checked);
                }}
                disabled={activeFilters.some(
                  activeFilter => activeFilter.field.name === filter.field.name,
                )}
              >
                {filter.field.label}
              </Checkbox>
            ))}
          </Flex>
        </div>
      ))}
    </>
  );
}
