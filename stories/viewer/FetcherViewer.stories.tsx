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
import { AntdProvider } from '../shared/AntdProvider.js';
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
  decorators: [
    Story => (
      <AntdProvider>
        <Story />
      </AntdProvider>
    ),
  ],
  title: 'Viewer/完整业务流程/FetcherViewer',
  component: FetcherViewerDemo,
  args: { scenario: 'success', enhance: false, showRefMethods: false },
  argTypes: {
    scenario: { control: 'radio' },
    enhance: { control: 'boolean' },
    showRefMethods: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, height: '640px' } },
  },
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
};

export const LoadingDefinition: Story = {
  args: { scenario: 'loading' },
};

export const MissingDefinition: Story = {
  args: { scenario: 'missing-definition' },
};

export const DefinitionRequestError: Story = {
  args: { scenario: 'definition-error' },
};

export const NoSavedViews: Story = {
  args: { scenario: 'empty-views' },
};

export const SaveViewChanges: Story = {
  args: { scenario: 'success' },
};

export const EnhanceDataSource: Story = {
  args: { scenario: 'success', enhance: true },
};

export const ImperativeMethods: Story = {
  args: { scenario: 'success', showRefMethods: true },
};
