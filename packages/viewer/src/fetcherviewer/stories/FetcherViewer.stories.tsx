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
import { FullscreenProvider } from '@ahoo-wang/fetcher-react';

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
      Authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwVkR2U3hVUTAwQkY2UEEiLCJzdWIiOiIzaEsiLCJpYXQiOjE3NzM1NjYxODIsImV4cCI6MTc3MzgyNTM4MiwiYXR0cmlidXRlcyI6eyJpc093bmVyIjoiZmFsc2UiLCJhcHBJZCI6InBtcyIsImRlcGFydG1lbnRzIjpbXSwiYXV0aGVudGljYXRlSWQiOiIwVkNtcnVOcjAwZmg0OHAifSwidGVuYW50SWQiOiJteWRhbyJ9.EqBGPTYuRSoXrZDi-CAi_nFz3TEhtXhGnmHbCYs5uu0',
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

/**
 * 全屏示例：使用默认的 document.documentElement（整个页面全屏）
 */
export const FullscreenDefault: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  },
  render: args => (
    <FullscreenProvider>
      <FetcherViewer {...args} />
    </FullscreenProvider>
  ),
};

/**
 * 全屏示例：不从外部获取自动挂载内部视图容器
 */
export const FullscreenInternalRef: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
    getFullScreenTarget: false,
  },
  render: args => (
    <FullscreenProvider>
      <div style={{ color: 'red' }}>
        默认自动挂载内部viewRef容器全屏后不可见
      </div>
      <FetcherViewer {...args} />
    </FullscreenProvider>
  ),
};

/**
 * 全屏示例：使用 RefObject 获取容器元素
 * 通过 useRef 创建 ref 并传递给组件
 */
export const FullscreenWithRef: Story = {
  args: {
    viewerDefinitionId: 'sku-cost',
    ownerId: '1ZE',
    tenantId: 'mydao',
    defaultViewId: '',
    pagination: {} as PaginationProps,
    enableRowSelection: true,
  },
  render: args => {
    const containerRef = useRef<HTMLDivElement>(null);
    return (
      <FullscreenProvider>
        <div
          ref={containerRef}
          style={{ padding: '16px', background: '#f5f5f5' }}
        >
          <div style={{ color: 'red' }}>外部容器（RefObject）- 全屏后可见</div>
          <FetcherViewer {...args} getFullScreenTarget={containerRef} />
        </div>
      </FullscreenProvider>
    );
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
      <FullscreenProvider>
        <FetcherViewer ref={viewerRef} {...args} />
      </FullscreenProvider>
    </Space>
  );
};
