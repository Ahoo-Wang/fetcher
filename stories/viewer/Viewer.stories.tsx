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
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
  emptyPagedUsers,
  fixtureAdminView,
  fixtureDefaultView,
  fixturePagedUsers,
  fixtureViewerDefinition,
  fixtureViewerError,
  fixtureViews,
} from '../fixtures/viewer';

type Scenario = 'ready' | 'loading' | 'empty' | 'error';

function ViewerDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState('Ready');
  const [retrySucceeded, setRetrySucceeded] = useState(false);

  if (scenario === 'error' && !retrySucceeded) {
    return (
      <section className="story-stack" aria-label="Viewer request error">
        <div role="alert">{fixtureViewerError.message}</div>
        <button onClick={() => setRetrySucceeded(true)}>Retry</button>
      </section>
    );
  }

  return (
    <section className="story-stack" aria-label="Viewer workflow">
      <Viewer
        defaultViews={fixtureViews}
        defaultView={fixtureDefaultView}
        definition={fixtureViewerDefinition}
        dataSource={scenario === 'empty' ? emptyPagedUsers : fixturePagedUsers}
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
      />
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'Viewer/Flows/Viewer',
  component: ViewerDemo,
  args: { scenario: 'ready' },
  argTypes: { scenario: { control: 'radio' } },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ViewerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteFlow: Story = {
  args: { scenario: 'ready' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await expect(await canvas.findByText('Ada')).toBeVisible();
    await userEvent.click(canvas.getByText('u-ada'));
    await expect(await canvas.findByText('Opened u-ada: Ada')).toBeVisible();

    await userEvent.click(canvas.getAllByRole('checkbox')[1]);
    await userEvent.click(canvas.getByRole('button', { name: /批量操作/ }));
    await userEvent.click(
      await page.findByRole('button', { name: 'Archive selected' }),
    );
    await expect(await canvas.findByText('Archive: Ada')).toBeVisible();
  },
};

export const SwitchSavedView: Story = {
  args: { scenario: 'ready' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText(fixtureAdminView.name));
    await expect(
      await canvas.findByText(`Switched to ${fixtureAdminView.name}`),
    ).toBeVisible();
  },
};

export const LoadingData: Story = {
  args: { scenario: 'loading' },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.ant-spin-spinning'),
    ).not.toBeNull();
  },
};

export const EmptyResult: Story = {
  args: { scenario: 'empty' },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('No data', { selector: 'div' }),
    ).toBeVisible();
  },
};

export const CallerOwnedErrorAndRetry: Story = {
  args: { scenario: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent(fixtureViewerError.message);
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(await canvas.findByText('Ada')).toBeVisible();
  },
};
