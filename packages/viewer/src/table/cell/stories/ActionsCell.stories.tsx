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
import { ActionsCell } from '../ActionsCell';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
}

const meta: Meta<typeof ActionsCell> = {
  title: 'Viewer/Table/Cell/ActionsCell',
  component: ActionsCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An actions cell component that renders multiple interactive actions in table cells. Displays a primary action as a button and secondary actions in a dropdown menu.',
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
          width: 150,
          render: (_, record: User, index) => (
            <ActionsCell
              data={{
                value: {
                  primaryAction: { title: '修改', key: 'edit' },
                  moreActionTitle: '更多',
                  secondaryActions:
                    record.role === 'Admin'
                      ? [
                          { title: '删除', key: 'delete' },
                          { title: '查看详情', key: 'view' },
                        ]
                      : [],
                },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.info(`Action: ${actionKey}, User: ${user.name}`);
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

export const MultipleActionTypes: Story = {
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
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record, index) => (
            <ActionsCell
              data={{
                value: {
                  primaryAction: { title: 'Edit Profile', key: 'edit' },
                  moreActionTitle: 'More',
                  secondaryActions: [
                    { title: 'Send Message', key: 'message' },
                    { title: 'View History', key: 'history' },
                    { title: 'Export Data', key: 'export' },
                    { title: 'Archive', key: 'archive' },
                  ],
                },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.info(
                    `${actionKey.replace(/^\w/, c => c.toUpperCase())} for: ${user.name}`,
                  );
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
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
        },
        {
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record, index) => {
            const canDelete = record.role !== 'Admin';
            const canActivate = record.status === 'inactive';

            const secondaryActions = [];
            if (canDelete) {
              secondaryActions.push({ title: 'Delete', key: 'delete' });
            }
            if (canActivate) {
              secondaryActions.push({ title: 'Activate', key: 'activate' });
            }
            secondaryActions.push({ title: 'View Logs', key: 'logs' });

            return (
              <ActionsCell
                data={{
                  value: {
                    primaryAction: { title: 'Edit', key: 'edit' },
                    moreActionTitle: 'More',
                    secondaryActions,
                  },
                  record,
                  index,
                }}
                attributes={{
                  onClick: (actionKey, user) => {
                    if (actionKey === 'delete' && !canDelete) {
                      message.error('Cannot delete admin user');
                      return;
                    }
                    message.info(`Action: ${actionKey}, User: ${user.name}`);
                  },
                }}
              />
            );
          },
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
          width: 180,
          render: (_, record, index) => (
            <ActionsCell
              data={{
                value: {
                  primaryAction: { title: 'Publish', key: 'publish' },
                  secondaryActions: [
                    { title: 'Save Draft', key: 'save' },
                    { title: 'Preview', key: 'preview' },
                  ],
                },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.success(
                    `${actionKey.replace(/^\w/, c => c.toUpperCase())} for: ${user.name}`,
                  );
                },
                type: 'primary',
                style: {
                  background:
                    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
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

export const DangerActions: Story = {
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
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record, index) => (
            <ActionsCell
              data={{
                value: {
                  primaryAction: { title: 'Edit', key: 'edit' },
                  secondaryActions: [
                    { title: 'Delete User', key: 'delete' },
                    { title: 'Suspend', key: 'suspend' },
                    { title: 'Reset Password', key: 'reset' },
                  ],
                },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  if (actionKey === 'delete') {
                    message.warning(`Deleting user: ${user.name}`);
                  } else {
                    message.info(
                      `${actionKey.replace(/^\w/, c => c.toUpperCase())} for: ${user.name}`,
                    );
                  }
                },
                danger: false, // Primary action is not danger
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

export const LoadingStates: Story = {
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
          title: 'Actions',
          key: 'actions',
          width: 180,
          render: (_, record, index) => (
            <ActionsCell
              data={{
                value: {
                  primaryAction: { title: 'Process', key: 'process' },
                  secondaryActions: [{ title: 'Cancel', key: 'cancel' }],
                },
                record,
                index,
              }}
              attributes={{
                onClick: async (actionKey, user) => {
                  if (actionKey === 'process') {
                    message.loading({
                      content: 'Processing...',
                      key: 'process',
                    });
                    // Simulate async operation
                    setTimeout(() => {
                      message.success({
                        content: `Processed: ${user.name}`,
                        key: 'process',
                      });
                    }, 2000);
                  } else {
                    message.info(`Cancelled for: ${user.name}`);
                  }
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

export const MinimalActions: Story = {
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
          width: 120,
          render: (_, record, index) => (
            <ActionsCell
              data={{
                value: {
                  primaryAction: { title: 'View', key: 'view' },
                  secondaryActions: [{ title: 'Edit', key: 'edit' }],
                },
                record,
                index,
              }}
              attributes={{
                onClick: (actionKey, user) => {
                  message.info(`${actionKey.toUpperCase()}: ${user.name}`);
                },
                size: 'small',
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
            width: 220,
            render: (_, record, index) => (
              <ActionsCell
                data={{
                  value: {
                    primaryAction: { title: 'Manage User', key: 'manage' },
                    secondaryActions: [
                      { title: 'View Permissions', key: 'permissions' },
                      { title: 'Edit Settings', key: 'settings' },
                      { title: 'View Activity', key: 'activity' },
                    ],
                  },
                  record,
                  index,
                }}
                attributes={{
                  onClick: (actionKey, user) => {
                    const messages = {
                      manage: `Managing user: ${user.name}`,
                      permissions: `Permissions: ${user.metadata.permissions.join(', ')}`,
                      settings: `Theme: ${user.settings.theme}, Notifications: ${user.settings.notifications}`,
                      activity: `Last login: ${user.metadata.lastLogin}`,
                    };
                    message.info(
                      messages[actionKey as keyof typeof messages] ||
                        `Action: ${actionKey}`,
                    );
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
