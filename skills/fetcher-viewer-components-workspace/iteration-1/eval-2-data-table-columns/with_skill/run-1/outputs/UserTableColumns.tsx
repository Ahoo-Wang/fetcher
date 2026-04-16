import type { TableColumnsType } from 'antd';
import { TextCell, TagCell, CurrencyCell, DateTimeCell, ActionCell } from '@ahoo-wang/fetcher-viewer/table/cell';

export interface User {
  id: number;
  name: string;
  status: string;
  accountBalance: number;
  createdDate: string | number | Date;
}

/**
 * User table column definitions using Ant Design Table columns format.
 *
 * Columns:
 * - name: TextCell with ellipsis for text truncation
 * - status: TagCell with blue color
 * - accountBalance: CurrencyCell formatted as USD
 * - createdDate: DateTimeCell with YYYY-MM-DD format
 * - Edit action: ActionCell for row-level operations
 */
export const userTableColumns: TableColumnsType<User> = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    render: (value: string, record: User, index: number) => (
      <TextCell
        data={{ value, record, index }}
        attributes={{ ellipsis: true }}
      />
    ),
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    render: (value: string, record: User, index: number) => (
      <TagCell
        data={{ value, record, index }}
        attributes={{ color: 'blue' }}
      />
    ),
  },
  {
    key: 'accountBalance',
    title: 'Account Balance',
    dataIndex: 'accountBalance',
    render: (value: number | string, record: User, index: number) => (
      <CurrencyCell
        data={{ value, record, index }}
        attributes={{
          format: {
            currency: 'USD',
            locale: 'en-US',
          },
        }}
      />
    ),
  },
  {
    key: 'createdDate',
    title: 'Created Date',
    dataIndex: 'createdDate',
    render: (value: string | number | Date, record: User, index: number) => (
      <DateTimeCell
        data={{ value, record, index }}
        attributes={{ format: 'YYYY-MM-DD' }}
      />
    ),
  },
  {
    key: 'edit',
    title: 'Action',
    render: (_: unknown, record: User, index: number) => (
      <ActionCell
        data={{ value: 'Edit', record, index }}
        attributes={{
          onClick: (rec: User) => {
            console.log('Edit user:', rec);
          },
        }}
      />
    ),
  },
];
