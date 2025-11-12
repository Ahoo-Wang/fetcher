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
import { Table } from 'antd';
import { CurrencyCell } from '../CurrencyCell';

interface Product {
  id: number;
  name: string;
  price: number;
  currency: string;
}

const meta: Meta<typeof CurrencyCell> = {
  title: 'Viewer/Table/Cell/CurrencyCell',
  component: CurrencyCell,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A currency cell component that formats numeric values as localized currency strings using the formatCurrency function. Supports various currencies, locales, decimal places, and text styling options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    attributes: {
      control: 'object',
      description: 'Currency formatting and text styling options',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData: Product[] = [
  { id: 1, name: 'Laptop', price: 1299.99, currency: 'USD' },
  { id: 2, name: 'Smartphone', price: 699.5, currency: 'USD' },
  { id: 3, name: 'Headphones', price: 199.99, currency: 'USD' },
  { id: 4, name: 'Mouse', price: 29.99, currency: 'USD' },
];

export const Default: Story = {
  args: {
    data: {
      value: 1234.56,
      record: sampleData[0],
      index: 0,
    },
    attributes: {},
  },
};

export const WithUSD: Story = {
  args: {
    data: {
      value: 1299.99,
      record: sampleData[0],
      index: 0,
    },
    attributes: {
      format: {
        currency: 'USD',
        locale: 'en-US',
      },
    },
  },
};

export const WithEUR: Story = {
  args: {
    data: {
      value: 999.99,
      record: sampleData[1],
      index: 1,
    },
    attributes: {
      format: {
        currency: 'EUR',
        locale: 'de-DE',
      },
    },
  },
};

export const WithCNY: Story = {
  args: {
    data: {
      value: 699.5,
      record: sampleData[1],
      index: 1,
    },
    attributes: {
      format: {
        currency: 'CNY',
        locale: 'zh-CN',
      },
    },
  },
};

export const WithCustomDecimals: Story = {
  args: {
    data: {
      value: 199.999,
      record: sampleData[2],
      index: 2,
    },
    attributes: {
      format: {
        currency: 'USD',
        decimals: 3,
        locale: 'en-US',
      },
    },
  },
};

export const WithoutGrouping: Story = {
  args: {
    data: {
      value: 1234567.89,
      record: sampleData[0],
      index: 0,
    },
    attributes: {
      format: {
        currency: 'USD',
        useGrouping: false,
        locale: 'en-US',
      },
    },
  },
};

export const WithCurrencyCode: Story = {
  args: {
    data: {
      value: 299.99,
      record: sampleData[2],
      index: 2,
    },
    attributes: {
      format: {
        currency: 'EUR',
        currencyDisplay: 'code',
        locale: 'en-GB',
      },
    },
  },
};

export const WithCurrencyName: Story = {
  args: {
    data: {
      value: 49.99,
      record: sampleData[3],
      index: 3,
    },
    attributes: {
      format: {
        currency: 'GBP',
        currencyDisplay: 'name',
        locale: 'en-GB',
      },
    },
  },
};

export const WithTextStyling: Story = {
  args: {
    data: {
      value: 1299.99,
      record: sampleData[0],
      index: 0,
    },
    attributes: {
      format: {
        currency: 'USD',
        locale: 'en-US',
      },
      style: { color: 'green', fontWeight: 'bold' },
      ellipsis: true,
    },
  },
};

export const WithStringValue: Story = {
  args: {
    data: {
      value: '999.50',
      record: sampleData[1],
      index: 1,
    },
    attributes: {
      format: {
        currency: 'EUR',
        locale: 'fr-FR',
      },
    },
  },
};

export const WithInvalidValue: Story = {
  args: {
    data: {
      value: NaN,
      record: sampleData[0],
      index: 0,
    },
    attributes: {
      format: {
        currency: 'USD',
        locale: 'en-US',
      },
    },
  },
};

export const InTable: Story = {
  render: () => {
    const columns = [
      {
        title: 'Product',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (value: number, record: Product, index: number) => (
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
    ];

    return (
      <Table
        columns={columns}
        dataSource={sampleData}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  },
};
