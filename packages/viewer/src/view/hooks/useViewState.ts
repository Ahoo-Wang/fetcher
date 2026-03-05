/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import {
  ActiveFilter,
  ViewColumn,
  DEFAULT_CONDITION,
  useActiveViewState,
} from '../../index';

/**
 * Callback type for view state changes.
 * Called when filter, pagination, or sort state changes.
 *
 * @template RecordType - The type of records in the data table.
 * @param condition - The composed filter condition.
 * @param index - Current page number (1-based).
 * @param size - Current page size.
 * @param sorter - Optional array of sort configurations.
 */
export type ViewChangeAction = (
  condition: Condition,
  index: number,
  size: number,
  sorter?: FieldSort[],
) => void;

/**
 * Options interface for useViewState hook.
 * Supports both controlled and uncontrolled state modes.
 *
 * @template RecordType - The type of records in the data table.
 *
 * State Mode:
 * - Uncontrolled: Provide default values via `default*` props; internal state is managed automatically.
 * - Controlled: Provide current values via `external*` props and update callbacks.
 *
 * @example
 * ```tsx
 * // Uncontrolled mode
 * const state = useViewState({
 *   defaultColumns: [...],
 *   defaultPageSize: 10,
 * });
 *
 * // Controlled mode
 * const state = useViewState({
 *   defaultColumns: [...],
 *   externalColumns: columns,
 *   externalUpdateColumns: setColumns,
 * });
 * ```
 */
export interface UseViewStateOptions {
  /** Default column configurations (uncontrolled mode) */
  defaultColumns: ViewColumn[];
  /** Current column configurations (controlled mode) */
  externalColumns?: ViewColumn[];
  /** Callback to update columns (controlled mode) */
  externalUpdateColumns?: (columns: ViewColumn[]) => void;

  /** Default active filters (uncontrolled mode) */
  defaultActiveFilters?: ActiveFilter[];
  /** Current active filters (controlled mode) */
  externalActiveFilters?: ActiveFilter[];
  /** Callback to update filters (controlled mode) */
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;

  /** Default current page number (1-based, uncontrolled mode) */
  defaultPage?: number;
  /** Current page number (controlled mode) */
  externalPage?: number;
  /** Callback to update page (controlled mode) */
  externalUpdatePage?: (page: number) => void;
  /** Default page size (uncontrolled mode) */
  defaultPageSize: number;
  /** Current page size (controlled mode) */
  externalPageSize?: number;
  /** Callback to update page size (controlled mode) */
  externalUpdatePageSize?: (pageSize: number) => void;
  /** Default filter condition (uncontrolled mode) */
  defaultCondition?: Condition;
  /** Current filter condition (controlled mode) */
  externalCondition?: Condition;
  /** Callback to update condition (controlled mode) */
  externalUpdateCondition?: (condition: Condition) => void;
  /** Default sort configuration (uncontrolled mode) */
  defaultSorter?: FieldSort[];
  /** Current sort configuration (controlled mode) */
  externalSorter?: FieldSort[];
  /** Callback to update sorter (controlled mode) */
  externalUpdateSorter?: (sorter: FieldSort[]) => void;

  /** Default table size (uncontrolled mode) */
  defaultTableSize: SizeType;
  /** Current table size (controlled mode) */
  externalTableSize?: SizeType;
  /** Callback to update table size (controlled mode) */
  externalUpdateTableSize?: (size: SizeType) => void;

  /** Callback fired when any view state changes */
  onChange?: ViewChangeAction;
}

/**
 * Return interface from useViewState hook.
 * Provides state values and setter functions.
 *
 * @template RecordType - The type of records in the data table.
 */
export interface UseViewStateReturn {
  /** Current column configurations */
  columns: ViewColumn[];
  /** Function to update columns */
  setColumns: (columns: ViewColumn[]) => void;
  /** Current active filters */
  activeFilters: ActiveFilter[];
  /** Function to update filters */
  setActiveFilters: (filters: ActiveFilter[]) => void;

  /** Current page number (1-based) */
  page: number;
  /** Function to update page */
  setPage: (page: number) => void;
  /** Current page size */
  pageSize: number;
  /** Function to update page size */
  setPageSize: (pageSize: number) => void;
  /** Current filter condition */
  condition: Condition;
  /** Function to update condition */
  setCondition: (condition: Condition) => void;
  /** Current sort configuration */
  sorter: FieldSort[];
  /** Function to update sorter */
  setSorter: (sorter: FieldSort[]) => void;

