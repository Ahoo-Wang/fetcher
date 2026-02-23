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

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveViewState, DEFAULT_CONDITION } from '../../src';
import { ViewColumn } from '../../src/viewer/types';
import { ActiveFilter } from '../../src/filter';
import {
  all,
  Condition,
  FieldSort,
  SortDirection,
  Operator,
} from '@ahoo-wang/fetcher-wow';
import { SizeType } from 'antd/es/config-provider/SizeContext';

describe('useActiveViewState', () => {
  const defaultColumns: ViewColumn[] = [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
  ];

  const defaultFilters: ActiveFilter[] = [
    {
      key: '1',
      type: 'text',
      field: { name: 'status', label: 'Status', type: 'text' },
      operator: { defaultValue: Operator.EQ },
      value: { defaultValue: 'active' },
    },
  ];

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      expect(result.current.columns).toEqual(defaultColumns);
      expect(result.current.activeFilters).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.condition).toEqual(DEFAULT_CONDITION);
      expect(result.current.sorter).toEqual([]);
      expect(result.current.tableSize).toBe('middle');
    });

    it('should use custom default values when provided', () => {
      const customCondition: Condition = {
        field: 'test',
        operator: Operator.EQ,
        value: '1',
      };
      const customSorter: FieldSort[] = [
        { field: 'name', direction: SortDirection.ASC },
      ];

      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: defaultFilters,
          defaultCondition: customCondition,
          defaultPage: 2,
          defaultPageSize: 20,
          defaultSorter: customSorter,
          defaultTableSize: 'large' as SizeType,
        }),
      );

      expect(result.current.columns).toEqual(defaultColumns);
      expect(result.current.activeFilters).toEqual(defaultFilters);
      expect(result.current.page).toBe(2);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.condition).toEqual(customCondition);
      expect(result.current.sorter).toEqual(customSorter);
      expect(result.current.tableSize).toBe('large');
    });
  });

  describe('setColumns', () => {
    it('should update columns immutably', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      const newColumns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: true, hidden: false },
        { key: 'name', name: 'name', fixed: false, hidden: false },
        { key: 'email', name: 'email', fixed: false, hidden: false },
      ];

      act(() => {
        result.current.setColumns(newColumns);
      });

      expect(result.current.columns).toEqual(newColumns);
      expect(result.current.columns).not.toBe(newColumns);
    });
  });

  describe('setActiveFilters', () => {
    it('should update activeFilters immutably', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      const newFilters: ActiveFilter[] = [
        {
          key: '2',
          type: 'text',
          field: { name: 'role', label: 'Role', type: 'text' },
          operator: { defaultValue: Operator.EQ },
          value: { defaultValue: 'admin' },
        },
      ];

      act(() => {
        result.current.setActiveFilters(newFilters);
      });

      expect(result.current.activeFilters).toEqual(newFilters);
      expect(result.current.activeFilters).not.toBe(newFilters);
    });
  });

  describe('setCondition', () => {
    it('should update condition immutably', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      const newCondition: Condition = {
        field: 'name',
        operator: Operator.EQ,
        value: 'test',
      };

      act(() => {
        result.current.setCondition(newCondition);
      });

      expect(result.current.condition).toEqual(newCondition);
      expect(result.current.condition).not.toBe(newCondition);
    });
  });

  describe('setSorter', () => {
    it('should update sorter immutably', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      const newSorter: FieldSort[] = [
        { field: 'name', direction: SortDirection.DESC },
      ];

      act(() => {
        result.current.setSorter(newSorter);
      });

      expect(result.current.sorter).toEqual(newSorter);
      expect(result.current.sorter).not.toBe(newSorter);
    });
  });

  describe('pagination', () => {
    it('should update page', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(3);
    });

    it('should update pageSize', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      act(() => {
        result.current.setPageSize(50);
      });

      expect(result.current.pageSize).toBe(50);
    });
  });

  describe('tableSize', () => {
    it('should update tableSize', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: [],
        }),
      );

      act(() => {
        result.current.setTableSize('small');
      });

      expect(result.current.tableSize).toBe('small');
    });
  });

  describe('reset', () => {
    it('should reset all state to default values', () => {
      const { result } = renderHook(() =>
        useActiveViewState({
          defaultColumns,
          defaultActiveFilters: defaultFilters,
          defaultCondition: all(),
          defaultPage: 1,
          defaultPageSize: 10,
          defaultSorter: [],
          defaultTableSize: 'middle',
        }),
      );

      act(() => {
        result.current.setPage(5);
        result.current.setPageSize(100);
        result.current.setCondition({
          field: 'test',
          operator: Operator.EQ,
          value: '1',
        });
        result.current.setTableSize('small');
      });

      expect(result.current.page).toBe(5);
      expect(result.current.pageSize).toBe(100);
      expect(result.current.tableSize).toBe('small');

      act(() => {
        result.current.reset();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.condition).toEqual(all());
      expect(result.current.tableSize).toBe('middle');
      expect(result.current.columns).toEqual(defaultColumns);
      expect(result.current.activeFilters).toEqual(defaultFilters);
    });
  });
});
