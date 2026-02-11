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
import { Condition, PagedList } from '@ahoo-wang/fetcher-wow';
import { RefAttributes, useImperativeHandle, useRef } from 'react';
import { FieldDefinition, ViewColumn } from '../viewer';
import { ViewTable, ViewTableActionColumn, ViewTableRef } from '../table';
import {
  PrimaryKeyClickHandlerCapable,
  TableSizeCapable,
  ViewTableSettingCapable,
} from '../types';
import { mapToTableRecord } from '../utils';
import type { SorterResult } from 'antd/es/table/interface';
import { useViewState } from './';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export type ViewChangeAction = 'pagination' | 'sorter' | 'filter' | 'reset';

export interface ViewRef extends ViewTableRef {
  updateTableSize: (size: SizeType) => void;
  reset: () => void;
}

export interface ViewProps<RecordType>
  extends
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    TableSizeCapable,
    RefAttributes<ViewRef> {
  fields: FieldDefinition[];
  availableFilters: AvailableFilterGroup[];
  // 外部State
  dataSource: PagedList<RecordType>;
  // 外部State
  showFilter: boolean;
  editableFilters?: boolean;

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

  actionColumn?: ViewTableActionColumn<RecordType>;

  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;

  enableRowSelection: boolean;
  onChange?: (
    action: ViewChangeAction,
    condition?: Condition,
    index?: number,
    size?: number,
    sorter?: SorterResult<RecordType>[],
  ) => void;
  onSelectedDataChange?: (data: RecordType[]) => void;
}

export function View<RecordType>(props: ViewProps<RecordType>) {
  const {
    ref,
    fields,
    availableFilters,
    dataSource,
    actionColumn,
    showFilter,
    editableFilters,
    pagination,
    enableRowSelection,
    viewTableSetting,
    defaultActiveFilters,
    externalActiveFilters,
    externalUpdateActiveFilters,
    defaultColumns,
    externalColumns,
    externalUpdateColumns,
    defaultPageSize,
    externalPageSize,
    externalUpdatePageSize,
    defaultTableSize,
    externalTableSize,
    externalUpdateTableSize,
    onClickPrimaryKey,
    onChange,
    onSelectedDataChange,
  } = props;

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
    selectedCount,
    updateSelectedCount,
    reset,
  } = useViewState({
    defaultActiveFilters,
    externalActiveFilters,
    externalUpdateActiveFilters,
    defaultColumns,
    externalColumns,
    externalUpdateColumns,
    defaultPageSize,
    externalPageSize,
    externalUpdatePageSize,
    defaultTableSize,
    externalTableSize,
    externalUpdateTableSize,
    onChange,
  });

  const handleSearch = (condition: Condition) => {
    onChange?.('filter', condition);
  };

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

  const handleTableSelectedDataChange = (data: RecordType[]) => {
    onSelectedDataChange?.(data);
    updateSelectedCount(data.length);
  };

  const handleSortChanged = (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => {
    if (Array.isArray(sorter)) {
      onChange?.('sorter', undefined, undefined, undefined, sorter);
    } else {
      onChange?.('sorter', undefined, undefined, undefined, [sorter]);
    }
  };

  const editableFilterPanelRef = useRef<FilterPanelRef | null>(null);
  const viewTableRef = useRef<ViewTableRef | null>(null);

  const resetFn = () => {
    reset();
    editableFilterPanelRef.current?.reset();
    viewTableRef.current?.reset();
  };

  const clearSelectedRowKeysFn = () => {
    viewTableRef.current?.clearSelectedRowKeys();
  };

  useImperativeHandle<ViewRef, ViewRef>(ref, () => ({
    clearSelectedRowKeys: clearSelectedRowKeysFn,
    updateTableSize: setTableSize,
    reset: resetFn,
  }));

  return (
    <Space orientation="vertical" style={{ display: 'flex' }} size="small">
      {showFilter && editableFilters && (
        <div className={styles.filterPanel}>
          <EditableFilterPanel
            ref={editableFilterPanelRef}
            filters={activeFilters}
            availableFilters={availableFilters}
            resetButton={false}
            onSearch={handleSearch}
            onChange={setActiveFilters}
          />
        </div>
      )}
      {showFilter && !editableFilters && (
        <div className={styles.filterPanel}>
          <FilterPanel
            ref={editableFilterPanelRef}
            filters={activeFilters}
            resetButton={false}
            onSearch={handleSearch}
          />
        </div>
      )}
      <ViewTable<RecordType>
        ref={viewTableRef}
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
      ></ViewTable>
      {pagination && enableRowSelection && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{selectedCount ? `已选择 ${selectedCount} 条数据` : ''}</span>
          <Pagination
            showTotal={total => `共 ${total} 条数据`}
            defaultPageSize={pageSize || 10}
            defaultCurrent={page}
            current={page}
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
