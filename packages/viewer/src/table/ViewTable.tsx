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

export function ViewTable<RecordType extends TableRecordType<any>>(
  props: ViewTableProps<RecordType>,
) {
  const {
    viewDefinition,
    dataSource,
    actionColumn,
    onSortChanged,
    onSelectChange,
    attributes,
  } = props;

  const { columns, tableSize } = useTableStateContext();

  const tableColumns: TableColumnsType<RecordType> = columns
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
              if (columnDefinition.render) {
                return columnDefinition.render(value, record, index);
              }
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
            sorter: columnDefinition.sorter,
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
          index: columns.length + 1,
        };
        return <ActionsCell data={data} />;
      },
    });
  }

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const rowSelection: TableRowSelection<RecordType> = {
    selectedRowKeys,
    fixed: true,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      onSelectChange?.(selectedRows);
      console.log(selectedRowKeys, selectedRows);
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
