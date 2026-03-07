import type { Meta, StoryObj } from '@storybook/react';
import { FetcherViewer, FetcherViewerRef } from '../FetcherViewer';
import type { PaginationProps } from 'antd';
import { Button, Space } from 'antd';
import { useRef } from 'react';
import {
  fetcher,
  FetchExchange,
  RequestInterceptor,
  URL_RESOLVE_INTERCEPTOR_ORDER,
  UrlBuilder,
} from '@ahoo-wang/fetcher';

const ACCEPT = 'Accept';
const CONTENT_TYPE = 'Content-Type';
const X_WAREHOUSE_ID = 'X-Warehouse-Id';
const COSEC_APP_ID = 'cosec-app-id';


class TestFetcherRequestInterceptor implements RequestInterceptor {
  name = 'RequestInterceptor';
  order = URL_RESOLVE_INTERCEPTOR_ORDER - 1;

  async intercept(exchange: FetchExchange): Promise<void> {
    exchange.request.cache = 'no-store';
    exchange.request.credentials = 'omit';
    exchange.request.redirect = 'follow';
    exchange.request.referrer = 'about:client';
    exchange.request.headers = {
      ...exchange.request.headers,
      [ACCEPT]: 'application/json',
      [CONTENT_TYPE]: 'application/json',
      [X_WAREHOUSE_ID]: 'mydao-SH',
      [COSEC_APP_ID]: 'pms',
      Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwVkQ0UWpFSzAwUkY0bEkiLCJzdWIiOiIzaEsiLCJpYXQiOjE3NzI3ODI1MDUsImV4cCI6MTc3MzA0MTcwNSwiYXR0cmlidXRlcyI6eyJpc093bmVyIjoiZmFsc2UiLCJhcHBJZCI6InBtcyIsImRlcGFydG1lbnRzIjpbXSwiYXV0aGVudGljYXRlSWQiOiIwVkNtcnVOcjAwZmg0OHAifSwidGVuYW50SWQiOiJteWRhbyJ9.cGsJkdTYLgfhBSyRjqKyDHaTW5yBV-USfrx_i9czvAw'
    };

    exchange.request.url = exchange.request.url.replace('{tenantId}', 'mydao');
    exchange.request.url = exchange.request.url.replace('{ownerId}', '1ZE');
  }
}

fetcher.urlBuilder = new UrlBuilder('https://dev-api.linyikj.com');
fetcher.interceptors.request.use(new TestFetcherRequestInterceptor());

const meta: Meta<typeof FetcherViewer> = {
  title: 'Viewer/FetcherViewer',
  component: FetcherViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A viewer component that fetches view definition and views from remote server. Built on top of Viewer component with integrated data fetching capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    viewerDefinitionId: {
      control: 'text',
      description: 'Unique identifier for the view definition',
    },
    defaultViewId: {
      control: 'text',
      description: 'Default view ID to display',
    },
    pagination: {
      control: 'object',
      description: 'Pagination configuration',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Whether to enable row selection',
    },
    actionColumn: {
      control: 'object',
      description: 'Action column configuration for row operations',
    },
    viewTableSetting: {
      control: 'object',
      description: 'Table settings panel configuration',
    },
    onClickPrimaryKey: {
      action: 'primary key clicked',
      description: 'Callback fired when primary key cell is clicked',
    },
    onSwitchView: {
      action: 'view changed',
      description: 'Callback fired when user switches view',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  },
};

export const WithRowSelection: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  },
};

export const WithoutPagination: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: false,
    enableRowSelection: false,
  },
};

export const SmallPageSize: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: { defaultPageSize: 5 } as PaginationProps,
    enableRowSelection: false,
  },
};

export const LargePageSize: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: { defaultPageSize: 50 } as PaginationProps,
    enableRowSelection: false,
  },
};

const FetcherViewerWithRefMethodsWrapper = (args: any) => {
  const viewerRef = useRef<FetcherViewerRef>(null);

  const handleClearSelection = () => {
    console.log('Clearing selected rows...');
    viewerRef.current?.clearSelectedRowKeys();
  };

  const handleRefresh = () => {
    console.log('Refreshing data...');
    viewerRef.current?.refreshData();
  };

  const handleGetCondition = () => {
    console.log('Getting current condition...');
    const condition = viewerRef.current?.getCondition();
    console.log('Current condition:', condition);
    alert(`Current condition: ${JSON.stringify(condition)}`);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space>
        <Button type="primary" onClick={handleRefresh}>
          Refresh Data
        </Button>
        <Button onClick={handleClearSelection}>Clear Selection</Button>
        <Button onClick={handleGetCondition}>Get Condition</Button>
      </Space>
      <FetcherViewer ref={viewerRef} {...args} />
    </Space>
  );
};

export const WithRefMethods: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  },
  render: args => <FetcherViewerWithRefMethodsWrapper {...args} />,
};
