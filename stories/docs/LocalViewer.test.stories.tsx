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
import type { StoryObj } from '@storybook/react-vite';
import displayMeta, {
  LocalData as DisplayLocalData,
} from './LocalViewer.stories.js';

const meta = {
  ...displayMeta,
  title: 'Docs/Local Viewer/回归',
  tags: ['!dev', '!autodocs', 'test'],
};
export default meta;
type Story = StoryObj<typeof displayMeta>;

export const LocalData: Story = {
  ...DisplayLocalData,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const names = () =>
      within(canvas.getByRole('table'))
        .getAllByRole('row')
        .filter(row => row.hasAttribute('data-row-key'))
        .map(row => within(row).getAllByRole('cell')[1].textContent);
    await waitFor(() => expect(names()).toEqual(['Ada', 'Lin']));
    await userEvent.click(canvas.getByTitle('2'));
    await waitFor(() => expect(names()).toEqual(['Grace', 'Zoe']));
    await userEvent.click(canvas.getByTitle('1'));
    await userEvent.click(canvas.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() => expect(names()).toEqual(['Ada', 'Grace']));
    await userEvent.click(canvas.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() => expect(names()).toEqual(['Zoe', 'Lin']));
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await page.findByText('是', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: /搜\s*索/ }));
    await waitFor(() => expect(names()).toEqual(['Grace', 'Ada']));
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await page.findByText('否', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: /搜\s*索/ }));
    await waitFor(() => expect(names()).toEqual(['Zoe', 'Lin']));
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await page.findByText('未设置', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: /搜\s*索/ }));
    await userEvent.click(canvas.getByTitle('2'));
    await waitFor(() => expect(names()).toEqual(['Grace', 'Ada']));
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(await page.findByText('是', { exact: true }));
    await userEvent.click(canvas.getByRole('button', { name: /搜\s*索/ }));
    await waitFor(() => expect(names()).toEqual(['Grace', 'Ada']));
    await userEvent.click(canvas.getByRole('button', { name: '另存为' }));
    const dialog = await page.findByRole('dialog');
    await userEvent.type(
      within(dialog).getByRole('textbox'),
      'Active descending',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: /确\s*认/ }),
    );
    await expect(
      await canvas.findByText('Saved: Active descending'),
    ).toBeVisible();
    await userEvent.click(canvas.getAllByText('All users', { exact: true })[0]);
    await waitFor(() => expect(names()).toEqual(['Ada', 'Lin']));
    await userEvent.click(
      canvas.getByText('Active descending', { exact: true }),
    );
    await waitFor(() => expect(names()).toEqual(['Grace', 'Ada']));
    await expect(
      canvas.getByRole('columnheader', { name: /Name/ }),
    ).toHaveAttribute('aria-sort', 'descending');
    await expect(canvas.getByText('是', { exact: true })).toBeVisible();
  },
};
