import React, { useCallback, useRef } from 'react';
import {
  FilterPanel,
  useFilterState,
} from '@ahoo-wang/fetcher-viewer';
import type { ActiveFilter, FilterPanelRef } from '@ahoo-wang/fetcher-viewer';
import { Operator } from '@ahoo-wang/fetcher-wow';

function UserFilterPanel() {
  const filterPanelRef = useRef<FilterPanelRef>(null);

  const usernameFilterState = useFilterState({
    field: 'username',
    operator: Operator.CONTAINS,
    value: '',
    onChange: (filterValue) => {
      console.log('username filter changed:', filterValue);
    },
  });

  const ageFilterState = useFilterState({
    field: 'age',
    operator: Operator.GT,
    value: undefined,
    onChange: (filterValue) => {
      console.log('age filter changed:', filterValue);
    },
  });

  const statusFilterState = useFilterState({
    field: 'status',
    operator: Operator.IN,
    value: [],
    onChange: (filterValue) => {
      console.log('status filter changed:', filterValue);
    },
  });

  const filters: ActiveFilter[] = [
    {
      key: 'username',
      type: 'text',
      field: { name: 'username', label: 'Username' },
      operator: usernameFilterState.operator,
      value: usernameFilterState.value,
      onChange: (value) => {
        if (value) {
          usernameFilterState.setOperator(value.operator);
          usernameFilterState.setValue(value.value);
        }
      },
      onRemove: () => {
        usernameFilterState.reset();
      },
    },
    {
      key: 'age',
      type: 'number',
      field: { name: 'age', label: 'Age' },
      operator: ageFilterState.operator,
      value: ageFilterState.value,
      onChange: (value) => {
        if (value) {
          ageFilterState.setOperator(value.operator);
          ageFilterState.setValue(value.value);
        }
      },
      onRemove: () => {
        ageFilterState.reset();
      },
    },
    {
      key: 'status',
      type: 'select',
      field: { name: 'status', label: 'Status' },
      operator: statusFilterState.operator,
      value: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
      onChange: (value) => {
        if (value) {
          statusFilterState.setOperator(value.operator);
          statusFilterState.setValue(value.value);
        }
      },
      onRemove: () => {
        statusFilterState.reset();
      },
    },
  ];

  const handleSearch = useCallback(
    (condition: any, activeFilterValues: Map<string, any>) => {
      console.log('Search triggered with condition:', condition);
      console.log('Active filter values:', activeFilterValues);
    },
    []
  );

  return (
    <FilterPanel
      ref={filterPanelRef}
      filters={filters}
      onSearch={handleSearch}
      searchButton={{ children: 'Search' }}
      resetButton={{ children: 'Reset' }}
    />
  );
}

export default UserFilterPanel;