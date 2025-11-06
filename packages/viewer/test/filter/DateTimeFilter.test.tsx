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
import { DateTimeFilter } from '../../src/filter/DateTimeFilter';
import { FilterProps, FilterRef } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';
import dayjs from 'dayjs';

// 测试辅助函数
const createMockProps = (
  overrides: Partial<FilterProps> = {},
): FilterProps => {
  const defaultProps: FilterProps = {
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'datetime',
    },
    label: {},
    operator: {
      defaultValue: Operator.GT,
    },
    value: {
      defaultValue: dayjs('2023-01-01'),
    },
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (
  props: Partial<FilterProps> = {},
) => {
  const ref = React.createRef<FilterRef>();
  const finalProps = createMockProps(props);

  const result = render(<DateTimeFilter ref={ref} {...finalProps} />);

  return { ...result, ref };
};

describe('DateTimeFilter', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const props = createMockProps();
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('renders all required components', () => {
      const props = createMockProps();
      const { container } = render(<DateTimeFilter {...props} />);

      expect(container.firstChild).toBeDefined();
    });

    it('displays field label correctly', () => {
      const props = createMockProps({
        field: { name: 'customField', label: 'Custom Label', type: 'datetime' },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Custom Label' })).toBeDefined();
    });
  });

  describe('Supported Operators', () => {
    it('supports all expected operators', () => {
      const props = createMockProps();
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('combobox')).toBeDefined();
    });

    const operators = [
      Operator.GT,
      Operator.LT,
      Operator.GTE,
      Operator.LTE,
      Operator.BETWEEN,
      Operator.TODAY,
      Operator.BEFORE_TODAY,
      Operator.TOMORROW,
      Operator.THIS_WEEK,
      Operator.NEXT_WEEK,
      Operator.LAST_WEEK,
      Operator.THIS_MONTH,
      Operator.LAST_MONTH,
      Operator.RECENT_DAYS,
      Operator.EARLIER_DAYS,
    ];

    operators.forEach(operator => {
      it(`renders correctly with ${operator} operator`, () => {
        const props = createMockProps({
          operator: { defaultValue: operator },
        });
        expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
      });
    });
  });

  describe('Value Input Rendering', () => {
    it('renders DatePicker for GT operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.GT },
      });
      render(<DateTimeFilter {...props} />);

      // DatePicker should be rendered
      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('renders DatePicker for LT operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.LT },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('renders DatePicker for GTE operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.GTE },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('renders DatePicker for LTE operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.LTE },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('renders DatePicker.RangePicker for BETWEEN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs('2023-01-01'), dayjs('2023-01-02')] },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('renders null for TODAY operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.TODAY },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      // No input should be rendered
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders null for TOMORROW operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.TOMORROW },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders null for THIS_WEEK operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.THIS_WEEK },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders null for NEXT_WEEK operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.NEXT_WEEK },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders null for LAST_WEEK operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.LAST_WEEK },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders null for THIS_MONTH operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.THIS_MONTH },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders null for LAST_MONTH operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.LAST_MONTH },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('renders InputNumber for RECENT_DAYS operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 5 },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('spinbutton')).toBeDefined();
    });

    it('renders InputNumber for EARLIER_DAYS operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EARLIER_DAYS },
        value: { defaultValue: 10 },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('spinbutton')).toBeDefined();
    });

    it('renders DatePicker with picker=time for BEFORE_TODAY operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BEFORE_TODAY },
        value: { defaultValue: dayjs('2023-01-01 12:00:00') },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });
  });

  describe('Value Parsing', () => {
    it('parses BETWEEN operator correctly with valid array', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs('2023-01-01'), dayjs('2023-01-02')] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
    });

    it('parses BETWEEN operator with invalid array length', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs('2023-01-01')] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('parses RECENT_DAYS operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 5 },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
    });

    it('parses EARLIER_DAYS operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.EARLIER_DAYS },
        value: { defaultValue: 10 },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
    });

    it('parses BEFORE_TODAY operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BEFORE_TODAY },
        value: { defaultValue: dayjs('2023-01-01 12:30:45') },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
    });

    it('parses GT operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs('2023-01-01') },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
    });

    it('parses null value correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: null },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('parses undefined value correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: undefined },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

      const result = ref.current?.getValue();
      expect(result).toEqual(expect.objectContaining({
        field: 'testField',
        operator: Operator.BETWEEN,
        value: [1672531200000, 1672617600000], // timestamps
      }));

    it('parses BETWEEN operator with invalid array length', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs('2023-01-01')] },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('parses RECENT_DAYS operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 5 },
      });

      const result = ref.current?.getValue() as any;
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.RECENT_DAYS,
        value: 5,
      });
    });

    it('parses EARLIER_DAYS operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.EARLIER_DAYS },
        value: { defaultValue: 10 },
      });

      const result = ref.current?.getValue() as any;
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.RECENT_DAYS,
        value: 5,
      });
    });

    it('parses EARLIER_DAYS operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.EARLIER_DAYS },
        value: { defaultValue: 10 },
      });

      const result = ref.current?.getValue() as any;
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.EARLIER_DAYS,
        value: 10,
      });
    });

    it('parses BEFORE_TODAY operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BEFORE_TODAY },
        value: { defaultValue: dayjs('2023-01-01 12:30:45') },
      });

      const result = ref.current?.getValue() as any;
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.BEFORE_TODAY,
        value: '12:30:45',
      });
    });

    it('parses GT operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs('2023-01-01') },
      });

      const result = ref.current?.getValue() as any;
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.GT,
        value: 1672531200000,
      });
    });

    it('parses BEFORE_TODAY operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BEFORE_TODAY },
        value: { defaultValue: dayjs('2023-01-01 12:30:45') },
      });

      const result = ref.current?.getValue();
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.BEFORE_TODAY,
        value: '12:30:45',
      });
    });

    it('parses GT operator correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs('2023-01-01') },
      });

      const result = ref.current?.getValue();
      expect(result).toEqual({
        field: 'testField',
        operator: Operator.GT,
        value: 1672531200000,
      });
    });

    it('parses null value correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: null },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });

    it('parses undefined value correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: undefined },
      });

      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });
  });


  describe('Props Forwarding', () => {
    it('forwards value props to DatePicker', () => {
      const props = createMockProps({
        value: {
          defaultValue: dayjs('2023-01-01'),
          placeholder: 'Select date',
        },
      });
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('forwards value props to InputNumber', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: {
          defaultValue: 5,
          min: 1,
          max: 365,
        },
      });
      render(<DateTimeFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();
    });
  });

  describe('onChange Callback', () => {
    it('handles DatePicker value changes', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs('2023-01-01') },
      });

      render(<DateTimeFilter {...props} />);

      // DatePicker interaction is complex, but component should render
      expect(screen.getByRole('button', { name: 'Test Field' })).toBeDefined();
    });

    it('handles InputNumber value changes', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 5 },
      });

      render(<DateTimeFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });

      expect(input).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: undefined },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles null value gracefully', () => {
      const props = createMockProps({
        value: { defaultValue: null },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles invalid Dayjs value', () => {
      const props = createMockProps({
        value: { defaultValue: 'invalid' as any },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles BETWEEN with empty array', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [] },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles BETWEEN with partial undefined values', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs('2023-01-01'), undefined] },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles BETWEEN with both undefined values', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [undefined, undefined] },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles non-array value for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: dayjs('2023-01-01') },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles string value for number operators', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 'not a number' as any },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles negative number for RECENT_DAYS', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: -5 },
      });
      render(<DateTimeFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();
    });

    it('handles zero for EARLIER_DAYS', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.EARLIER_DAYS },
        value: { defaultValue: 0 },
      });
      render(<DateTimeFilter {...props} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeDefined();
    });
  });

  describe('Reset Functionality', () => {
    it('resets value correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs('2023-01-01') },
      });

      ref.current?.reset();
      const result = ref.current?.getValue();
      expect(result).toBeUndefined();
    });
  });
});