  /** Current table size */
  tableSize: SizeType;
  /** Function to update table size */
  setTableSize: (size: SizeType) => void;

  /** Current count of selected rows */
  selectedCount: number;
  /** Function to update selected count */
  updateSelectedCount: (count: number) => void;

  /** Function to reset all state to default values */
  reset: () => void;
}

/** Default page number when not specified */
const DEFAULT_PAGE = 1;
/** Default page size when not specified */
const DEFAULT_PAGE_SIZE = 10;

/**
 * useViewState Hook
 *
 * Manages view state for filtering, pagination, sorting, and column configuration.
 * Supports both controlled and uncontrolled modes for flexible state management.
 *
 * This hook wraps useActiveViewState and extends it with:
 * - External state support (controlled mode)
 * - View change callbacks
 * - Selected row count tracking
 *
 * @template RecordType - The type of records in the data table.
 * @param defaultPage - Default page number (1-based).
 * @param defaultPageSize - Default page size (number of items per page).
 * @param options - Configuration options including default values and controlled state.
 * @returns State values and setter functions for view components.
 *
 * @example
 * ```tsx
 * const {
 *   page,
 *   setPage,
 *   columns,
 *   setColumns,
 *   activeFilters,
 *   setActiveFilters,
 *   condition,
 *   sorter,
 *   selectedCount,
 *   reset,
 * } = useViewState({
 *   defaultColumns: initialColumns,
 *   defaultPageSize: 10,
 *   defaultTableSize: 'middle',
 *   onChange: (condition, index, size, sorter) => {
 *     fetchData(condition, index, size, sorter);
 *   },
 * });
 * ```
 */
export function useViewState({
  defaultPage = DEFAULT_PAGE,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  ...options
}: UseViewStateOptions): UseViewStateReturn {
  /**
   * Extract controlled mode options.
   * These override internal state when provided.
   */
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

  /**
   * Initialize internal state from useActiveViewState hook.
   * Handles uncontrolled mode state management.
   */
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

  /**
   * Merge controlled and internal state.
   * External state takes precedence over internal state.
   */
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

  /** Track count of selected rows for display purposes */
  const [selectedCount, setSelectedCount] = useState(0);

  /**
   * Updates page size and triggers onChange callback.
   * @param pageSize - New page size value.
   */
  const setPageSizeFn = (pageSize: number) => {
    setPageSize(pageSize);
    onChange?.(condition, page, pageSize, sorter);
  };

  /**
   * Updates table size without triggering onChange.
   * Table size changes don't typically require data refetch.
   * @param size - New table size value.
   */
  const setTableSizeFn = (size: SizeType) => {
    setTableSize(size);
  };

  /**
   * Updates page number and triggers onChange callback.
   * @param page - New page number (1-based).
   */
  const setPageFn = (page: number) => {
    setPage(page);
    onChange?.(condition, page, pageSize, sorter);
  };

  /**
   * Updates filter condition and triggers onChange callback.
   * Typically called when user applies a new filter.
   * @param condition - New filter condition.
   */
  const setConditionFn = (condition: Condition) => {
    setCondition(condition);
    setPage(1);
    onChange?.(condition, 1, pageSize, sorter);
  };

  /**
   * Updates sort configuration and triggers onChange callback.
   * @param sorter - New sort configuration array.
   */
  const setSorterFn = (sorter: FieldSort[]) => {
    setSorter(sorter);
    setPage(1);
    onChange?.(condition, 1, pageSize, sorter);
  };

  /**
   * Resets all state to default values.
   * Triggers onChange with default condition, page, pageSize, and sorter.
   */
  const resetFn = () => {
    reset();
    onChange?.(
      defaultCondition || DEFAULT_CONDITION,
      defaultPage,
      defaultPageSize,
      defaultSorter,
    );
  };

  /**
   * Updates selected row count.
   * @param count - Number of currently selected rows.
   */
  const updateSelectedCountFn = (count: number) => {
    setSelectedCount(count);
  };

  /**
   * Return merged state and setters.
   * Wrapped setters trigger onChange callback for state synchronization.
   */
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
