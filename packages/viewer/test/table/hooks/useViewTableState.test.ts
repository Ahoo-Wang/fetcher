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
import { useViewTableState } from '../../../src';

describe('useViewTableState', () => {
  describe('initialization', () => {
    it('should initialize with empty selectedRowKeys', () => {
      const { result } = renderHook(() => useViewTableState());

      expect(result.current.selectedRowKeys).toEqual([]);
    });

    it('should have setSelectedRowKeys function', () => {
      const { result } = renderHook(() => useViewTableState());

      expect(result.current.setSelectedRowKeys).toBeDefined();
      expect(typeof result.current.setSelectedRowKeys).toBe('function');
    });

    it('should have clearSelectedRowKeys function', () => {
      const { result } = renderHook(() => useViewTableState());

      expect(result.current.clearSelectedRowKeys).toBeDefined();
      expect(typeof result.current.clearSelectedRowKeys).toBe('function');
    });

    it('should have reset function', () => {
      const { result } = renderHook(() => useViewTableState());

      expect(result.current.reset).toBeDefined();
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('setSelectedRowKeys', () => {
    it('should update selectedRowKeys', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.setSelectedRowKeys(['1', '2', '3']);
      });

      expect(result.current.selectedRowKeys).toEqual(['1', '2', '3']);
    });

    it('should replace existing selectedRowKeys', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.setSelectedRowKeys(['1', '2']);
      });

      act(() => {
        result.current.setSelectedRowKeys(['3']);
      });

      expect(result.current.selectedRowKeys).toEqual(['3']);
    });

    it('should handle empty array', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.setSelectedRowKeys(['1', '2']);
      });

      act(() => {
        result.current.setSelectedRowKeys([]);
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });
  });

  describe('clearSelectedRowKeys', () => {
    it('should clear selectedRowKeys to empty array', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.setSelectedRowKeys(['1', '2', '3']);
      });

      act(() => {
        result.current.clearSelectedRowKeys();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });

    it('should do nothing when already empty', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.clearSelectedRowKeys();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset selectedRowKeys to empty array', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.setSelectedRowKeys(['1', '2', '3']);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });

    it('should do nothing when already at default state', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });
  });

  describe('integration', () => {
    it('should handle multiple state changes in sequence', () => {
      const { result } = renderHook(() => useViewTableState());

      act(() => {
        result.current.setSelectedRowKeys(['1']);
      });

      expect(result.current.selectedRowKeys).toEqual(['1']);

      act(() => {
        result.current.setSelectedRowKeys(['2', '3']);
      });

      expect(result.current.selectedRowKeys).toEqual(['2', '3']);

      act(() => {
        result.current.clearSelectedRowKeys();
      });

      expect(result.current.selectedRowKeys).toEqual([]);

      act(() => {
        result.current.setSelectedRowKeys(['4', '5', '6']);
      });

      expect(result.current.selectedRowKeys).toEqual(['4', '5', '6']);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedRowKeys).toEqual([]);
    });
  });
});
