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

import { and, Condition, Identifier } from '@ahoo-wang/fetcher-wow';
import React, { useState, useRef, useEffect } from 'react';
import { Button, Col, Row, Space } from 'antd';
import { FilterRef } from '../types';
import { StyleCapable } from '../../types';
import { FilterField } from '../types';
import { FilterType } from '../TypedFilter';
import { ActiveFilterGroup, AvailableFilter } from './AvailableFilterSelect';
import { AvailableFilterSelectModal } from './AvailableFilterSelectModal';
import { RemovableTypedFilter } from './RemovableTypedFilter';
import { SearchOutlined } from '@ant-design/icons';

export interface ActiveFilter extends Identifier {
  type: FilterType;
  field: FilterField;
}

export interface FilterPanelProps extends StyleCapable {
  availableFilters: ActiveFilterGroup[];
  activeFilters: ActiveFilter[];
  onSearch?: (condition: Condition) => void;
}

export function FilterPanel(props: FilterPanelProps) {
  const {
    availableFilters,
    activeFilters,
    onSearch,
  } = props;
  const [filters, setFilters] = useState(activeFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const filterRefs = useRef<(FilterRef | null)[]>([]);

  useEffect(() => {
    filterRefs.current = new Array(activeFilters.length).fill(null);
  }, [activeFilters.length]);

  const generateId = () => Date.now().toString();

  const handleAddFilter = (selectedAvailableFilters: AvailableFilter[]) => {
    if (selectedAvailableFilters.length === 0) return;
    const newFilters = selectedAvailableFilters.map(
      available =>
        ({
          id: generateId(),
          type: available.component,
          field: available.field,
        }) as ActiveFilter,
    );
    setFilters([...filters, ...newFilters]);
    setModalOpen(false);
  };

  const removeFilter = (id: string) => {
    const newFilters = activeFilters.filter(f => f.id !== id);
    setFilters(newFilters);
  };

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
        {filters.map((filter, index) => (
          <Col span={12}>
            <RemovableTypedFilter key={filter.id}
                                  type={filter.type}
                                  field={filter.field}
                                  operator={{}}
                                  value={{}}
                                  ref={el => {
                                    filterRefs.current[index] = el;
                                  }}
                                  onRemove={() => removeFilter(filter.id)}
            ></RemovableTypedFilter>
          </Col>
        ))}
        <Col offset={12} span={12}>
          <Space>
            <Button onClick={() => setModalOpen(true)}>Add Filter</Button>
            <Button type="primary"  icon={<SearchOutlined />}  onClick={handleSearch}>Search</Button>
          </Space>
        </Col>
      </Row>
      <AvailableFilterSelectModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSave={handleAddFilter}
        availableFilters={{ filters: availableFilters }}
      />
    </>
  );
}
