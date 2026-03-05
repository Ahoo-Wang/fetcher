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

import { Pagination, PaginationProps, Space } from 'antd';
import styles from '../viewer/Viewer.module.css';
import {
  ActiveFilter,
  AvailableFilterGroup,
  EditableFilterPanel,
  FilterPanel,
  FilterPanelRef,
} from '../filter';
import type * as React from 'react';
import { Condition, FieldSort, PagedList } from '@ahoo-wang/fetcher-wow';
import {
  RefAttributes,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { FieldDefinition, ViewColumn } from '../viewer';
import { ViewTable, ViewTableActionColumn, ViewTableRef } from '../table';
import {
  PrimaryKeyClickHandlerCapable,
  ViewTableSettingCapable,
} from '../types';
import { SorterResult } from 'antd/es/table/interface';
import { useViewState, ViewChangeAction } from './';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useLocale } from '../locale';

/**
 * Ref interface for exposing View component imperative methods to parent components.
 * Enables external control of view state including table size reset and row selection clearing.
 */
export interface ViewRef extends ViewTableRef {
  /**
   * Updates the table size (small, middle, large).
   * @param size - The new table size to set.
   */
  updateTableSize: (size: SizeType) => void;
  /**
   * Resets the view state to default values.
   * Resets filters, columns, pagination, sorting, and clears row selections.
   */
  reset: () => void;
}

/**
 * Filter panel mode options.
 * - 'none': No filter panel displayed.
 * - 'normal': Read-only filter panel with pre-configured filters.
 * - 'editable': Interactive filter panel allowing users to add/remove/modify filters.
 */
export type FilterMode = 'none' | 'normal' | 'editable';

/**
 * Props interface for the View component.
 *
 * @template RecordType - The type of records displayed in the data table.
 *
 * The View component supports both controlled and uncontrolled state modes:
 * - Controlled: Provide external state via `external*` props and update callbacks.
 * - Uncontrolled: Provide default values via `default*` props; internal state is managed automatically.
 *
 * @example
 * ```tsx
 * // Uncontrolled mode (recommended for simple use cases)
 * <View
 *   fields={userFields}
 *   availableFilters={filterGroups}
 *   dataSource={userPagedData}
 *   defaultColumns={defaultViewColumns}
 *   defaultPageSize={10}
 *   defaultTableSize="middle"
 *   onChange={(condition, index, size) => fetchData(condition, index, size)}
 * />
 *
 * // Controlled mode (for advanced state management)
 * <View
 *   fields={userFields}
 *   availableFilters={filterGroups}
 *   dataSource={userPagedData}
 *   externalColumns={columns}
 *   externalPage={currentPage}
 *   externalPageSize={pageSize}
 *   externalActiveFilters={activeFilters}
 *   externalUpdateColumns={setColumns}
 *   externalUpdatePage={setPage}
 *   externalUpdateActiveFilters={setFilters}
 *   onChange={(condition, index, size) => handleSearch(condition, index, size)}
 * />
 * ```
 */
