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

import React, { useState, Key, useEffect } from 'react';
import { Button } from 'antd';
import { AvailableFilterGroup, AvailableFilter } from './AvailableFilterSelect';
import { AvailableFilterSelectModal } from './AvailableFilterSelectModal';
import { useRequestId } from '@ahoo-wang/fetcher-react';
import { ActiveFilter, FilterPanelProps, FilterPanel } from './FilterPanel';

export interface EditableFilterPanelProps extends Omit<
  FilterPanelProps,
  'actions'
> {
  availableFilters: AvailableFilterGroup[];
  onChange?: (filters: ActiveFilter[]) => void;
}

export function EditableFilterPanel(props: EditableFilterPanelProps) {
  const {
    ref,
    row,
    col,
    availableFilters,
    filters,
    resetButton,
    onSearch,
    onChange,
  } = props;
  const [activeFilters, setActiveFilters] = useState(filters);
  const [modalOpen, setModalOpen] = useState(false);
  const generator = useRequestId();

  useEffect(() => {
    console.log('EditableFilterPanel - when activeFilters updated', filters);
    setActiveFilters(filters);
  }, [filters]);

  const handleAddFilter = (selectedAvailableFilters: AvailableFilter[]) => {
    if (selectedAvailableFilters.length === 0) {
      setModalOpen(false);
      return;
    }
    const newFilters = selectedAvailableFilters.map(
      available =>
        ({
          key: generator.generate(),
          type: available.component,
          field: available.field,
          value: available.value,
          operator: available.operator,
        }) as ActiveFilter,
    );
    const newActiveFilters = [...activeFilters, ...newFilters];
    setActiveFilters(newActiveFilters);
    if (onChange) {
      onChange(newActiveFilters);
    }
    setModalOpen(false);
  };

  const removeFilter = (key: Key) => {
    const newFilters = activeFilters.filter(f => f.key !== key);
    setActiveFilters(newFilters);
    if (onChange) {
      onChange(newFilters);
    }
  };

  const editableFilters = activeFilters.map(filter => ({
    ...filter,
    onRemove: () => removeFilter(filter.key),
  }));

  return (
    <>
      <FilterPanel
        ref={ref}
        filters={editableFilters}
        onSearch={onSearch}
        actions={<Button onClick={() => setModalOpen(true)}>Add Filter</Button>}
        resetButton={resetButton}
        row={row}
        col={col}
      />
      <AvailableFilterSelectModal
        title={'Add Filter'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSave={handleAddFilter}
        availableFilters={{
          filters: availableFilters,
          activeFilters: activeFilters,
        }}
      />
    </>
  );
}
