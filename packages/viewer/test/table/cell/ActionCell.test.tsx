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

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ActionCell, ActionCellProps } from '../../../src';

describe('ActionCell', () => {
  const mockClickHandler = vi.fn();

  const defaultProps: ActionCellProps = {
    data: {
      value: 'Edit',
      record: { id: 1, name: 'Test Item' },
      index: 0,
    },
    attributes: {
      onClick: mockClickHandler,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with correct title when value is provided', () => {
    render(<ActionCell {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  });

  it('renders null when no value is provided', () => {
    const propsWithoutValue: ActionCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: null as any,
      },
    };
    const { container } = render(<ActionCell {...propsWithoutValue} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when value is undefined', () => {
    const propsWithUndefinedValue: ActionCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: undefined as any,
      },
    };
    const { container } = render(<ActionCell {...propsWithUndefinedValue} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls click handler with correct parameters when button is clicked', () => {
    render(<ActionCell {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(button);

    expect(mockClickHandler).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Item',
    });
    expect(mockClickHandler).toHaveBeenCalledTimes(1);
  });

  it('renders with link button type by default', () => {
    render(<ActionCell {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Edit' });
    expect(button.classList.contains('ant-btn-link')).toBe(true);
  });

  it('handles different action keys and titles', () => {
    const deleteProps: ActionCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: 'Delete',
      },
    };

    render(<ActionCell {...deleteProps} />);
    const button = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(button);

    expect(mockClickHandler).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Item',
    });
  });

  it('passes record data correctly to click handler', () => {
    const complexRecord = {
      id: 42,
      name: 'Complex Item',
      nested: { prop: 'value' },
      array: [1, 2, 3],
    };

    const propsWithComplexRecord: ActionCellProps<typeof complexRecord> = {
      data: {
        value: 'View',
        record: complexRecord,
        index: 5,
      },
      attributes: {
        onClick: mockClickHandler,
      },
    };

    render(<ActionCell {...propsWithComplexRecord} />);
    const button = screen.getByRole('button', { name: 'View' });
    fireEvent.click(button);

    expect(mockClickHandler).toHaveBeenCalledWith(complexRecord);
  });
});
