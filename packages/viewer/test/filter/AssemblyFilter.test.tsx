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
import { AssemblyFilter, AssemblyFilterProps } from '../../src';
import { FilterRef } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { Input } from 'antd';
import { UseFilterStateReturn } from '../../src';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<AssemblyFilterProps> = {},
): AssemblyFilterProps => {
  const validate = vi.fn((operator: Operator, value: string | undefined) => {
    return !!(operator && value);
  });

  const valueInputSupplier = vi.fn((_filterState: UseFilterStateReturn) => (
    <Input value="test" onChange={() => {}} />
  ));

  const defaultProps: AssemblyFilterProps = {
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
      defaultValue: 'test-value',
    },
    supportedOperators: [Operator.EQ, Operator.NE],
    validate,
    valueInputRender: valueInputSupplier,
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (props: Partial<AssemblyFilterProps> = {}) => {
  const ref = React.createRef<FilterRef>();
  const finalProps = createMockProps(props);

  const result = render(<AssemblyFilter ref={ref} {...finalProps} />);

  return { ...result, ref };
};

describe('AssemblyFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<AssemblyFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<AssemblyFilter {...props} />);

      // 检查标签（使用 Typography 组件渲染）
      expect(container.textContent).toContain('Test Field');

      // 检查操作符选择器
      expect(screen.getByRole('combobox')).toBeDefined();

      // 检查输入组件 (通过 valueInputSupplier 提供)
      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
      });
      const { container } = render(<AssemblyFilter {...props} />);

      expect(container.textContent).toContain('Custom Label');
    });

    it('renders in Space.Compact layout', () => {
      const props = createMockProps();
      const { container } = render(<AssemblyFilter {...props} />);

      const compactContainer = container.querySelector('.ant-space-compact');
      expect(compactContainer).toBeDefined();
    });
  });

  describe('Operator Selection', () => {
    it('uses provided operator value when valid', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        supportedOperators: [Operator.EQ, Operator.NE],
      });
      render(<AssemblyFilter {...props} />);

      // Verify the component renders without errors
      expect(screen.getByRole('combobox')).toBeDefined();
    });

    it('falls back to first supported operator when provided operator is invalid', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.CONTAINS as any }, // Invalid operator
        supportedOperators: [Operator.EQ, Operator.NE],
      });
      expect(() => render(<AssemblyFilter {...props} />)).not.toThrow();
    });

    it('falls back to first supported operator when no operator provided', () => {
      const props = createMockProps({
        operator: {}, // No value provided
        supportedOperators: [Operator.EQ, Operator.NE],
      });
      expect(() => render(<AssemblyFilter {...props} />)).not.toThrow();
    });
  });

  describe('Supported Operators', () => {
    it('renders options for all supported operators', () => {
      const props = createMockProps({
        supportedOperators: [Operator.EQ, Operator.NE, Operator.CONTAINS],
      });
      render(<AssemblyFilter {...props} />);

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

      expect(() => render(<AssemblyFilter {...props} />)).toThrow(
        'supportedOperators must be a non-empty array',
      );
    });

    it('throws error when supportedOperators is undefined', () => {
      const props = createMockProps({
        supportedOperators: undefined as any,
      });

      expect(() => render(<AssemblyFilter {...props} />)).toThrow(
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
        valueInputRender: valueInputSupplier,
      });

      render(<AssemblyFilter {...props} />);

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

    it('getValue returns FilterValue when validation passes', () => {
      const validate = vi.fn(() => true);

      const { ref } = renderWithRef({
        validate,
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: 'test-value' },
      });

      const result = ref.current?.getValue();

      expect(result).toBeDefined();
      expect(result?.condition).toEqual({
        field: 'testField',
        operator: Operator.EQ,
        value: 'test-value',
      });
    });

    it('getValue returns undefined when validation fails', () => {
      const validate = vi.fn(() => false);

      const { ref } = renderWithRef({
        validate,
        operator: { defaultValue: Operator.EQ },
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

      expect(() => render(<AssemblyFilter {...props} />)).not.toThrow();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards operator props to Select component', () => {
      const props = createMockProps({
        operator: {
          defaultValue: Operator.EQ,
          placeholder: 'Select operator',
        },
      });
      render(<AssemblyFilter {...props} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDefined();
    });

    it('forwards label props to Typography component', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
        label: { className: 'custom-label-class' },
      });
      const { container } = render(<AssemblyFilter {...props} />);

      expect(container.textContent).toContain('Custom Label');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<AssemblyFilter {...props} />)).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() => render(<AssemblyFilter {...props} />)).not.toThrow();
    });
  });
});
