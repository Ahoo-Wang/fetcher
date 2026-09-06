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

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DEFAULT_FETCHER_NAME,
  Fetcher,
  fetcherRegistrar,
  URL_RESOLVE_INTERCEPTOR_ORDER,
} from '@ahoo-wang/fetcher';
import { FullscreenProvider } from '@ahoo-wang/fetcher-react';
import type { FetcherViewerRef } from '@ahoo-wang/fetcher-viewer';
import { FetcherViewer } from '@ahoo-wang/fetcher-viewer';
import { useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { ViewerFixtureScenario } from '../fixtures/http';
import { installViewerFetchFixture } from '../fixtures/http';
import type { FixtureViewerUser } from '../fixtures/viewer';

interface FetcherViewerDemoProps {
  scenario: ViewerFixtureScenario;
  enhance: boolean;
  showRefMethods: boolean;
}

function FetcherViewerDemo({
  scenario,
  enhance,
  showRefMethods,
}: FetcherViewerDemoProps) {
  const viewerRef = useRef<FetcherViewerRef>(null);
  const [output, setOutput] = useState<string>();

  const readState = () => {
    const definition = viewerRef.current?.getViewerDefinition();
    const view = viewerRef.current?.getActiveView();
    const query = viewerRef.current?.getPageQuery();
    setOutput(
      `Definition: ${definition?.id} · View: ${view?.id} · Page: ${query?.pagination.index}`,
    );
  };

  return (
    <div className="story-stack" data-scenario={scenario}>
      {showRefMethods && (
        <div className="story-actions">
          <button
            onClick={() => {
              viewerRef.current?.refreshData();
              setOutput('Refresh requested');
            }}
          >
            Refresh data
          </button>
          <button
            onClick={() => {
              viewerRef.current?.clearSelectedRowKeys();
              setOutput('Selection cleared');
            }}
          >
            Clear selection
          </button>
          <button onClick={readState}>Read state</button>
        </div>
      )}
      <FullscreenProvider>
        <FetcherViewer<FixtureViewerUser>
          ref={viewerRef}
          viewerDefinitionId="users"
          defaultViewId="all-users"
          pagination={{ showSizeChanger: false }}
          enableRowSelection
          viewTableSetting={false}
          enhanceDataSource={
            enhance
              ? users =>
                  users.map(user => ({
                    ...user,
                    name: `${user.name} (enhanced)`,
                  }))
              : undefined
          }
        />
      </FullscreenProvider>
      {showRefMethods && output && (
        <output className="story-output" aria-live="polite">
          {output}
        </output>
      )}
    </div>
  );
}

const storageKey = 'fetcher-viewer-local-default-view-id';

const meta = {
  title: 'Viewer/Flows/FetcherViewer',
  component: FetcherViewerDemo,
  args: { scenario: 'success', enhance: false, showRefMethods: false },
  argTypes: {
    scenario: { control: 'radio' },
    enhance: { control: 'boolean' },
    showRefMethods: { control: 'boolean' },
  },
  parameters: { layout: 'fullscreen' },
  beforeEach: ({ args }) => {
    const restoreFetch = installViewerFetchFixture(args.scenario);
    const previousFetcher = fetcherRegistrar.get(DEFAULT_FETCHER_NAME);
    const previousDefaultViewId = localStorage.getItem(storageKey);

    fetcherRegistrar.default = new Fetcher({
      baseURL: 'https://api.example.test',
    });
    fetcherRegistrar.default.interceptors.request.use({
      name: 'storybook-viewer-tenant',
      order: URL_RESOLVE_INTERCEPTOR_ORDER - 1,
      intercept(exchange) {
        const { path } = exchange.ensureRequestUrlParams();
        path.tenantId ??= '(0)';
      },
    });
    localStorage.removeItem(storageKey);

    return () => {
      restoreFetch();
      if (previousFetcher) fetcherRegistrar.default = previousFetcher;
      else fetcherRegistrar.unregister(DEFAULT_FETCHER_NAME);
      if (previousDefaultViewId === null) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, previousDefaultViewId);
    };
  },
} satisfies Meta<typeof FetcherViewerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RemoteSuccess: Story = {
  args: { scenario: 'success' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('Setup')).not.toBeInTheDocument();
    await expect(await canvas.findByText('Ada')).toBeVisible();
  },
};

export const LoadingDefinition: Story = {
  args: { scenario: 'loading' },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.ant-spin-spinning'),
    ).not.toBeNull();
  },
};

export const MissingDefinition: Story = {
  args: { scenario: 'missing-definition' },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('未找到视图定义'),
    ).toBeVisible();
  },
};

export const DefinitionRequestError: Story = {
  args: { scenario: 'definition-error' },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/加载视图定义失败/),
    ).toBeVisible();
  },
};

export const NoSavedViews: Story = {
  args: { scenario: 'empty-views' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await expect(await canvas.findByText('未找到视图')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '创建视图' }));
    await userEvent.type(
      page.getByLabelText('视图名称'),
      'Created in Storybook',
    );
    await userEvent.click(page.getByRole('button', { name: /^确\s*认$/ }));
    await expect(
      (await canvas.findAllByText('Created in Storybook'))[0],
    ).toBeVisible();
    await expect(await canvas.findByText('Ada')).toBeVisible();
    expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const SaveViewChanges: Story = {
  args: { scenario: 'success' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByText('Admins'));
    await userEvent.click(
      await canvas.findByRole('columnheader', { name: 'Name' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: /保\s*存/ }));
    await userEvent.click(await page.findByText('覆盖当前视图'));
    await userEvent.click(page.getByRole('button', { name: /^确\s*认$/ }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('columnheader', { name: 'Name' }),
      ).toHaveAttribute('aria-sort', 'ascending');
      await expect(
        canvas.queryByRole('button', { name: /保\s*存/ }),
      ).not.toBeInTheDocument();
    });
    expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const EnhanceDataSource: Story = {
  args: { scenario: 'success', enhance: true },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Ada (enhanced)'),
    ).toBeVisible();
  },
};

export const ImperativeMethods: Story = {
  args: { scenario: 'success', showRefMethods: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Ada')).toBeVisible();
    expect(canvas.queryByText('Ready')).not.toBeInTheDocument();
    const actions = canvasElement.querySelector('.story-actions');
    await expect(getComputedStyle(actions!).display).toBe('block');
    const searchButton = canvas.getByRole('button', { name: /搜索/ });
    await expect(getComputedStyle(searchButton).backgroundColor).toBe(
      'rgb(9, 88, 217)',
    );
    const refreshButton = canvas.getByRole('button', { name: 'Refresh data' });
    await expect(getComputedStyle(refreshButton).borderRadius).not.toBe('8px');
    await userEvent.click(refreshButton);
    await expect(await canvas.findByText('Ada (refreshed)')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Read state' }));
    await expect(
      await canvas.findByText('Definition: users · View: all-users · Page: 1'),
    ).toBeVisible();
  },
};
