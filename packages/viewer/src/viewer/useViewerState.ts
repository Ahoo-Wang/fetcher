import { SearchDataConverter } from '../view';
import { ViewColumn, ViewDefinition, ViewState } from './types';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useMemo, useState } from 'react';
import { deepEqual } from '../utils';
import { useActiveViewState } from '../useActiveViewState';
import { ActiveFilter } from '../filter';

// const DEFAULT_CONDITION: Condition = all();

export interface SearchDataConverterCapable<R> {
  searchDataConverter?: SearchDataConverter<R>;
}

// const defaultSearchDataConverter: SearchDataConverter<PagedQuery> = (
//   condition: Condition,
//   page: number,
//   pageSize: number,
//   sorter?: SorterResult[],
// ): PagedQuery => {
//   const fieldSorts = sorter
//     ? sorter
//         .filter(s => s)
//         .map(s => ({
//           field: String(s.field).split(',').join('.'),
//           direction:
//             s.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
//         }))
//     : [];
//
//   return {
//     condition,
//     pagination: { index: page, size: pageSize },
//     sort: fieldSorts,
//   };
// };

export interface UseViewerStateOptions {
  views: ViewState[];
  defaultViewId?: string;
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

  pageSize: number;
  setPageSize: (size: number) => void;

  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;

  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;

  onSwitchView: (view: ViewState) => void;
}

export function useViewerState({
  defaultShowFilter = true,
  defaultShowViewPanel = true,
  ...options
}: UseViewerStateOptions): UseViewerStateReturn {
  const view = getActiveView(options.views, options.defaultViewId);
  const [activeView, setActiveView] = useState<ViewState>(view);
  const [showFilter, setShowFilter] = useState(defaultShowFilter);
  const [showViewPanel, setShowViewPanel] = useState(defaultShowViewPanel);

  const {
    columns,
    setColumns,
    pageSize,
    setPageSize,
    activeFilters,
    setActiveFilters,
    tableSize,
    setTableSize,
  } = useActiveViewState({
    defaultColumns: activeView.columns,
    defaultPageSize: activeView.pageSize,
    defaultActiveFilters: activeView.filters,
    defaultTableSize: activeView.tableSize,
  });

  const viewChanged = useMemo(() => {
    const comparisonView = {
      ...activeView,
      filters: activeFilters.map(it => ({ ...it })),
      columns: columns.map(it => ({ ...it })),
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
    pageSize,
    setPageSize,
    activeFilters,
    setActiveFilters,
    tableSize,
    setTableSize,
    viewChanged,
    onSwitchView: onSwitchViewFn,
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

/**
 *
 *
 * showViewPanel
 * title
 * activeView.name
 * activeView.viewSource
 * activeView.tableSize
 * onShowFilterChange
 * onTableSizeChange
 */
