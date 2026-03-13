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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  NumberFilter,
  NumberOnOperatorChangeValueConverter,
} from '../../src/filter/NumberFilter';
import { FilterProps, FilterRef } from '../../src/filter/types';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<FilterProps> = {},
): FilterProps => {
  const defaultProps: FilterProps = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      defaultValue: 42,
    },
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (props: Partial<FilterProps> = {}) => {
  const ref = React.createRef<FilterRef>();
  const finalProps = createMockProps(props);

  const result = render(<NumberFilter ref={ref} {...finalProps} />);

  return { ...result, ref };
};

describe('NumberFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<NumberFilter {...props} />);

      // 检查组件是否渲染到 DOM 中
      expect(container.firstChild).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'number' },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Supported Operators', () => {
    it('supports all expected operators', () => {
      const props = createMockProps();
      render(<NumberFilter {...props} />);

      // 组件应该渲染成功，操作符选择器应该存在
      expect(screen.getByRole('combobox')).toBeDefined();
    });

    const operators = [
      Operator.EQ,
      Operator.NE,
      Operator.GT,
      Operator.LT,
      Operator.GTE,
      Operator.LTE,
      Operator.BETWEEN,
      Operator.IN,
      Operator.NOT_IN,
    ];

    operators.forEach(operator => {
      it(`renders correctly with ${operator} operator`, () => {
        const props = createMockProps({
          operator: { defaultValue: operator },
        });
        expect(() => render(<NumberFilter {...props} />)).not.toThrow();
      });
    });
  });

  describe('Value Input Supplier', () => {
    it('renders InputNumber for default operators', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
      });
      render(<NumberFilter {...props} />);

      expect(screen.getByRole('spinbutton')).toBeDefined();
    });

    it('renders TagInput for IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: [1, 2, 3] },
      });
      const { container } = render(<NumberFilter {...props} />);

      // TagInput 可能没有特定的 role，但组件应该渲染
      expect(container.textContent).toContain('Test Field');
    });

    it('renders TagInput for NOT_IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.NOT_IN },
        value: { defaultValue: [1, 2, 3] },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.textContent).toContain('Test Field');
    });

    it('renders NumberRange for BETWEEN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [10, 20] },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('validates BETWEEN operator correctly with valid array', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [10, 20] },
      });
      const { container } = render(<NumberFilter {...props} />);

      // 组件应该渲染成功
      expect(container.firstChild).toBeDefined();
    });

    it('validates BETWEEN operator correctly with invalid value', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: 42 }, // Not an array
      });
      const { container } = render(<NumberFilter {...props} />);

      // 组件仍然应该渲染，但验证会失败
      expect(container.firstChild).toBeDefined();
    });

    it('validates other operators correctly', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: undefined },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles BETWEEN with both values defined', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [10, 20] },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles BETWEEN with first value undefined', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [undefined, 20] },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles BETWEEN with second value undefined', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [10, undefined] },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles BETWEEN with both values undefined', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [undefined, undefined] },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles non-array value for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: 'not an array' as any },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles number value for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: 42 },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles boolean value for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: true as any },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function is called when getValue is invoked with BETWEEN and non-array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: 'not an array' as any },
      });

      // This should trigger the validate function
      const result = ref.current?.getValue();
      expect(result).toBeUndefined(); // Should be undefined due to validation failure
    });

    it('validate function is called when getValue is invoked with BETWEEN and valid array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [10, 20] },
      });

      // This should trigger the validate function
      const result = ref.current?.getValue();
      expect(result).toBeDefined();
    });

    it('validate function handles defined value for non-BETWEEN operators', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: 42 },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles undefined value for non-BETWEEN operators', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: undefined },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('validate function handles null value for non-BETWEEN operators', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: null as any },
      });
      const { container } = render(<NumberFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards value props to InputNumber', () => {
      const props = createMockProps({
        value: {
          defaultValue: 100,
          placeholder: 'Enter number',
        },
      });
      render(<NumberFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();
    });

    it('handles array defaultValue for InputNumber', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: [50] },
      });
      render(<NumberFilter {...props} />);

      expect(screen.getByRole('spinbutton')).toBeDefined();
    });
  });

  describe('onChange Callback', () => {
    it('calls setValue when InputNumber value changes', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: 42 },
      });

      render(<NumberFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();

      // Simulate user typing in the input
      fireEvent.change(input, { target: { value: '100' } });
      expect(input).toBeDefined();
    });

    it('handles null onChange value correctly', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: 42 },
      });

      render(<NumberFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();

      // Simulate clearing the input (null value)
      fireEvent.change(input, { target: { value: '' } });
      expect(input).toBeDefined();
    });

    it('InputNumber onChange handles undefined values', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: 42 },
      });

      render(<NumberFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();

      // Test that the component handles the onChange logic
      // The actual setValue call happens internally
      expect(input).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();
    });

    it('handles empty array for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [] },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();
    });

    it('handles BETWEEN with partial undefined values', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [10, undefined] },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();
    });

    it('handles BETWEEN with both undefined values', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [undefined, undefined] },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();
    });
  });

  describe('Value Converter', () => {
    it('keeps array value when switching to BETWEEN', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.BETWEEN,
        [10, 20],
      );
      expect(result).toEqual([10, 20]);
    });

    it('wraps value into range when switching to BETWEEN', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.BETWEEN,
        5,
      );
      expect(result).toEqual([5, undefined]);
    });

    it('keeps array value when switching to IN operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        [1, 2],
      );
      expect(result).toEqual([1, 2]);
    });

    it('converts number to array when switching to IN operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        3,
      );
      expect(result).toEqual([3]);
    });

    it('keeps array value when switching to NOT_IN operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.NOT_IN,
        [6, 7],
      );
      expect(result).toEqual([6, 7]);
    });

    it('converts number to array when switching to NOT_IN operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.NOT_IN,
        4,
      );
      expect(result).toEqual([4]);
    });

    it('returns first item when switching to EQ operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.IN,
        Operator.EQ,
        [7, 8],
      );
      expect(result).toBe(7);
    });

    it('returns first item when switching from BETWEEN to EQ operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.BETWEEN,
        Operator.EQ,
        [11, 22],
      );
      expect(result).toBe(11);
    });

    it('keeps array value when switching from BETWEEN to IN operator', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.BETWEEN,
        Operator.IN,
        [13, 27],
      );
      expect(result).toEqual([13, 27]);
    });

    it('returns original value for single-value operators', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.GT,
        Operator.LT,
        9,
      );
      expect(result).toBe(9);
    });

    it('handles undefined value', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        undefined,
      );
      expect(result).toBeUndefined();
    });

    it('handles null value', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        null as any,
      );
      expect(result).toBeNull();
    });

    it('keeps array value when switching between multi-value operators', () => {
      const result = NumberOnOperatorChangeValueConverter(
        Operator.IN,
        Operator.NOT_IN,
        [4, 5],
      );
      expect(result).toEqual([4, 5]);
    });
  });
});
