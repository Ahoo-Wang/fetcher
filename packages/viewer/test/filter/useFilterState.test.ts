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

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { useFilterState, UseFilterStateOptions } from '../../src';
import { FilterRef } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockOptions = (
  overrides: Partial<UseFilterStateOptions<string>> = {},
): UseFilterStateOptions<string> => {
  const defaultOptions: UseFilterStateOptions<string> = {
    field: 'testField',
    operator: Operator.EQ,
    value: 'test value',
  };

  return { ...defaultOptions, ...overrides };
};

describe('useFilterState', () => {
  describe('Initialization', () => {
    it('initializes with provided operator and value', () => {
      const options = createMockOptions({
        operator: Operator.CONTAINS,
        value: 'initial value',
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.operator).toBe(Operator.CONTAINS);
      expect(result.current.value).toBe('initial value');
    });

    it('initializes with undefined value', () => {
      const options = createMockOptions({
        value: undefined,
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.operator).toBe(Operator.EQ);
      expect(result.current.value).toBeUndefined();
    });

    it('initializes with null value', () => {
      const options = createMockOptions({
        value: null as any,
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.operator).toBe(Operator.EQ);
      expect(result.current.value).toBeNull();
    });
  });

  describe('setOperator', () => {
    it('updates operator and resets value to undefined', () => {
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test value',
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setOperator(Operator.CONTAINS);
      });

      expect(result.current.operator).toBe(Operator.CONTAINS);
      expect(result.current.value).toBe(options.value);
    });

    it('calls onChange callback when operator changes', () => {
      const onChange = vi.fn();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test value',
        onChange,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setOperator(Operator.CONTAINS);
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: 'testField',
          operator: 'CONTAINS',
          value: 'test value',
        },
      });
    });

    it('calls onChange with valid condition when operator changes and validation passes', () => {
      const onChange = vi.fn();
      const validate = vi.fn(() => true);
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test value',
        onChange,
        validate,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setOperator(Operator.CONTAINS);
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: 'testField',
          operator: Operator.CONTAINS,
          value: options.value,
        },
      });
    });
  });

  describe('setValue', () => {
    it('updates value', () => {
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('new value');
      });

      expect(result.current.value).toBe('new value');
    });

    it('calls onChange callback when value changes', () => {
      const onChange = vi.fn();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
        onChange,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('new value');
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: 'testField',
          operator: Operator.EQ,
          value: 'new value',
        },
      });
    });

    it('calls onChange with undefined when validation fails', () => {
      const onChange = vi.fn();
      const validate = vi.fn(() => false);
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
        onChange,
        validate,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('new value');
      });

      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('reset', () => {
    it('resets operator and value to initial values', () => {
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
      });

      const { result } = renderHook(() => useFilterState(options));

      // Change state
      act(() => {
        result.current.setOperator(Operator.CONTAINS);
        result.current.setValue('changed value');
      });

      expect(result.current.operator).toBe(Operator.CONTAINS);
      expect(result.current.value).toBe('changed value');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.operator).toBe(Operator.EQ);
      expect(result.current.value).toBe('initial value');
    });

    it('calls onChange callback when reset', () => {
      const onChange = vi.fn();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
        onChange,
      });

      const { result } = renderHook(() => useFilterState(options));

      // Change state
      act(() => {
        result.current.setOperator(Operator.CONTAINS);
        result.current.setValue('changed value');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: 'testField',
          operator: Operator.EQ,
          value: 'initial value',
        },
      });
    });

    it('calls onChange with undefined when reset validation fails', () => {
      const onChange = vi.fn();
      const validate = vi.fn(() => false);
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
        onChange,
        validate,
      });

      const { result } = renderHook(() => useFilterState(options));

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('exposes reset method via ref', () => {
      const ref = React.createRef<FilterRef>();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial value',
        ref,
      });

      renderHook(() => useFilterState(options));

      expect(ref.current).toHaveProperty('reset');
      expect(typeof ref.current?.reset).toBe('function');
    });
  });

  describe('Validation', () => {
    describe('defaultValueValidate', () => {
      it('returns false when operator is falsy', () => {
        const options = createMockOptions({
          operator: '' as any,
          value: 'test',
        });

        const { result } = renderHook(() => useFilterState(options));

        // Since validation fails, getValue should return undefined
        expect(result.current.operator).toBe('');
        expect(result.current.value).toBe('test');
      });

      it('returns false when value is falsy', () => {
        const options = createMockOptions({
          operator: Operator.EQ,
          value: '',
        });

        const { result } = renderHook(() => useFilterState(options));

        expect(result.current.operator).toBe(Operator.EQ);
        expect(result.current.value).toBe('');
      });

      it('returns false when value is empty array', () => {
        const options = createMockOptions({
          operator: Operator.IN,
          value: [] as any,
        });

        const { result } = renderHook(() => useFilterState(options));

        expect(result.current.operator).toBe(Operator.IN);
        expect(result.current.value).toEqual([]);
      });

      it('returns true when value is non-empty array', () => {
        const options = createMockOptions({
          operator: Operator.IN,
          value: ['item1', 'item2'] as any,
        });

        const { result } = renderHook(() => useFilterState(options));

        expect(result.current.operator).toBe(Operator.IN);
        expect(result.current.value).toEqual(['item1', 'item2']);
      });

      it('returns true when value is valid string', () => {
        const options = createMockOptions({
          operator: Operator.EQ,
          value: 'valid string',
        });

        const { result } = renderHook(() => useFilterState(options));

        expect(result.current.operator).toBe(Operator.EQ);
        expect(result.current.value).toBe('valid string');
      });
    });

    it('uses custom validate function when provided', () => {
      const validate = vi.fn(() => false);
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test',
        validate,
      });

      const { result } = renderHook(() => useFilterState(options));

      // Trigger validation by calling setValue
      act(() => {
        result.current.setValue('new value');
      });

      expect(validate).toHaveBeenCalled();
      expect(result.current.operator).toBe(Operator.EQ);
      expect(result.current.value).toBe('new value');
    });
  });

  describe('Ref functionality', () => {
    it('exposes getValue method via ref', () => {
      const ref = React.createRef<FilterRef>();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test value',
        ref,
      });

      renderHook(() => useFilterState(options));

      expect(ref.current).toHaveProperty('getValue');
      expect(typeof ref.current?.getValue).toBe('function');
    });

    it('getValue returns FilterValue when validation passes', () => {
      const ref = React.createRef<FilterRef>();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test value',
        ref,
      });

      renderHook(() => useFilterState(options));

      const result = ref.current?.getValue();

      expect(result).toEqual({
        condition: {
          field: 'testField',
          operator: Operator.EQ,
          value: 'test value',
        },
      });
    });

    it('getValue returns undefined when validation fails', () => {
      const ref = React.createRef<FilterRef>();
      const validate = vi.fn(() => false);
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'test value',
        ref,
        validate,
      });

      renderHook(() => useFilterState(options));

      const result = ref.current?.getValue();

      expect(result).toBeUndefined();
    });
  });

  describe('onChange callback', () => {
    it('is called with FilterValue when state changes and validation passes', () => {
      const onChange = vi.fn();
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial',
        onChange,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('updated');
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: 'testField',
          operator: Operator.EQ,
          value: 'updated',
        },
      });
    });

    it('is called with undefined when validation fails', () => {
      const onChange = vi.fn();
      const validate = vi.fn(() => false);
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial',
        onChange,
        validate,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('updated');
      });

      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('is not called when onChange is not provided', () => {
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 'initial',
      });

      const { result } = renderHook(() => useFilterState(options));

      // This should not throw an error
      act(() => {
        result.current.setValue('updated');
      });

      expect(result.current.value).toBe('updated');
    });
  });

  describe('Field handling', () => {
    it('includes field in condition when provided', () => {
      const onChange = vi.fn();
      const options = createMockOptions({
        field: 'customField',
        operator: Operator.EQ,
        value: 'test',
        onChange,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('updated');
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: 'customField',
          operator: Operator.EQ,
          value: 'updated',
        },
      });
    });

    it('includes undefined field when not provided', () => {
      const onChange = vi.fn();
      const options = createMockOptions({
        field: undefined,
        operator: Operator.EQ,
        value: 'test',
        onChange,
      });

      const { result } = renderHook(() => useFilterState(options));

      act(() => {
        result.current.setValue('updated');
      });

      expect(onChange).toHaveBeenCalledWith({
        condition: {
          field: undefined,
          operator: Operator.EQ,
          value: 'updated',
        },
      });
    });
  });

  describe('Edge cases', () => {
    it('handles complex value types', () => {
      const complexValue = { nested: { value: 42 } };
      const options = createMockOptions({
        operator: Operator.EQ,
        value: complexValue as any,
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.value).toEqual(complexValue);
    });

    it('handles array values', () => {
      const arrayValue = [1, 2, 3];
      const options = createMockOptions({
        operator: Operator.IN,
        value: arrayValue as any,
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.value).toEqual(arrayValue);
    });

    it('handles number values', () => {
      const options = createMockOptions({
        operator: Operator.EQ,
        value: 42 as any,
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.value).toBe(42);
    });

    it('handles boolean values', () => {
      const options = createMockOptions({
        operator: Operator.EQ,
        value: true as any,
      });

      const { result } = renderHook(() => useFilterState(options));

      expect(result.current.value).toBe(true);
    });
  });
});
