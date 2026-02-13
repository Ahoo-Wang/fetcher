import { ViewColumn, ViewDefinition, ViewState } from './types';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useMemo, useState } from 'react';
import { deepEqual } from '../utils';
import { useActiveViewState } from '../useActiveViewState';
import { ActiveFilter } from '../filter';
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
  defaultViewId?: string;
  definition: ViewDefinition;
  defaultShowFilter?: boolean;
  defaultShowViewPanel?: boolean;
}

export interface UseViewerStateReturn<RecordType> {
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
  sorter: SorterResult<RecordType>[];
  setSorter: (sorter: SorterResult<RecordType>[]) => void;

  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;

  onSwitchView: (view: ViewState) => void;
  reset: () => void;
}

export function useViewerState<RecordType = any>({
  defaultShowFilter = true,
  defaultShowViewPanel = true,
  ...options
}: UseViewerStateOptions): UseViewerStateReturn<RecordType> {
  const view = getActiveView(options.views, options.defaultViewId);
  const [activeView, setActiveView] = useState<ViewState>(view);
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
  } = useActiveViewState<RecordType>({
    defaultColumns: activeView.columns,
    defaultPageSize: activeView.pageSize,
    defaultActiveFilters: activeView.filters,
    defaultTableSize: activeView.tableSize,
    defaultCondition: activeView.condition,
    defaultSorter:
      activeView.sorter?.map(it => ({ ...it }) as SorterResult<RecordType>) ||
      [],
  });

  const viewChanged = useMemo(() => {
    const comparisonView = {
      ...activeView,
      filters: activeFilters,
      columns: columns,
      pageSize: pageSize,
      tableSize: tableSize,
    };

    return !deepEqual(activeView, comparisonView);
  }, [activeView, columns, pageSize, activeFilters, tableSize]);

  const setShowFilterFn = (showFilter: boolean) => {
    setShowFilter(showFilter);
  };

  const setShowViewPanelFn = (showViewPanel: boolean) => {
    setShowViewPanel(showViewPanel);
  };

  const onSwitchViewFn = (view: ViewState) => {
    setActiveView(view);
  };

  return {
    activeView,
    showFilter,
    setShowFilter: setShowFilterFn,
    showViewPanel,
    setShowViewPanel: setShowViewPanelFn,
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
    viewChanged,
    onSwitchView: onSwitchViewFn,
    reset: resetFn,
  };
}

function getActiveView(views: ViewState[], defaultViewId?: string): ViewState {
  let activeView: ViewState | undefined;
  if (defaultViewId) {
    activeView = views.find(view => view.id === defaultViewId);
    if (activeView) {
      return activeView;
    }
  }

  activeView = views.find(view => view.isDefault);
  if (activeView) {
    return activeView;
  }

  return views[0];
}
