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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

import {
  CalendarTimeCell,
  CalendarTimeProps,
  CALENDAR_CELL_TYPE,
  DEFAULT_CALENDAR_FORMATS,
} from '../../../src';

dayjs.extend(calendar);

describe('CalendarTimeCell Component', () => {
  // Test data interfaces
  interface Event {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: number;
  }

  interface Log {
    id: number;
    message: string;
    timestamp: number;
    date: Date;
  }

  // Sample data - using relative dates for testing
  const now = dayjs();
  const today = now.startOf('day').add(10, 'hours').add(30, 'minutes'); // Today at 10:30
  const yesterday = now
    .subtract(1, 'day')
    .startOf('day')
    .add(15, 'hours')
    .add(45, 'minutes'); // Yesterday at 15:45
  const tomorrow = now.add(1, 'day').startOf('day').add(9, 'hours'); // Tomorrow at 9:00
  const lastWeek = now.subtract(1, 'week').startOf('day').add(14, 'hours'); // Last week at 14:00
  const oldDate = now.subtract(2, 'months'); // 2 months ago

  const sampleEvent: Event = {
    id: 1,
    title: 'User Login',
    createdAt: today.format(),
    updatedAt: today.valueOf(),
  };

  const sampleLog: Log = {
    id: 1,
    message: 'System startup',
    timestamp: yesterday.valueOf(),
    date: yesterday.toDate(),
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render today datetime with default calendar format', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render yesterday datetime with default calendar format', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: yesterday.valueOf(),
          record: sampleEvent,
          index: 1,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = yesterday.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render Date object with default calendar format', () => {
      const testDate = yesterday.toDate();
      const props: CalendarTimeProps<Log> = {
        data: {
          value: testDate,
          record: sampleLog,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = dayjs(testDate).calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render Dayjs object with default calendar format', () => {
      const dayjsDate = tomorrow;
      const props: CalendarTimeProps<Event> = {
        data: {
          value: dayjsDate,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = dayjsDate.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render with different record types', () => {
      const eventProps: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const logProps: CalendarTimeProps<Log> = {
        data: {
          value: yesterday.valueOf(),
          record: sampleLog,
          index: 1,
        },
        attributes: {},
      };

      const { rerender } = render(<CalendarTimeCell {...eventProps} />);
      const eventExpected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(eventExpected)).toBeInTheDocument();

      rerender(<CalendarTimeCell {...logProps} />);
      const logExpected = yesterday.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(logExpected)).toBeInTheDocument();
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999];

      indices.forEach(index => {
        const props: CalendarTimeProps<Event> = {
          data: {
            value: today.format(),
            record: sampleEvent,
            index,
          },
          attributes: {},
        };

        const { rerender } = render(<CalendarTimeCell {...props} />);
        const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
        expect(screen.getByText(expected)).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Custom Calendar Formats', () => {
    it('should apply custom calendar formats', () => {
      const customFormats = {
        sameDay: '[Today at] HH:mm',
        nextDay: '[Tomorrow at] HH:mm',
        nextWeek: 'dddd [at] HH:mm',
        lastDay: '[Yesterday at] HH:mm',
        lastWeek: '[Last] dddd [at] HH:mm',
        sameElse: 'MMM DD, YYYY [at] HH:mm',
      };

      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: { formats: customFormats },
      };

      render(<CalendarTimeCell {...props} />);
      const expected = today.calendar(null, customFormats);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle partial custom formats', () => {
      const partialFormats = {
        sameDay: '[今天] HH:mm',
        lastDay: '[昨天] HH:mm',
      };

      const props: CalendarTimeProps<Event> = {
        data: {
          value: yesterday.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: { formats: partialFormats },
      };

      render(<CalendarTimeCell {...props} />);
      const expected = yesterday.calendar(null, {
        ...DEFAULT_CALENDAR_FORMATS,
        ...partialFormats,
      });
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle old dates with sameElse format', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: oldDate.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = oldDate.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Null and Invalid Values', () => {
    it('should render dash for null value', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: null as any,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for undefined value', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: undefined as any,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid string date', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: 'invalid-date',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid numeric timestamp', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: NaN,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid Date object', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: new Date('invalid'),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid Dayjs object', () => {
      const invalidDayjs = dayjs('invalid-date');
      const props: CalendarTimeProps<Event> = {
        data: {
          value: invalidDayjs,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('TextProps Attributes', () => {
    it('should apply style attribute', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          style: { color: 'red', fontWeight: 'bold' },
        },
      };

      const { container } = render(<CalendarTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toHaveStyle({
        color: 'rgb(255, 0, 0)',
        fontWeight: 'bold',
      });
    });

    it('should apply className attribute', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          className: 'custom-calendar',
        },
      };

      const { container } = render(<CalendarTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toHaveClass('custom-calendar');
    });

    it('should apply ellipsis attribute', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          ellipsis: true,
        },
      };

      render(<CalendarTimeCell {...props} />);
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      const textElement = screen.getByText(expected);
      expect(textElement).toHaveClass('ant-typography-ellipsis');
    });

    it('should combine formats and other attributes', () => {
      const customFormats = {
        sameDay: '[Today] HH:mm',
        lastDay: '[Yesterday] HH:mm',
      };

      const props: CalendarTimeProps<Event> = {
        data: {
          value: yesterday.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          formats: customFormats,
          style: { color: 'blue' },
          className: 'calendar-date',
        },
      };

      const { container } = render(<CalendarTimeCell {...props} />);
      const expected = yesterday.calendar(null, {
        ...DEFAULT_CALENDAR_FORMATS,
        ...customFormats,
      });
      expect(screen.getByText(expected)).toBeInTheDocument();

      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toHaveStyle({ color: 'rgb(0, 0, 255)' });
      expect(textElement).toHaveClass('calendar-date');
    });
  });

  describe('Edge Cases and Special Values', () => {
    it('should handle very old dates', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: '1900-01-01T00:00:00Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = dayjs('1900-01-01T00:00:00Z').calendar(
        null,
        DEFAULT_CALENDAR_FORMATS,
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle future dates', () => {
      const futureDate = dayjs().add(1, 'year');
      const props: CalendarTimeProps<Event> = {
        data: {
          value: futureDate.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = futureDate.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle timezone differences', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45+08:00',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45+08:00').calendar(
        null,
        DEFAULT_CALENDAR_FORMATS,
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle milliseconds in timestamp', () => {
      const timestampWithMs = yesterday.valueOf() + 123;
      const props: CalendarTimeProps<Event> = {
        data: {
          value: timestampWithMs,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = dayjs(timestampWithMs).calendar(
        null,
        DEFAULT_CALENDAR_FORMATS,
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: CalendarTimeProps<any> = {
        data: {
          value: today.format(),
          record: null,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle undefined record gracefully', () => {
      const props: CalendarTimeProps<any> = {
        data: {
          value: today.format(),
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle empty object record', () => {
      const props: CalendarTimeProps<any> = {
        data: {
          value: today.format(),
          record: {},
          index: 0,
        },
        attributes: {},
      };

      render(<CalendarTimeCell {...props} />);
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Integration and Constants', () => {
    it('should export CALENDAR_CELL_TYPE constant', () => {
      expect(CALENDAR_CELL_TYPE).toBe('calendar-time');
      expect(typeof CALENDAR_CELL_TYPE).toBe('string');
    });

    it('should have default calendar formats', () => {
      expect(DEFAULT_CALENDAR_FORMATS).toBeDefined();
      expect(typeof DEFAULT_CALENDAR_FORMATS).toBe('object');
      expect(DEFAULT_CALENDAR_FORMATS.sameDay).toBeDefined();
      expect(DEFAULT_CALENDAR_FORMATS.lastDay).toBeDefined();
      expect(DEFAULT_CALENDAR_FORMATS.sameElse).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many re-renders', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const { rerender } = render(<CalendarTimeCell {...props} />);

      // Re-render multiple times to test performance
      for (let i = 0; i < 100; i++) {
        rerender(<CalendarTimeCell {...props} />);
      }

      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('should render as Typography.Text element', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<CalendarTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toBeInTheDocument();
      expect(textElement?.tagName).toBe('SPAN');
    });

    it('should contain the formatted calendar date text', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<CalendarTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(textElement?.textContent).toBe(expected);
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle malformed format strings gracefully', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          formats: {
            sameDay: 'invalid[format]string',
            lastDay: '[昨天] HH:mm',
            sameElse: 'YYYY-MM-DD HH:mm:ss',
          },
        },
      };

      // Should not throw an error, dayjs will format with the malformed string
      expect(() => render(<CalendarTimeCell {...props} />)).not.toThrow();
      const expected = today.calendar(null, {
        sameDay: 'invalid[format]string',
        lastDay: '[昨天] HH:mm',
        sameElse: 'YYYY-MM-DD HH:mm:ss',
      });
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle extreme attribute values', () => {
      const props: CalendarTimeProps<Event> = {
        data: {
          value: today.format(),
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          style: {
            fontSize: '1000px',
            margin: '-1000px',
            zIndex: 999999,
          },
          className: 'class1 class2 class3',
          formats: DEFAULT_CALENDAR_FORMATS,
        },
      };

      expect(() => render(<CalendarTimeCell {...props} />)).not.toThrow();
      const expected = today.calendar(null, DEFAULT_CALENDAR_FORMATS);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});
