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
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import { useState } from 'react';
import {
  emptyPagedUsers,
  fixtureDefaultView,
  fixturePagedUsers,
  fixtureViewerDefinition,
  fixtureViewerError,
  fixtureViews,
} from '../fixtures/viewer';

type Scenario = 'ready' | 'loading' | 'empty' | 'error';

function ViewerDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState<string>();
  const [retrySucceeded, setRetrySucceeded] = useState(false);

  if (scenario === 'error' && !retrySucceeded) {
    return (
      <div className="story-stack">
        <div role="alert">{fixtureViewerError.message}</div>
        <button onClick={() => setRetrySucceeded(true)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="story-stack">
      <Viewer
        defaultViews={fixtureViews}
        defaultView={fixtureDefaultView}
        definition={fixtureViewerDefinition}
        dataSource={
          scenario === 'empty'
            ? emptyPagedUsers
            : { ...fixturePagedUsers, total: 20 }
        }
        loading={scenario === 'loading'}
        pagination={{ showSizeChanger: false }}
        enableRowSelection
        viewTableSetting={{ title: 'Visible columns' }}
        primaryAction={{
          title: 'Create user',
          onClick: users => setOutput(`Create: ${users.length} selected`),
        }}
        batchActions={{
          enabled: true,
          title: 'Batch actions',
          actions: [
            {
              title: 'Archive selected',
              onClick: users =>
                setOutput(
                  `Archive: ${users.map(user => user.name).join(', ')}`,
                ),
            },
          ],
        }}
        onClickPrimaryKey={(id, user) =>
          setOutput(`Opened ${id}: ${user.name}`)
        }
        onGetRecordCount={() => Promise.resolve(1)}
        onLoadData={(_condition, page, size, sorter) =>
          setOutput(
            `Load: page ${page}, size ${size}, sort ${sorter?.[0]?.field ?? 'none'}`,
          )
        }
        onSwitchView={view => setOutput(`Switched to ${view.name}`)}
        onCreateView={(view, onSuccess) => {
          const created = { ...view, id: 'story-view' };
          onSuccess?.(created);
          setOutput(`Created view: ${created.name}`);
        }}
        onUpdateView={(view, onSuccess) => {
          onSuccess?.(view);
          setOutput(`Renamed view: ${view.name}`);
        }}
        onDeleteView={(view, onSuccess) => {
          onSuccess?.(view);
          setOutput(`Deleted view: ${view.name}`);
        }}
      />
      {output && (
        <output className="story-output" aria-live="polite">
          {output}
        </output>
      )}
    </div>
  );
}

const meta = {
  decorators: [
    Story => (
      <AntdProvider>
        <Story />
      </AntdProvider>
    ),
  ],
  title: 'Viewer/完整业务流程/Viewer',
  component: ViewerDemo,
  args: { scenario: 'ready' },
  argTypes: { scenario: { control: 'radio' } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ViewerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CompleteFlow: Story = {
  args: { scenario: 'ready' },
};

export const SwitchSavedView: Story = {
  args: { scenario: 'ready' },
};

export const CreateSavedView: Story = {
  args: { scenario: 'ready' },
};

export const RenameSavedView: Story = {
  args: { scenario: 'ready' },
};

export const DeleteSavedView: Story = {
  args: { scenario: 'ready' },
};

export const SortAndPaginate: Story = {
  args: { scenario: 'ready' },
};

export const LoadingData: Story = {
  args: { scenario: 'loading' },
};

export const EmptyResult: Story = {
  args: { scenario: 'empty' },
};

export const CallerOwnedErrorAndRetry: Story = {
  args: { scenario: 'error' },
};
