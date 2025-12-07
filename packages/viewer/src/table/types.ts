import { AttributesCapable } from '../types';
import { ActionsData } from './cell';

export interface ColumnsCell {
  type: string;
  attributes?: any;
}

export interface ViewColumnDefinition {
  title: string;
  dataIndex: string;
  cell: ColumnsCell;
  primaryKey: boolean;
}

export interface ViewTableActionColumn<
  RecordType = any,
  Attributes = any,
> extends ViewColumnDefinition {
  actions: (record: RecordType) => ActionsData;
}

export interface ViewColumnProps
  extends AttributesCapable<any>, ViewColumnDefinition {}

export interface ViewTableProps<
  RecordType = any,
  Attributes = any,
> extends AttributesCapable<Attributes> {
  columns: ViewColumnProps[];
  dataSource: RecordType[];
  actionColumn?: ViewTableActionColumn<RecordType, any>;
}

export interface ViewColumn {
  columnDefinition: ViewColumnDefinition;
  fixed: boolean;
  visible: boolean;
}
