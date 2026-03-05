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
import { renderHook, act } from '@testing-library/react';
import { useViewerState } from '../../src/viewer/hooks';
import { ViewState, ViewDefinition, ViewColumn } from '../../src/viewer/types';
import { Operator, SortDirection, all } from '@ahoo-wang/fetcher-wow';
import { SizeType } from 'antd/es/config-provider/SizeContext';

describe('useViewerState', () => {
  const defaultColumns: ViewColumn[] = [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
  ];

  const viewDefinition: ViewDefinition = {
    id: 'test-view',
    name: 'Test View',
    fields: [],
    availableFilters: [],
    dataUrl: '/api/test',
    countUrl: '/api/test/count',
  };

  const createViewState = (overrides: Partial<ViewState> = {}): ViewState => ({
    id: 'view-1',
    name: 'View 1',
    definitionId: 'test-view',
    type: 'PERSONAL',
    source: 'CUSTOM',
    isDefault: true,
    filters: [],
    columns: defaultColumns,
    tableSize: 'middle' as SizeType,
    pageSize: 10,
    condition: {},
    internalCondition: {},
    ...overrides,
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const views = [
        createViewState(),
        createViewState({ id: 'view-2', isDefault: false }),
      ];
      const defaultView = views[0];

      const { result } = renderHook(() =>
        useViewerState({
          views,
          defaultView,
          definition: viewDefinition,
        }),
      );

      expect(result.current.activeView).toEqual(defaultView);
      expect(result.current.showFilter).toBe(true);
      expect(result.current.showViewPanel).toBe(true);
      expect(result.current.views).toEqual(views);
    });

    it('should use custom default showFilter and showViewPanel', () => {
      const view = createViewState();

      const { result } = renderHook(() =>
        useViewerState({
          views: [view],
          defaultView: view,
          definition: viewDefinition,
          defaultShowFilter: false,
          defaultShowViewPanel: false,
        }),
      );

      expect(result.current.showFilter).toBe(false);
      expect(result.current.showViewPanel).toBe(false);
    });
  });

  describe('onSwitchView', () => {
    it('should switch to new view and update all related state', () => {
      const views = [
        createViewState(),
        createViewState({ id: 'view-2', pageSize: 20 }),
      ];
      const defaultView = views[0];

      const { result } = renderHook(() =>
        useViewerState({
          views,
          defaultView,
          definition: viewDefinition,
        }),
      );

      const newView = views[1];

      act(() => {
        result.current.onSwitchView(newView);
      });

      expect(result.current.activeView).toEqual(newView);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.columns).toEqual(newView.columns);
      expect(result.current.tableSize).toBe(newView.tableSize);
    });

    it('should set viewChanged to true after switching', () => {
      const view = createViewState();

      const { result } = renderHook(() =>
        useViewerState({
          views: [view],
          defaultView: view,
          definition: viewDefinition,
        }),
      );

      act(() => {
        result.current.setCondition({
          field: 'test',
          operator: Operator.EQ,
          value: '1',
        });
      });

      expect(result.current.viewChanged).toBe(true);
    });
  });

  describe('setShowFilter', () => {
    it('should toggle filter visibility', () => {
      const view = createViewState();

      const { result } = renderHook(() =>
        useViewerState({
          views: [view],
          defaultView: view,
          definition: viewDefinition,
        }),
      );

      act(() => {
        result.current.setShowFilter(false);
      });

      expect(result.current.showFilter).toBe(false);

      act(() => {
        result.current.setShowFilter(true);
      });

      expect(result.current.showFilter).toBe(true);
    });
  });

  describe('setShowViewPanel', () => {
    it('should toggle view panel visibility', () => {
      const view = createViewState();

      const { result } = renderHook(() =>
        useViewerState({
          views: [view],
          defaultView: view,
          definition: viewDefinition,
        }),
      );

      act(() => {
        result.current.setShowViewPanel(false);
      });

      expect(result.current.showViewPanel).toBe(false);

      act(() => {
        result.current.setShowViewPanel(true);
      });

      expect(result.current.showViewPanel).toBe(true);
    });
  });

  describe('setViews', () => {
    it('should update views list', () => {
      const view = createViewState();
      const newViews = [view, createViewState({ id: 'view-3' })];

      const { result } = renderHook(() =>
        useViewerState({
          views: [view],
          defaultView: view,
          definition: viewDefinition,
        }),
      );

      act(() => {
        result.current.setViews(newViews);
      });

      expect(result.current.views).toEqual(newViews);
    });
  });

  describe('reset', () => {
    it('should reset all state to default view values', () => {
      const view = createViewState();

      const { result } = renderHook(() =>
        useViewerState({
          views: [view],
          defaultView: view,
          definition: viewDefinition,
        }),
      );

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(view.pageSize);
    });
  });
});
