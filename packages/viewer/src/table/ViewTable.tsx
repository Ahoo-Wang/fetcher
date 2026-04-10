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

import { Table, Popover } from 'antd';
import type {
  ViewTableActionColumn} from './';
import {
  ActionsCell,
  TextCell,
  typedCellRender,
  TableSettingPanel,
  useViewTableState,
} from './';
import { SettingOutlined } from '@ant-design/icons';
import styles from './ViewTable.module.css';

import type { TableColumnsType , TableProps } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import type { RefAttributes} from 'react';
import { useImperativeHandle, useMemo } from 'react';
import type {
  AttributesCapable,
  PrimaryKeyClickHandlerCapable,
  TableSizeCapable,
  ViewTableSetting,
  ViewTableSettingCapable,
} from '../types';
import type { FieldDefinition, ViewColumn } from '../viewer';
import { mapToTableRecord } from '../utils';
import { PrimaryKeyCell } from './cell/PrimaryKeyCell';
/**
 * Ref interface for exposing ViewTable imperative methods to parent components.
 * Enables external control of table state without prop drilling.
 */
export interface ViewTableRef {
  /** Clears all selected row keys */
  clearSelectedRowKeys: () => void;
  /** Resets table state to default values */
  reset: () => void;
}

/**
 * Props interface for the ViewTable component.
 *
 * @template RecordType - The type of records displayed in the table.
 * @template Attributes - Additional props to pass to the underlying Antd Table.
 */
export interface ViewTableProps<RecordType = any>
  extends AttributesCapable<Omit<TableProps<RecordType>, 'columns' | 'dataSource'>>,
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    TableSizeCapable,
    RefAttributes<ViewTableRef> {
  /** Field definitions describing each column's metadata */
  fields: FieldDefinition[];
  /** Column configurations including visibility, fixed position, and sorting */
  columns: ViewColumn[];
  onColumnsChange?: (columns: ViewColumn[]) => void;
  /** Optional action column for row-level operations (edit, delete, etc.) */
  actionColumn?: ViewTableActionColumn<RecordType>;
  /** Data source for the table */
  dataSource: RecordType[];
  /** Enables row selection for batch operations */
  enableRowSelection: boolean;
  /** Callback fired when sort order changes */
  onSortChanged?: (sorter: SorterResult<RecordType>[]) => void;
  /** Callback fired when row selection changes */
  onSelectChange?: (items: RecordType[]) => void;
  viewTableSetting: false | ViewTableSetting;
  loading?: boolean;
}

/**
 * ViewTable Component
 *
 * A comprehensive data table component that integrates with the Viewer ecosystem.
 * Provides features including column configuration, row selection, sorting, and
 * custom cell rendering based on field types.
 *
 * Key Features:
 * - Dynamic column rendering based on field definitions
 * - Configurable column visibility and ordering via TableSettingPanel
 * - Row selection with batch operation support
 * - Primary key click handling for navigation
 * - Custom cell type rendering (text, image, date, etc.)
 * - Integration with ActiveViewStateContext for state persistence
 *
 * @template RecordType - The type of records displayed in the table.
 * @param props - Configuration props for the table.
 * @returns An Antd Table component with enhanced Viewer functionality.
 *
 * @example
 * ```tsx
 * <ViewTable<User>
 *   fields={userFields}
 *   columns={userColumns}
 *   dataSource={users}
 *   tableSize="middle"
 *   enableRowSelection
 *   onSortChanged={(sorter) => console.log('Sort:', sorter)}
 *   onClickPrimaryKey={(id, user) => navigateToUser(id)}
 * />
 * ```
 */
