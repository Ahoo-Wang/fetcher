import { AttributesCapable } from '../types';
import { ActionsData } from './cell';
import { ViewColumn, ViewColumnDefinition, ViewDefinition } from '../viewer';
import { TableProps } from 'antd';
import { COLUMN_HEIGHT_TYPE } from '../topbar';

/**
 * Configuration for a cell in a table column.
 *
 * @interface ColumnsCell
 *
 * @example
 * ```tsx
 * const textCell: ColumnsCell = {
 *   type: 'text'
 * };
 *
 * const linkCell: ColumnsCell = {
 *   type: 'link',
 *   attributes: { target: '_blank' }
 * };
 * ```
 */
export interface ColumnsCell {
  type: string;
  attributes?: any;
}

/**
 * Definition for an action column in a view table.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @template Attributes - The type of additional attributes.
 * @interface ViewTableActionColumn
 * @extends ViewColumnDefinition
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
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
 * ```
 */
export interface ViewTableActionColumn<RecordType = any> {
  title: string;
  dataIndex?: string;
  actions: (record: RecordType) => ActionsData<RecordType>;
  configurable: boolean;
  configurePanelTitle?: string;
}

/**
 * Props for a view column with additional attributes capability.
 *
 * @interface ViewColumnProps
 * @extends AttributesCapable<any>
 * @extends ViewColumnDefinition
 *
 * @example
 * ```tsx
 * const columnProps: ViewColumnProps = {
 *   title: 'Name',
 *   dataIndex: 'name',
 *   cell: { type: 'text' },
 *   primaryKey: false,
 *   attributes: { width: 200, sorter: true }
 * };
 * ```
 */
export interface ViewColumnProps extends ViewColumn {
  columnDefinition: ViewColumnDefinition;
}

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
  dataSource: RecordType[];
  actionColumn?: ViewTableActionColumn<RecordType>;
  tableSize?: COLUMN_HEIGHT_TYPE
}
