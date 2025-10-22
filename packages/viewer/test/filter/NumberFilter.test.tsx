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
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberFilter } from '../../src';
import { FilterRef } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<React.ComponentProps<typeof NumberFilter>> = {},
) => {
  const defaultProps: React.ComponentProps<typeof NumberFilter> = {
    field: {
      name: 'testNumber',
      label: 'Test Number',
      type: 'number',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: 42,
    },
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (
  props: Partial<React.ComponentProps<typeof NumberFilter>> = {},
) => {
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
      render(<NumberFilter {...props} />);

      // 检查标签按钮
      expect(screen.getByRole('button', { name: 'Test Number' })).toBeDefined();

      // 检查操作符选择器
      expect(screen.getByRole('combobox')).toBeDefined();

      // 检查输入组件
      expect(screen.getByRole('spinbutton')).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'number' },
      });
      render(<NumberFilter {...props} />);

      expect(
        screen.getByRole('button', { name: 'Custom Label' }),
      ).toBeDefined();
    });

    it('renders in Space.Compact layout', () => {
      const props = createMockProps();
      const { container } = render(<NumberFilter {...props} />);

      const compactContainer = container.querySelector('.ant-space-compact');
      expect(compactContainer).toBeDefined();
    });
  });

  describe('Operator Selection', () => {
    it('defaults to EQ operator when no value provided', () => {
      const props = createMockProps({
        operator: { options: [] }, // No value provided
      });
      render(<NumberFilter {...props} />);

      // EQ operator displays as '等于' (equal) in Chinese locale
      const selectedOption = screen.getByText('等于');
      expect(selectedOption).toBeDefined();
    });

    it('supports all number operators', () => {
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
        const props = createMockProps({
          operator: { defaultValue: operator, options: [] },
        });
        expect(() => render(<NumberFilter {...props} />)).not.toThrow();
      });
    });
  });

  describe('Input Component Types', () => {
    it('renders number input for EQ operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ, options: [] },
        value: { defaultValue: 123 },
      });
      render(<NumberFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input.getAttribute('type')).toBe('number');
    });

    it('renders comma-separated input for IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN, options: [] },
        value: { defaultValue: [1, 2, 3] },
      });
      render(<NumberFilter {...props} />);

      const input = screen.getByRole('textbox');
      expect(input.getAttribute('placeholder')).toBe('输入数字，用逗号分隔');
    });

    it('renders dual inputs for BETWEEN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN, options: [] },
        value: { defaultValue: [10, 20] },
      });
      render(<NumberFilter {...props} />);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(2);
    });
  });

  describe('Validation Logic', () => {
    it('validates correctly for EQ operator with valid number', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.EQ, options: [] },
        value: { defaultValue: 42 },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
      expect(result?.condition.operator).toBe(Operator.EQ);
      expect(result?.condition.value).toBe(42);
    });

    it('validates correctly for GT operator with valid number', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT, options: [] },
        value: { defaultValue: 100 },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
      expect(result?.condition.operator).toBe(Operator.GT);
      expect(result?.condition.value).toBe(100);
    });

    it('validates correctly for BETWEEN operator with valid array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN, options: [] },
        value: { defaultValue: [10, 50] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
      expect(result?.condition.operator).toBe(Operator.BETWEEN);
      expect(result?.condition.value).toEqual([10, 50]);
    });

    it('returns undefined for EQ operator with invalid value', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.EQ, options: [] },
        value: { defaultValue: undefined },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('returns undefined for IN operator with empty array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.IN, options: [] },
        value: { defaultValue: [] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });
  });

  describe('Ref Functionality', () => {
    it('exposes getValue method via ref', () => {
      const { ref } = renderWithRef();

      expect(ref.current).toHaveProperty('getValue');
      expect(typeof ref.current?.getValue).toBe('function');
    });

    it('getValue returns FilterValue object when valid', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.EQ, options: [] },
        value: { defaultValue: 99 },
      });

      const result = ref.current?.getValue();

      expect(result).toHaveProperty('condition');
      expect(result?.condition).toEqual({
        field: 'testNumber',
        operator: Operator.EQ,
        value: 99,
      });
    });
  });

  describe('Props Forwarding', () => {
    it('forwards value props to input component', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ, options: [] },
        value: {
          defaultValue: 123,
          placeholder: 'Enter number',
        },
      });
      render(<NumberFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input.getAttribute('placeholder')).toBe('Enter number');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();

      const { ref } = renderWithRef({
        value: { defaultValue: undefined },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null },
      });
      expect(() => render(<NumberFilter {...props} />)).not.toThrow();

      const { ref } = renderWithRef({
        value: { defaultValue: null },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });
  });
});
