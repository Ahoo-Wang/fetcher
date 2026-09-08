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
import { expect, userEvent, waitFor, within } from 'storybook/test';
import displayMeta, {
  DefinitionRequestError as DisplayDefinitionRequestError,
  EnhanceDataSource as DisplayEnhanceDataSource,
  ImperativeMethods as DisplayImperativeMethods,
  LoadingDefinition as DisplayLoadingDefinition,
  MissingDefinition as DisplayMissingDefinition,
  NoSavedViews as DisplayNoSavedViews,
  RemoteSuccess as DisplayRemoteSuccess,
  SaveViewChanges as DisplaySaveViewChanges,
} from './FetcherViewer.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'Viewer/完整业务流程/FetcherViewer/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const RemoteSuccess: Story = {
  ...DisplayRemoteSuccess,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('Setup')).not.toBeInTheDocument();
    await expect(await canvas.findByText('Ada')).toBeVisible();
  },
};

export const LoadingDefinition: Story = {
  ...DisplayLoadingDefinition,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.ant-spin-spinning'),
    ).not.toBeNull();
  },
};

export const MissingDefinition: Story = {
  ...DisplayMissingDefinition,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('未找到视图定义'),
    ).toBeVisible();
  },
};

export const DefinitionRequestError: Story = {
  ...DisplayDefinitionRequestError,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/加载视图定义失败/),
    ).toBeVisible();
  },
};

export const NoSavedViews: Story = {
  ...DisplayNoSavedViews,
  tags: ['!dev', '!autodocs', 'test'],
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
  ...DisplaySaveViewChanges,
  tags: ['!dev', '!autodocs', 'test'],
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
  ...DisplayEnhanceDataSource,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Ada (enhanced)'),
    ).toBeVisible();
  },
};

export const ImperativeMethods: Story = {
  ...DisplayImperativeMethods,
  tags: ['!dev', '!autodocs', 'test'],
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