export interface ViewProps<RecordType>
  extends
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    RefAttributes<ViewRef> {
  /** Field definitions describing each column's metadata (label, type, sorter, etc.) */
  fields: FieldDefinition[];
  /** Available filter groups for the filter panel */
  availableFilters: AvailableFilterGroup[];
  /** Paged data source containing list of records and total count */
  dataSource: PagedList<RecordType>;
  /** Whether to display the filter panel */
  showFilter: boolean;
  /** Filter panel mode: 'none' | 'normal' | 'editable' */
  filterMode: FilterMode;

  /** Default active filters (used in uncontrolled mode) */
  defaultActiveFilters?: ActiveFilter[];
  /** Currently active filters (controlled mode) */
  externalActiveFilters?: ActiveFilter[];
  /** Callback to update active filters (controlled mode) */
  externalUpdateActiveFilters?: (filters: ActiveFilter[]) => void;
  /** Default column configurations including visibility, fixed position, and order */
  defaultColumns: ViewColumn[];
  /** Current column configurations (controlled mode) */
  externalColumns?: ViewColumn[];
  /** Callback to update columns (controlled mode) */
  externalUpdateColumns?: (columns: ViewColumn[]) => void;

  /** Default current page number (1-based) */
  defaultPage?: number;
  /** Current page number (controlled mode) */
  externalPage?: number;
  /** Callback to update page (controlled mode) */
  externalUpdatePage?: (page: number) => void;
  /** Default number of items per page */
  defaultPageSize: number;
  /** Current page size (controlled mode) */
  externalPageSize?: number;
  /** Callback to update page size (controlled mode) */
  externalUpdatePageSize?: (pageSize: number) => void;
  /** Default table size (small, middle, large) */
  defaultTableSize: SizeType;
  /** Current table size (controlled mode) */
  externalTableSize?: SizeType;
  /** Callback to update table size (controlled mode) */
  externalUpdateTableSize?: (size: SizeType) => void;
  /** Default sort configuration */
  defaultSorter?: FieldSort[];
  /** Current sort configuration (controlled mode) */
  externalSorter?: FieldSort[];
  /** Callback to update sorter (controlled mode) */
  externalUpdateSorter?: (sorter: FieldSort[]) => void;
  /** Default filter condition */
  defaultCondition?: Condition;
  /** Current filter condition (controlled mode) */
  externalCondition?: Condition;
  /** Callback to update condition (controlled mode) */
  externalUpdateCondition?: (condition: Condition) => void;

  /** Optional action column configuration for row-level operations */
  actionColumn?: ViewTableActionColumn<RecordType>;

  /**
   * Pagination configuration.
   * - `false`: Disable pagination entirely.
   * - Object: Antd Pagination props excluding 'onChange', 'onShowSizeChange', and 'total'.
   */
  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;

  /** Whether to enable row selection for batch operations */
  enableRowSelection: boolean;
  loading?: boolean;
  /**
   * Callback fired when view state changes (filter, pagination, or sort).
   * Provides the composed condition, current page, page size, and sorters.
   */
  onChange?: ViewChangeAction;
  /** Callback fired when row selection changes */
  onSelectedDataChange?: (data: RecordType[]) => void;
}

/**
 * View Component
 *
 * A comprehensive view component that combines filter panel and data table.
 * Provides unified state management for filtering, pagination, sorting, and column configuration.
 *
 * Features:
 * - Configurable filter modes: none, normal (read-only), editable (interactive)
 * - Built-in pagination with Antd Pagination component
 * - Row selection support for batch operations
 * - Column visibility and order configuration via ViewTable
 * - Dual state mode: uncontrolled (default values) or fully controlled (external state)
 * - Integration with useViewState hook for consistent state management
 *
 * @template RecordType - The type of records displayed in the table.
 * @param props - Configuration props including fields, filters, data source, and callbacks.
 * @returns A Space container with filter panel (optional), data table, and pagination.
 */
