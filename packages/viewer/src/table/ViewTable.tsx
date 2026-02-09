import { Table, Popover, TableProps } from 'antd';
import { ActionCell, ActionsCell, TextCell, typedCellRender } from './cell';
import { ViewTableActionColumn } from './types';
import { SettingOutlined } from '@ant-design/icons';
import styles from './ViewTable.module.css';
import { TableSettingPanel } from './setting';

import type { TableColumnsType } from 'antd';
import type { SorterResult, TableRowSelection } from 'antd/es/table/interface';
import { RefAttributes, useImperativeHandle } from 'react';
import { AttributesCapable } from '../types';
import { ViewColumn, FieldDefinition } from '../viewer';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useViewTableState } from './useViewTableState';

export interface ViewTableRef {
  updateTableSize: (size: SizeType) => void;
  clearSelectedRowKeys: () => void;
  reset: () => void;
}

export interface ViewTableProps<
  RecordType = any,
  Attributes = Omit<TableProps<RecordType>, 'columns' | 'dataSource'>,
>
  extends AttributesCapable<Attributes>, RefAttributes<ViewTableRef> {
  fields: FieldDefinition[];
  columns: ViewColumn[];
  actionColumn?: ViewTableActionColumn<RecordType>;
  defaultTableSize: SizeType;
  dataSource: RecordType[];
  enableRowSelection: boolean;
  onSortChanged?: (
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  ) => void;
  onSelectChange?: (items: RecordType[]) => void;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;

  configurable: boolean;
  configurePanelTitle?: string;
}

export function ViewTable<RecordType>(props: ViewTableProps<RecordType>) {
  // Extract props for easier access and type safety
  const {
    ref,
    fields,
    columns,
    actionColumn,
    defaultTableSize,
    dataSource,
    enableRowSelection,
    onSortChanged,
    onSelectChange,
    onClickPrimaryKey,
    configurable,
    configurePanelTitle,
    attributes,
  } = props;

  const {
    tableSize,
    setTableSize,
    selectedRowKeys,
    setSelectedRowKeys,
    reset,
    clearSelectedRowKeys,
  } = useViewTableState({ defaultTableSize });

  const tableColumns: TableColumnsType<RecordType> = columns.map(col => {
    const columnDefinition = fields.find(f => f.name === col.name);
    return {
      key: col.name,
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
      ...(columnDefinition?.attributes || {}),
    };
  });

  if (actionColumn) {
    // Determine which field to use as the dataIndex for the action column
    // Priority: explicit dataIndex > primary key column > fallback to 'id'
    const dataIndex =
      actionColumn.dataIndex || fields.find(x => x.primaryKey)?.name || 'id';

    tableColumns.push({
      key: 'action',
      title: () => {
        if (configurable) {
          // Create the settings panel component
          const settingPanel = (
            <TableSettingPanel fields={fields} initialColumns={columns} />
          );

          return (
            <div className={styles.configurableColumnHeader}>
              <span>{actionColumn.title}</span>
              <Popover
                content={settingPanel}
                title={configurePanelTitle || 'Setting'}
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
          index: columns.length + 1, // Use next available index
        };
        return <ActionsCell data={data} />;
      },
    });
  }

  const rowSelection: TableRowSelection<RecordType> = {
    selectedRowKeys,
    fixed: true, // Keep selection column fixed during horizontal scroll
    onChange: (keys, selectedRows) => {
      setSelectedRowKeys(keys);
      onSelectChange?.(selectedRows); // Notify parent component of selection changes
    },
  };

  useImperativeHandle<ViewTableRef, ViewTableRef>(ref, () => ({
    updateTableSize: setTableSize,
    clearSelectedRowKeys: clearSelectedRowKeys,
    reset: reset,
  }));

  return (
    <Table<RecordType>
      dataSource={dataSource}
      rowSelection={enableRowSelection ? rowSelection : undefined}
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
