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

import { Condition, Identifier } from '@ahoo-wang/fetcher-wow';
import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Checkbox } from 'antd';
import { TypedFilter } from './TypedFilter';
import { FilterRef } from './types';
import { StyleCapable } from '../types';
import { FilterField } from './types';
import { FilterType } from './TypedFilter';
import { Flex } from 'antd';

export interface AvailableFilter {
  field: FilterField;
  component: FilterType;
}

export interface ActiveFilter extends Identifier {
  type: FilterType;
  field: FilterField;
}

export interface ActiveFilterGroup {
  name: string;
  label: string;
  filters: AvailableFilter[];
}

export interface FilterPanelProps extends StyleCapable {
  availableFilters: ActiveFilterGroup[];
  activeFilters: ActiveFilter[];
  onFiltersChange?: (filters: ActiveFilter[]) => void;
  onSearch?: (condition: Condition) => void;
}

export function FilterPanel(props: FilterPanelProps) {
  const {
    availableFilters,
    activeFilters,
    onFiltersChange,
    onSearch,
    ...styleProps
  } = props;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const filterRefs = useRef<(FilterRef | null)[]>([]);

  useEffect(() => {
    filterRefs.current = new Array(activeFilters.length).fill(null);
  }, [activeFilters.length]);

  const generateId = () => Date.now().toString();

  const allAvailableFilters = availableFilters.flatMap(group => group.filters);

  const handleAddFilter = () => {
    if (selectedFilters.length === 0) return;
    const newFilters = selectedFilters
      .map(filterType => {
        const available = allAvailableFilters.find(
          f => f.component === filterType,
        );
        if (!available) return null;
        return {
          id: generateId(),
          type: filterType,
          field: available.field,
        } as ActiveFilter;
      })
      .filter(Boolean) as ActiveFilter[];
    onFiltersChange?.([...activeFilters, ...newFilters]);
    setModalOpen(false);
    setSelectedFilters([]);
  };

  const removeFilter = (id: string) => {
    const newFilters = activeFilters.filter(f => f.id !== id);
    onFiltersChange?.(newFilters);
  };

  const handleRemoveAll = () => {
    onFiltersChange?.([]);
  };

  const handleSearch = () => {
    const conditions = filterRefs.current
      .map(ref => ref?.getValue()?.condition)
      .filter(Boolean) as Condition[];
    const condition: Condition = {
      operator: 'AND' as any,
      children: conditions,
    };
    onSearch?.(condition);
  };

  return (
    <div {...styleProps}>
      <Flex gap="middle" vertical>
        {activeFilters.map((filter, index) => (
          <Flex key={filter.id} align="center" gap="small">
            <TypedFilter
              type={filter.type}
              field={filter.field}
              operator={{}}
              value={{}}
              ref={el => {
                filterRefs.current[index] = el;
              }}
            />
            <Button onClick={() => removeFilter(filter.id)}>Remove</Button>
          </Flex>
        ))}
        <Flex gap="small">
          <Button onClick={handleSearch}>Search</Button>
          <Button onClick={() => setModalOpen(true)}>Add Filter</Button>
          <Button onClick={handleRemoveAll}>Remove All</Button>
        </Flex>
      </Flex>
      <Modal
        open={modalOpen}
        onOk={handleAddFilter}
        onCancel={() => setModalOpen(false)}
        title="Add Filter"
      >
        <div>
          {availableFilters.map(group => (
            <div key={group.name} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: '#666',
                }}
              >
                {group.label}
              </div>
              {group.filters.map(f => (
                <div
                  key={f.component}
                  style={{ marginBottom: 8, marginLeft: 16 }}
                >
                  <Checkbox
                    checked={selectedFilters.includes(f.component)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedFilters([
                          ...selectedFilters,
                          f.component,
                        ]);
                      } else {
                        setSelectedFilters(
                          selectedFilters.filter(
                            type => type !== f.component,
                          ),
                        );
                      }
                    }}
                  >
                    {f.field.label}
                  </Checkbox>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
