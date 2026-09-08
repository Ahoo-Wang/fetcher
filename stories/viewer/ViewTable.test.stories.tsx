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
import { fixtureViewerError } from '../fixtures/viewer';
import displayMeta, {
  ActionColumn as DisplayActionColumn,
  ColumnSettings as DisplayColumnSettings,
  Empty as DisplayEmpty,
  ErrorPresentation as DisplayErrorPresentation,
  RowSelection as DisplayRowSelection,
  Sorting as DisplaySorting,
} from './ViewTable.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'Viewer/单元格与表格/ViewTable/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const Empty: Story = {
  ...DisplayEmpty,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('No data', { selector: 'div' }),
    ).toBeVisible();
  },
};

export const ErrorPresentation: Story = {
  ...DisplayErrorPresentation,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveTextContent(fixtureViewerError.message);
  },
};

export const RowSelection: Story = {
  ...DisplayRowSelection,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('checkbox')[1]);
    await expect(await canvas.findByText('Selected: Ada')).toBeVisible();
  },
};

export const Sorting: Story = {
  ...DisplaySorting,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('columnheader', { name: /Name/ }));
    await expect(await canvas.findByText('Sort: name ascend')).toBeVisible();
  },
};

export const ActionColumn: Story = {
  ...DisplayActionColumn,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Edit' })[0]);
    await expect(await canvas.findByText('Edited Ada')).toBeVisible();
  },
};

export const ColumnSettings: Story = {
  ...DisplayColumnSettings,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('img', { name: 'setting' }));
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByRole('checkbox', { name: 'Name' }));
    await expect(await canvas.findByText('Columns: 6')).toBeVisible();
  },
};
