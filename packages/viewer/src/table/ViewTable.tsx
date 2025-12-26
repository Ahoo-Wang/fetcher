import { Table, Popover } from 'antd';
import { ActionsCell, TextCell, typedCellRender } from './cell';
import { ViewTableProps } from './types';
import { SettingOutlined } from '@ant-design/icons';
import styles from './ViewTable.module.css';
import { TableSettingPanel } from './setting';

import type { TableColumnsType } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { TableRecordType } from '../types';
import { Key, useState } from 'react';
import { useTableStateContext } from '../viewer';

/**
 * ViewTable Component
 *
 * A comprehensive table component that provides advanced data display capabilities
 * with column management, sorting, selection, and customizable actions. It integrates
 * with the viewer's table state context for dynamic column visibility and configuration.
 *
 * @template RecordType - The type of records displayed in the table, must extend TableRecordType
 *
 * @param props - The properties for configuring the table
 * @param props.viewDefinition - Defines the table structure, columns, and behavior
 * @param props.dataSource - Array of records to display in the table
 * @param props.actionColumn - Optional action column configuration for row-level actions
 * @param props.onSortChanged - Callback fired when table sorting changes
 * @param props.onSelectChange - Callback fired when row selection changes
 * @param props.attributes - Additional Ant Design Table props
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   status: 'active' | 'inactive';
 * }
 *
 * const viewDefinition: ViewDefinition = {
 *   name: 'Users',
 *   columns: [
 *     {
 *       title: 'ID',
 *       dataIndex: 'id',
 *       type: 'number',
 *       primaryKey: true,
 *       sorter: true
 *     },
 *     {
 *       title: 'Name',
 *       dataIndex: 'name',
 *       type: 'text',
 *       sorter: true
 *     },
 *     {
 *       title: 'Email',
 *       dataIndex: 'email',
 *       type: 'link',
 *       attributes: { target: '_blank' }
 *     },
 *     {
 *       title: 'Status',
 *       dataIndex: 'status',
 *       type: 'tag',
 *       sorter: true
 *     }
 *   ],
 *   availableFilters: [],
 *   dataSourceUrl: '/api/users',
 *   countUrl: '/api/users/count',
 *   checkable: true
 * };
 *
 * const actionColumn: ViewTableActionColumn<User> = {
 *   title: 'Actions',
 *   configurable: true,
 *   configurePanelTitle: 'Table Settings',
 *   actions: (record) => ({
 *     primaryAction: {
 *       data: { value: 'Edit', record, index: 0 },
 *       attributes: { onClick: () => handleEdit(record.id) }
 *     },
 *     secondaryActions: [
 *       {
 *         data: { value: 'Delete', record, index: 0 },
 *         attributes: { onClick: () => handleDelete(record.id), danger: true }
 *       }
 *     ]
 *   })
 * };
 *
 * function UserTable() {
 *   const [data, setData] = useState<User[]>([]);
 *
 *   return (
 *     <ViewTable
 *       viewDefinition={viewDefinition}
 *       dataSource={data}
 *       actionColumn={actionColumn}
 *       onSortChanged={(sorter) => {
 *         console.log('Sort changed:', sorter);
 *       }}
 *       onSelectChange={(selectedUsers) => {
 *         console.log('Selected users:', selectedUsers);
 *       }}
 *       attributes={{
 *         pagination: { pageSize: 20 },
 *         loading: false
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function ViewTable<RecordType extends TableRecordType<any>>(
  props: ViewTableProps<RecordType>,
) {
  // Extract props for easier access and type safety
  const {
    viewDefinition,
    dataSource,
    actionColumn,
    onSortChanged,
    onSelectChange,
    attributes,
  } = props;

  // Get table state from context (column visibility, table size, etc.)
  const { columns, tableSize } = useTableStateContext();

  /**
   * Transform view columns into Ant Design table columns.
   *
   * This process:
   * 1. Filters only visible columns from the table state
   * 2. Maps each column to its definition in viewDefinition
   * 3. Creates appropriate render functions based on column type
   * 4. Handles special cases like primary key columns and custom renderers
   */
  const tableColumns: TableColumnsType<RecordType> = columns
    .filter(it => it.visible) // Only include columns marked as visible
    .map(it => {
      // Find the column definition that matches this column's dataIndex
      const columnDefinition = viewDefinition.fields.find(
        col => col.name === it.name,
      );

      return columnDefinition
        ? {
            // Standard column properties from definition
            title: columnDefinition.label,
            dataIndex: it.name.split('.'), // Support nested properties (e.g., 'user.name')

            // Fixed positioning: primary keys and explicitly fixed columns go to start
            fixed: columnDefinition.primaryKey
              ? 'start'
              : it.fixed
                ? 'start'
                : '',

            /**
             * Render function that handles different cell types.
             * Priority: custom render > typed cell renderer > fallback text cell
             */
            render: (value, record, index) => {
              // Use custom render function if provided
              if (columnDefinition.render) {
                return columnDefinition.render(value, record, index);
              }

              // Use typed cell renderer based on column type (text, number, link, etc.)
              const cellRender = typedCellRender(
                columnDefinition.type,
                columnDefinition.attributes || {},
              );

              if (cellRender) {
                return cellRender(value, record, index);
              } else {
                // Fallback to basic text cell for unknown types
                return (
                  <TextCell data={{ value: String(value), record, index }} />
                );
              }
            },

            // Enable sorting if specified in definition
            sorter: columnDefinition.sorter,

            // Spread any additional attributes from column definition
            ...columnDefinition.attributes,

            // Use width from table state (user-configurable)
            width: it.width,
          }
        : {
            // Fallback for columns without definitions (shouldn't normally happen)
            title: '未知', // "Unknown" in Chinese
            dataIndex: it.name,
            render: (value, record, index) => {
              return (
                <TextCell
                  data={{ value: String(value) || 'ERROR', record, index }}
                />
              );
            },
          };
    });
  /**
   * Add action column if configured.
   *
   * The action column provides row-level actions like edit/delete buttons.
   * It can be made configurable to allow users to show/hide table columns.
   */
  if (actionColumn) {
    // Determine which field to use as the dataIndex for the action column
    // Priority: explicit dataIndex > primary key column > fallback to 'id'
    const dataIndex =
      actionColumn.dataIndex ||
      viewDefinition.fields.find(x => x.primaryKey)?.name ||
      'id';

    tableColumns.push({
      /**
       * Dynamic title that includes settings icon when configurable.
       * Clicking the settings icon opens a popover with column visibility controls.
       */
      title: () => {
        if (actionColumn.configurable) {
          // Create the settings panel component
          const settingPanel = (
            <TableSettingPanel viewDefinition={viewDefinition} />
          );

          return (
            <div className={styles.configurableColumnHeader}>
              <span>{actionColumn.title}</span>
              <Popover
                content={settingPanel}
                title={actionColumn.configurePanelTitle || 'Setting'}
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
      key: 'action',
      fixed: 'end', // Always fixed to the right side
      width: '200px', // Fixed width for action buttons

      /**
       * Render function for action cells.
       * Calls the actionColumn.actions function to get action data for each row.
       */
      render: (_, record) => {
        const actionsData = props.actionColumn!.actions(record);
        const data = {
          value: actionsData,
          record: record,
          index: columns.length + 1, // Use next available index
        };
        return <ActionsCell data={data} />;
      },
    });
  }

  /**
   * Row selection state and configuration.
   *
   * Only enabled when viewDefinition.checkable is true.
   * Provides checkbox selection for table rows with callback support.
   */
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const rowSelection: TableRowSelection<RecordType> = {
    selectedRowKeys,
    fixed: true, // Keep selection column fixed during horizontal scroll
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      onSelectChange?.(selectedRows); // Notify parent component of selection changes
    },
  };

  return (
    <Table<RecordType>
      dataSource={dataSource}
      rowSelection={viewDefinition.checkable ? rowSelection : undefined}
      columns={tableColumns}
      {...attributes}
      scroll={{ x: 'max-content' }}
      size={tableSize}
      onChange={(_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort' && onSortChanged) {
          onSortChanged(sorter);
        }
      }}
    />
  );
}
