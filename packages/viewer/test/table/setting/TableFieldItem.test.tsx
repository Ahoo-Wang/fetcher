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
import { describe, expect, it, vi } from 'vitest';
import { TableFieldItem } from '../../../src/table/setting';

describe('TableFieldItem', () => {
  const mockColumnDefinition = {
    title: 'Test Column',
    dataIndex: 'testColumn',
    cell: { type: 'text' },
    primaryKey: false,
  };

  const defaultProps = {
    columnDefinition: mockColumnDefinition,
    fixed: false,
    visible: true,
    onVisibleChange: vi.fn(),
  };

  it('renders without crashing', () => {
    const { container } = render(<TableFieldItem {...defaultProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('displays the column title in the checkbox label', () => {
    render(<TableFieldItem {...defaultProps} />);
    expect(screen.getByText('Test Column')).toBeTruthy();
  });

  it('renders the drag icon', () => {
    const { container } = render(<TableFieldItem {...defaultProps} />);
    const dragIcon = container.querySelector('.anticon-drag');
    expect(dragIcon).toBeTruthy();
  });

  it('sets checkbox to checked when visible is true', () => {
    render(<TableFieldItem {...defaultProps} visible={true} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('sets checkbox to unchecked when visible is false', () => {
    render(<TableFieldItem {...defaultProps} visible={false} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('disables checkbox when column is primary key', () => {
    const primaryKeyProps = {
      ...defaultProps,
      columnDefinition: {
        ...mockColumnDefinition,
        primaryKey: true,
      },
    };
    render(<TableFieldItem {...primaryKeyProps} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('enables checkbox when column is not primary key', () => {
    render(<TableFieldItem {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(false);
  });

  it('calls onVisibleChange when checkbox is toggled', () => {
    const mockOnChange = vi.fn();
    render(<TableFieldItem {...defaultProps} onVisibleChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(false);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('calls onVisibleChange with correct value when checked', () => {
    const mockOnChange = vi.fn();
    render(
      <TableFieldItem
        {...defaultProps}
        visible={false}
        onVisibleChange={mockOnChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('renders with flex layout for proper alignment', () => {
    const { container } = render(<TableFieldItem {...defaultProps} />);
    const wrapperDiv = container.querySelector('div[style]');
    expect(wrapperDiv).toBeTruthy();
    expect((wrapperDiv as HTMLElement).style.display).toBe('flex');
    expect((wrapperDiv as HTMLElement).style.justifyContent).toBe(
      'space-between',
    );
    expect((wrapperDiv as HTMLElement).style.width).toBe('100%');
  });

  it('handles different column titles correctly', () => {
    const customTitle = 'Custom Title';
    const customProps = {
      ...defaultProps,
      columnDefinition: {
        ...mockColumnDefinition,
        title: customTitle,
      },
    };

    render(<TableFieldItem {...customProps} />);
    expect(screen.getByText(customTitle)).toBeTruthy();
  });
});
