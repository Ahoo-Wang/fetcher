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
import { TableFieldItem } from '../../../src';
import { ViewColumnDefinition } from '../../../src';

describe('TableFieldItem', () => {
  const mockColumnDefinition: ViewColumnDefinition = {
    title: 'Test Column',
    dataIndex: 'testColumn',
    type: 'text',
    primaryKey: false,
    sorter: true,
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
    // The DragOutlined icon from @ant-design/icons
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
    // The component uses Antd's Flex component which should have appropriate classes
    const flexContainer = container.firstChild;
    expect(flexContainer).toBeTruthy();
    // Check that it contains both checkbox and drag icon
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
    expect(container.querySelector('.anticon-drag')).toBeTruthy();
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

  it('handles column with sorter configuration', () => {
    const sorterColumn: ViewColumnDefinition = {
      ...mockColumnDefinition,
      sorter: { multiple: 1 },
    };

    const sorterProps = {
      ...defaultProps,
      columnDefinition: sorterColumn,
    };

    render(<TableFieldItem {...sorterProps} />);
    expect(screen.getByText('Test Column')).toBeTruthy();
  });

  it('handles column with render function', () => {
    const renderColumn: ViewColumnDefinition = {
      ...mockColumnDefinition,
      render: (value: any) => <span>Rendered: {value}</span>,
    };

    const renderProps = {
      ...defaultProps,
      columnDefinition: renderColumn,
    };

    render(<TableFieldItem {...renderProps} />);
    expect(screen.getByText('Test Column')).toBeTruthy();
  });

  it('handles column with attributes', () => {
    const attributesColumn: ViewColumnDefinition = {
      ...mockColumnDefinition,
      attributes: { width: 200, align: 'center' },
    };

    const attributesProps = {
      ...defaultProps,
      columnDefinition: attributesColumn,
    };

    render(<TableFieldItem {...attributesProps} />);
    expect(screen.getByText('Test Column')).toBeTruthy();
  });

  it('handles fixed prop correctly', () => {
    const fixedProps = {
      ...defaultProps,
      fixed: true,
    };

    render(<TableFieldItem {...fixedProps} />);
    // The fixed prop doesn't affect the UI directly, just passed to parent
    expect(screen.getByText('Test Column')).toBeTruthy();
  });

  it('maintains accessibility features', () => {
    render(<TableFieldItem {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    // Check that the checkbox has proper type
    expect(checkbox.type).toBe('checkbox');

    // Check that the column title is displayed (serves as label)
    expect(screen.getByText('Test Column')).toBeTruthy();
  });

  it('handles rapid visibility changes', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <TableFieldItem
        {...defaultProps}
        visible={true}
        onVisibleChange={mockOnChange}
      />,
    );

    // Change visibility prop
    rerender(
      <TableFieldItem
        {...defaultProps}
        visible={false}
        onVisibleChange={mockOnChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('does not call onVisibleChange when disabled', () => {
    const mockOnChange = vi.fn();
    const disabledProps = {
      ...defaultProps,
      columnDefinition: {
        ...mockColumnDefinition,
        primaryKey: true,
      },
      onVisibleChange: mockOnChange,
    };

    render(<TableFieldItem {...disabledProps} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);

    // Should not call the callback when disabled
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('renders with proper component structure', () => {
    const { container } = render(<TableFieldItem {...defaultProps} />);

    // Should have a container element
    expect(container.firstChild).toBeTruthy();

    // Should contain a checkbox and drag icon
    const checkbox = screen.getByRole('checkbox');
    const dragIcon = container.querySelector('.anticon-drag');

    expect(checkbox).toBeTruthy();
    expect(dragIcon).toBeTruthy();

    // Both elements should be present in the DOM
    expect(container.contains(checkbox)).toBe(true);
    expect(container.contains(dragIcon)).toBe(true);
  });
});
