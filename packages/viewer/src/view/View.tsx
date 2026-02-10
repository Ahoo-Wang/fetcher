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
  TableRecordType,
  TableSizeCapable,
  ViewTableSettingCapable,
} from '../types';
import { mapToTableRecord } from '../utils';
import type { SorterResult } from 'antd/es/table/interface';
import { useViewState } from './';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export type ViewChangeAction = 'pagination' | 'sorter' | 'filter' | 'reset';

export interface ViewRef extends ViewTableRef {
  reset: () => void;
}

export interface ViewProps<RecordType>
  extends
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    TableSizeCapable,
    RefAttributes<ViewRef> {
  fields: FieldDefinition[];
  // 外部State
  availableFilters: AvailableFilterGroup[];
  // 外部State
  tableSize: SizeType;
  // 外部State
  dataSource: PagedList<RecordType>;
  // 外部State
  showFilter: boolean;
  editableFilters?: boolean;
  activeFilters: ActiveFilter[];

  defaultColumns: ViewColumn[];
  defaultPageSize: number;

  actionColumn?: ViewTableActionColumn<TableRecordType<RecordType>>;

  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;

  enableRowSelection: boolean;
  onChange?: (
    action: ViewChangeAction,
    condition?: Condition,
    index?: number,
    size?: number,
    sorter?: SorterResult<TableRecordType<RecordType>>[],
  ) => void;
  onFiltersChange?: (filters: ActiveFilter[]) => void;
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
    tableSize,
    activeFilters,
    defaultColumns,
    defaultPageSize,
    onClickPrimaryKey,
    onChange,
    onFiltersChange,
    onSelectedDataChange,
  } = props;

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    columns,
    setColumns,
    selectedCount,
    updateSelectedCount,
    reset,
  } = useViewState({
    defaultPage: 1,
    defaultPageSize: defaultPageSize,
    defaultColumns,
    onChange,
  });

  const handleSearch = (condition: Condition) => {
    onChange?.('filter', condition);
  };

  const handleEditableFilterPanelChanged = (filters: ActiveFilter[]) => {
    onFiltersChange?.(filters);
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
    sorter:
      | SorterResult<TableRecordType<RecordType>>
      | SorterResult<TableRecordType<RecordType>>[],
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
            onChange={handleEditableFilterPanelChanged}
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
      <ViewTable<TableRecordType<RecordType>>
        ref={viewTableRef}
        dataSource={mapToTableRecord(dataSource.list)}
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
        viewTableSetting={viewTableSetting}
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
            showTotal={total => `total ${total} items`}
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
