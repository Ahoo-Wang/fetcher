import { Table, TableProps } from 'antd';
import { TextCell, typedCellRender } from './cell';
import { ViewTableProps } from './types';

export function ViewTable<RecordType = any>(props: ViewTableProps<RecordType>) {
  const { columns, dataSource, attributes } = props;

  const tableColumns: TableProps<RecordType>['columns'] = columns.map(it => {
    return {
      title: it.title,
      dataIndex: it.dataIndex,
      key: it.dataIndex,
      render: (value, record, index) => {
        const cellRender = typedCellRender(
          it.cell.type,
          it.cell.attributes || {},
        );
        if (cellRender) {
          return cellRender(value, record, index);
        } else {
          return <TextCell data={{ value: String(value), record, index }} />;
        }
      },
      ...it.attributes,
    };
  });
  if (props.actionColumn) {
    console.log('actionColumn.props =>', props);
    tableColumns.push({
      title: props.actionColumn.title,
      dataIndex: props.actionColumn.dataIndex,
      key: props.actionColumn.dataIndex,
      render: (_, record, index) => {
        const cellRender = typedCellRender('actions', {});
        if (!cellRender) {
          return null;
        }
        const actionsData = props.actionColumn!.actions(record);
        console.log('actionsData from function =>', actionsData);
        return cellRender(actionsData, record, index);
      },
    });
  }

  return (
    <Table<RecordType>
      columns={tableColumns}
      dataSource={dataSource}
      {...attributes}
    />
  );
}
