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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FilterPanel, FilterItem } from '../../src/filter/Filter';
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import '../../src/filter/IdFilter';
import '../../src/filter/TextFilter';

describe('FilterPanel', () => {
  const mockAvailableFields = [
    {
      name: 'id',
      label: 'ID',
      type: 'id',
    },
    {
      name: 'name',
      label: '名称',
      type: 'text',
    },
    {
      name: 'email',
      label: '邮箱',
      type: 'text',
    },
  ];

  const mockFilters: FilterItem[] = [
    {
      id: 'filter1',
      field: mockAvailableFields[0],
      type: 'id',
    },
  ];

  const mockConditions: Condition[] = [
    {
      field: 'id',
      operator: Operator.EQ,
      value: '123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<FilterPanel availableFields={mockAvailableFields} />);

    expect(screen.getByText('过滤条件')).toBeTruthy();
    expect(screen.getByText('暂无过滤条件，点击上方按钮添加')).toBeTruthy();
    expect(screen.getByText('添加过滤器')).toBeTruthy();
  });

  it('renders empty state when no available fields', () => {
    render(<FilterPanel availableFields={[]} />);

    expect(screen.getByText('暂无可用的过滤字段')).toBeTruthy();
  });

  it('renders with custom title', () => {
    render(
      <FilterPanel availableFields={mockAvailableFields} title="自定义标题" />,
    );

    expect(screen.getByText('自定义标题')).toBeTruthy();
  });

  it('renders existing filters in controlled mode', () => {
    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={mockFilters}
      />,
    );

    expect(screen.getByText('ID')).toBeTruthy();
    expect(screen.getByText('删除')).toBeTruthy();
  });

  it('calls onFiltersChange when adding filter', async () => {
    const mockOnFiltersChange = vi.fn();
    const mockOnFilterChange = vi.fn();

    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={[]}
        onFiltersChange={mockOnFiltersChange}
        onFilterChange={mockOnFilterChange}
      />,
    );

    const addButton = screen.getByText('添加过滤器');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            field: mockAvailableFields[0],
            type: 'id',
          }),
        ]),
      );
    });
  });

  it('calls onFiltersChange when removing filter', async () => {
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const removeButton = screen.getByText('删除');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
    });
  });

  it('calls onFiltersChange when clearing all filters', async () => {
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />,
    );

    const clearButton = screen.getByText('清空');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
    });
  });

  it('calls onFilterChange with initial conditions', () => {
    const mockOnFilterChange = vi.fn();

    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
      />,
    );

    // Should be called initially with empty conditions since filters have no values
    expect(mockOnFilterChange).toHaveBeenCalledWith([]);
  });

  it('shows valid conditions count', () => {
    const filtersWithValue: FilterItem[] = [
      {
        ...mockFilters[0],
        value: {
          condition: mockConditions[0],
          friendly: 'ID equals 123',
        },
      },
    ];

    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={filtersWithValue}
      />,
    );

    expect(screen.getByText('(1 个有效条件)')).toBeTruthy();
  });

  it('hides add button when all fields are used', () => {
    const allUsedFilters: FilterItem[] = mockAvailableFields.map(
      (field, index) => ({
        id: `filter${index}`,
        field,
        type: field.type,
      }),
    );

    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        filters={allUsedFilters}
      />,
    );

    expect(screen.queryByText('添加过滤器')).toBeFalsy();
  });

  it('hides clear button when no filters', () => {
    render(<FilterPanel availableFields={mockAvailableFields} filters={[]} />);

    expect(screen.queryByText('清空')).toBeFalsy();
  });

  it('supports collapsible mode', () => {
    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        collapsible={true}
        defaultExpanded={false}
      />,
    );

    expect(screen.getByText('展开')).toBeTruthy();
  });

  it('toggles expanded state in collapsible mode', async () => {
    render(
      <FilterPanel
        availableFields={mockAvailableFields}
        collapsible={true}
        defaultExpanded={true}
      />,
    );

    const toggleButton = screen.getByText('收起');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('展开')).toBeTruthy();
    });
  });

  it('maintains displayName for debugging', () => {
    expect(FilterPanel.displayName).toBe('FilterPanel');
  });

  it('works in uncontrolled mode', () => {
    render(<FilterPanel availableFields={mockAvailableFields} />);

    const addButton = screen.getByText('添加过滤器');

    // In uncontrolled mode, the component manages its own state
    // We can't easily test internal state changes without more complex setup
    expect(addButton).toBeTruthy();
  });
});
