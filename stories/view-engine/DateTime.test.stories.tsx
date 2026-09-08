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
import '@ahoo-wang/fetcher-view-engine/styles.css';
import { expect, userEvent, within } from 'storybook/test';
import displayMeta, {
  DarkDateTimeFilter as DisplayDarkDateTimeFilter,
  DateTimeFilter as DisplayDateTimeFilter,
  UnsetValue as DisplayUnsetValue,
} from './DateTime.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'View Engine/基础组件/日期时间/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const DateTimeFilter: Story = {
  ...DisplayDateTimeFilter,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole('button', { name: '创建日期：2026-09-01' }),
    );
    await userEvent.click(
      await page.findByRole('button', { name: /^2026年9月3日 星期四/ }),
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: '创建时刻' }),
      '12:',
    );
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-01 09:00:00',
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: '创建时刻' }),
      '10:30:00',
    );
    await expect(canvas.getByText('待查询')).toHaveTextContent('待查询');
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-01 09:00:00',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-03 10:30:00',
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-03 10:30:00',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: '创建日期：2026-09-03' }),
    );
    await userEvent.click(
      await page.findByRole('button', { name: /^2026年9月3日 星期四/ }),
    );
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '查询' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '不限制创建时间',
    );
    await userEvent.type(
      canvas.getByRole('textbox', { name: '创建时刻' }),
      '09:00',
    );
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await expect(canvas.getByText('待查询')).toBeInTheDocument();
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
  },
};

export const UnsetValue: Story = {
  ...DisplayUnsetValue,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '查询' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '不限制创建时间',
    );
  },
};

export const DarkDateTimeFilter: Story = {
  ...DisplayDarkDateTimeFilter,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole('button', { name: '创建日期：2026-09-01' }),
    );
    await userEvent.click(
      await page.findByRole('button', { name: /^2026年9月3日 星期四/ }),
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: '创建时刻' }),
      '12:',
    );
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-01 09:00:00',
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
    await userEvent.type(
      canvas.getByRole('textbox', { name: '创建时刻' }),
      '10:30:00',
    );
    await expect(canvas.getByText('待查询')).toHaveTextContent('待查询');
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-01 09:00:00',
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-03 10:30:00',
    );
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '2026-09-03 10:30:00',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: '创建日期：2026-09-03' }),
    );
    await userEvent.click(
      await page.findByRole('button', { name: /^2026年9月3日 星期四/ }),
    );
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: '查询' })).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await expect(canvas.getByLabelText('已应用条件')).toHaveTextContent(
      '不限制创建时间',
    );
    await userEvent.type(
      canvas.getByRole('textbox', { name: '创建时刻' }),
      '09:00',
    );
    await expect(canvas.getByRole('button', { name: '查询' })).toBeDisabled();
    await expect(canvas.getByText('待查询')).toBeInTheDocument();
    await userEvent.clear(canvas.getByRole('textbox', { name: '创建时刻' }));
  },
};
