import { Condition } from '@ahoo-wang/fetcher-wow';
import type { SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';
import { ViewColumn } from '../viewer';
import { ActiveFilter } from '../filter';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useActiveViewState } from '../useActiveViewState';
import { DEFAULT_CONDITION } from '../';

export type ViewChangeAction<RecordType> = (
  condition: Condition,
  index: number,
  size: number,
  sorter?: SorterResult<RecordType>[],
) => void;

export interface UseViewStateOptions<RecordType> {
  defaultColumns: ViewColumn[];
  externalColumns?: ViewColumn[];
  externalUpdateColumns?: (columns: ViewColumn[]) => void;
  defaultActiveFilters?: ActiveFilter[];
  externalActiveFilters?: ActiveFilter[];
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;

  defaultPage?: number;
  externalPage?: number;
  externalUpdatePage?: (page: number) => void;
  defaultPageSize: number;
  externalPageSize?: number;
  externalUpdatePageSize?: (pageSize: number) => void;
  defaultCondition?: Condition;
  externalCondition?: Condition;
  externalUpdateCondition?: (condition: Condition) => void;
  defaultSorter?: SorterResult<RecordType>[];
  externalSorter?: SorterResult<RecordType>[];
  externalUpdateSorter?: (sorter: SorterResult<RecordType>[]) => void;

  defaultTableSize: SizeType;
  externalTableSize?: SizeType;
  externalUpdateTableSize?: (size: SizeType) => void;

  onChange?: ViewChangeAction<RecordType>;
}

export interface UseViewStateReturn<RecordType> {
  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;

  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  condition: Condition;
  setCondition: (condition: Condition) => void;
  sorter: SorterResult<RecordType>[];
  setSorter: (sorter: SorterResult<RecordType>[]) => void;

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
}: UseViewStateOptions<RecordType>): UseViewStateReturn<RecordType> {
  const {
    defaultColumns,
    externalColumns,
    externalUpdateColumns,
    defaultActiveFilters,
    externalActiveFilters,
    externalUpdateActiveFilters,
    externalPage,
    externalUpdatePage,
    externalPageSize,
    externalUpdatePageSize,
    defaultTableSize,
    externalTableSize,
    externalUpdateTableSize,
    defaultSorter,
    externalSorter,
    externalUpdateSorter,
    defaultCondition,
    externalCondition,
    externalUpdateCondition,
    onChange,
  } = options;

  const {
    columns: internalColumns,
    setColumns: internalSetColumns,
    activeFilters: internalActiveFilters,
    setActiveFilters: internalSetActiveFilters,
    page: internalPage,
    setPage: internalSetPage,
    pageSize: internalPageSize,
    setPageSize: internalSetPageSize,
    tableSize: internalTableSize,
    setTableSize: internalSetTableSize,
    condition: internalCondition,
    setCondition: internalSetCondition,
    sorter: internalSorter,
    setSorter: internalSetSorter,
    reset,
  } = useActiveViewState({
    defaultColumns: defaultColumns,
    defaultPageSize: defaultPageSize,
    defaultActiveFilters: defaultActiveFilters || [],
    defaultTableSize: defaultTableSize,
    defaultCondition: defaultCondition,
    defaultSorter: defaultSorter,
  });

  const columns = externalColumns ?? internalColumns;
  const setColumns = externalUpdateColumns ?? internalSetColumns;
  const activeFilters = externalActiveFilters ?? internalActiveFilters;
  const setActiveFilters =
    externalUpdateActiveFilters ?? internalSetActiveFilters;

  const page = externalPage ?? internalPage;
  const setPage = externalUpdatePage ?? internalSetPage;
  const pageSize = externalPageSize ?? internalPageSize;
  const setPageSize = externalUpdatePageSize ?? internalSetPageSize;
  const condition = externalCondition ?? internalCondition;
  const setCondition = externalUpdateCondition ?? internalSetCondition;
  const sorter = externalSorter ?? internalSorter;
  const setSorter = externalUpdateSorter ?? internalSetSorter;

  const tableSize = externalTableSize ?? internalTableSize;
  const setTableSize = externalUpdateTableSize ?? internalSetTableSize;

  const [selectedCount, setSelectedCount] = useState(0);

  const setPageSizeFn = (pageSize: number) => {
    setPageSize(pageSize);
    onChange?.(condition, page, pageSize, sorter);
  };

  const setTableSizeFn = (size: SizeType) => {
    setTableSize(size);
  };

  const setPageFn = (page: number) => {
    setPage(page);
    onChange?.(condition, page, pageSize, sorter);
  };

  const setConditionFn = (condition: Condition) => {
    setCondition(condition);
    onChange?.(condition, page, pageSize, sorter);
  };

  const setSorterFn = (sorter: SorterResult<RecordType>[]) => {
    setSorter(sorter);
    onChange?.(condition, page, pageSize, sorter);
  };

  const resetFn = () => {
    reset();
    onChange?.(
      defaultCondition || DEFAULT_CONDITION,
      defaultPage,
      defaultPageSize,
      defaultSorter,
    );
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
    setColumns,
    activeFilters,
    setActiveFilters,
    tableSize,
    setTableSize: setTableSizeFn,
    condition,
    setCondition: setConditionFn,
    sorter,
    setSorter: setSorterFn,
    selectedCount,
    updateSelectedCount: updateSelectedCountFn,
    reset: resetFn,
  };
}
