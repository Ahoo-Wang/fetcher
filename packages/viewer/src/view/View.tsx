import { Pagination, PaginationProps, Space } from 'antd';
import styles from '../viewer/Viewer.module.css';
import {
  ActiveFilter,
  AvailableFilterGroup,
  EditableFilterPanel,
  FilterPanelRef,
} from '../filter';
import type * as React from 'react';
import { Condition } from '@ahoo-wang/fetcher-wow';
import { RefAttributes, useImperativeHandle, useRef } from 'react';
import { FieldDefinition, ViewState } from '../viewer';
import { ViewTable, ViewTableActionColumn, ViewTableRef } from '../table';
import { PrimaryKeyClickHandlerCapable, TableRecordType, ViewTableSettingCapable } from '../types';
import { deepEqual, mapToTableRecord } from '../utils';
import type { SorterResult } from 'antd/es/table/interface';
import { SearchDataConverterCapable, useViewState } from './';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export interface ViewRef extends ViewTableRef {
  toggleShowFilter: () => boolean;
  reset: () => void;
}

export interface ViewProps<RecordType, SearchBody>
  extends
    SearchDataConverterCapable<SearchBody>,
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    RefAttributes<ViewRef> {
  viewState: ViewState;
  fields: FieldDefinition[];
  dataSource: RecordType[];
  actionColumn?: ViewTableActionColumn<TableRecordType<RecordType>>;
  defaultShowFilter: boolean;
  pagination:
    | false
    | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;

  enableRowSelection: boolean;
  onSearch?: (searchBody: SearchBody) => void;
}

export function View<RecordType, SearchBody>(
  props: ViewProps<RecordType, SearchBody>,
) {
  const {
    ref,
    viewState,
    fields,
    dataSource,
    actionColumn,
    defaultShowFilter,
    pagination,
    enableRowSelection,
    onClickPrimaryKey,
    onSearch,
    searchDataConverter,
    viewTableSetting
  } = props;

  const {
    showFilter,
    toggleShowFilter,
    condition,
    setCondition,
    page,
    setPage,
    pageSize,
    setPageSize,
    tableSelectedData,
    setTableSelectedData,
    reset,
  } = useViewState({
    defaultShowFilter: defaultShowFilter,
    defaultPage: 1,
    defaultPageSize: viewState.pageSize,
    defaultCondition: viewState.condition,
    onSearch,
    searchDataConverter,
  });

  const filters: ActiveFilter[] = [];

  const availableFilters: AvailableFilterGroup[] = [];
  const handleSearch = (latestCondition: Condition) => {
    if (!deepEqual(condition, latestCondition)) {
      setCondition(condition);
    }
  };

  const handleEditableFilterPanelChanged: (filters: ActiveFilter[]) => void = (
    filters: ActiveFilter[],
  ) => {
    console.log('handleEditableFilterPanelChanged', filters);
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
    setTableSelectedData(data);
  };

  const handleSortChanged = (
    sorter:
      | SorterResult<TableRecordType<RecordType>>
      | SorterResult<TableRecordType<RecordType>>[],
  ) => {
    console.log('viewer sort changed', sorter);
  };

  const editableFilterPanelRef = useRef<FilterPanelRef | null>(null);
  const viewTableRef = useRef<ViewTableRef | null>(null);

  const resetFn = () => {
    reset();
    editableFilterPanelRef.current?.reset();
    viewTableRef.current?.reset();
  };

  const updateTableSizeFn = (size: SizeType) => {
    viewTableRef.current?.updateTableSize(size);
  };

  const clearSelectedRowKeysFn = () => {
    viewTableRef.current?.clearSelectedRowKeys();
  }

  useImperativeHandle<ViewRef, ViewRef>(ref, () => ({
    toggleShowFilter,
    updateTableSize: updateTableSizeFn,
    clearSelectedRowKeys: clearSelectedRowKeysFn,
    reset: resetFn,
  }));

  return (
    <Space orientation="vertical" style={{ display: 'flex' }} size="small">
      {showFilter && (
        <div className={styles.filterPanel}>
          <EditableFilterPanel
            ref={editableFilterPanelRef}
            filters={filters}
            availableFilters={availableFilters}
            onSearch={handleSearch}
            onChange={handleEditableFilterPanelChanged}
          />
        </div>
      )}
      <ViewTable<TableRecordType<RecordType>>
        ref={viewTableRef}
        dataSource={mapToTableRecord(dataSource)}
        fields={fields}
        columns={viewState.columns}
        defaultTableSize={viewState.tableSize}
        actionColumn={actionColumn}
        onSortChanged={handleSortChanged}
        onSelectChange={handleTableSelectedDataChange}
        attributes={{ pagination: false }}
        enableRowSelection={enableRowSelection}
        onClickPrimaryKey={onClickPrimaryKey}
        viewTableSetting={viewTableSetting}
      ></ViewTable>
      {pagination && enableRowSelection && (
        <>
          <span>
            {tableSelectedData.length
              ? `已选择 ${tableSelectedData.length} 条数据`
              : ''}
          </span>
          <Pagination
            showTotal={total => `total ${total} items`}
            defaultPageSize={pageSize || 10}
            defaultCurrent={page}
            current={page}
            pageSizeOptions={['10', '20', '50', '100', '200']}
            {...pagination}
            onChange={handlePaginationChange}
          />
        </>
      )}
    </Space>
  );
}
