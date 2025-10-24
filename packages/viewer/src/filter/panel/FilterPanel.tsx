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

import React, { Key, useRef } from 'react';
import { FilterType, TypedFilter, TypedFilterComponent } from '../TypedFilter';
import { FilterField, FilterRef } from '../types';
import { StyleCapable } from '../../types';
import { and, Condition } from '@ahoo-wang/fetcher-wow';
import { Button, Col, Row, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export interface FilterPanelItem {
  key: Key;
  type: FilterType;
  field: FilterField;
  component?: TypedFilterComponent;
}

export interface FilterPanelProps extends StyleCapable {
  filters: FilterPanelItem[];
  actions?: React.ReactNode;
  onSearch?: (condition: Condition) => void;
}

export function FilterPanel(props: FilterPanelProps) {
  const { filters, onSearch, actions } = props;
  const filterRefs = useRef<(FilterRef | null)[]>([]);
  const handleSearch = () => {
    const conditions = filterRefs.current
      .map(ref => ref?.getValue()?.condition)
      .filter(Boolean) as Condition[];
    const finalCondition: Condition = and(...conditions);
    onSearch?.(finalCondition);
  };
  return (
    <>
      <Row gutter={[8, 8]} wrap>
        {filters.map((filter, index) => {
          const FilterComponent = filter.component ?? TypedFilter;
          return (
            <Col span={12}>
              <FilterComponent key={filter.key}
                               type={filter.type}
                               field={filter.field}
                               operator={{}}
                               value={{}}
                               ref={el => {
                                 filterRefs.current[index] = el;
                               }}
              ></FilterComponent>
            </Col>
          );
        })}
        <Col span={12}>
          <Space>
            {actions}
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Search</Button>
          </Space>
        </Col>
      </Row>
    </>
  );
}