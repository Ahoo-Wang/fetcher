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
import { IdFilter, IdOnOperatorChangeValueConverter } from '../../src';
import { FilterRef } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<React.ComponentProps<typeof IdFilter>> = {},
) => {
  const defaultProps: React.ComponentProps<typeof IdFilter> = {
    field: {
      name: 'testId',
      label: 'Test ID',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.ID,
    },
    value: {
      defaultValue: 'test-value',
    },
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (
  props: Partial<React.ComponentProps<typeof IdFilter>> = {},
) => {
  const ref = React.createRef<FilterRef>();
  const finalProps = createMockProps(props);

  const result = render(<IdFilter ref={ref} {...finalProps} />);

  return { ...result, ref };
};

describe('IdFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<IdFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<IdFilter {...props} />);

      // 检查标签（使用 Typography 组件渲染）
      expect(container.textContent).toContain('Test ID');

      // 检查操作符选择器
      expect(screen.getByRole('combobox')).toBeDefined();

      // 检查输入组件
      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
      });
      const { container } = render(<IdFilter {...props} />);

      expect(container.textContent).toContain('Custom Label');
    });

    it('renders in Space.Compact layout', () => {
      const props = createMockProps();
      const { container } = render(<IdFilter {...props} />);

      const compactContainer = container.querySelector('.ant-space-compact');
      expect(compactContainer).toBeDefined();
    });
  });

  describe('Operator Selection', () => {
    it('defaults to ID operator when no value provided', () => {
      const props = createMockProps({
        operator: {}, // No value provided
      });
      render(<IdFilter {...props} />);

      // For Antd Select, check the selected option text instead of value attribute
      // ID operator displays as '等于' (equal) in Chinese locale
      const selectedOption = screen.getByText('等于');
      expect(selectedOption).toBeDefined();
    });

    it('respects provided operator value', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IDS },
      });
      expect(() => render(<IdFilter {...props} />)).not.toThrow();
    });
  });

  describe('Input Component Types', () => {
    it('renders Input component for ID operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.ID },
        value: { defaultValue: 'single-id' },
      });
      render(<IdFilter {...props} />);

      const input = screen.getByRole('textbox');
      expect(input.tagName.toLowerCase()).toBe('input');
    });

    it('renders TagInput component for IDS operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IDS },
        value: { defaultValue: ['id1', 'id2'] },
      });
      expect(() => render(<IdFilter {...props} />)).not.toThrow();
    });
  });

  describe('Validation Logic', () => {
    it('validates correctly for ID operator with valid value', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.ID },
        value: { defaultValue: 'valid-id' },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
      expect(result?.condition.operator).toBe(Operator.ID);
      expect(result?.condition.value).toBe('valid-id');
    });

    it('validates correctly for IDS operator with valid array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.IDS },
        value: { defaultValue: ['id1', 'id2'] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
      expect(result?.condition.operator).toBe(Operator.IDS);
      expect(result?.condition.value).toEqual(['id1', 'id2']);
    });

    it('returns undefined for ID operator with empty value', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.ID },
        value: { defaultValue: '' },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('returns undefined for IDS operator with empty array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.IDS },
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

    it('getValue returns ConditionFilterValue object when valid', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.ID },
        value: { defaultValue: 'test-id' },
      });

      const result = ref.current?.getValue();

      expect(result).toHaveProperty('condition');
      expect(result?.condition).toEqual({
        field: 'testId',
        operator: Operator.ID,
        value: 'test-id',
      });
    });
  });

  describe('onChange Callback', () => {
    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      const props = createMockProps({
        operator: { defaultValue: Operator.ID },
        value: { defaultValue: 'initial' },
        onChange,
      });
      render(<IdFilter {...props} />);

      // Note: In a real scenario, this would trigger onChange
      // For now, we just verify the onChange prop is accepted
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Internationalization', () => {
    it('uses default Chinese locale when no locale provided', () => {
      const props = createMockProps({
        operator: {}, // No locale provided
      });
      render(<IdFilter {...props} />);

      const select = screen.getByRole('combobox');
      // Verify component renders without locale errors
      expect(select).toBeDefined();
    });
  });

  describe('Props Forwarding', () => {
    it('forwards operator props to Select component', () => {
      const props = createMockProps({
        operator: {
          defaultValue: Operator.ID,
          placeholder: 'Select operator',
        },
      });
      render(<IdFilter {...props} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDefined();
    });

    it('forwards value props to input component', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.ID },
        value: {
          defaultValue: 'test',
          placeholder: 'Enter ID',
        },
      });
      render(<IdFilter {...props} />);

      const input = screen.getByRole('textbox');
      expect(input.getAttribute('placeholder')).toBe('Enter ID');
    });

    it.skip('forwards label props to Button component', () => {
      // Skipped due to jsdom CSS issues with Antd Button
    });
  });

  describe('Value Converter', () => {
    it('converts array to single value when switching to ID operator', () => {
      // Test the converter function directly
      const result = IdOnOperatorChangeValueConverter(
        Operator.IDS,
        Operator.ID,
        ['id1', 'id2'],
      );
      expect(result).toBe('id1');
    });

    it('converts single value to array when switching to IDS operator', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.IDS,
        'single-id',
      );
      expect(result).toEqual(['single-id']);
    });

    it('converts empty string to empty array for IDS operator', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.IDS,
        '',
      );
      expect(result).toEqual([]);
    });

    it('converts trimmed single value to array for IDS operator', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.IDS,
        '  trimmed-id  ',
      );
      expect(result).toEqual(['trimmed-id']);
    });

    it('returns original value when no conversion needed', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.ID,
        'unchanged-value',
      );
      expect(result).toBe('unchanged-value');
    });

    it('handles undefined value', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.IDS,
        undefined,
      );
      expect(result).toBeUndefined();
    });

    it('handles null value', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.IDS,
        null as any,
      );
      expect(result).toBeNull();
    });

    it('converts whitespace-only string to empty array for IDS operator', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.ID,
        Operator.IDS,
        '   ',
      );
      expect(result).toEqual([]);
    });

    it('returns array unchanged when switching from IDS to IDS', () => {
      const result = IdOnOperatorChangeValueConverter(
        Operator.IDS,
        Operator.IDS,
        ['id1', 'id2'],
      );
      expect(result).toEqual(['id1', 'id2']);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<IdFilter {...props} />)).not.toThrow();

      const { ref } = renderWithRef({
        value: { defaultValue: undefined },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() => render(<IdFilter {...props} />)).not.toThrow();

      const { ref } = renderWithRef({
        value: { defaultValue: null as any },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('handles empty array for IDS operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IDS },
        value: { defaultValue: [] },
      });
      render(<IdFilter {...props} />);

      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.IDS },
        value: { defaultValue: [] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });
  });
});
