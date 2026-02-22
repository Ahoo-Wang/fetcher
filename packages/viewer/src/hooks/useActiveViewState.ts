import { ViewColumn } from '../viewer';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { ActiveFilter } from '../filter';
import { useState } from 'react';
import { all, Condition, FieldSort } from '@ahoo-wang/fetcher-wow';

export const DEFAULT_CONDITION: Condition = all();

export interface UseActiveViewStateOptions {
  defaultColumns: ViewColumn[];
  defaultActiveFilters: ActiveFilter[];

  defaultCondition?: Condition;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSorter?: FieldSort[];

  defaultTableSize?: SizeType;
}

export interface UseActiveViewStateReturn {
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

  reset: () => void;
}

export function useActiveViewState({
  defaultPage = 1,
  defaultPageSize = 10,
  defaultTableSize = 'middle',
  defaultCondition = DEFAULT_CONDITION,
  defaultSorter = [],
  ...options
}: UseActiveViewStateOptions): UseActiveViewStateReturn {
  const { defaultColumns, defaultActiveFilters } = options;
  const [columns, setColumns] = useState<ViewColumn[]>(defaultColumns);
  const [activeFilters, setActiveFilters] =
    useState<ActiveFilter[]>(defaultActiveFilters);

  const [page, setPage] = useState<number>(defaultPage);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [tableSize, setTableSize] = useState<SizeType>(defaultTableSize);
  const [sorter, setSorter] = useState<FieldSort[]>(defaultSorter);
  const [condition, setCondition] = useState<Condition>(defaultCondition);

  const setColumnsFn = (columns: ViewColumn[]) => {
    setColumns(columns.map(it => ({ ...it })));
  };

  const setActiveFiltersFn = (filters: ActiveFilter[]) => {
    setActiveFilters(filters.map(it => ({ ...it })));
  };

  const setConditionFn = (condition: Condition) => {
    setCondition({ ...condition });
  };

  const setSorterFn = (sorter: FieldSort[]) => {
    setSorter(sorter.map(it => ({ ...it })));
  };

  const resetFn = () => {
    setColumns(defaultColumns);
    setActiveFilters(defaultActiveFilters);

    setPage(defaultPage);
    setPageSize(defaultPageSize);
    setCondition(defaultCondition);
    setSorter(defaultSorter);

    setTableSize(defaultTableSize);
  };

  return {
    columns: columns,
    setColumns: setColumnsFn,
    activeFilters: activeFilters,
    setActiveFilters: setActiveFiltersFn,

    page: page,
    setPage: setPage,
    pageSize: pageSize,
    setPageSize: setPageSize,
    condition: condition,
    setCondition: setConditionFn,
    sorter: sorter,
    setSorter: setSorterFn,

    tableSize: tableSize,
    setTableSize: setTableSize,
    reset: resetFn,
  };
}
