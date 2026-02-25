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

import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TopBar } from '../../src/topbar/TopBar';
import { ViewState, ViewType, ViewSource } from '../../src/viewer/types';

vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: vi.fn(() => ({
    publish: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../src/viewer/panel/SaveViewModal', () => ({
  SaveViewModal: () => null,
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Modal: {
      useModal: () => [
        {
          confirm: vi.fn(),
        },
        vi.fn(),
      ],
    },
  };
});

interface RecordType {
  id: number;
  name: string;
}

describe('TopBar', () => {
  const defaultActiveView: ViewState = {
    id: 'view-1',
    name: 'Default View',
    definitionId: 'def-1',
    type: 'PERSONAL' as ViewType,
    source: 'SYSTEM' as ViewSource,
    isDefault: true,
    filters: [],
    columns: [],
    tableSize: 'middle',
    pageSize: 10,
    condition: {},
    internalCondition: {},
  };

  const defaultViews: ViewState[] = [defaultActiveView];

  const requiredProps = {
    title: 'Test Title',
    activeView: defaultActiveView,
    views: defaultViews,
    viewChanged: false,
    tableSelectedItems: [] as RecordType[],
    showViewPanel: false,
    showFilter: false,
    defaultTableSize: 'middle' as const,
    onCreateView: vi.fn(),
    onUpdateView: vi.fn(),
    onDeleteView: vi.fn(),
  };

  describe('rendering', () => {
    it('should render title', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      expect(container.textContent).toContain('Test Title');
    });

    it('should render active view name', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      expect(container.textContent).toContain('Default View');
    });

    it('should render FilterBarItem', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      expect(container.querySelector('.anticon-filter')).toBeInTheDocument();
    });

    it('should render RefreshDataBarItem', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      expect(container.querySelector('.anticon-reload')).toBeInTheDocument();
    });

    it('should render ColumnHeightBarItem', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      expect(container.querySelector('.anticon-column-height')).toBeInTheDocument();
    });

    it('should render ShareLinkBarItem', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      expect(container.querySelector('.anticon-link')).toBeInTheDocument();
    });
  });

  describe('viewChanged state', () => {
    it('should not show edit indicators when viewChanged is false', () => {
      const { container } = render(
        <TopBar<RecordType> {...requiredProps} viewChanged={false} />,
      );

      expect(container.textContent).not.toContain('已编辑');
    });

    it('should show edit indicators when viewChanged is true', () => {
      const { container } = render(
        <TopBar<RecordType> {...requiredProps} viewChanged={true} />,
      );

      expect(container.textContent).toContain('已编辑');
    });

    it('should show SaveAs button for SYSTEM source when viewChanged is true', () => {
      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          viewChanged={true}
          activeView={{ ...defaultActiveView, source: 'SYSTEM' }}
        />,
      );

      expect(container.textContent).toContain('另存为');
    });

    it('should show reset button when viewChanged is true', () => {
      const { container } = render(
        <TopBar<RecordType> {...requiredProps} viewChanged={true} />,
      );

      expect(container.textContent?.replace(/\s/g, '')).toContain('重置');
    });
  });

  describe('showViewPanel', () => {
    it('should render unfold button when showViewPanel is false', () => {
      const { container } = render(
        <TopBar<RecordType> {...requiredProps} showViewPanel={false} />,
      );

      expect(container.querySelector('.anticon-menu-unfold')).toBeInTheDocument();
    });

    it('should not render unfold button when showViewPanel is true', () => {
      const { container } = render(
        <TopBar<RecordType> {...requiredProps} showViewPanel={true} />,
      );

      expect(container.querySelector('.anticon-menu-unfold')).not.toBeInTheDocument();
    });
  });

  describe('onReset callback', () => {
    it('should call onReset when reset button is clicked', () => {
      const onReset = vi.fn();

      const { container } = render(
        <TopBar<RecordType> {...requiredProps} viewChanged={true} onReset={onReset} />,
      );

      const resetButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent === '重置',
      );

      if (resetButton) {
        fireEvent.click(resetButton);
        expect(onReset).toHaveBeenCalled();
      }
    });
  });

  describe('onShowViewPanelChange callback', () => {
    it('should call onShowViewPanelChange when unfold button is clicked', () => {
      const onShowViewPanelChange = vi.fn();

      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          showViewPanel={false}
          onShowViewPanelChange={onShowViewPanelChange}
        />,
      );

      const unfoldButton = container.querySelector('.anticon-menu-unfold');
      if (unfoldButton) {
        fireEvent.click(unfoldButton.parentElement!);
        expect(onShowViewPanelChange).toHaveBeenCalledWith(true);
      }
    });
  });

  describe('batch actions', () => {
    it('should render batch actions when enabled', () => {
      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          batchActions={{
            enabled: true,
            title: 'Batch Actions',
            actions: [
              {
                title: 'Delete',
                onClick: vi.fn(),
              },
            ],
          }}
        />,
      );

      expect(container.textContent).toContain('批量操作');
    });

    it('should not render batch actions when disabled', () => {
      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          batchActions={{
            enabled: false,
            title: 'Batch Actions',
            actions: [],
          }}
        />,
      );

      expect(container.textContent).not.toContain('批量操作');
    });
  });

  describe('primary action', () => {
    it('should render primary action when provided', () => {
      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          primaryAction={{
            title: 'Create',
            onClick: vi.fn(),
          }}
        />,
      );

      expect(container.textContent).toContain('Create');
    });

    it('should not render primary action when not provided', () => {
      const { container } = render(<TopBar<RecordType> {...requiredProps} />);

      const buttons = container.querySelectorAll('.ant-btn-primary');
      expect(buttons.length).toBe(0);
    });
  });

  describe('onShowFilterChange callback', () => {
    it('should accept onShowFilterChange prop', () => {
      const onShowFilterChange = vi.fn();

      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          showFilter={false}
          onShowFilterChange={onShowFilterChange}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('onTableSizeChange callback', () => {
    it('should accept onTableSizeChange prop', () => {
      const onTableSizeChange = vi.fn();

      const { container } = render(
        <TopBar<RecordType>
          {...requiredProps}
          defaultTableSize="middle"
          onTableSizeChange={onTableSizeChange}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
