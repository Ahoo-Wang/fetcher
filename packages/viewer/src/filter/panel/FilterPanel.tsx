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

import React, { Key } from 'react';
import { TypedFilter, TypedFilterComponent, TypedFilterProps } from '../TypedFilter';
import { FilterRef } from '../types';
import { StyleCapable } from '../../types';
import { and, Condition } from '@ahoo-wang/fetcher-wow';
import { Button, Col, Row, Space, ColProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRefs } from '@ahoo-wang/fetcher-react';

export interface ActiveFilter extends Omit<TypedFilterProps, 'onChange' | 'ref'> {
  key: Key;
}

export interface FilterPanelProps extends StyleCapable {
  component?: TypedFilterComponent;
  filters: ActiveFilter[];
  actions?: React.ReactNode;
  onSearch?: (condition: Condition) => void;
  colSpan?: ColProps['span'];
}

export function FilterPanel(props: FilterPanelProps) {
  const { filters, onSearch, actions, component, colSpan = 12 } = props;
  const filterRefs = useRefs<FilterRef>();
  const handleSearch = () => {
    if (!onSearch) {
      return;
    }
    const conditions = Array.from(filterRefs.values())
      .map(ref => ref?.getValue()?.condition)
      .filter(Boolean);
    const finalCondition: Condition = and(...conditions);
    onSearch(finalCondition);
  };
  const FilterComponent = component || TypedFilter;
  return (
    <>
      <Row gutter={[8, 8]} wrap>
        {filters.map(filter => {
          return (
            <Col span={colSpan}>
              <FilterComponent
                key={filter.key}
                type={filter.type}
                field={filter.field}
                operator={filter.operator}
                value={filter.value}
                ref={filterRefs.register(filter.key)}
              ></FilterComponent>
            </Col>
          );
        })}
        <Col span={colSpan}>
          <Space>
            {actions}
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Space>
        </Col>
      </Row>
    </>
  );
}