export function View<RecordType>({
  ref,
  fields,
  availableFilters,
  dataSource,
  actionColumn,
  showFilter,
  filterMode,
  pagination,
  enableRowSelection,
  viewTableSetting,
  onClickPrimaryKey,
  onSelectedDataChange,
  loading,
  ...viewState
}: ViewProps<RecordType>) {
  /**
   * Initialize view state using useViewState hook.
   * Handles all internal state management for filters, columns, pagination, sorting.
   * Supports both controlled and uncontrolled modes through external props.
   */
  const {
    page,
    setPage,
    activeFilters,
    setActiveFilters,
    columns,
    setColumns,
    pageSize,
    setPageSize,
    tableSize,
    setTableSize,
    setCondition,
    setSorter,
    selectedCount,
    updateSelectedCount,
  } = useViewState(viewState);

  const { locale } = useLocale();

  /**
   * Handles search/filter condition changes from the filter panel.
   * Updates internal condition state and triggers onChange callback.
   * @param condition - The composed filter condition from filter panel.
   */
  const handleSearch = (condition: Condition) => {
    setCondition(condition);
  };

  /**
   * Handles pagination changes from the Antd Pagination component.
   * Updates page and/or pageSize state when user interacts with pagination.
   * @param currentPage - The new page number (1-based).
   * @param currentPageSize - The new page size.
   */
  const handlePaginationChange = (
    currentPage: number,
    currentPageSize: number,
  ) => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
    if (pageSize !== currentPageSize) {
      setPageSize(currentPageSize);
    }
  };

  /**
   * Handles row selection changes from the data table.
   * Notifies parent component and updates selected count display.
   * @param data - Array of currently selected records.
   */
  const handleTableSelectedDataChange = (data: RecordType[]) => {
    onSelectedDataChange?.(data);
    updateSelectedCount(data.length);
  };

  /**
   * Handles sort changes from the data table.
   * Normalizes single sorter or array of sorters into array format.
   * @param sorter - Single sorter result or array of sorters from Antd Table.
   */
  const handleSortChanged = (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => {
    let finalSorter: FieldSort[] = [];
    if (Array.isArray(sorter)) {
      finalSorter = sorter
        .filter(it => it.field)
        .map(
          it =>
            ({
              field: Array.isArray(it.field)
                ? [...it.field].join('.')
                : it.field,
              direction: it.order === 'ascend' ? 'ASC' : 'DESC',
            }) as FieldSort,
        );
    } else {
      if (sorter.field) {
        finalSorter = [
          {
            field: Array.isArray(sorter.field)
              ? [...sorter.field].join('.')
              : sorter.field,
            direction: sorter.order === 'ascend' ? 'ASC' : 'DESC',
          } as FieldSort,
        ];
      } else {
        finalSorter = [];
      }
    }

    setSorter(finalSorter);
  };

  /** Ref for accessing EditableFilterPanel imperative methods (reset) */
  const editableFilterPanelRef = useRef<FilterPanelRef | null>(null);
  /** Ref for accessing ViewTable imperative methods (reset, clearSelectedRowKeys) */
  const viewTableRef = useRef<ViewTableRef | null>(null);

  /** Clears all selected row keys. Called via ref imperatively. */
  const clearSelectedRowKeysFn = useCallback(() => {
    viewTableRef.current?.clearSelectedRowKeys();
    onSelectedDataChange?.([]);
    updateSelectedCount(0);
  }, [onSelectedDataChange, updateSelectedCount]);

  /**
   * Resets all view state to default values.
   * Called via ref imperatively from parent components.
   */
  const resetFn = () => {
    // reset();
    editableFilterPanelRef.current?.reset();
    clearSelectedRowKeysFn();
  };

  /**
   * Exposes imperative methods to parent components via ref.
   * Allows parent to control table size, reset state, and clear selections.
   */
  useImperativeHandle<ViewRef, ViewRef>(ref, () => ({
    clearSelectedRowKeys: clearSelectedRowKeysFn,
    updateTableSize: setTableSize,
    reset: resetFn,
  }));

  // useEffect(() => {
  //   clearSelectedRowKeysFn();
  // }, [dataSource, clearSelectedRowKeysFn]);

  /**
   * Renders the view component.
   * Contains filter panel (optional), data table, and pagination footer.
   */
  return (
    <Space orientation="vertical" style={{ display: 'flex' }} size="small">
      {/* Editable filter panel - allows users to add/remove/modify filters */}
      {filterMode === 'editable' && (
        <div
          className={styles.filterPanel}
          style={{ display: showFilter ? 'block' : 'none' }}
        >
          <EditableFilterPanel
            row={{ gutter: [24, 16], wrap: true }}
            col={{
              xxl: 12,
              xl: 12,
              lg: 12,
              md: 12,
              sm: 24,
              xs: 24,
            }}
            ref={editableFilterPanelRef}
            filters={activeFilters}
            availableFilters={availableFilters}
            resetButton={false}
            onSearch={handleSearch}
            onChange={setActiveFilters}
          />
        </div>
      )}
      {/* Normal filter panel - read-only display of active filters */}
      {filterMode === 'normal' && (
        <div
          className={styles.filterPanel}
          style={{ display: showFilter ? 'block' : 'none' }}
        >
          <FilterPanel
            ref={editableFilterPanelRef}
            filters={activeFilters}
            resetButton={false}
            onSearch={handleSearch}
          />
        </div>
      )}
      {/* Data table with columns, sorting, row selection, and actions */}
      <ViewTable<RecordType>
        ref={viewTableRef}
        loading={loading}
        dataSource={dataSource.list}
        fields={fields}
        columns={columns}
        onColumnsChange={setColumns}
        tableSize={tableSize}
        actionColumn={actionColumn}
        onSortChanged={handleSortChanged}
        onSelectChange={handleTableSelectedDataChange}
        attributes={{ pagination: false }}
        enableRowSelection={enableRowSelection}
        onClickPrimaryKey={onClickPrimaryKey}
        viewTableSetting={viewTableSetting || false}
      />
      {/* Pagination footer with selection count and Antd Pagination */}
      {(pagination !== false || enableRowSelection) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Selection count display */}
          <span>
            {selectedCount
              ? locale.selectedCountLabel
                ? locale.selectedCountLabel.format(selectedCount)
                : `已选择 ${selectedCount} 条数据`
              : ''}
          </span>
          {/* Antd Pagination component */}
          <Pagination
            showTotal={total => `共 ${total} 条数据`}
            defaultCurrent={page}
            current={page}
            pageSize={pageSize || 10}
            total={dataSource.total}
            pageSizeOptions={['10', '20', '50', '100']}
            {...pagination}
            onChange={handlePaginationChange}
          />
        </div>
      )}
    </Space>
  );
}
