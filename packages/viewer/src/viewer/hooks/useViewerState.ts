import { ViewColumn, ViewDefinition, ViewState } from '../types';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useEffect, useRef, useState } from 'react';
import { deepEqual, ActiveFilter, useActiveViewState } from '../../';
import { all, Condition, FieldSort, Operator } from '@ahoo-wang/fetcher-wow';

export type SearchDataConverter<R> = (
  condition: Condition,
  page: number,
  pageSize: number,
  sorter?: FieldSort[],
) => R;

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
  sorter: FieldSort[];
  setSorter: (sorter: FieldSort[]) => void;

  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;

  views: ViewState[];
  setViews: (views: ViewState[]) => void;
  onSwitchView: (view: ViewState) => void;
  reset: () => ViewState;
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
    setCondition(view.condition || all());
    setActiveFilters(view.filters);
    setTableSize(view.tableSize);
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

    const newActiveFilters = activeFilters.map(af => {
      if (condition.operator === Operator.AND) {
        const queriedCondition = condition.children?.find(
          c => c.field === af.field.name,
        );
        if (queriedCondition) {
          return {
            ...af,
            value: { defaultValue: queriedCondition.value },
            operator: { defaultValue: queriedCondition.operator },
          };
        }
        return {
          ...af,
          value: null,
          operator: null,
        };
      } else if (condition.field === af.field.name) {
        return {
          ...af,
          value: { defaultValue: condition.value },
          operator: { defaultValue: condition.operator },
        };
      } else {
        return {
          ...af,
          value: null,
          operator: null,
        };
      }
    });
    setActiveFilters(newActiveFilters);

    setActiveView({
      ...activeView,
      condition: condition,
      filters: newActiveFilters,
    });
  };

  const setSorterFn = (sorter: FieldSort[]) => {
    setSorter(sorter);
    setActiveView({
      ...activeView,
      sorter: sorter,
    });
  };

  const resetFn = (): ViewState => {
    setActiveView(originalView.current);
    setPage(1);
    setPageSize(originalView.current.pageSize);
    setColumns(originalView.current.columns);
    setActiveFilters(originalView.current.filters);
    setCondition(originalView.current.condition || all());
    setTableSize(originalView.current.tableSize);
    setSorter(originalView.current.sorter || []);
    return originalView.current;
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
