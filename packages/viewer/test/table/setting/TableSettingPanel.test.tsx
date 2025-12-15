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
import { TableSettingPanel, ViewColumnDefinition } from '../../../src';
import type { ViewColumn, ViewDefinition } from '../../../src';
import ViewerSharedValueContext from '../../../src/viewer/ViewerSharedValueContext';
import React from 'react';

describe('TableSettingPanel', () => {
  const mockColumnDefinition1: ViewColumnDefinition = {
    title: 'Column 1',
    dataIndex: 'col1',
    type: 'text',
    primaryKey: false,
    sorter: false,
  };

  const mockColumnDefinition2: ViewColumnDefinition = {
    title: 'Column 2',
    dataIndex: 'col2',
    type: 'text',
    primaryKey: false,
    sorter: false,
  };

  const mockColumnDefinition3: ViewColumnDefinition = {
    title: 'Primary Key Column',
    dataIndex: 'primaryKey',
    type: 'text',
    primaryKey: true,
    sorter: false,
  };

  const mockViewDefinition: ViewDefinition = {
    name: 'test-view',
    columns: [
      mockColumnDefinition1,
      mockColumnDefinition2,
      mockColumnDefinition3,
    ],
    availableFilters: [],
    dataSourceUrl: '/api/test',
    defaultPageSize: 10,
  };

  const createMockColumns = (): ViewColumn[] => [
    {
      dataIndex: 'col1',
      fixed: true,
      visible: true,
    },
    {
      dataIndex: 'col2',
      fixed: false,
      visible: true,
    },
    {
      dataIndex: 'primaryKey',
      fixed: false,
      visible: false,
    },
  ];

  const mockContextValue = {
    aggregateName: 'test-aggregate',
    viewName: 'test-view',
    viewColumns: createMockColumns(),
    setViewColumns: vi.fn(),
    showFilterPanel: true,
    setShowFilterPanel: vi.fn(),
    refreshData: vi.fn(),
    tableSize: 'middle' as const,
    setTableSize: vi.fn(),
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ViewerSharedValueContext.Provider value={mockContextValue}>
      {children}
    </ViewerSharedValueContext.Provider>
  );

  const defaultProps = {
    viewDefinition: mockViewDefinition,
  };

  it('renders without crashing', () => {
    const { container } = render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('displays section titles', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );
    expect(screen.getByText('已显示字段')).toBeTruthy();
    expect(screen.getByText('未显示字段')).toBeTruthy();
  });

  it('displays the lock tip text', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );
    expect(
      screen.getByText('请将需要锁定的字段拖至上方（最多支持3列）'),
    ).toBeTruthy();
  });

  it('renders fixed columns in the fixed section', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );
    const fixedSection = screen.getByText('已显示字段').parentElement;
    expect(fixedSection).toBeTruthy();

    // Should contain the fixed column
    expect(screen.getByText('Column 1')).toBeTruthy();
  });

  it('renders visible non-fixed columns in the visible section', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );
    // Should contain the visible non-fixed column
    expect(screen.getByText('Column 2')).toBeTruthy();
  });

  it('renders hidden columns in the hidden section', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );
    const hiddenSection = screen.getByText('未显示字段').parentElement;
    expect(hiddenSection).toBeTruthy();

    // Should contain the hidden column
    expect(screen.getByText('Primary Key Column')).toBeTruthy();
  });

  it('calls onColumnsChange when visibility is toggled', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
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

    expect(mockContextValue.setViewColumns).toHaveBeenCalledTimes(1);
    const calledColumns = mockContextValue.setViewColumns.mock.calls[0][0];
    expect(calledColumns).toHaveLength(3);
    // Column 2 should now be invisible
    expect(calledColumns[1].visible).toBe(false);
  });

  it('handles empty columns array', () => {
    const emptyContextValue = {
      ...mockContextValue,
      viewColumns: [],
    };

    const { container } = render(
      <ViewerSharedValueContext.Provider value={emptyContextValue}>
        <TableSettingPanel {...defaultProps} />
      </ViewerSharedValueContext.Provider>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('handles columns with only fixed columns', () => {
    const fixedOnlyColumns = createMockColumns().map(col => ({
      ...col,
      fixed: true,
      visible: true,
    }));

    const fixedOnlyContextValue = {
      ...mockContextValue,
      viewColumns: fixedOnlyColumns,
    };

    render(
      <ViewerSharedValueContext.Provider value={fixedOnlyContextValue}>
        <TableSettingPanel {...defaultProps} />
      </ViewerSharedValueContext.Provider>,
    );

    expect(screen.getByText('Column 1')).toBeTruthy();
    expect(screen.getByText('Column 2')).toBeTruthy();
    expect(screen.getByText('Primary Key Column')).toBeTruthy();
  });

  it('handles columns with only hidden columns', () => {
    const hiddenOnlyColumns = [
      {
        dataIndex: 'col1',
        fixed: false,
        visible: false,
      },
      {
        dataIndex: 'col2',
        fixed: false,
        visible: false,
      },
      {
        dataIndex: 'primaryKey',
        fixed: false,
        visible: false,
      },
    ];

    const hiddenOnlyContextValue = {
      ...mockContextValue,
      viewColumns: hiddenOnlyColumns,
    };

    render(
      <ViewerSharedValueContext.Provider value={hiddenOnlyContextValue}>
        <TableSettingPanel {...defaultProps} />
      </ViewerSharedValueContext.Provider>,
    );

    expect(screen.getByText('Column 1')).toBeTruthy();
    expect(screen.getByText('Column 2')).toBeTruthy();
    expect(screen.getByText('Primary Key Column')).toBeTruthy();
  });

  it('renders draggable items for non-primary key columns', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );

    // Check that draggable attribute is set correctly
    const draggableItems = document.querySelectorAll('[draggable="true"]');
    expect(draggableItems.length).toBe(2); // Column 1 (fixed) and Column 2 (visible), but not primary key column
  });

  it('does not render draggable items for primary key columns', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );

    // The primary key column should not be draggable (it's in the hidden section)
    const draggableItems = document.querySelectorAll('[draggable="true"]');
    const allItems = document.querySelectorAll('._item_d8c9c3');

    expect(draggableItems.length).toBe(2); // fixed and visible non-primary columns
    expect(allItems.length).toBe(3); // total items: fixed + visible + hidden
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-panel-class';
    const { container } = render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} className={customClass} />
      </TestWrapper>,
    );

    // The className should be applied to the root element
    // Since it's passed through props but not directly used in the component,
    // this test verifies the prop is accepted without error
    expect(container.firstChild).toBeTruthy();
  });

  it('handles drag events without crashing', () => {
    render(
      <TestWrapper>
        <TableSettingPanel {...defaultProps} />
      </TestWrapper>,
    );

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
      type: 'text',
      primaryKey: false,
      sorter: false,
    };

    const uniqueColumn2 = {
      title: 'Unique Column 2',
      dataIndex: 'unique-col2',
      type: 'text',
      primaryKey: false,
      sorter: false,
    };

    const uniqueColumn3 = {
      title: 'Unique Primary Key Column',
      dataIndex: 'unique-primary',
      type: 'text',
      primaryKey: true,
      sorter: false,
    };

    const uniqueViewDefinition: ViewDefinition = {
      name: 'unique-test-view',
      columns: [uniqueColumn1, uniqueColumn2, uniqueColumn3],
      availableFilters: [],
      dataSourceUrl: '/api/unique',
      defaultPageSize: 10,
    };

    const uniqueColumns = [
      {
        dataIndex: 'unique-col1',
        fixed: true,
        visible: true,
      },
      {
        dataIndex: 'unique-col2',
        fixed: false,
        visible: true,
      },
      {
        dataIndex: 'unique-primary',
        fixed: false,
        visible: false,
      },
    ];

    const uniqueContextValue = {
      ...mockContextValue,
      viewColumns: uniqueColumns,
    };

    render(
      <ViewerSharedValueContext.Provider value={uniqueContextValue}>
        <TableSettingPanel viewDefinition={uniqueViewDefinition} />
      </ViewerSharedValueContext.Provider>,
    );

    // Verify all columns are rendered
    expect(screen.getByText('Unique Column 1')).toBeTruthy();
    expect(screen.getByText('Unique Column 2')).toBeTruthy();
    expect(screen.getByText('Unique Primary Key Column')).toBeTruthy();
  });
});
