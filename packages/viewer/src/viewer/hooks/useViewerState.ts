import { ViewColumn, ViewDefinition, ViewState } from '../types';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useEffect, useRef, useState } from 'react';
import { deepEqual } from '../../utils';
import { useActiveViewState } from '../../hooks/useActiveViewState';
import { ActiveFilter } from '../../filter';
import { Condition } from '@ahoo-wang/fetcher-wow';
import type { SorterResult } from 'antd/es/table/interface';

export type SearchDataConverter<R> = (
  condition: Condition,
  page: number,
  pageSize: number,
  sorter?: SorterResult[],
) => R;

export interface SearchDataConverterCapable<R> {
  searchDataConverter?: SearchDataConverter<R>;
}

export interface UseViewerStateOptions {
  views: ViewState[];
  defaultView: ViewState;
  definition: ViewDefinition;
  defaultShowFilter?: boolean;
  defaultShowViewPanel?: boolean;
}

export interface UseViewerStateReturn {
  activeView: ViewState;
  showFilter: boolean;
  setShowFilter: (showFilter: boolean) => void;
  showViewPanel: boolean;
  setShowViewPanel: (showViewPanel: boolean) => void;
  viewChanged: boolean;

  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;

  condition: Condition;
  setCondition: (condition: Condition) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sorter: SorterResult[];
  setSorter: (sorter: SorterResult[]) => void;

  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;

  views: ViewState[];
  setViews: (views: ViewState[]) => void;
  onSwitchView: (view: ViewState) => void;
  reset: () => void;
}

export function useViewerState({
  defaultShowFilter = true,
  defaultShowViewPanel = true,
  ...options
}: UseViewerStateOptions): UseViewerStateReturn {
  const originalView = useRef<ViewState>(options.defaultView);
  const [views, setViews] = useState<ViewState[]>(options.views);
  const [activeView, setActiveView] = useState<ViewState>(options.defaultView);
  const [showFilter, setShowFilter] = useState(defaultShowFilter);
  const [showViewPanel, setShowViewPanel] = useState(defaultShowViewPanel);

  const {
    columns,
    setColumns,
    page,
    setPage,
    pageSize,
    setPageSize,
    activeFilters,
    setActiveFilters,
    tableSize,
    setTableSize,
    condition,
    setCondition,
    sorter,
    setSorter,
    reset: resetFn,
  } = useActiveViewState({
    defaultColumns: activeView.columns,
    defaultPageSize: activeView.pageSize,
    defaultActiveFilters: activeView.filters,
    defaultTableSize: activeView.tableSize,
    defaultCondition: activeView.condition,
    defaultSorter: activeView.sorter,
  });

  const [viewChanged, setViewChanged] = useState(false);

  useEffect(() => {
    setViewChanged(!deepEqual(activeView, originalView.current));
  }, [activeView]);

  const setShowFilterFn = (showFilter: boolean) => {
    setShowFilter(showFilter);
  };

  const setShowViewPanelFn = (showViewPanel: boolean) => {
    setShowViewPanel(showViewPanel);
  };

  const onSwitchViewFn = (view: ViewState) => {
    originalView.current = view;
    setActiveView(view);
    setPage(1);
    setPageSize(view.pageSize);
    setColumns(view.columns);
    setActiveFilters(view.filters);
    setTableSize(view.tableSize);
    setCondition(view.condition);
    setSorter(view.sorter || []);
  };

  const setColumnsFn = (newColumns: ViewColumn[]) => {
    setColumns(newColumns);
    setActiveView({
      ...activeView,
      columns: newColumns,
    });
  };

  const setPageSizeFn = (size: number) => {
    setPageSize(size);
    setActiveView({
      ...activeView,
      pageSize: size,
    });
  };

  const setActiveFiltersFn = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    setActiveView({
      ...activeView,
      filters: filters,
    });
  };

  const setTableSizeFn = (size: SizeType) => {
    setTableSize(size);
    setActiveView({
      ...activeView,
      tableSize: size,
    });
  };

  const setConditionFn = (condition: Condition) => {
    setCondition(condition);
    setActiveView({
      ...activeView,
      condition: condition,
    });
  };

  const setSorterFn = (sorter: SorterResult[]) => {
    setSorter(sorter);
    setActiveView({
      ...activeView,
      sorter: sorter,
    });
  };

  return {
    activeView,
    showFilter,
    setShowFilter: setShowFilterFn,
    showViewPanel,
    setShowViewPanel: setShowViewPanelFn,
    columns,
    setColumns: setColumnsFn,
    page,
    setPage,
    pageSize,
    setPageSize: setPageSizeFn,
    activeFilters,
    setActiveFilters: setActiveFiltersFn,
    tableSize,
    setTableSize: setTableSizeFn,
    condition,
    setCondition: setConditionFn,
    sorter,
    setSorter: setSorterFn,
    viewChanged,
    views,
    setViews,
    onSwitchView: onSwitchViewFn,
    reset: resetFn,
  };
}
