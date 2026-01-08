import type { Meta, StoryObj } from '@storybook/react';
import { FetcherViewer } from '../FetcherViewer';
import {
  COLUMN_HEIGHT_BAR_ITEM_TYPE,
  FILTER_BAR_ITEM_TYPE,
  REFRESH_DATA_BAR_ITEM_TYPE,
  SHARE_LINK_BAR_ITEM_TYPE,
} from '../../topbar';
import {
  fetcher,
  type FetchExchange,
  RequestInterceptor,
  URL_RESOLVE_INTERCEPTOR_ORDER,
  UrlBuilder,
} from '@ahoo-wang/fetcher';

fetcher.urlBuilder = new UrlBuilder('https://dev-api.linyikj.com');
fetcher.timeout = 1000 * 60 * 2;

const ACCEPT = 'Accept';
const CONTENT_TYPE = 'Content-Type';
const X_WAREHOUSE_ID = 'X-Warehouse-Id';
const FETCHER_REQUEST_INTERCEPTOR_NAME = 'RequestInterceptor';

class FetcherRequestInterceptor implements RequestInterceptor {
  name = FETCHER_REQUEST_INTERCEPTOR_NAME;
  order = URL_RESOLVE_INTERCEPTOR_ORDER - 1;

  async intercept(exchange: FetchExchange): Promise<void> {
    /**
     * 有些 RequestInit 配置不方便在实例化 Fetcher 时传入，可以通过拦截器注入
     * https://developer.mozilla.org/en-US/docs/Web/API/RequestInit
     */
    exchange.request.cache = 'no-store';
    exchange.request.credentials = 'omit';
    exchange.request.redirect = 'follow';
    exchange.request.referrer = 'about:client';
    exchange.request.headers = {
      ...exchange.request.headers,
      [ACCEPT]: 'application/json',
      [CONTENT_TYPE]: 'application/json',
      [X_WAREHOUSE_ID]: 'mydao-SH',
      authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwVjdXRDA0SjAwZWwzQnQiLCJzdWIiOiIzaEgiLCJpYXQiOjE3Njc2OTYxNzQsImV4cCI6MTc2Nzk1NTM3NCwiYXR0cmlidXRlcyI6eyJpc093bmVyIjoiZmFsc2UiLCJhcHBJZCI6InB1cmNoYXNlIiwiZGVwYXJ0bWVudHMiOltdLCJhdXRoZW50aWNhdGVJZCI6IjBWN1dEMDNyMDBlbDNCbyJ9LCJ0ZW5hbnRJZCI6Im15ZGFvIn0.q7z0KC4AEnHIMdvxP3CJNE0g19fWqRISfU2RYLnzEpw',
    };

    const request = exchange.request;
    request.url = exchange.request.url.replace('{tenantId}', 'mydao').replace('{ownerId}','Zh');
  }
}

fetcher.interceptors.request.use(new FetcherRequestInterceptor()); // 处理 fetch 方法的配置信息
// fetcher.interceptors.error.use(new ResponseErrorInterceptor());

const mockActionColumn = {
  title: '操作',
  dataIndex: 'id',
  configurable: true,
  configurePanelTitle: '表格设置',
  actions: (record: any) => ({
    primaryAction: {
      data: { value: '编辑', record, index: 0 },
      attributes: { onClick: () => console.log('Edit', record) },
    },
    moreActionTitle: '更多',
    secondaryActions: [
      {
        data: { value: '删除', record, index: 1 },
        attributes: { onClick: () => console.log('Delete', record) },
      },
    ],
  }),
};

const meta: Meta<typeof FetcherViewer> = {
  title: 'Viewer/FetcherViewer',
  component: FetcherViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'FetcherViewer is a data-driven viewer component that fetches view definitions and user views from the server.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    definitionId: {
      control: 'text',
      description: 'The ID of the view definition to fetch',
    },
    ownerId: {
      control: 'text',
      description: 'The ID of the view owner',
    },
    defaultViewId: {
      control: 'text',
      description: 'The ID of the default view to use',
    },
    supportedTopbarItems: {
      control: 'multi-select',
      options: [
        FILTER_BAR_ITEM_TYPE,
        REFRESH_DATA_BAR_ITEM_TYPE,
        COLUMN_HEIGHT_BAR_ITEM_TYPE,
        SHARE_LINK_BAR_ITEM_TYPE,
      ],
      description: 'Top bar items to display',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const Template = (args: any) => {
  return (
    <div style={{ height: '100vh' }}>
      <FetcherViewer {...args} />
    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    definitionId: 'sku-cost',
    ownerId: 'Zh',
    defaultViewId: 'view-1',
    supportedTopbarItems: [
      FILTER_BAR_ITEM_TYPE,
      REFRESH_DATA_BAR_ITEM_TYPE,
      COLUMN_HEIGHT_BAR_ITEM_TYPE,
      SHARE_LINK_BAR_ITEM_TYPE,
    ],
    actionColumn: mockActionColumn,
    batchOperationConfig: {
      enabled: true,
      title: '批量操作',
      actions: [
        {
          title: '批量删除',
          onClick: (items: any[]) => {
            console.log('Bulk Delete', items);
          },
        },
      ],
    },
    primaryAction: {
      title: '新增',
      onClick: (items: any[]) => {
        console.log('Primary Button', items);
      },
    },
    secondaryActions: [
      {
        title: '导出',
        onClick: (items: any[]) => {
          console.log('Export', items);
        },
      },
    ],
    onClickPrimaryKey: (id: string, record: any) => {
      console.log('Click Primary Key', id, record);
    },
    onViewChange: (view: any) => {
      console.log('View changed:', view);
    },
  },
};
