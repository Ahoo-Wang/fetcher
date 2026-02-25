import type { Meta, StoryObj } from '@storybook/react';
import { FetcherViewer } from '../FetcherViewer';
import type { PaginationProps } from 'antd';
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
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwVkNGM09KUDAwZmg2amkiLCJzdWIiOiIxWkUiLCJpYXQiOjE3NzIwMjMzNTAsImV4cCI6MTc3MjI4MjU1MCwicm9sZXMiOlsiM1F2Il0sImF0dHJpYnV0ZXMiOnsiaXNPd25lciI6ImZhbHNlIiwiYXBwSWQiOiJwbXMiLCJkZXBhcnRtZW50cyI6W10sImF1dGhlbnRpY2F0ZUlkIjoiMFZCd3RBeDMwMGZoMTQ0In0sInRlbmFudElkIjoibXlkYW8ifQ.sRoJXFDBE3jU2JKAXu7qj5KJTsUHVgLzA48_VBeUTj0',
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
