import { ViewColumn } from './viewer';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { ActiveFilter } from './filter';
import { useEffect, useState } from 'react';
import { SorterResult } from 'antd/es/table/interface';
import { all, Condition } from '@ahoo-wang/fetcher-wow';

export const DEFAULT_CONDITION: Condition = all();

export interface UseActiveViewStateOptions<RecordType> {
  defaultColumns: ViewColumn[];
  defaultActiveFilters: ActiveFilter[];

  defaultCondition?: Condition;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSorter?: SorterResult<RecordType>[];

  defaultTableSize?: SizeType;
}

export interface UseActiveViewStateReturn<RecordType> {
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

  reset: () => void;
}

export function useActiveViewState<RecordType>({
  defaultPage = 1,
  defaultPageSize = 10,
  defaultTableSize = 'middle',
  defaultCondition = DEFAULT_CONDITION,
  ...options
}: UseActiveViewStateOptions<RecordType>): UseActiveViewStateReturn<RecordType> {
  const { defaultColumns, defaultActiveFilters, defaultSorter } = options;
  const [columns, setColumns] = useState<ViewColumn[]>(defaultColumns);
  const [activeFilters, setActiveFilters] =
    useState<ActiveFilter[]>(defaultActiveFilters);

  const [page, setPage] = useState<number>(defaultPage);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [tableSize, setTableSize] = useState<SizeType>(defaultTableSize);
  const [sorter, setSorter] = useState<SorterResult<RecordType>[]>(
    defaultSorter || [],
  );
  const [condition, setCondition] = useState<Condition>(defaultCondition);

  useEffect(() => {
    setPage(defaultPage);
  }, [defaultPage]);

  useEffect(() => {
    setColumns(defaultColumns);
  }, [defaultColumns]);

  useEffect(() => {
    setActiveFilters(defaultActiveFilters);
  }, [defaultActiveFilters]);

  useEffect(() => {
    setTableSize(defaultTableSize);
  }, [defaultTableSize]);

  useEffect(() => {
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  useEffect(() => {
    setCondition(defaultCondition);
  }, [defaultCondition]);

  useEffect(() => {
    setSorter(defaultSorter || []);
  }, [defaultSorter]);

  const setColumnsFn = (columns: ViewColumn[]) => {
    setColumns(columns.map(it => ({ ...it })));
  };

  const setActiveFiltersFn = (filters: ActiveFilter[]) => {
    setActiveFilters(filters.map(it => ({ ...it })));
  };

  const setConditionFn = (condition: Condition) => {
    setCondition({ ...condition });
  };

  const setSorterFn = (sorter: SorterResult<RecordType>[]) => {
    setSorter(sorter.map(it => ({ ...it })));
  };

  const resetFn = () => {
    setColumns(defaultColumns);
    setActiveFilters(defaultActiveFilters);

    setPage(defaultPage);
    setPageSize(defaultPageSize);
    setCondition(defaultCondition);
    setSorter(defaultSorter || []);

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
