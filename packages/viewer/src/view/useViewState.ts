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
import { ViewChangeAction } from './View';
import { ViewColumn } from '../viewer';

export type SearchDataConverter<R> = (
  condition: Condition,
  page: number,
  pageSize: number,
  sorter?: SorterResult | SorterResult[],
) => R;

export interface SearchDataConverterCapable<R> {
  searchDataConverter?: SearchDataConverter<R>;
}

export interface UseViewStateOptions<RecordType> {
  defaultPage?: number;
  defaultPageSize?: number;

  defaultColumns: ViewColumn[];

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
  pageSize: number;
  setPageSize: (pageSize: number) => void;

  columns: ViewColumn[];
  setColumns: (columns: ViewColumn[]) => void;

  selectedCount: number;
  updateSelectedCount: (count: number) => void;

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

export function useViewState<RecordType>({
  defaultPage = DEFAULT_PAGE,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  ...options
}: UseViewStateOptions<RecordType>): UseViewStateReturn {
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [columns, setColumns] = useState<ViewColumn[]>(options.defaultColumns);

  const [selectedCount, setSelectedCount] = useState(0);

  const setPageFn = (page: number) => {
    setPage(page);
    options.onChange?.('pagination', undefined, page, undefined, undefined);
  };

  const setPageSizeFn = (pageSize: number) => {
    setPageSize(pageSize);
    options.onChange?.('pagination', undefined, undefined, pageSize, undefined);
  };
  const setColumnsFn = (columns: ViewColumn[]) => {
    setColumns(columns);
  };

  const resetFn = () => {
    setPage(defaultPage);
    setPageSize(defaultPageSize);
    options.onChange?.('reset');
  };

  const updateSelectedCountFn = (count: number) => {
    setSelectedCount(count);
  }

  return {
    page,
    setPage: setPageFn,
    pageSize,
    setPageSize: setPageSizeFn,
    columns,
    setColumns: setColumnsFn,
    selectedCount,
    updateSelectedCount: updateSelectedCountFn,
    reset: resetFn,
  };
}
