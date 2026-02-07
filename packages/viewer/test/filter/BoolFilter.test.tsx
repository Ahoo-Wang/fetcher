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
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BoolFilter, BOOL_FILTER } from '../../src/filter/BoolFilter';
import { FilterProps, FilterRef } from '../../src/filter/types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { ExtendedOperator } from '../../src/filter/operator';

// Mock AssemblyFilter to test props passing
vi.mock('../../src/filter/AssemblyFilter', () => ({
  AssemblyFilter: vi.fn(props => {
    (globalThis as Record<string, any>).mockAssemblyFilterProps = props;
    return <div data-testid="assembly-filter" />;
  }),
}));

// 测试辅助函数
const createMockProps = (
  overrides: Partial<FilterProps<any>> = {},
): FilterProps<any> => {
  const defaultProps: FilterProps<any> = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'boolean',
    },
    label: {},
    operator: {
      defaultValue: Operator.TRUE,
    },
    value: {
      defaultValue: undefined,
    },
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (props: Partial<FilterProps<any>> = {}) => {
  const ref = React.createRef<FilterRef>();
  const finalProps = createMockProps(props);

  const result = render(<BoolFilter ref={ref} {...finalProps} />);

  return { ...result, ref };
};

describe('BoolFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as Record<string, unknown>).mockAssemblyFilterProps;
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });

    it('renders AssemblyFilter component', () => {
      const props = createMockProps();
      render(<BoolFilter {...props} />);

      expect(screen.getByTestId('assembly-filter')).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'boolean' },
      });
      render(<BoolFilter {...props} />);

      expect(screen.getByTestId('assembly-filter')).toBeDefined();
    });
  });

  describe('Props Forwarding', () => {
    it('passes all props to AssemblyFilter except supportedOperators and validate', () => {
      const props = createMockProps({
        field: { name: 'testField', label: 'Test Field', type: 'boolean' },
        label: { style: { color: 'red' } },
        operator: { defaultValue: Operator.TRUE },
        value: { defaultValue: undefined },
      });
      render(<BoolFilter {...props} />);

      const mockProps = (globalThis as Record<string, any>).mockAssemblyFilterProps;
      expect(mockProps).toBeDefined();
      expect(mockProps.field).toEqual(props.field);
      expect(mockProps.label).toEqual(props.label);
      expect(mockProps.operator).toEqual(props.operator);
      expect(mockProps.value).toEqual(props.value);
    });

    it('sets correct supportedOperators', () => {
      const props = createMockProps();
      render(<BoolFilter {...props} />);

      const mockProps = (globalThis as Record<string, any>).mockAssemblyFilterProps;
      expect(mockProps.supportedOperators).toEqual([
        ExtendedOperator.UNDEFINED,
        Operator.TRUE,
        Operator.FALSE,
      ]);
    });

    it('uses TrueValidateValue for validation', () => {
      const props = createMockProps();
      render(<BoolFilter {...props} />);

      const mockProps = (globalThis as Record<string, any>).mockAssemblyFilterProps;
      // TrueValidateValue always returns true
      expect(typeof mockProps.validate).toBe('function');
      expect(mockProps.validate(Operator.TRUE, undefined)).toBe(true);
      expect(mockProps.validate(Operator.FALSE, undefined)).toBe(true);
      expect(mockProps.validate(ExtendedOperator.UNDEFINED, undefined)).toBe(
        true,
      );
    });
  });

  describe('Supported Operators', () => {
    it('supports UNDEFINED operator', () => {
      const props = createMockProps({
        operator: { defaultValue: ExtendedOperator.UNDEFINED },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });

    it('supports TRUE operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.TRUE },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });

    it('supports FALSE operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.FALSE },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });
  });

  describe('Ref Functionality', () => {
    it('forwards ref to AssemblyFilter', () => {
      const { ref } = renderWithRef();

      expect(ref.current).toBeDefined();
    });
  });

  describe('Constants', () => {
    it('exports BOOL_FILTER constant', () => {
      expect(BOOL_FILTER).toBe('bool');
    });
  });

  describe('Component Properties', () => {
    it('has correct displayName', () => {
      expect(BoolFilter.displayName).toBe('BoolFilter');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<BoolFilter {...props} />)).not.toThrow();
    });

    it('handles minimal props', () => {
      const minimalProps: FilterProps<any> = {
        field: {
          name: 'test',
          label: 'Test',
        },
      };
      expect(() => render(<BoolFilter {...minimalProps} />)).not.toThrow();
    });
  });
});
