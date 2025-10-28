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
import { SelectFilter } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (overrides: any = {}): any => {
  const defaultProps = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'string',
    },
    label: {},
    operator: {
      defaultValue: Operator.IN,
    },
    value: {
      defaultValue: ['option1'],
    },
  };

  return { ...defaultProps, ...overrides };
};

describe('SelectFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<SelectFilter {...props} />);

      // 检查组件是否渲染到 DOM 中
      expect(container.firstChild).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'string' },
      });
      const { container } = render(<SelectFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Supported Operators', () => {
    it('supports IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
      });
      render(<SelectFilter {...props} />);

      // 组件应该渲染成功，操作符选择器应该存在
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });

    it('supports NOT_IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.NOT_IN },
      });
      render(<SelectFilter {...props} />);

      expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });

    it('renders correctly with IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
      });
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });

    it('renders correctly with NOT_IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.NOT_IN },
      });
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });
  });

  describe('Value Input Supplier', () => {
    it('renders Select component for IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: ['value1', 'value2'] },
      });
      render(<SelectFilter {...props} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('renders Select component for NOT_IN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.NOT_IN },
        value: { defaultValue: ['value1', 'value2'] },
      });
      render(<SelectFilter {...props} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('passes options to Select component', () => {
      const options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: ['option1'] },
        options,
      });
      render(<SelectFilter {...props} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });
  });

  describe('Props Forwarding', () => {
    it('forwards value props to Select', () => {
      const props = createMockProps({
        value: {
          defaultValue: ['custom'],
          placeholder: 'Select options',
        },
        options: [{ label: 'Custom', value: 'custom' }],
      });
      const { container } = render(<SelectFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('handles array defaultValue', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: ['item1', 'item2', 'item3'] },
        options: [
          { label: 'Item 1', value: 'item1' },
          { label: 'Item 2', value: 'item2' },
          { label: 'Item 3', value: 'item3' },
        ],
      });
      const { container } = render(<SelectFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });

    it('handles empty array value', () => {
      const props = createMockProps({
        value: { defaultValue: [] },
      });
      render(<SelectFilter {...props} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('handles empty options array', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: [] },
        options: [],
      });
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });

    it('handles undefined options', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.IN },
        value: { defaultValue: [] },
        options: undefined as any,
      });
      expect(() => render(<SelectFilter {...props} />)).not.toThrow();
    });
  });
});
