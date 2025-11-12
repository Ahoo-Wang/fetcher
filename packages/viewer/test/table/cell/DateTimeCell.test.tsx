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
import {
  DateTimeCell,
  DateTimeCellProps,
  DATETIME_CELL_TYPE,
} from '../../../src/table/cell';

describe('DateTimeCell Component', () => {
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

  // Sample data
  const sampleEvent: Event = {
    id: 1,
    title: 'User Login',
    createdAt: '2024-01-15T10:30:45Z',
    updatedAt: 1705312245000,
  };

  const sampleLog: Log = {
    id: 1,
    message: 'System startup',
    timestamp: 1705312200000,
    date: new Date('2024-01-15T10:30:00Z'),
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render string datetime with default format', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render numeric timestamp with default format', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: 1705312245000,
          record: sampleEvent,
          index: 1,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs(1705312245000).format('YYYY-MM-DD HH:mm:ss');
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render Date object with default format', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const props: DateTimeCellProps<Log> = {
        data: {
          value: testDate,
          record: sampleLog,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs(testDate).format('YYYY-MM-DD HH:mm:ss');
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render Dayjs object with default format', () => {
      const dayjsDate = dayjs('2024-01-15T10:30:45Z');
      const props: DateTimeCellProps<Event> = {
        data: {
          value: dayjsDate,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjsDate.format('YYYY-MM-DD HH:mm:ss');
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should render with different record types', () => {
      const eventProps: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const logProps: DateTimeCellProps<Log> = {
        data: {
          value: 1705312200000,
          record: sampleLog,
          index: 1,
        },
        attributes: {},
      };

      const { rerender } = render(<DateTimeCell {...eventProps} />);
      const eventExpected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(eventExpected)).toBeInTheDocument();

      rerender(<DateTimeCell {...logProps} />);
      const logExpected = dayjs(1705312200000).format('YYYY-MM-DD HH:mm:ss');
      expect(screen.getByText(logExpected)).toBeInTheDocument();
    });

    it('should render with different index values', () => {
      const indices = [0, 1, 10, 100, 999];

      indices.forEach(index => {
        const props: DateTimeCellProps<Event> = {
          data: {
            value: '2024-01-15T10:30:45Z',
            record: sampleEvent,
            index,
          },
          attributes: {},
        };

        const { rerender } = render(<DateTimeCell {...props} />);
        const expected = dayjs('2024-01-15T10:30:45Z').format(
          'YYYY-MM-DD HH:mm:ss',
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
        cleanup();
      });
    });
  });

  describe('Custom Formatting', () => {
    it('should apply custom format string', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: { format: 'YYYY/MM/DD HH:mm' },
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format('YYYY/MM/DD HH:mm');
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should apply various custom formats', () => {
      const formats = [
        'YYYY-MM-DD',
        'MM/DD/YYYY',
        'DD MMM YYYY',
        'HH:mm:ss',
        'hh:mm A',
        'YYYY-MM-DD HH:mm:ss.SSS',
      ];

      formats.forEach(format => {
        const props: DateTimeCellProps<Event> = {
          data: {
            value: '2024-01-15T10:30:45Z',
            record: sampleEvent,
            index: 0,
          },
          attributes: { format },
        };

        const { rerender } = render(<DateTimeCell {...props} />);
        const expected = dayjs('2024-01-15T10:30:45Z').format(format);
        expect(screen.getByText(expected)).toBeInTheDocument();
        cleanup();
      });
    });

    it('should handle format with numeric timestamp', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: 1705312245000,
          record: sampleEvent,
          index: 0,
        },
        attributes: { format: 'MMM DD, YYYY hh:mm A' },
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs(1705312245000).format('MMM DD, YYYY hh:mm A');
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Null and Invalid Values', () => {
    it('should render dash for null value', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: null as any,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for undefined value', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: undefined as any,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid string date', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: 'invalid-date',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid numeric timestamp', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: NaN,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid Date object', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: new Date('invalid'),
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render dash for invalid Dayjs object', () => {
      const invalidDayjs = dayjs('invalid-date');
      const props: DateTimeCellProps<Event> = {
        data: {
          value: invalidDayjs,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('TextProps Attributes', () => {
    it('should apply style attribute', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          style: { color: 'red', fontWeight: 'bold' },
        },
      };

      const { container } = render(<DateTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toHaveStyle({
        color: 'rgb(255, 0, 0)',
        fontWeight: 'bold',
      });
    });

    it('should apply className attribute', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          className: 'custom-datetime',
        },
      };

      const { container } = render(<DateTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toHaveClass('custom-datetime');
    });

    it('should apply ellipsis attribute', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          ellipsis: true,
        },
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      const textElement = screen.getByText(expected);
      expect(textElement).toHaveClass('ant-typography-ellipsis');
    });

    it('should combine format and other attributes', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          format: 'YYYY/MM/DD',
          style: { color: 'blue' },
          className: 'formatted-date',
        },
      };

      const { container } = render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format('YYYY/MM/DD');
      expect(screen.getByText(expected)).toBeInTheDocument();

      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toHaveStyle({ color: 'rgb(0, 0, 255)' });
      expect(textElement).toHaveClass('formatted-date');
    });
  });

  describe('Edge Cases and Special Values', () => {
    it('should handle very old dates', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '1900-01-01T00:00:00Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('1900-01-01T00:00:00Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle future dates', () => {
      const futureDate = dayjs().add(1, 'year').format();
      const props: DateTimeCellProps<Event> = {
        data: {
          value: futureDate,
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      // Just check that it renders without error
      expect(
        screen.getByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
      ).toBeInTheDocument();
    });

    it('should handle timezone differences', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45+08:00',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45+08:00').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle milliseconds in timestamp', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: 1705312245123,
          record: sampleEvent,
          index: 0,
        },
        attributes: { format: 'YYYY-MM-DD HH:mm:ss.SSS' },
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs(1705312245123).format('YYYY-MM-DD HH:mm:ss.SSS');
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle null record gracefully', () => {
      const props: DateTimeCellProps<any> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: null,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle undefined record gracefully', () => {
      const props: DateTimeCellProps<any> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: undefined,
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle empty object record', () => {
      const props: DateTimeCellProps<any> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: {},
          index: 0,
        },
        attributes: {},
      };

      render(<DateTimeCell {...props} />);
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Integration and Constants', () => {
    it('should export DATETIME_CELL_TYPE constant', () => {
      expect(DATETIME_CELL_TYPE).toBe('datetime');
      expect(typeof DATETIME_CELL_TYPE).toBe('string');
    });
  });

  describe('Performance and Memory', () => {
    it('should render efficiently with many re-renders', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const { rerender } = render(<DateTimeCell {...props} />);

      // Re-render multiple times to test performance
      for (let i = 0; i < 100; i++) {
        rerender(<DateTimeCell {...props} />);
      }

      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('DOM Structure', () => {
    it('should render as Typography.Text element', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<DateTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      expect(textElement).toBeInTheDocument();
      expect(textElement?.tagName).toBe('SPAN');
    });

    it('should contain the formatted date text', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {},
      };

      const { container } = render(<DateTimeCell {...props} />);
      const textElement = container.querySelector('.ant-typography');
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(textElement?.textContent).toBe(expected);
    });
  });

  describe('Error Boundaries and Resilience', () => {
    it('should handle malformed format strings gracefully', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
          record: sampleEvent,
          index: 0,
        },
        attributes: {
          format: 'invalid[format]string',
        },
      };

      // Should not throw an error, dayjs will format with the malformed string
      expect(() => render(<DateTimeCell {...props} />)).not.toThrow();
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'invalid[format]string',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('should handle extreme attribute values', () => {
      const props: DateTimeCellProps<Event> = {
        data: {
          value: '2024-01-15T10:30:45Z',
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
          format: 'YYYY-MM-DD HH:mm:ss',
        },
      };

      expect(() => render(<DateTimeCell {...props} />)).not.toThrow();
      const expected = dayjs('2024-01-15T10:30:45Z').format(
        'YYYY-MM-DD HH:mm:ss',
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});
