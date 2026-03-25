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

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { FetcherViewer, FetcherViewerRef } from '../../src/fetcherviewer/FetcherViewer';
import type { PaginationProps } from 'antd';

vi.mock('../../src/fetcherviewer/hooks/useViewerDefinition', () => ({
  useViewerDefinition: vi.fn(),
}));

vi.mock('../../src/fetcherviewer/hooks/useViewerViews', () => ({
  useViewerViews: vi.fn(),
}));

vi.mock('../../src/fetcherviewer/hooks/useFetchData', () => ({
  useFetchData: vi.fn(),
}));

vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: vi.fn(() => ({
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(() => true),
  })),
}));

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useKeyStorage: vi.fn(() => [
    undefined,
    vi.fn(),
  ]),
}));

vi.mock('../../src/viewer/Viewer', () => ({
  Viewer: vi.fn(() => <div data-testid="viewer">Viewer</div>),
}));

import { useViewerDefinition } from '../../src';
import { useViewerViews } from '../../src';
import { useFetchData } from '../../src';

interface User {
  id: number;
  name: string;
}

describe('FetcherViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    viewerDefinitionId: 'test-view',
    ownerId: 'test-owner',
    tenantId: 'test-tenant',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  };

  const mockViewerDefinition = {
    id: 'test-view',
    name: 'Test View',
    fields: [
      { name: 'id', label: 'ID', type: 'number', primaryKey: true },
      { name: 'name', label: 'Name', type: 'text' },
    ],
    availableFilters: [],
    dataUrl: '/api/test',
    countUrl: '/api/test/count',
  };

  const mockViews = [
    {
      id: 'default-view',
      name: 'Default View',
      definitionId: 'test-view',
      type: 'PERSONAL' as const,
      source: 'SYSTEM' as const,
      isDefault: true,
      filters: [] as any[],
      columns: [
        { key: 'id', name: 'id', fixed: true, hidden: false },
        { key: 'name', name: 'name', fixed: false, hidden: false },
      ],
      tableSize: 'middle' as const,
      pageSize: 10,
      condition: {},
      internalCondition: {},
      sorter: [],
    },
  ];

  const mockDataSource = {
    list: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ],
    total: 2,
  };

  beforeEach(() => {
    vi.mocked(useViewerDefinition).mockReturnValue({
      viewerDefinition: mockViewerDefinition as any,
      loading: false,
      error: undefined,
    });

    vi.mocked(useViewerViews).mockReturnValue({
      views: mockViews as any,
      loading: false,
      error: undefined,
    });

    vi.mocked(useFetchData).mockReturnValue({
      dataSource: mockDataSource as any,
      loading: false,
      setQuery: vi.fn(),
      reload: vi.fn().mockResolvedValue(undefined),
      error: undefined,
      getPageQuery: vi.fn(),
    });
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<FetcherViewer<User> {...defaultProps} />);

      expect(container.firstChild).not.toBeNull();
    });

    it('should render loading state when definition is loading', () => {
      vi.mocked(useViewerDefinition).mockReturnValue({
        viewerDefinition: undefined,
        loading: true,
        error: undefined,
      });

      const { container } = render(<FetcherViewer<User> {...defaultProps} />);

      expect(container.firstChild).not.toBeNull();
    });

    it('should render error state when definition fails to load', () => {
      vi.mocked(useViewerDefinition).mockReturnValue({
        viewerDefinition: undefined,
        loading: false,
        error: new Error('Failed to load'),
      });

      const { container } = render(<FetcherViewer<User> {...defaultProps} />);

      expect(container.textContent).toContain('加载视图定义失败');
    });

    it('should render "no view definition" when definition is null', () => {
      vi.mocked(useViewerDefinition).mockReturnValue({
        viewerDefinition: undefined,
        loading: false,
        error: undefined,
      });

      const { container } = render(<FetcherViewer<User> {...defaultProps} />);

      expect(container.textContent).toContain('未找到视图定义');
    });

    it('should render "no views" when views array is empty', () => {
      vi.mocked(useViewerViews).mockReturnValue({
        views: [],
        loading: false,
        error: undefined,
      });

      const { container } = render(<FetcherViewer<User> {...defaultProps} />);

      expect(container.textContent).toContain('未找到视图');
    });
  });

  describe('ref', () => {
    it('should expose refreshData method via ref', () => {
      const ref = { current: null as FetcherViewerRef | null };

      render(<FetcherViewer<User> ref={ref} {...defaultProps} />);

      expect(ref.current).toHaveProperty('refreshData');
    });

    it('should expose clearSelectedRowKeys method via ref', () => {
      const ref = { current: null as FetcherViewerRef | null };

      render(<FetcherViewer<User> ref={ref} {...defaultProps} />);

      expect(ref.current).toHaveProperty('clearSelectedRowKeys');
    });

    it('should expose getPageQuery method via ref', () => {
      const mockGetPageQuery = vi.fn(() => ({ page: 1, size: 10 }));
      
      const mockUseFetchData = useFetchData as ReturnType<typeof vi.fn>;
      mockUseFetchData.mockReturnValue({
        dataSource: mockDataSource as any,
        loading: false,
        setQuery: vi.fn(),
        reload: vi.fn().mockResolvedValue(undefined),
        error: undefined,
        getPageQuery: mockGetPageQuery,
      });

      const ref = { current: null as FetcherViewerRef | null };

      render(<FetcherViewer<User> ref={ref} {...defaultProps} />);

      expect(ref.current).toHaveProperty('getPageQuery');
      expect(typeof ref.current?.getPageQuery).toBe('function');
      expect(ref.current?.getPageQuery()).toEqual({ page: 1, size: 10 });
    });
  });

});
