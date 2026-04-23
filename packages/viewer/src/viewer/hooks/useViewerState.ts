import type { ViewColumn, ViewDefinition, ViewState } from '../types';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import type { Key } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ActiveFilter } from '../../';
import { deepEqual, useActiveViewState } from '../../';
import type { Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import { all } from '@ahoo-wang/fetcher-wow';
import type { SortOrder } from 'antd/es/table/interface';

/**
 * Merges fields from definition that are not present in columns.
 * New fields are added with default visibility (hidden: false).
 */
const mergeMissingFields = (
  columns: ViewColumn[],
  definitionFields: ViewDefinition['fields'],
): ViewColumn[] => [
  ...columns,
  ...definitionFields
    .filter(field => columns.every(col => col.name !== field.name))
    .map(field => ({
      name: field.name,
      key: field.name,
      fixed: false,
      hidden: false,
      width: '180px',
      sortOrder: undefined,
    })),
];

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
  setCondition: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
  ) => void;
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
  const mergedMissingFieldsView: ViewState = {
    ...options.defaultView,
    columns: mergeMissingFields(
      options.defaultView.columns,
      options.definition.fields,
    ),
  };

  const originalView = useRef<ViewState>(mergedMissingFieldsView);
  const [views, setViews] = useState<ViewState[]>(options.views);
  const [activeView, setActiveView] = useState<ViewState>(
    mergedMissingFieldsView,
  );
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
    const mergedView: ViewState = {
      ...view,
      columns: mergeMissingFields(view.columns, options.definition.fields),
    };

    originalView.current = mergedView;
    setActiveView(mergedView);
    setPage(1);
    setPageSize(view.pageSize);
    setColumns(mergedView.columns);
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

  const setConditionFn = (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
  ) => {
    setCondition(finalCondition);
    const newActiveFilters = activeFilters.map(activeFilter => {
      const activeFilterValue = activeFilterValues.get(activeFilter.key);
      if (!activeFilterValue) {
        return {
          ...activeFilter,
          value: null,
        };
      }

      return {
        ...activeFilter,
        value: { defaultValue: activeFilterValue.value },
        operator: { defaultValue: activeFilterValue.operator },
      };
    });
    setActiveFilters(newActiveFilters);

    setActiveView({
      ...activeView,
      condition: finalCondition,
      filters: newActiveFilters,
    });
  };

  const setSorterFn = (sorter: FieldSort[]) => {
    setSorter(sorter);
    const newColumns = columns.map(column => {
      const temp = sorter.find(it => it.field == column.name);
      return temp
        ? {
            ...column,
            sortOrder: (temp.direction === 'ASC'
              ? 'ascend'
              : 'descend') as SortOrder,
          }
        : { ...column, sortOrder: undefined };
    });
    setColumns(newColumns);
    const newView: ViewState = {
      ...activeView,
      sorter: sorter,
      columns: newColumns,
    };
    setActiveView(newView);
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
