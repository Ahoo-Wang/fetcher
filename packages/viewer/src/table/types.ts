import { ActionsData } from './cell';

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
}
