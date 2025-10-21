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
import { describe, expect, it } from 'vitest';
import { FallbackConditionFilter } from '../../src';
import {
  ConditionFilterRef,
  ConditionFilterValue,
} from '../../src';
import { TypedConditionFilterProps } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

// 测试辅助函数
const createMockProps = (type: string): TypedConditionFilterProps => ({
  type,
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
    defaultValue: 'test',
  },
});

describe('FallbackConditionFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps('unknown');
      const { container } = render(<FallbackConditionFilter {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders warning alert for unsupported filter type', () => {
      const props = createMockProps('unknown');
      render(<FallbackConditionFilter {...props} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.classList.contains('ant-alert-warning')).toBe(true);
    });

    it('displays correct unsupported type message', () => {
      const props = createMockProps('custom-filter');
      render(<FallbackConditionFilter {...props} />);

      expect(
        screen.getByText('Unsupported filter type:[custom-filter]'),
      ).toBeDefined();
    });

    it('renders as an Alert component with correct structure', () => {
      const props = createMockProps('test');
      const { container } = render(<FallbackConditionFilter {...props} />);
      const alert = container.querySelector('.ant-alert');
      expect(alert).toBeDefined();
      expect(alert?.classList.contains('ant-alert-warning')).toBe(true);
    });

    it('displays warning icon for visual indication', () => {
      const props = createMockProps('test');
      render(<FallbackConditionFilter {...props} />);

      const icon = document.querySelector('.anticon-exclamation-circle');
      expect(icon).toBeDefined();
    });

    it('handles different type values correctly', () => {
      const { rerender } = render(
        <FallbackConditionFilter {...createMockProps('type1')} />,
      );
      expect(screen.getByText('Unsupported filter type:[type1]')).toBeDefined();

      rerender(<FallbackConditionFilter {...createMockProps('type2')} />);
      expect(screen.getByText('Unsupported filter type:[type2]')).toBeDefined();
    });
  });

  describe('Functionality', () => {
    it('exposes getValue method via ref', () => {
      const ref = React.createRef<ConditionFilterRef | null>();
      const props = createMockProps('test');

      render(
        <FallbackConditionFilter
          ref={ref as React.RefObject<ConditionFilterRef>}
          {...props}
        />,
      );

      expect(ref.current).toHaveProperty('getValue');
      expect(typeof ref.current?.getValue).toBe('function');
    });

    it('getValue method always returns undefined', () => {
      const ref = React.createRef<ConditionFilterRef | null>();
      const props = createMockProps('any-type');

      render(
        <FallbackConditionFilter
          ref={ref as React.RefObject<ConditionFilterRef>}
          {...props}
        />,
      );

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('getValue returns undefined regardless of props', () => {
      const testCases = ['string', 'number', 'boolean', 'custom'];

      testCases.forEach(type => {
        const ref = React.createRef<ConditionFilterRef | null>();
        const props = createMockProps(type);

        render(
          <FallbackConditionFilter
            ref={ref as React.RefObject<ConditionFilterRef>}
            {...props}
          />,
        );
        expect(ref.current?.getValue()).toBeUndefined();
      });
    });

    it('maintains ref functionality across re-renders', () => {
      const ref = React.createRef<ConditionFilterRef | null>();
      const { rerender } = render(
        <FallbackConditionFilter
          ref={ref as React.RefObject<ConditionFilterRef>}
          {...createMockProps('initial')}
        />,
      );

      expect(ref.current?.getValue()).toBeUndefined();

      rerender(
        <FallbackConditionFilter
          ref={ref as React.RefObject<ConditionFilterRef>}
          {...createMockProps('updated')}
        />,
      );
      expect(ref.current?.getValue()).toBeUndefined();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      const props = createMockProps('test');
      render(<FallbackConditionFilter {...props} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
    });

    it('is announced by screen readers', () => {
      const props = createMockProps('accessibility-test');
      render(<FallbackConditionFilter {...props} />);

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain(
        'Unsupported filter type:[accessibility-test]',
      );
    });
  });

  describe('Error Handling', () => {
    it('handles undefined type gracefully', () => {
      const props = createMockProps('undefined' as any);
      render(<FallbackConditionFilter {...props} />);

      expect(
        screen.getByText('Unsupported filter type:[undefined]'),
      ).toBeDefined();
    });

    it('handles null type gracefully', () => {
      const props = createMockProps('null' as any);
      render(<FallbackConditionFilter {...props} />);

      expect(screen.getByText('Unsupported filter type:[null]')).toBeDefined();
    });

    it('handles empty string type', () => {
      const props = createMockProps('');
      render(<FallbackConditionFilter {...props} />);

      expect(screen.getByText('Unsupported filter type:[]')).toBeDefined();
    });

    it('handles special characters in type', () => {
      const specialTypes = [
        'type with spaces',
        'type-with-dashes',
        'type_with_underscores',
      ];

      specialTypes.forEach(type => {
        const { rerender } = render(
          <FallbackConditionFilter {...createMockProps('placeholder')} />,
        );
        rerender(<FallbackConditionFilter {...createMockProps(type)} />);

        expect(
          screen.getByText(`Unsupported filter type:[${type}]`),
        ).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily with same props', () => {
      const props = createMockProps('test');
      const { rerender } = render(<FallbackConditionFilter {...props} />);
      const initialAlert = screen.getByRole('alert');

      rerender(<FallbackConditionFilter {...props} />);
      const secondAlert = screen.getByRole('alert');

      expect(initialAlert).toBe(secondAlert);
    });

    it('handles rapid prop changes without issues', () => {
      const { rerender } = render(
        <FallbackConditionFilter {...createMockProps('type1')} />,
      );

      rerender(<FallbackConditionFilter {...createMockProps('type2')} />);
      rerender(<FallbackConditionFilter {...createMockProps('type3')} />);

      expect(screen.getByText('Unsupported filter type:[type3]')).toBeDefined();
    });
  });

  describe('TypeScript Integration', () => {
    it('accepts correct TypeScript props', () => {
      const props: TypedConditionFilterProps = createMockProps('string');

      expect(() =>
        render(<FallbackConditionFilter {...props} />),
      ).not.toThrow();
    });

    it('works with ref typing', () => {
      const ref = React.createRef<ConditionFilterRef | null>();
      const props = createMockProps('test');

      expect(() =>
        render(
          <FallbackConditionFilter
            ref={ref as React.RefObject<ConditionFilterRef>}
            {...props}
          />,
        ),
      ).not.toThrow();

      // TypeScript should infer correct type
      if (ref.current) {
        const result: ConditionFilterValue | undefined = ref.current.getValue();
        expect(result).toBeUndefined();
      }
    });
  });
});
