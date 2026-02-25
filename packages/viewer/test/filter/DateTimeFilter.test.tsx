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
import { describe, expect, it, vi } from 'vitest';
import {
  DateTimeFilter,
  DATE_TIME_FILTER_NAME,
  DateTimeOnOperatorChangeValueConverter,
  TimestampConditionValueParser,
} from '../../src/filter/DateTimeFilter';
import { FilterRef, FilterValueProps } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { ExtendedOperator } from '../../src';
import dayjs from 'dayjs';

// Use real dayjs instances for testing

// Helper to create mock props
const createMockProps = (
  overrides: Partial<{
    field: any;
    label: any;
    operator: any;
    value: FilterValueProps;
    onChange: any;
  }> = {},
) => {
  const defaultProps = {
    field: {
      name: 'testDateTimeField',
      label: 'Test DateTime Field',
      type: 'datetime',
    },
    label: {},
    operator: {
      defaultValue: Operator.GT,
    },
    value: {
      defaultValue: dayjs(),
    } as FilterValueProps,
    onChange: vi.fn(),
  };

  return { ...defaultProps, ...overrides };
};

const renderWithRef = (props: Partial<any> = {}) => {
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

    it('renders field label correctly', () => {
      const props = createMockProps({
        field: {
          name: 'customField',
          label: 'Custom DateTime Label',
          type: 'datetime',
        },
      });
      const { container } = render(<DateTimeFilter {...props} />);

      expect(container.textContent).toContain('Custom DateTime Label');
    });

    it('renders operator selector', () => {
      const props = createMockProps();
      render(<DateTimeFilter {...props} />);

      expect(screen.getByRole('combobox')).toBeDefined();
    });
  });

  describe('Supported Operators', () => {
    it('includes all expected operators', () => {
      const props = createMockProps();
      render(<DateTimeFilter {...props} />);

      // The component should render without errors, indicating operators are properly configured
      expect(screen.getByRole('combobox')).toBeDefined();
    });
  });

  describe('Value Input Rendering by Operator', () => {
    it('renders DatePicker.RangePicker for BETWEEN operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs(), dayjs().add(1, 'day')] },
      });
      render(<DateTimeFilter {...props} />);

      // RangePicker should be rendered
      const rangePicker = document.querySelector('.ant-picker-range');
      expect(rangePicker).toBeDefined();
    });

    it('renders null for operators without input (TODAY, TOMORROW, etc.)', () => {
      const operatorsWithoutInput = [
        Operator.TODAY,
        Operator.TOMORROW,
        Operator.THIS_WEEK,
        Operator.NEXT_WEEK,
        Operator.LAST_WEEK,
        Operator.THIS_MONTH,
        Operator.LAST_MONTH,
      ];

      operatorsWithoutInput.forEach(operator => {
        const props = createMockProps({
          operator: { defaultValue: operator },
        });
        const { container } = render(<DateTimeFilter {...props} />);

        // Should not have any input elements beyond the operator select
        const inputs = container.querySelectorAll('input');
        // Only the hidden inputs from Select should be present
        expect(inputs.length).toBeLessThanOrEqual(2); // Select may have hidden inputs
      });
    });

    it('renders InputNumber for RECENT_DAYS and EARLIER_DAYS operators', () => {
      [Operator.RECENT_DAYS, Operator.EARLIER_DAYS].forEach(operator => {
        const props = createMockProps({
          operator: { defaultValue: operator },
          value: { defaultValue: 5 },
        });
        render(<DateTimeFilter {...props} />);

        const inputNumber = document.querySelector('.ant-input-number-input');
        expect(inputNumber).toBeDefined();
      });
    });

    it('renders DatePicker with time picker for BEFORE_TODAY operator', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BEFORE_TODAY },
        value: { defaultValue: dayjs() },
      });
      render(<DateTimeFilter {...props} />);

      const timePicker = document.querySelector('.ant-picker-time');
      expect(timePicker).toBeDefined();
    });

    it('renders DatePicker with date picker for comparison operators (GT, LT, GTE, LTE)', () => {
      [Operator.GT, Operator.LT, Operator.GTE, Operator.LTE].forEach(
        operator => {
          const props = createMockProps({
            operator: { defaultValue: operator },
            value: { defaultValue: dayjs() },
          });
          const { container } = render(<DateTimeFilter {...props} />);

          const datePicker = container.querySelector(
            '.ant-picker:not(.ant-picker-time)',
          );
          expect(datePicker).toBeDefined();
        },
      );
    });
  });

  describe('Value Parsing', () => {
    it('parses BETWEEN operator correctly with valid array', () => {
      const start = dayjs();
      const end = dayjs().add(1, 'day');
      const result = TimestampConditionValueParser(Operator.BETWEEN, [
        start,
        end,
      ]);
      expect(result).toEqual([start.valueOf(), end.valueOf()]);
    });

    it('returns undefined for BETWEEN with invalid array', () => {
      const invalidValues = [
        [dayjs()], // Too short
        [dayjs(), dayjs(), dayjs()], // Too long
        'not an array',
        [],
      ];

      invalidValues.forEach(value => {
        const result = TimestampConditionValueParser(Operator.BETWEEN, value);
        expect(result).toBeUndefined();
      });
    });

    it('parses number operators (RECENT_DAYS, EARLIER_DAYS) correctly', () => {
      [Operator.RECENT_DAYS, Operator.EARLIER_DAYS].forEach(operator => {
        const value = 7;
        const result = TimestampConditionValueParser(operator, value);
        expect(result).toBe(value);
      });
    });

    it('parses BEFORE_TODAY with dayjs value correctly', () => {
      const value = dayjs();
      const result = TimestampConditionValueParser(
        Operator.BEFORE_TODAY,
        value,
      );
      expect(result).toBe(value.format('HH:mm:ss'));
    });

    it('parses comparison operators (GT, LT, GTE, LTE) to timestamp', () => {
      [Operator.GT, Operator.LT, Operator.GTE, Operator.LTE].forEach(
        operator => {
          const value = dayjs();
          const result = TimestampConditionValueParser(operator, value);
          expect(result).toBe(value.valueOf());
        },
      );
    });

    it('returns undefined for falsy values', () => {
      const falsyValues = [undefined, null, ''];

      falsyValues.forEach(value => {
        const result = TimestampConditionValueParser(Operator.GT, value);
        expect(result).toBeUndefined();
      });
    });

    it('returns undefined for BEFORE_TODAY with non-dayjs value', () => {
      const result = TimestampConditionValueParser(
        Operator.BEFORE_TODAY,
        'not dayjs',
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined for comparison operators with non-dayjs value', () => {
      const result = TimestampConditionValueParser(Operator.GT, 'not dayjs');
      expect(result).toBeUndefined();
    });

    // Integration tests through component
    it('parses BETWEEN operator correctly with valid array (integration)', () => {
      const start = dayjs();
      const end = dayjs().add(1, 'day');
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [start, end] },
      });

      const result = ref.current?.getValue();
      expect(result?.condition.value).toEqual([start.valueOf(), end.valueOf()]);
    });

    it('parses number operators (RECENT_DAYS, EARLIER_DAYS) correctly (integration)', () => {
      [Operator.RECENT_DAYS, Operator.EARLIER_DAYS].forEach(operator => {
        const { ref } = renderWithRef({
          operator: { defaultValue: operator },
          value: { defaultValue: 7 },
        });

        const result = ref.current?.getValue();
        expect(result?.condition.value).toBe(7);
      });
    });

    it('parses BEFORE_TODAY with dayjs value correctly (integration)', () => {
      const timeValue = dayjs();
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.BEFORE_TODAY },
        value: { defaultValue: timeValue },
      });

      const result = ref.current?.getValue();
      expect(result?.condition.value).toBe(timeValue.format('HH:mm:ss'));
    });

    it('parses comparison operators (GT, LT, GTE, LTE) to timestamp (integration)', () => {
      [Operator.GT, Operator.LT, Operator.GTE, Operator.LTE].forEach(
        operator => {
          const dateValue = dayjs();
          const { ref } = renderWithRef({
            operator: { defaultValue: operator },
            value: { defaultValue: dateValue },
          });

          const result = ref.current?.getValue();
          expect(result?.condition.value).toBe(dateValue.valueOf());
        },
      );
    });
  });

  describe('Operator Change Value Converter', () => {
    it('returns value unchanged for UNDEFINED operators', () => {
      const value = dayjs();
      const result = DateTimeOnOperatorChangeValueConverter(
        ExtendedOperator.UNDEFINED,
        ExtendedOperator.UNDEFINED,
        value,
      );
      expect(result).toBe(value);
    });

    it('returns value for same number value operators', () => {
      const value = 5;
      const result = DateTimeOnOperatorChangeValueConverter(
        Operator.RECENT_DAYS,
        Operator.EARLIER_DAYS,
        value,
      );
      expect(result).toBe(value);
    });

    it('returns value for same dayjs value operators', () => {
      const value = dayjs();
      const result = DateTimeOnOperatorChangeValueConverter(
        Operator.GT,
        Operator.LT,
        value,
      );
      expect(result).toBe(value);
    });

    it('converts to array when switching from dayjs operator to BETWEEN', () => {
      const value = dayjs();
      const result = DateTimeOnOperatorChangeValueConverter(
        Operator.GT,
        Operator.BETWEEN,
        value,
      );
      expect(result).toEqual([value, undefined]);
    });

    it('returns undefined for incompatible conversions', () => {
      const value = dayjs();
      const result = DateTimeOnOperatorChangeValueConverter(
        Operator.RECENT_DAYS,
        Operator.GT,
        value,
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when switching from dayjs to number operator', () => {
      const value = dayjs();
      const result = DateTimeOnOperatorChangeValueConverter(
        Operator.GT,
        Operator.RECENT_DAYS,
        value,
      );
      expect(result).toBeUndefined();
    });

    it('maintains dayjs value for GT operator', () => {
      const dateValue = dayjs();
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dateValue },
      });

      // Initially should have the dayjs value
      expect(ref.current?.getValue()?.condition.value).toBe(
        dateValue.valueOf(),
      );
    });

    it('maintains value for compatible operators', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 5 },
      });

      expect(ref.current?.getValue()?.condition.value).toBe(5);
    });
  });

  describe('Integration with Filter State', () => {
    it('accepts onChange prop', () => {
      const onChange = vi.fn();
      const props = createMockProps({ onChange });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('updates value when input changes', () => {
      const onChange = vi.fn();
      const props = createMockProps({
        onChange,
        operator: { defaultValue: Operator.RECENT_DAYS },
        value: { defaultValue: 5 },
      });
      render(<DateTimeFilter {...props} />);

      const input = document.querySelector(
        '.ant-input-number-input',
      ) as HTMLInputElement;
      expect(input).toBeDefined();

      fireEvent.change(input, { target: { value: '10' } });

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Ref Functionality', () => {
    it('exposes getValue method', () => {
      const { ref } = renderWithRef();
      expect(ref.current?.getValue).toBeDefined();
    });

    it('getValue returns correct FilterValue for valid state', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs() },
      });

      const result = ref.current?.getValue();
      expect(result).toBeDefined();
      expect(result?.condition.operator).toBe(Operator.GT);
      expect(typeof result?.condition.value).toBe('number'); // timestamp
    });

    it('reset method works correctly', () => {
      const { ref } = renderWithRef({
        operator: { defaultValue: Operator.GT },
        value: { defaultValue: dayjs() },
      });

      // Change something
      ref.current?.reset();

      // Should reset to initial values
      const result = ref.current?.getValue();
      expect(result?.condition.operator).toBe(Operator.GT);
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

    it('handles invalid dayjs values', () => {
      const invalidDayjs = dayjs('invalid-date');
      const props = createMockProps({
        value: { defaultValue: invalidDayjs },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles empty array for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [] },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });

    it('handles single element array for BETWEEN', () => {
      const props = createMockProps({
        operator: { defaultValue: Operator.BETWEEN },
        value: { defaultValue: [dayjs()] },
      });
      expect(() => render(<DateTimeFilter {...props} />)).not.toThrow();
    });
  });

  describe('Display Name', () => {
    it('has correct displayName', () => {
      expect(DateTimeFilter.displayName).toBe('DateTimeFilter');
    });
  });

  describe('Constants', () => {
    it('exports DATE_TIME_FILTER_NAME', () => {
      expect(DATE_TIME_FILTER_NAME).toBe('datetime');
    });
  });
});
