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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextCell } from '../../../src';

describe('TextCell', () => {
  it('should render text value correctly', () => {
    const props = {
      data: {
        value: 'Hello World',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render empty string', () => {
    const props = {
      data: {
        value: '',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<TextCell {...props} />);
    const textElement = container.querySelector('.ant-typography');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('');
  });

  it('should render special characters', () => {
    const specialText = 'Special: & < > " \' / \\';
    const props = {
      data: {
        value: specialText,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText(specialText)).toBeInTheDocument();
  });

  it('should render long text without truncation by default', () => {
    const longText = 'A'.repeat(1000);
    const props = {
      data: {
        value: longText,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('should apply ellipsis attribute', () => {
    const longText = 'A'.repeat(100);
    const props = {
      data: {
        value: longText,
        record: { id: 1 },
        index: 0,
      },
      attributes: { ellipsis: true },
    };

    render(<TextCell {...props} />);
    const textElement = screen.getByText(longText);
    expect(textElement).toHaveClass('ant-typography-ellipsis');
  });

  it('should apply custom className', () => {
    const props = {
      data: {
        value: 'Test',
        record: { id: 1 },
        index: 0,
      },
      attributes: { className: 'custom-class' },
    };

    render(<TextCell {...props} />);
    const textElement = screen.getByText('Test');
    expect(textElement).toHaveClass('custom-class');
  });

  it('should apply style attribute', () => {
    const props = {
      data: {
        value: 'Styled Text',
        record: { id: 1 },
        index: 0,
      },
      attributes: { style: { color: 'red', fontSize: '14px' } },
    };

    render(<TextCell {...props} />);
    const textElement = screen.getByText('Styled Text');
    expect(textElement).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      fontSize: '14px',
    });
  });

  it('should handle numeric value converted to string', () => {
    const props = {
      data: {
        value: 123 as any, // Testing with non-string value
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should handle boolean true value (renders nothing)', () => {
    const props = {
      data: {
        value: true as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<TextCell {...props} />);
    const textElement = container.querySelector('.ant-typography');
    expect(textElement?.textContent).toBe('');
  });

  it('should handle boolean false value (renders nothing)', () => {
    const props = {
      data: {
        value: false as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<TextCell {...props} />);
    const textElement = container.querySelector('.ant-typography');
    expect(textElement?.textContent).toBe('');
  });

  it('should handle null value (renders empty)', () => {
    const props = {
      data: {
        value: null as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<TextCell {...props} />);
    const textElement = container.querySelector('.ant-typography');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('');
  });

  it('should handle undefined value (renders empty)', () => {
    const props = {
      data: {
        value: undefined as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<TextCell {...props} />);
    const textElement = container.querySelector('.ant-typography');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('');
  });

  it('should handle object value (throws error)', () => {
    const obj = { key: 'value' };
    const props = {
      data: {
        value: obj as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    expect(() => render(<TextCell {...props} />)).toThrow(
      'Objects are not valid as a React child',
    );
  });

  it('should handle array value (renders concatenated)', () => {
    const arr = ['a', 'b', 'c'];
    const props = {
      data: {
        value: arr as any,
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    const { container } = render(<TextCell {...props} />);
    const textElement = container.querySelector('.ant-typography');
    expect(textElement?.textContent).toBe('abc');
  });

  it('should render with different record types', () => {
    const props = {
      data: {
        value: 'Test',
        record: { name: 'John', age: 30 }, // Different record type
        index: 5,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render with zero index', () => {
    const props = {
      data: {
        value: 'Zero Index',
        record: { id: 1 },
        index: 0,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText('Zero Index')).toBeInTheDocument();
  });

  it('should render with large index', () => {
    const props = {
      data: {
        value: 'Large Index',
        record: { id: 1 },
        index: 999999,
      },
      attributes: {},
    };

    render(<TextCell {...props} />);
    expect(screen.getByText('Large Index')).toBeInTheDocument();
  });

  it('should apply multiple attributes', () => {
    const props = {
      data: {
        value: 'Multi Attr',
        record: { id: 1 },
        index: 0,
      },
      attributes: {
        ellipsis: true,
        className: 'multi-class',
        style: { color: 'blue' },
        title: 'Tooltip text',
      },
    };

    render(<TextCell {...props} />);
    const textElement = screen.getByText('Multi Attr');
    expect(textElement).toHaveClass('ant-typography-ellipsis');
    expect(textElement).toHaveClass('multi-class');
    expect(textElement).toHaveStyle({ color: 'rgb(0, 0, 255)' });
    expect(textElement).toHaveAttribute('title', 'Tooltip text');
  });
});
