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

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ViewDefinition, ViewColumn, TableSettingPanel } from '../../../src';

// Mock the useTableStateContext hook
const mockUseTableStateContext = vi.fn();
vi.mock('../../../src/viewer', () => ({
  useTableStateContext: () => mockUseTableStateContext(),
  ViewColumn: {},
  ViewDefinition: {},
}));

describe('TableSettingPanel', () => {
  const mockUpdateColumns = vi.fn();

  const mockColumns: ViewColumn[] = [
    {
      name: 'id',
      hidden: true,
      fixed: true,
    },
  ];

  const mockViewDefinition: ViewDefinition = {
    name: 'Test View',
    fields: [
      {
        label: 'ID',
        name: 'id',
        type: 'text',
        primaryKey: true,
        sorter: true,
      },
    ],
    availableFilters: [],
    dataUrl: '/api/test',
    countUrl: '/api/test/count',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTableStateContext.mockReturnValue({
      columns: mockColumns,
      updateColumns: mockUpdateColumns,
      tableSize: 'middle',
      updateTableSize: vi.fn(),
      refreshData: vi.fn(),
    });
  });

  it('renders without crashing', () => {
    render(<TableSettingPanel viewDefinition={mockViewDefinition} />);
    expect(screen.getByText('已显示字段')).toBeTruthy();
  });
});
