import { Table, Popover } from 'antd';
import { ActionsCell, TextCell, typedCellRender } from './cell';
import { ViewTableProps } from './types';
import { SettingOutlined } from '@ant-design/icons';
import styles from './ViewTable.module.css';
import { TableSettingPanel } from './setting';
import { useViewerSharedValue } from '../viewer';

import type { TableColumnsType } from 'antd';

/**
 * Renders a view table using Ant Design's Table component with typed cell rendering.
 *
 * This component provides a flexible table view that supports various cell types
 * through a typed cell rendering system. It automatically handles column configuration,
 * cell rendering based on type, and optional action columns with multiple actions.
 *
 * @template RecordType - The type of the records in the data source.
 * @param props - The props for the ViewTable component.
 * @param props.columns - Array of column definitions with cell type and attributes.
 * @param props.dataSource - Array of records to display in the table.
 * @param props.attributes - Optional attributes to pass to the underlying Table component.
 * @param props.actionColumn - Optional action column configuration with actions function.
 * @returns A React element representing the view table.
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   status: string;
 * }
 *
 * const columns: ViewColumnProps[] = [
 *   {
 *     title: 'Name',
 *     dataIndex: 'name',
 *     cell: { type: 'text' },
 *     primaryKey: false
 *   },
 *   {
 *     title: 'Email',
 *     dataIndex: 'email',
 *     cell: { type: 'link', attributes: { target: '_blank' } },
 *     primaryKey: false
 *   },
 *   {
 *     title: 'Status',
 *     dataIndex: 'status',
 *     cell: { type: 'badge' },
 *     primaryKey: false
 *   }
 * ];
 *
 * const dataSource: User[] = [
 *   { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' }
 * ];
 *
 * <ViewTable
 *   columns={columns}
 *   dataSource={dataSource}
 *   attributes={{ pagination: { pageSize: 10 } }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With action column
 * const actionColumn: ViewTableActionColumn<User> = {
 *   title: 'Actions',
 *   dataIndex: 'actions',
 *   cell: { type: 'actions' },
 *   primaryKey: false,
 *   actions: (record) => ({
 *     primaryAction: {
 *       data: { value: 'Edit', record, index: 0 },
 *       attributes: { onClick: () => editUser(record.id) }
 *     },
 *     secondaryActions: [
 *       {
 *         data: { value: 'Delete', record, index: 0 },
 *         attributes: { onClick: () => deleteUser(record.id), danger: true }
 *       }
 *     ]
 *   })
 * };
 *
 * <ViewTable
 *   columns={columns}
 *   dataSource={dataSource}
 *   actionColumn={actionColumn}
 * />
 * ```
 */
export function ViewTable<RecordType = any>(props: ViewTableProps<RecordType>) {
  const { viewDefinition, dataSource, actionColumn, attributes } = props;

  const { viewColumns, tableSize } = useViewerSharedValue();
  const tableColumns: TableColumnsType<RecordType> = viewColumns
    .filter(it => it.visible)
    .map(it => {
      const columnDefinition = viewDefinition.columns.find(
        col => col.dataIndex === it.dataIndex,
      );

      return columnDefinition
        ? {
            title: columnDefinition.title,
            dataIndex: it.dataIndex.split('.'),
            fixed: columnDefinition.primaryKey
              ? 'start'
              : it.fixed
                ? 'start'
                : '',
            render: (value, record, index) => {
              const cellRender = typedCellRender(
                columnDefinition.type,
                columnDefinition.attributes || {},
              );
              if (cellRender) {
                return cellRender(value, record, index);
              } else {
                return (
                  <TextCell data={{ value: String(value), record, index }} />
                );
              }
            },
            ...columnDefinition.attributes,
            width: it.width,
          }
        : {
            title: '未知',
            dataIndex: it.dataIndex,
            render: (value, record, index) => {
              return (
                <TextCell
                  data={{ value: String(value) || 'ERROR', record, index }}
                />
              );
            },
          };
    });
  if (actionColumn) {
    const dataIndex =
      actionColumn.dataIndex ||
      viewDefinition.columns.find(x => x.primaryKey)?.dataIndex ||
      'id';

    tableColumns.push({
      title: () => {
        if (actionColumn.configurable) {
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
      fixed: 'end',
      width: '200px',
      render: (_, record) => {
        const actionsData = props.actionColumn!.actions(record);
        const data = {
          value: actionsData,
          record: record,
          index: viewColumns.length + 1,
        };
        return <ActionsCell data={data} />;
      },
    });
  }

  return (
    <Table<RecordType>
      dataSource={dataSource}
      columns={tableColumns}
      {...attributes}
      scroll={{ x: 'max-content' }}
      size={tableSize}
    />
  );
}
