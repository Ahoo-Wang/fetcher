import { Table, Popover, TableProps } from 'antd';
import { ActionCell, ActionsCell, TextCell, typedCellRender } from './cell';
import { ViewTableActionColumn } from './types';
import { SettingOutlined } from '@ant-design/icons';
import styles from './ViewTable.module.css';
import { TableSettingPanel } from './setting';

import type { TableColumnsType } from 'antd';
import type { SorterResult, TableRowSelection } from 'antd/es/table/interface';
import { Key, useState } from 'react';
import { AttributesCapable } from '../types';
import { ViewDefinition, useActiveViewStateContext } from '../viewer';

/**
 * Props for the ViewTable component.
 *
 * @template RecordType - The type of the records in the data source.
 * @template Attributes - The type of additional attributes for the table.
 * @interface ViewTableProps
 * @extends AttributesCapable<Attributes>
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const tableProps: ViewTableProps<User> = {
 *   columns: [
 *     {
 *       title: 'Name',
 *       dataIndex: 'name',
 *       cell: { type: 'text' },
 *       primaryKey: false
 *     },
 *     {
 *       title: 'Email',
 *       dataIndex: 'email',
 *       cell: { type: 'link' },
 *       primaryKey: false
 *     }
 *   ],
 *   dataSource: [
 *     { id: 1, name: 'John Doe', email: 'john@example.com' }
 *   ],
 *   attributes: { pagination: { pageSize: 10 } }
 * };
 * ```
 */
export interface ViewTableProps<
  RecordType = any,
  Attributes = Omit<TableProps<RecordType>, 'columns' | 'dataSource'>,
> extends AttributesCapable<Attributes> {
  viewDefinition: ViewDefinition;
  enableBatchOperation: boolean;
  dataSource: RecordType[];
  actionColumn?: ViewTableActionColumn<RecordType>;
  onSortChanged?: (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => void;
  onSelectChange?: (items: RecordType[]) => void;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
}

export function ViewTable<RecordType>(props: ViewTableProps<RecordType>) {
  // Extract props for easier access and type safety
  const {
    viewDefinition,
    dataSource,
    actionColumn,
    onSortChanged,
    onSelectChange,
    attributes,
    enableBatchOperation,
    onClickPrimaryKey,
  } = props;

  // Get table state from context (column visibility, table size, etc.)
  const { activeView } = useActiveViewStateContext();

  const tableColumns: TableColumnsType<RecordType> = activeView.columns.map(col=>{
    const columnDefinition = viewDefinition.fields.find(f => f.name === col.name)
    return {
      key: col.name,
      title: columnDefinition?.label || 'UNKNOWN',
      dataIndex: col.name.split('.'),
      fixed: columnDefinition?.primaryKey
        ? 'start'
        : col?.fixed
          ? 'start'
          : '',
      render: (value: any, record: RecordType, index: number) => {
        if (columnDefinition?.render) {
          return columnDefinition.render(value, record, index);
        }

        if (columnDefinition?.primaryKey) {
          return (
            <ActionCell
              data={{ value, record, index }}
              attributes={{
                onClick: (record: RecordType) => {
                  onClickPrimaryKey?.(value, record);
                },
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
      sorter: columnDefinition?.sorter,
      width: col.width,
      hidden: col.hidden,
      ...columnDefinition?.attributes || {},
    };
  })

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
          index: activeView.columns.length + 1, // Use next available index
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
    onChange: (keys, selectedRows) => {
      setSelectedRowKeys(keys);
      onSelectChange?.(selectedRows); // Notify parent component of selection changes
    },
  };

  return (
    <Table<RecordType>
      dataSource={dataSource}
      rowSelection={enableBatchOperation ? rowSelection : undefined}
      columns={tableColumns}
      {...attributes}
      scroll={{ x: 'max-content' }}
      size={activeView.tableSize}
      onChange={(_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort' && onSortChanged) {
          onSortChanged(sorter);
        }
      }}
    />
  );
}
