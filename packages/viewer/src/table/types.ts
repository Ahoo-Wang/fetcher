import { AttributesCapable } from '../types';
import { Attributes } from 'react';
import { ActionsData } from './cell';

export interface ColumnsCell {
  type: string;
  attributes?: any;
}

export interface ViewTableColumn<
  RecordType = any,
  Attributes = any,
> extends AttributesCapable<Attributes> {
  title: string;
  dataIndex: string;
  cell: ColumnsCell;
}

export interface ViewTableActionColumn<
  RecordType = any,
  Attributes = any,
> extends ViewTableColumn<RecordType, Attributes> {
  actions: (record: RecordType) => ActionsData;
}

export interface ViewTableProps<
  RecordType = any,
  Attributes = any,
> extends AttributesCapable<Attributes> {
  columns: ViewTableColumn<RecordType>[];
  dataSource: RecordType[];
  actionColumn?: ViewTableActionColumn<RecordType, any>;
}