export function ViewTable<RecordType>(props: ViewTableProps<RecordType>) {
  // Extract props for easier access and type safety
  const {
    ref,
    fields,
    columns,
    onColumnsChange,
    actionColumn,
    tableSize,
    dataSource,
    enableRowSelection,
    onSortChanged,
    onSelectChange,
    onClickPrimaryKey,
    viewTableSetting,
    loading,
    attributes,
  } = props;

  const { selectedRowKeys, setSelectedRowKeys, reset, clearSelectedRowKeys } =
    useViewTableState();

  /**
   * Builds table columns from field definitions and column configurations.
   * Each column is mapped to its definition for rendering and behavior.
   */
  const tableColumns: TableColumnsType<RecordType> = useMemo(() => {
    const cols: TableColumnsType<RecordType> = columns.map(col => {
      const columnDefinition = fields.find(f => f.name === col.name);
      return {
        key: col.key,
        title: columnDefinition?.label || 'UNKNOWN',
        dataIndex: col.name.split('.'),
        fixed: columnDefinition?.primaryKey ? 'start' : col?.fixed ? 'start' : '',
        sorter: columnDefinition?.sorter,
        defaultSortOrder: col.sortOrder,
        width: col.width,
        hidden: col.hidden,
        render: (value: any, record: RecordType, index: number) => {
          if (columnDefinition?.render) {
            return columnDefinition.render(value, record, index);
          }

          if (columnDefinition?.primaryKey) {
            return (
              <PrimaryKeyCell
                data={{ value, record, index }}
                attributes={{
                  onClick: (record: RecordType) => {
                    onClickPrimaryKey?.(value, record);
                  },
                  copyable: true,
                  ...columnDefinition.attributes,
                }}
              />
            );
          }

          const cellRender = typedCellRender(
            columnDefinition?.type || 'text',
            columnDefinition?.attributes || {},
          );

          if (cellRender) {
            return cellRender(value, record, index);
          } else {
            return <TextCell data={{ value: String(value), record, index }} />;
          }
        },
        ...(columnDefinition?.attributes || {}),
      };
    });

    if (actionColumn) {
      const dataIndex =
        actionColumn.dataIndex || fields.find(x => x.primaryKey)?.name || 'id';

      cols.push({
        key: 'action',
        title: () => {
          if (viewTableSetting) {
            const settingPanel = (
              <TableSettingPanel
                fields={fields}
                initialColumns={columns}
                onChange={onColumnsChange}
              />
            );

            return (
              <div className={styles.configurableColumnHeader}>
                <span>{actionColumn.title}</span>
                <Popover
                  content={settingPanel}
                  title={viewTableSetting.title || 'Setting'}
                  placement="bottomRight"
                  trigger="click"
                >
                  <SettingOutlined />
                </Popover>
              </div>
            );
          }
          return actionColumn.title;
        },
        dataIndex: dataIndex,
        fixed: 'end',
        width: '200px',
        render: (_, record) => {
          const actionsData = props.actionColumn!.actions(record);
          const data = {
            value: actionsData,
            record: record,
            index: columns.length + 1,
          };
          return <ActionsCell data={data} />;
        },
      });
    }

    return cols;
  }, [
    columns,
    fields,
    actionColumn,
    viewTableSetting,
    onColumnsChange,
    onClickPrimaryKey,
    props.actionColumn,
  ]);

  /**
   * Row selection configuration.
   * Enabled when enableRowSelection is true.
   */
  const rowSelection: TableProps<RecordType>['rowSelection'] =
    enableRowSelection
      ? {
        selectedRowKeys,
        fixed: true, // Keep selection column fixed during horizontal scroll
        /**
         * Handles row selection changes.
         * Updates local state and notifies parent component.
         */
        onChange: (keys, selectedRows) => {
          setSelectedRowKeys(keys);
          onSelectChange?.(selectedRows); // Notify parent component of selection changes
        },
      }
      : undefined;

  /**
   * Exposes imperative methods via ref.
   * Allows parent components to control table state.
   */
  useImperativeHandle<ViewTableRef, ViewTableRef>(ref, () => ({
    clearSelectedRowKeys: clearSelectedRowKeys,
    reset: reset,
  }));

  /**
   * Renders the configured Antd Table.
   * Combines built columns, row selection, and table configuration.
   */
  return (
    <Table<RecordType>
      loading={loading}
      dataSource={mapToTableRecord(dataSource)}
      rowSelection={rowSelection}
      columns={tableColumns}
      {...attributes}
      scroll={{ x: 'max-content' }}
      size={tableSize || 'middle'}
      /**
       * Handles table change events.
       * Specifically processes sort events and triggers callback.
       */
      onChange={(_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort' && onSortChanged) {
          if (Array.isArray(sorter)) {
            onSortChanged(sorter);
          } else {
            onSortChanged([sorter]);
          }
        }
      }}
    />
  );
}
