import { ViewColumn } from './viewer';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { ActiveFilter } from './filter';
import { useState } from 'react';

export interface UseActiveViewStateOptions {
  defaultColumns: ViewColumn[];
  defaultPageSize?: number;
  defaultActiveFilters: ActiveFilter[];
  defaultTableSize?: SizeType;
}

export interface UseActiveViewStateReturn {
  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;

  pageSize: number;
  setPageSize: (size: number) => void;

  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;

  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;
}

export function useActiveViewState({
  defaultPageSize = 10,
  defaultTableSize = 'middle',
  ...options
}: UseActiveViewStateOptions): UseActiveViewStateReturn {
  const { defaultColumns, defaultActiveFilters } = options;
  const [columns, setColumns] = useState<ViewColumn[]>(defaultColumns);
  const [activeFilters, setActiveFilters] =
    useState<ActiveFilter[]>(defaultActiveFilters);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [tableSize, setTableSize] = useState<SizeType>(defaultTableSize);

  const setColumnsFn = (columns: ViewColumn[]) => {
    setColumns(columns.map(it => ({ ...it })));
  };

  const setActiveFiltersFn = (filters: ActiveFilter[]) => {
    setActiveFilters(filters.map(it => ({ ...it })));
  };

  return {
    columns: columns,
    setColumns: setColumnsFn,
    pageSize: pageSize,
    setPageSize: setPageSize,
    activeFilters: activeFilters,
    setActiveFilters: setActiveFiltersFn,
    tableSize: tableSize,
    setTableSize: setTableSize,
  };
}
