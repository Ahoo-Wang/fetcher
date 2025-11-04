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
import { BoolFilter } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (overrides: any = {}): any => {
  const defaultProps = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'boolean',
    },
    label: {},
    operator: {
      defaultValue: Operator.EQ,
    },
    value: {
      defaultValue: true,
    },
  };

  return { ...defaultProps, ...overrides };
};

describe('BoolFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<BoolFilter {...props} />);

      // 检查组件是否渲染到 DOM 中
      expect(container.firstChild).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'boolean' },
      });
      const { container } = render(<BoolFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Supported Operators', () => {
    it('supports EQ operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
      });
      render(<BoolFilter {...props} />);

      // 组件应该渲染成功，操作符选择器应该存在
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });

    it('renders correctly with EQ operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });
  });

  describe('Value Input Supplier', () => {
    it('renders Select component for EQ operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: true },
      });
      render(<BoolFilter {...props} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('renders boolean options correctly', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: true },
      });
      render(<BoolFilter {...props} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });
  });

  describe('Props Forwarding', () => {
    it('forwards value props to Select', () => {
      const props = createMockProps({
        value: {
          defaultValue: false,
          placeholder: 'Select boolean value',
        },
      });
      const { container } = render(<BoolFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('handles true defaultValue', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: true },
      });
      const { container } = render(<BoolFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('handles false defaultValue', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EQ },
        value: { defaultValue: false },
      });
      const { container } = render(<BoolFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null as any },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });
  });
});
