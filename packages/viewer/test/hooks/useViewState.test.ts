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

import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewState } from '../../src';
import { ViewColumn } from '../../src';
import { Operator, SortDirection } from '@ahoo-wang/fetcher-wow';
import { SizeType } from 'antd/es/config-provider/SizeContext';

describe('useViewState', () => {
  const defaultColumns: ViewColumn[] = [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
  ];

  describe('uncontrolled mode', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
        }),
      );

      expect(result.current.columns).toEqual(defaultColumns);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.tableSize).toBe('middle');
      expect(result.current.selectedCount).toBe(0);
    });

    it('should trigger onChange when page changes', () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
          onChange,
        }),
      );

      act(() => {
        result.current.setPage(3);
      });

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[1]).toBe(3);
    });

    it('should trigger onChange when pageSize changes', () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
          onChange,
        }),
      );

      act(() => {
        result.current.setPageSize(50);
      });

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[2]).toBe(50);
    });

    it('should trigger onChange when condition changes', () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
          onChange,
        }),
      );

      const newCondition = {
        field: 'name',
        operator: Operator.EQ,
        value: 'test',
      };

      act(() => {
        result.current.setCondition(newCondition);
      });

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[0];
      expect(lastCall[0]).toMatchObject(newCondition);
      expect(lastCall[1]).toBe(1);
      expect(lastCall[2]).toBe(10);
    });

    it('should trigger onChange when sorter changes', () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
          onChange,
        }),
      );

      const newSorter = [{ field: 'name', direction: SortDirection.ASC }];

      act(() => {
        result.current.setSorter(newSorter);
      });

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[0];
      expect(lastCall[3]).toEqual(newSorter);
    });

    it('should not trigger onChange when tableSize changes', () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
          onChange,
        }),
      );

      act(() => {
        result.current.setTableSize('small');
      });

      expect(onChange).not.toHaveBeenCalled();
      expect(result.current.tableSize).toBe('small');
    });

    it('should reset all state and trigger onChange', () => {
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
          onChange,
        }),
      );

      act(() => {
        result.current.setPage(5);
        result.current.setPageSize(100);
      });

      act(() => {
        result.current.reset();
      });

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[1]).toBe(1);
      expect(lastCall[2]).toBe(10);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
    });

    it('should update selectedCount', () => {
      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
        }),
      );

      act(() => {
        result.current.updateSelectedCount(5);
      });

      expect(result.current.selectedCount).toBe(5);
    });
  });

  describe('controlled mode', () => {
    it('should use external columns when provided', () => {
      const externalColumns: ViewColumn[] = [
        { key: 'external', name: 'external', fixed: false, hidden: true },
      ];

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          externalColumns,
          externalUpdateColumns: vi.fn(),
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
        }),
      );

      expect(result.current.columns).toEqual(externalColumns);
    });

    it('should use external page when provided', () => {
      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          externalPage: 5,
          externalUpdatePage: vi.fn(),
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
        }),
      );

      expect(result.current.page).toBe(5);
    });

    it('should call externalUpdatePage when setPage is called', () => {
      const externalUpdatePage = vi.fn();

      const { result } = renderHook(() =>
        useViewState({
          defaultColumns,
          externalPage: 5,
          externalUpdatePage,
          defaultPageSize: 10,
          defaultTableSize: 'middle' as SizeType,
        }),
      );

      act(() => {
        result.current.setPage(10);
      });

      expect(externalUpdatePage).toHaveBeenCalledWith(10);
    });
  });
});
