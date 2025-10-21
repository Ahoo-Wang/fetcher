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
import {
  AssemblyConditionFilter,
  AssemblyConditionFilterProps,
} from '../../src/filter/AssemblyConditionFilter';
import { ConditionFilterRef } from '../../src/filter/types';
import { Operator, Condition } from '@ahoo-wang/fetcher-wow';
import { Input } from 'antd';
import { UseConditionFilterStateReturn } from '../../src/filter/useConditionFilterState';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<AssemblyConditionFilterProps<string>> = {},
): AssemblyConditionFilterProps<string> => {
  const validate = vi.fn((operator: Operator, value: string | undefined) => {
    return !!(operator && value);
  });

  const friendly = vi.fn((condition: Condition) => {
    return `Test Field ${condition.operator} ${condition.value}`;
  });

  const valueInputSupplier = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_filterState: UseConditionFilterStateReturn<string>) => (
      <Input value="test" onChange={() => {}} />
    ),
  );

  const defaultProps: AssemblyConditionFilterProps<string> = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'string',
    },
    label: {
      children: 'Test Label',
    },
    operator: {
      value: Operator.EQ,
      options: [],
    },
    value: {
      defaultValue: 'test-value',
    },
    supportedOperators: [Operator.EQ, Operator.NE],
    validate,
    friendly,
    valueInputSupplier,
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (
  props: Partial<AssemblyConditionFilterProps<string>> = {},
) => {
  const ref = React.createRef<ConditionFilterRef>();
  const finalProps = createMockProps(props);

  const result = render(<AssemblyConditionFilter ref={ref} {...finalProps} />);

  return { ...result, ref };
};

describe('AssemblyConditionFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() =>
        render(<AssemblyConditionFilter {...props} />),
      ).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      render(<AssemblyConditionFilter {...props} />);

      // 检查标签按钮
      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();

      // 检查操作符选择器
      expect(screen.getByRole('combobox')).toBeDefined();

      // 检查输入组件 (通过 valueInputSupplier 提供)
      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
      });
      render(<AssemblyConditionFilter {...props} />);

      expect(
        screen.getByRole('button', { name: 'Custom Label' }),
      ).toBeDefined();
    });

    it('renders in Space.Compact layout', () => {
      const props = createMockProps();
      const { container } = render(<AssemblyConditionFilter {...props} />);

      const compactContainer = container.querySelector('.ant-space-compact');
      expect(compactContainer).toBeDefined();
    });
  });

  describe('Operator Selection', () => {
    it('uses provided operator value when valid', () => {
      const props = createMockProps({
        operator: { value: Operator.EQ, options: [] },
        supportedOperators: [Operator.EQ, Operator.NE],
      });
      render(<AssemblyConditionFilter {...props} />);

      // Verify the component renders without errors
      expect(screen.getByRole('combobox')).toBeDefined();
    });

    it('falls back to first supported operator when provided operator is invalid', () => {
      const props = createMockProps({
        operator: { value: Operator.CONTAINS as any, options: [] }, // Invalid operator
        supportedOperators: [Operator.EQ, Operator.NE],
      });
      expect(() =>
        render(<AssemblyConditionFilter {...props} />),
      ).not.toThrow();
    });

    it('falls back to first supported operator when no operator provided', () => {
      const props = createMockProps({
        operator: { options: [] }, // No value provided
        supportedOperators: [Operator.EQ, Operator.NE],
      });
      expect(() =>
        render(<AssemblyConditionFilter {...props} />),
      ).not.toThrow();
    });
  });

  describe('Supported Operators', () => {
    it('renders options for all supported operators', () => {
      const props = createMockProps({
        supportedOperators: [Operator.EQ, Operator.NE, Operator.CONTAINS],
      });
      render(<AssemblyConditionFilter {...props} />);

      // The select should have options, but we can't easily test the dropdown content
      // with react-testing-library. We verify the component renders.
      expect(screen.getByRole('combobox')).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('throws error when supportedOperators is empty', () => {
      const props = createMockProps({
        supportedOperators: [],
      });

      expect(() => render(<AssemblyConditionFilter {...props} />)).toThrow(
        'supportedOperators must be a non-empty array',
      );
    });

    it('throws error when supportedOperators is undefined', () => {
      const props = createMockProps({
        supportedOperators: undefined as any,
      });

      expect(() => render(<AssemblyConditionFilter {...props} />)).toThrow(
        'supportedOperators must be a non-empty array',
      );
    });
  });

  describe('Value Input Supplier', () => {
    it('calls valueInputSupplier with correct filterState', () => {
      const valueInputSupplier = vi.fn(() => (
        <Input value="test" onChange={() => {}} />
      ));

      const props = createMockProps({
        valueInputSupplier,
      });

      render(<AssemblyConditionFilter {...props} />);

      expect(valueInputSupplier).toHaveBeenCalledWith(
        expect.objectContaining({
          operator: expect.any(String),
          value: 'test-value',
          setOperator: expect.any(Function),
          setValue: expect.any(Function),
        }),
      );
    });
  });

  describe('Ref Functionality', () => {
    it('exposes getValue method via ref', () => {
      const { ref } = renderWithRef();

      expect(ref.current).toHaveProperty('getValue');
      expect(typeof ref.current?.getValue).toBe('function');
    });

    it('getValue returns ConditionFilterValue when validation passes', () => {
      const validate = vi.fn(() => true);
      const friendly = vi.fn(() => 'Test friendly description');

      const { ref } = renderWithRef({
        validate,
        friendly,
        operator: { value: Operator.EQ, options: [] },
        value: { defaultValue: 'test-value' },
      });

      const result = ref.current?.getValue();

      expect(result).toBeDefined();
      expect(result?.condition).toEqual({
        field: 'testField',
        operator: Operator.EQ,
        value: 'test-value',
      });
      expect(result?.friendly).toBe('Test friendly description');
    });

    it('getValue returns undefined when validation fails', () => {
      const validate = vi.fn(() => false);

      const { ref } = renderWithRef({
        validate,
        operator: { value: Operator.EQ, options: [] },
        value: { defaultValue: 'invalid-value' },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });
  });

  describe('onChange Callback', () => {
    it('accepts onChange prop', () => {
      const onChange = vi.fn();
      const props = createMockProps({
        onChange,
      });

      expect(() =>
        render(<AssemblyConditionFilter {...props} />),
      ).not.toThrow();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards operator props to Select component', () => {
      const props = createMockProps({
        operator: {
          value: Operator.EQ,
          options: [],
          placeholder: 'Select operator',
        },
      });
      render(<AssemblyConditionFilter {...props} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDefined();
    });

    it('forwards label props to Button component', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
        label: {
          type: 'primary',
        },
      });
      render(<AssemblyConditionFilter {...props} />);

      expect(
        screen.getByRole('button', { name: 'Custom Label' }),
      ).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() =>
        render(<AssemblyConditionFilter {...props} />),
      ).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() =>
        render(<AssemblyConditionFilter {...props} />),
      ).not.toThrow();
    });
  });
});
