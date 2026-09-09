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
import displayMeta, {
  AddAvailableFilter as DisplayAddAvailableFilter,
  EditTextFilter as DisplayEditTextFilter,
  RemoveFilter as DisplayRemoveFilter,
  ResetValues as DisplayResetValues,
  TypedGallery as DisplayTypedGallery,
} from './Filters.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'Viewer/输入与过滤/Filters/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const EditTextFilter: Story = {
  ...DisplayEditTextFilter,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Filter name'), 'Ada');
    await expect(
      await canvas.findByText('{"field":"name","operator":"EQ","value":"Ada"}'),
    ).toBeVisible();
  },
};

export const TypedGallery: Story = {
  ...DisplayTypedGallery,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Read filters' }));
    await expect(await canvas.findByText(/"field":"name"/)).toBeVisible();
  },
};

export const AddAvailableFilter: Story = {
  ...DisplayAddAvailableFilter,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /添加过滤器/ }));
    await userEvent.click(await page.findByRole('checkbox', { name: 'Role' }));
    await userEvent.click(page.getByRole('button', { name: 'OK' }));
    await expect(
      await canvas.findByText('Active filters: Name, Role'),
    ).toBeVisible();
  },
};

export const RemoveFilter: Story = {
  ...DisplayRemoveFilter,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText('Name'));
    const remove = canvas
      .getAllByRole('button')
      .find(button => button.classList.contains('ant-btn-circle'));
    if (!remove) throw new Error('Remove filter button was not shown');
    await userEvent.click(remove);
    await expect(await canvas.findByText('Active filters: none')).toBeVisible();
  },
};

export const ResetValues: Story = {
  ...DisplayResetValues,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Filter name'), 'Ada');
    await userEvent.click(canvas.getByRole('button', { name: /搜索|Search/ }));
    await expect(await canvas.findByText(/"value":"Ada"/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /Reset/ }));
    await userEvent.click(canvas.getByRole('button', { name: /搜索|Search/ }));
    await expect(await canvas.findByText('{"operator":"ALL"}')).toBeVisible();
  },
};
