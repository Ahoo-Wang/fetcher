import { Condition } from '@ahoo-wang/fetcher-wow';
import type { SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';
import { ViewChangeAction } from './View';
import { ViewColumn } from '../viewer';
import { ActiveFilter } from '../filter';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export type SearchDataConverter<R> = (
  condition: Condition,
  page: number,
  pageSize: number,
  sorter?: SorterResult | SorterResult[],
) => R;

export interface UseViewStateOptions<RecordType> {
  defaultPage?: number;

  defaultActiveFilters?: ActiveFilter[];
  externalActiveFilters?: ActiveFilter[];
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;
  defaultColumns: ViewColumn[];
  externalColumns?: ViewColumn[];
  externalUpdateColumns?: (columns: ViewColumn[]) => void;
  defaultPageSize: number;
  externalPageSize?: number;
  externalUpdatePageSize?: (pageSize: number) => void;
  defaultTableSize: SizeType;
  externalTableSize?: SizeType;
  externalUpdateTableSize?: (size: SizeType) => void;

  onChange?: (
    action: ViewChangeAction,
    condition?: Condition,
    index?: number,
    size?: number,
    sorter?: SorterResult<RecordType>[],
  ) => void;
}

export interface UseViewStateReturn {
  page: number;
  setPage: (page: number) => void;

  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;
  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  tableSize: SizeType;
  setTableSize: (size: SizeType) => void;
  selectedCount: number;
  updateSelectedCount: (count: number) => void;

  reset: () => void;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export function useViewState<RecordType>({
  defaultPage = DEFAULT_PAGE,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  ...options
}: UseViewStateOptions<RecordType>): UseViewStateReturn {
  const {
    defaultActiveFilters,
    externalActiveFilters,
    externalUpdateActiveFilters,
    defaultColumns,
    externalColumns,
    externalUpdateColumns,
    externalPageSize,
    externalUpdatePageSize,
    defaultTableSize,
    externalTableSize,
    externalUpdateTableSize,
    onChange,
  } = options;

  const [page, setPage] = useState(defaultPage);

  const [internalActiveFilters, internalSetActiveFilters] = useState<
    ActiveFilter[]
  >(defaultActiveFilters || []);
  const [internalColumns, internalSetColumns] =
    useState<ViewColumn[]>(defaultColumns);
  const [internalPageSize, internalSetPageSize] = useState(defaultPageSize);
  const [internalTableSize, internalSetTableSize] = useState(defaultTableSize);

  const activeFilters = externalActiveFilters ?? internalActiveFilters;
  const setActiveFilters =
    externalUpdateActiveFilters ?? internalSetActiveFilters;
  const columns = externalColumns ?? internalColumns;
  const setColumns = externalUpdateColumns ?? internalSetColumns;
  const pageSize = externalPageSize ?? internalPageSize;
  const setPageSize = externalUpdatePageSize ?? internalSetPageSize;
  const tableSize = externalTableSize ?? internalTableSize;
  const setTableSize = externalUpdateTableSize ?? internalSetTableSize;

  const [selectedCount, setSelectedCount] = useState(0);

  const setActiveFiltersFn = (filters: ActiveFilter[]) => {
    setActiveFilters(filters.map(it => ({ ...it })));
  };

  const setColumnsFn = (columns: ViewColumn[]) => {
    setColumns(columns);
  };

  const setPageSizeFn = (pageSize: number) => {
    setPageSize(pageSize);
    onChange?.('pagination', undefined, undefined, pageSize, undefined);
  };

  const setTableSizeFn = (size: SizeType) => {
    setTableSize(size);
  };

  const setPageFn = (page: number) => {
    setPage(page);
    onChange?.('pagination', undefined, page, undefined, undefined);
  };

  const resetFn = () => {
    setPage(defaultPage);
    setPageSize(defaultPageSize);
    setActiveFilters(defaultActiveFilters || []);
    setColumns(defaultColumns);
    setTableSize(defaultTableSize);
    onChange?.('reset');
  };

  const updateSelectedCountFn = (count: number) => {
    setSelectedCount(count);
  };

  return {
    page,
    setPage: setPageFn,
    pageSize,
    setPageSize: setPageSizeFn,
    columns,
    setColumns: setColumnsFn,
    activeFilters,
    setActiveFilters: setActiveFiltersFn,
    tableSize,
    setTableSize: setTableSizeFn,
    selectedCount,
    updateSelectedCount: updateSelectedCountFn,
    reset: resetFn,
  };
}
