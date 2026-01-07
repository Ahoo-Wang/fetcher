import { Table, Popover } from 'antd';
import { ActionCell, ActionsCell, TextCell, typedCellRender } from './cell';
import { ViewTableProps } from './types';
import { SettingOutlined } from '@ant-design/icons';
import styles from './ViewTable.module.css';
import { TableSettingPanel } from './setting';

import type { TableColumnsType } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { Key, useState } from 'react';
import { useActiveViewStateContext } from '../viewer/ActiveViewStateContext';

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

  const tableColumns: TableColumnsType<RecordType> = viewDefinition.fields.map(
    columnDefinition => {
      const column = activeView.columns.find(it => it.name === columnDefinition.name);
      return {
        title: columnDefinition.label,
        dataIndex: columnDefinition.name.split('.'),
        fixed: columnDefinition.primaryKey
          ? 'start'
          : column?.fixed
            ? 'start'
            : '',
        render: (value: any, record: RecordType, index: number) => {
          if (columnDefinition.render) {
            return columnDefinition.render(value, record, index);
          }

          if (columnDefinition.primaryKey) {
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
            columnDefinition.type,
            columnDefinition.attributes || {},
          );

          if (cellRender) {
            return cellRender(value, record, index);
          } else {
            return <TextCell data={{ value: String(value), record, index }} />;
          }
        },
        sorter: columnDefinition.sorter,
        width: column?.width,
        hidden: column ? column!.hidden : true,
        ...columnDefinition.attributes,
      };
    },
  );
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
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
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
