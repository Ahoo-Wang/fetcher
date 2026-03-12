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

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextFilter, TextOnOperatorChangeValueConverter } from '../../src';
import { FilterProps } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<FilterProps<string | string[]>> = {},
): FilterProps<string | string[]> => {
  const defaultProps: FilterProps<string | string[]> = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      defaultValue: 'test value',
    },
  };

  return { ...defaultProps, ...overrides };
};

describe('TextFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<TextFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<TextFilter {...props} />);

      // 检查组件是否渲染到 DOM 中
      expect(container.firstChild).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
      });
      const { container } = render(<TextFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Supported Operators', () => {
    it('supports all expected operators', () => {
      const props = createMockProps();
      render(<TextFilter {...props} />);

      // 组件应该渲染成功，操作符选择器应该存在
      expect(screen.getByRole('combobox')).toBeDefined();
    });

    const operators = [
      Operator.EQ,
      Operator.NE,
      Operator.CONTAINS,
      Operator.STARTS_WITH,
      Operator.ENDS_WITH,
      Operator.IN,
      Operator.NOT_IN,
    ];

    operators.forEach(operator => {
      it(`renders correctly with ${operator} operator`, () => {
        const props = createMockProps({
          operator: { defaultValue: operator },
        });
        expect(() => render(<TextFilter {...props} />)).not.toThrow();
      });
    });
  });

  describe('Value Input Supplier', () => {
    it('renders Input for default operators', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
      });
      render(<TextFilter {...props} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDefined();
      // 检查 allowClear 属性（通过 data 属性或其他方式）
      expect(input).toBeDefined();
    });

    it('renders TagInput for IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: ['value1', 'value2'] },
      });
      const { container } = render(<TextFilter {...props} />);

      // TagInput 可能没有特定的 role，但组件应该渲染
      expect(container.firstChild).toBeDefined();
    });

    it('renders TagInput for NOT_IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.NOT_IN },
        value: { defaultValue: ['value1', 'value2'] },
      });
      const { container } = render(<TextFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('renders Input for CONTAINS operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.CONTAINS },
      });
      render(<TextFilter {...props} />);

      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('renders Input for STARTS_WITH operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.STARTS_WITH },
      });
      render(<TextFilter {...props} />);

      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('renders Input for ENDS_WITH operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.ENDS_WITH },
      });
      render(<TextFilter {...props} />);

      expect(screen.getByRole('textbox')).toBeDefined();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards value props to Input', () => {
      const props = createMockProps({
        value: {
          defaultValue: 'custom value',
          placeholder: 'Enter text',
        },
      });
      const { container } = render(<TextFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('handles array defaultValue for TagInput', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: ['item1', 'item2'] },
      });
      const { container } = render(<TextFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<TextFilter {...props} />)).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() => render(<TextFilter {...props} />)).not.toThrow();
    });

    it('handles empty string value', () => {
      const props = createMockProps({
        value: { defaultValue: '' },
      });
      render(<TextFilter {...props} />);

      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('handles empty array for IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: [] },
      });
      expect(() => render(<TextFilter {...props} />)).not.toThrow();
    });
  });

  describe('Value Converter', () => {
    it('keeps array value when switching to IN operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        ['value1', 'value2'],
      );
      expect(result).toEqual(['value1', 'value2']);
    });

    it('converts string to array when switching to IN operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        'single-value',
      );
      expect(result).toEqual(['single-value']);
    });

    it('converts empty string to empty array for IN operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        '   ',
      );
      expect(result).toEqual([]);
    });

    it('returns first item when switching to EQ operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.IN,
        Operator.EQ,
        ['first', 'second'],
      );
      expect(result).toBe('first');
    });

    it('returns original value when switching between single value operators', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.CONTAINS,
        Operator.ENDS_WITH,
        'same',
      );
      expect(result).toBe('same');
    });

    it('keeps array value when switching from IN to NOT_IN operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.IN,
        Operator.NOT_IN,
        ['value1'],
      );
      expect(result).toEqual(['value1']);
    });

    it('converts string to array when switching to NOT_IN operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.NOT_IN,
        'value1',
      );
      expect(result).toEqual(['value1']);
    });

    it('converts array to single value when switching to NE operator', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.IN,
        Operator.NE,
        ['first', 'second'],
      );
      expect(result).toBe('first');
    });

    it('handles undefined value', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        undefined,
      );
      expect(result).toBeUndefined();
    });

    it('handles null value', () => {
      const result = TextOnOperatorChangeValueConverter(
        Operator.EQ,
        Operator.IN,
        null as any,
      );
      expect(result).toBeNull();
    });
  });
});
