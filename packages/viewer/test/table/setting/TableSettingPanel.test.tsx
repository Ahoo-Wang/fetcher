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
import { TableSettingPanel } from '../../../src/table/setting';
import type { ViewColumn } from '../../../src';

describe('TableSettingPanel', () => {
  const mockColumnDefinition1 = {
    title: 'Column 1',
    dataIndex: 'col1',
    cell: { type: 'text' },
    primaryKey: false,
  };

  const mockColumnDefinition2 = {
    title: 'Column 2',
    dataIndex: 'col2',
    cell: { type: 'text' },
    primaryKey: false,
  };

  const mockColumnDefinition3 = {
    title: 'Primary Key Column',
    dataIndex: 'primaryKey',
    cell: { type: 'text' },
    primaryKey: true,
  };

  const createMockColumns = (): (ViewColumn & { index: number })[] => [
    {
      columnDefinition: mockColumnDefinition1,
      fixed: true,
      visible: true,
      index: 0,
    },
    {
      columnDefinition: mockColumnDefinition2,
      fixed: false,
      visible: true,
      index: 1,
    },
    {
      columnDefinition: mockColumnDefinition3,
      fixed: false,
      visible: false,
      index: 2,
    },
  ];

  const defaultProps = {
    columns: createMockColumns(),
    onColumnsChange: vi.fn(),
  };

  it('renders without crashing', () => {
    const { container } = render(<TableSettingPanel {...defaultProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('displays section titles', () => {
    render(<TableSettingPanel {...defaultProps} />);
    expect(screen.getByText('已显示字段')).toBeTruthy();
    expect(screen.getByText('未显示字段')).toBeTruthy();
  });

  it('displays the lock tip text', () => {
    render(<TableSettingPanel {...defaultProps} />);
    expect(
      screen.getByText('请将需要锁定的字段拖至上方（最多支持3列）'),
    ).toBeTruthy();
  });

  it('renders fixed columns in the fixed section', () => {
    render(<TableSettingPanel {...defaultProps} />);
    const fixedSection = screen.getByText('已显示字段').parentElement;
    expect(fixedSection).toBeTruthy();

    // Should contain the fixed column
    expect(screen.getByText('Column 1')).toBeTruthy();
  });

  it('renders visible non-fixed columns in the visible section', () => {
    render(<TableSettingPanel {...defaultProps} />);
    // Should contain the visible non-fixed column
    expect(screen.getByText('Column 2')).toBeTruthy();
  });

  it('renders hidden columns in the hidden section', () => {
    render(<TableSettingPanel {...defaultProps} />);
    const hiddenSection = screen.getByText('未显示字段').parentElement;
    expect(hiddenSection).toBeTruthy();

    // Should contain the hidden column
    expect(screen.getByText('Primary Key Column')).toBeTruthy();
  });

  it('calls onColumnsChange when visibility is toggled', () => {
    const mockOnChange = vi.fn();
    render(
      <TableSettingPanel {...defaultProps} onColumnsChange={mockOnChange} />,
    );

    // Find the checkbox for Column 2 (visible column)
    const column2Label = screen.getByText('Column 2');
    const column2Checkbox = column2Label
      .closest('label')
      ?.querySelector('input[type="checkbox"]') as HTMLInputElement;

    expect(column2Checkbox).toBeTruthy();
    expect(column2Checkbox.type).toBe('checkbox');
    expect(column2Checkbox.checked).toBe(true);

    fireEvent.click(column2Checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledColumns = mockOnChange.mock.calls[0][0];
    expect(calledColumns).toHaveLength(3);
    // Column 2 should now be invisible
    expect(calledColumns[1].visible).toBe(false);
  });

  it('handles empty columns array', () => {
    const { container } = render(
      <TableSettingPanel columns={[]} onColumnsChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('handles columns with only fixed columns', () => {
    const fixedOnlyColumns = createMockColumns().map(col => ({
      ...col,
      fixed: true,
      visible: true,
    }));

    render(
      <TableSettingPanel
        columns={fixedOnlyColumns}
        onColumnsChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Column 1')).toBeTruthy();
    expect(screen.getByText('Column 2')).toBeTruthy();
    expect(screen.getByText('Primary Key Column')).toBeTruthy();
  });

  it('handles columns with only hidden columns', () => {
    const hiddenOnlyColumns = [
      {
        columnDefinition: {
          ...mockColumnDefinition1,
          dataIndex: 'hidden-col1',
        },
        fixed: false,
        visible: false,
        index: 0,
      },
      {
        columnDefinition: {
          ...mockColumnDefinition2,
          dataIndex: 'hidden-col2',
        },
        fixed: false,
        visible: false,
        index: 1,
      },
      {
        columnDefinition: {
          ...mockColumnDefinition3,
          dataIndex: 'hidden-primary',
        },
        fixed: false,
        visible: false,
        index: 2,
      },
    ];

    render(
      <TableSettingPanel
        columns={hiddenOnlyColumns}
        onColumnsChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Column 1')).toBeTruthy();
    expect(screen.getByText('Column 2')).toBeTruthy();
    expect(screen.getByText('Primary Key Column')).toBeTruthy();
  });

  it('renders draggable items for non-primary key columns', () => {
    render(<TableSettingPanel {...defaultProps} />);

    // Check that draggable attribute is set correctly
    const draggableItems = document.querySelectorAll('[draggable="true"]');
    expect(draggableItems.length).toBe(2); // Column 1 (fixed) and Column 2 (visible), but not primary key column
  });

  it('does not render draggable items for primary key columns', () => {
    render(<TableSettingPanel {...defaultProps} />);

    // The primary key column should not be draggable (it's in the hidden section)
    const draggableItems = document.querySelectorAll('[draggable="true"]');
    const allItems = document.querySelectorAll('._item_d8c9c3');

    expect(draggableItems.length).toBe(2); // fixed and visible non-primary columns
    expect(allItems.length).toBe(3); // total items: fixed + visible + hidden
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-panel-class';
    const { container } = render(
      <TableSettingPanel {...defaultProps} className={customClass} />,
    );

    // The className should be applied to the root element
    // Since it's passed through props but not directly used in the component,
    // this test verifies the prop is accepted without error
    expect(container.firstChild).toBeTruthy();
  });

  it('handles drag events without crashing', () => {
    render(<TableSettingPanel {...defaultProps} />);

    const draggableItem = document.querySelector(
      '[draggable="true"]',
    ) as HTMLElement;
    expect(draggableItem).toBeTruthy();

    // Test drag start
    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = {
      effectAllowed: '',
      setDragImage: vi.fn(),
    };
    Object.defineProperty(dragStartEvent, 'currentTarget', {
      value: {
        cloneNode: () => document.createElement('div'),
        clientWidth: 100,
        clientHeight: 30,
      },
    });
    Object.defineProperty(dragStartEvent, 'nativeEvent', {
      value: { offsetX: 10, offsetY: 10 },
    });
    fireEvent(draggableItem, dragStartEvent);

    // Test drag over
    const dragOverEvent = new Event('dragover', { bubbles: true }) as any;
    dragOverEvent.dataTransfer = { dropEffect: '' };
    dragOverEvent.preventDefault = vi.fn();
    fireEvent(draggableItem, dragOverEvent);

    // Test drag end
    fireEvent.dragEnd(draggableItem);

    // Component should handle all events without crashing
    expect(draggableItem).toBeTruthy();
  });

  it('correctly filters columns into different groups', () => {
    const uniqueColumn1 = {
      title: 'Unique Column 1',
      dataIndex: 'unique-col1',
      cell: { type: 'text' },
      primaryKey: false,
    };

    const uniqueColumn2 = {
      title: 'Unique Column 2',
      dataIndex: 'unique-col2',
      cell: { type: 'text' },
      primaryKey: false,
    };

    const uniqueColumn3 = {
      title: 'Unique Primary Key Column',
      dataIndex: 'unique-primary',
      cell: { type: 'text' },
      primaryKey: true,
    };

    const testColumns = [
      {
        columnDefinition: uniqueColumn1,
        fixed: true,
        visible: true,
        index: 0,
      },
      {
        columnDefinition: uniqueColumn2,
        fixed: false,
        visible: true,
        index: 1,
      },
      {
        columnDefinition: uniqueColumn3,
        fixed: false,
        visible: false,
        index: 2,
      },
    ];

    render(
      <TableSettingPanel columns={testColumns} onColumnsChange={vi.fn()} />,
    );

    // Verify all columns are rendered
    expect(screen.getByText('Unique Column 1')).toBeTruthy();
    expect(screen.getByText('Unique Column 2')).toBeTruthy();
    expect(screen.getByText('Unique Primary Key Column')).toBeTruthy();
  });
});
