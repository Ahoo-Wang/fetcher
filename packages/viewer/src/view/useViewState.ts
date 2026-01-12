/*
 * show/hide filter panel
 * on filter change
 * update data source
 * search value updated
 * page size changed
 * page index changed
 * sort changed
 *
 * column updated
 *
 * */

import {
  all,
  Condition,
  FieldSort,
  PagedQuery,
  SortDirection,
} from '@ahoo-wang/fetcher-wow';
import type { SorterResult } from 'antd/es/table/interface';
import { useState } from 'react';

export type SearchDataConverter<R> = (
  condition: Condition,
  page: number,
  pageSize: number,
  sorter?: SorterResult | SorterResult[],
) => R;

export interface SearchDataConverterCapable<R> {
  searchDataConverter?: SearchDataConverter<R>;
}

export interface UseViewStateOptions<
  RecordType,
  SearchBody = PagedQuery,
> extends SearchDataConverterCapable<SearchBody> {
  defaultShowFilter?: boolean;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultCondition?: Condition;

  onSearch?: (searchBody: SearchBody) => void;
}

export interface UseViewStateReturn<RecordType> {
  showFilter: boolean;
  toggleShowFilter: () => boolean;

  condition: Condition;
  setCondition: (condition: Condition) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;

  // sorter: SorterResult<RecordType> | SorterResult<RecordType>[];
  setSorter: (sorter: SorterResult | SorterResult[]) => void;

  tableSelectedData: RecordType[];
  setTableSelectedData: (data: RecordType[]) => void;

  reset: () => void;
}

const DEFAULT_CONDITION: Condition = all();
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const defaultSearchDataConverter: SearchDataConverter<PagedQuery> = (
  condition: Condition,
  page: number,
  pageSize: number,
  sorter?: SorterResult | SorterResult[],
): PagedQuery => {
  let fieldSorts: FieldSort[];
  if (Array.isArray(sorter)) {
    fieldSorts = sorter
      .filter(s => s)
      .map(s => ({
        field: String(s.field).split(',').join('.'),
        direction:
          s.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
      }));
  } else if (sorter) {
    fieldSorts = [
      {
        field: String(sorter.field).split(',').join('.'),
        direction:
          sorter.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
      },
    ];
  } else {
    fieldSorts = [];
  }
  return {
    condition,
    pagination: { index: page, size: pageSize },
    sort: fieldSorts,
  };
};

export function useViewState<RecordType, SearchBody = PagedQuery>({
  defaultShowFilter = true,
  defaultCondition = DEFAULT_CONDITION,
  defaultPage = DEFAULT_PAGE,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  searchDataConverter = defaultSearchDataConverter as SearchDataConverter<SearchBody>,
  ...options
}: UseViewStateOptions<
  RecordType,
  SearchBody
>): UseViewStateReturn<RecordType> {
  const [showFilter, setShowFilter] = useState(defaultShowFilter);

  const [condition, setCondition] = useState<Condition>(defaultCondition);
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [sorter, setSorter] = useState<SorterResult | SorterResult[]>([]);

  const [tableSelectedData, setTableSelectedData] = useState<RecordType[]>([]);

  const setConditionFn = (condition: Condition) => {
    setCondition(condition);
    const searchData = searchDataConverter(condition, page, pageSize, sorter);
    options.onSearch?.(searchData);
  };

  const setPageFn = (page: number) => {
    setPage(page);
    const searchData = searchDataConverter(condition, page, pageSize, sorter);
    options.onSearch?.(searchData);
  };

  const setPageSizeFn = (pageSize: number) => {
    setPageSize(pageSize);
    const searchData = searchDataConverter(condition, page, pageSize, sorter);
    options.onSearch?.(searchData);
  };

  const setSorterFn = (sorter: SorterResult | SorterResult[]) => {
    setSorter(sorter);
    const searchData = searchDataConverter(condition, page, pageSize, sorter);
    options.onSearch?.(searchData);
  }

  const toggleShowFilter = (): boolean => {
    setShowFilter(!showFilter);
    return !showFilter;
  };

  const resetFn = () => {
    setShowFilter(true);
    setCondition(defaultCondition);
    setPage(defaultPage);
    setPageSize(defaultPageSize);
    setSorter([]);
    const searchData = searchDataConverter(
      defaultCondition,
      defaultPage,
      defaultPageSize,
      [],
    );
    options.onSearch?.(searchData);
  };

  return {
    showFilter,
    toggleShowFilter,
    condition,
    setCondition: setConditionFn,
    page,
    setPage: setPageFn,
    pageSize,
    setPageSize: setPageSizeFn,
    setSorter: setSorterFn,
    tableSelectedData,
    setTableSelectedData,
    reset: resetFn,
  };
}
