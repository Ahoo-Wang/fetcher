/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Table, message } from 'antd';
import { ActionCell } from '../ActionCell';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
}

const meta: Meta<typeof ActionCell> = {
  title: 'Viewer/Table/Cell/ActionCell',
  component: ActionCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An action cell component that renders interactive buttons in table cells. Supports custom click handlers, button styling, and conditional rendering based on data availability.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Button props and click handler configuration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData: User[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    role: 'Admin',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive',
    role: 'User',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'active',
    role: 'User',
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice@example.com',
    status: 'pending',
    role: 'Moderator',
  },
];

export const Basic: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 80,
        },
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Email',
          dataIndex: 'email',
          key: 'email',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
        },
        {
          title: 'Actions',
          key: 'actions',
          width: 120,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'Edit', key: 'edit' },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  console.log('Action:', actionKey, 'User:', user);
                  message
                    .info(`Action: ${actionKey}, User: ${user.name}`)
                    .then(r => {});
                },
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const MultipleActions: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
        },
        {
          title: 'View',
          key: 'view',
          width: 80,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'View', key: 'view' },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.info(`Viewing user: ${user.name}`);
                },
              }}
            />
          ),
        },
        {
          title: 'Edit',
          key: 'edit',
          width: 80,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'Edit', key: 'edit' },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.info(`Editing user: ${user.name}`);
                },
              }}
            />
          ),
        },
        {
          title: 'Delete',
          key: 'delete',
          width: 100,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'Delete', key: 'delete' },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.warning(`Deleting user: ${user.name}`);
                },
                danger: true,
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const ConditionalActions: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
        },
        {
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record, index) => (
            <div style={{ display: 'flex', gap: '8px' }}>
              <ActionCell
                data={{
                  value:
                    record.status !== 'pending'
                      ? { title: 'Edit', key: 'edit' }
                      : { title: '', key: '' },
                  record,
                  index,
                }}
                attributes={{
                  onClick: (actionKey, user) => {
                    message.info(`Editing user: ${user.name}`);
                  },
                }}
              />
              <ActionCell
                data={{
                  value:
                    record.status === 'active'
                      ? { title: 'Deactivate', key: 'deactivate' }
                      : { title: 'Activate', key: 'activate' },
                  record,
                  index,
                }}
                attributes={{
                  onClick: (actionKey, user) => {
                    message.info(
                      `${actionKey === 'activate' ? 'Activating' : 'Deactivating'} user: ${user.name}`,
                    );
                  },
                }}
              />
            </div>
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const WithStyling: Story = {
  render: () => (
    <Table
      dataSource={sampleData.slice(0, 3)}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Actions',
          key: 'actions',
          width: 150,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'Edit Profile', key: 'edit' },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.info(`Editing profile for: ${user.name}`);
                },
                style: {
                  background:
                    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                },
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const DisabledActions: Story = {
  render: () => (
    <Table
      dataSource={sampleData}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
        },
        {
          title: 'Delete',
          key: 'delete',
          width: 100,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'Delete', key: 'delete' },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.error(`Cannot delete admin user: ${user.name}`);
                },
                disabled: record.role === 'Admin',
                danger: true,
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const LoadingActions: Story = {
  render: () => (
    <Table
      dataSource={sampleData.slice(0, 2)}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: 'Save',
          key: 'save',
          width: 100,
          render: (_, record, index) => (
            <ActionCell
              data={{
                value: { title: 'Save', key: 'save' },
                record,
                index,
              }}
              attributes={{
                onClick: async (actionKey, user) => {
                  message.loading({ content: 'Saving...', key: 'save' });
                  // Simulate async operation
                  setTimeout(() => {
                    message.success({
                      content: `Saved user: ${user.name}`,
                      key: 'save',
                    });
                  }, 2000);
                },
                loading: false, // Set to true to show loading state
              }}
            />
          ),
        },
      ]}
      rowKey="id"
      pagination={false}
    />
  ),
};

export const EmptyActions: Story = {
  render: () => {
    const dataWithEmptyActions = [
      { id: 1, name: 'John Doe', canEdit: true },
      { id: 2, name: 'Jane Smith', canEdit: false },
      { id: 3, name: 'Bob Johnson', canEdit: null },
    ];

    return (
      <Table
        dataSource={dataWithEmptyActions}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Edit',
            key: 'edit',
            width: 100,
            render: (_, record, index) => (
              <ActionCell
                data={{
                  value: record.canEdit
                    ? { title: 'Edit', key: 'edit' }
                    : { title: '', key: '' },
                  record,
                  index,
                }}
                attributes={{
                  onClick: (actionKey, user) => {
                    message.info(`Editing user: ${user.name}`);
                  },
                }}
              />
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};

export const ComplexData: Story = {
  render: () => {
    interface ComplexUser extends User {
      metadata: {
        lastLogin: string;
        permissions: string[];
      };
      settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
      };
    }

    const complexData: ComplexUser[] = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        role: 'Admin',
        metadata: {
          lastLogin: '2024-01-15',
          permissions: ['read', 'write', 'delete'],
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'active',
        role: 'User',
        metadata: {
          lastLogin: '2024-01-10',
          permissions: ['read'],
        },
        settings: {
          theme: 'light',
          notifications: false,
        },
      },
    ];

    return (
      <Table
        dataSource={complexData}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_, record, index) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <ActionCell
                  data={{
                    value: { title: 'View Details', key: 'view' },
                    record,
                    index,
                  }}
                  attributes={{
                    onClick: (actionKey, user) => {
                      message.info(`Viewing details for: ${user.name}
Permissions: ${user.metadata.permissions.join(', ')}
Theme: ${user.settings.theme}`);
                    },
                  }}
                />
                <ActionCell
                  data={{
                    value: { title: 'Settings', key: 'settings' },
                    record,
                    index,
                  }}
                  attributes={{
                    onClick: (actionKey, user) => {
                      message.info(`Opening settings for: ${user.name}`);
                    },
                    type: 'primary',
                  }}
                />
              </div>
            ),
          },
        ]}
        rowKey="id"
        pagination={false}
      />
    );
  },
};
