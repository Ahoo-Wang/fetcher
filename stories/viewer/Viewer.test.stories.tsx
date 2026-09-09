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
import { expect, userEvent, within } from 'storybook/test';
import { fixtureAdminView, fixtureViewerError } from '../fixtures/viewer';
import displayMeta, {
  CallerOwnedErrorAndRetry as DisplayCallerOwnedErrorAndRetry,
  CompleteFlow as DisplayCompleteFlow,
  CreateSavedView as DisplayCreateSavedView,
  DeleteSavedView as DisplayDeleteSavedView,
  EmptyResult as DisplayEmptyResult,
  LoadingData as DisplayLoadingData,
  RenameSavedView as DisplayRenameSavedView,
  SortAndPaginate as DisplaySortAndPaginate,
  SwitchSavedView as DisplaySwitchSavedView,
} from './Viewer.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'Viewer/完整业务流程/Viewer/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const CompleteFlow: Story = {
  ...DisplayCompleteFlow,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await expect(await canvas.findByText('Ada')).toBeVisible();
    expect(canvas.queryByText('Ready')).not.toBeInTheDocument();
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
  ...DisplaySwitchSavedView,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText(fixtureAdminView.name));
    await expect(
      await canvas.findByText(`Switched to ${fixtureAdminView.name}`),
    ).toBeVisible();
  },
};

export const CreateSavedView: Story = {
  ...DisplayCreateSavedView,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getAllByRole('img', { name: 'plus' })[0]);
    const dialog = await page.findByRole('dialog', { name: '创建视图' });
    await userEvent.type(within(dialog).getByRole('textbox'), 'My view');
    await userEvent.click(
      within(dialog).getByRole('button', { name: /确\s*认/ }),
    );
    await expect(
      await canvas.findByText('Created view: My view'),
    ).toBeVisible();
  },
};

export const RenameSavedView: Story = {
  ...DisplayRenameSavedView,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getAllByRole('img', { name: 'setting' })[0]);
    const dialog = await page.findByRole('dialog', { name: '个人视图' });
    await userEvent.click(
      within(dialog).getAllByRole('img', { name: 'edit' })[0],
    );
    const nameInput = within(dialog).getByDisplayValue('Admins');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Admin team');
    await userEvent.click(
      within(dialog).getByRole('button', { name: /保\s*存/ }),
    );
    await expect(
      await canvas.findByText('Renamed view: Admin team'),
    ).toBeVisible();
  },
};

export const DeleteSavedView: Story = {
  ...DisplayDeleteSavedView,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getAllByRole('img', { name: 'setting' })[0]);
    const dialog = await page.findByRole('dialog', { name: '个人视图' });
    await userEvent.click(
      within(dialog).getAllByRole('img', { name: 'delete' })[0],
    );
    await userEvent.click(await page.findByRole('button', { name: /确\s*认/ }));
    await expect(await canvas.findByText('Deleted view: Admins')).toBeVisible();
  },
};

export const SortAndPaginate: Story = {
  ...DisplaySortAndPaginate,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('columnheader', { name: /Name/ }));
    await expect(
      await canvas.findByText('Load: page 1, size 10, sort name'),
    ).toBeVisible();
    await userEvent.click(canvas.getByTitle('2'));
    await expect(
      await canvas.findByText('Load: page 2, size 10, sort name'),
    ).toBeVisible();
  },
};

export const LoadingData: Story = {
  ...DisplayLoadingData,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.ant-spin-spinning'),
    ).not.toBeNull();
  },
};

export const EmptyResult: Story = {
  ...DisplayEmptyResult,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('No data', { selector: 'div' }),
    ).toBeVisible();
  },
};

export const CallerOwnedErrorAndRetry: Story = {
  ...DisplayCallerOwnedErrorAndRetry,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent(fixtureViewerError.message);
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(await canvas.findByText('Ada')).toBeVisible();
  },
};
