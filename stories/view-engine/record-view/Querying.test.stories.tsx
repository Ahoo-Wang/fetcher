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
import { playBusinessRecords } from './persistence.play.js';
import {
  playCursorRecords,
  playEmptyRecords,
  playQueryFailure,
} from './querying.play.js';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import displayMeta, {
  BusinessRecords as DisplayBusinessRecords,
  CursorRecords as DisplayCursorRecords,
  EmptyRecords as DisplayEmptyRecords,
  QueryFailure as DisplayQueryFailure,
} from './Querying.stories.js';
import type { Story } from './demoTypes.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta = {
  ...displayMeta,
  title: 'View Engine/Record View/查询与分页/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

export const BusinessRecords: Story = {
  ...DisplayBusinessRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playBusinessRecords,
};

export const CursorRecords: Story = {
  ...DisplayCursorRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playCursorRecords,
};

export const EmptyRecords: Story = {
  ...DisplayEmptyRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playEmptyRecords,
};

export const QueryFailure: Story = {
  ...DisplayQueryFailure,
  tags: ['!dev', '!autodocs', 'test'],
  play: playQueryFailure,
};

export const BuiltinFilters: Story = {
  ...DisplayBusinessRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await canvas.findByRole('row', { name: /ORD-202609-1001/ });
    await userEvent.click(canvas.getByRole('button', { name: '添加筛选' }));
    const picker = within(
      await page.findByRole('dialog', { name: '选择筛选字段' }),
    );
    for (const name of ['订单编号', '客户', '订单状态', '下单时间'])
      await userEvent.click(picker.getByRole('checkbox', { name }));
    await userEvent.click(picker.getByRole('button', { name: '完成' }));

    await userEvent.click(canvas.getByRole('textbox', { name: '订单编号' }));
    await userEvent.paste('ORD-202609-1002,ORD-202609-1014');
    await userEvent.click(canvas.getByRole('combobox', { name: '客户' }));
    await userEvent.click(
      await page.findByRole('option', { name: '晨星零售' }),
    );
    await userEvent.click(canvas.getByRole('combobox', { name: '订单状态' }));
    await userEvent.click(await page.findByRole('option', { name: '处理中' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      canvas.getByRole('button', { name: /下单时间日期范围/ }),
    );
    const rangePicker = within(
      await page.findByRole('dialog', { name: '下单时间日期范围' }),
    );
    await expect(rangePicker.getAllByRole('grid')).toHaveLength(2);
    const today = new Date();
    const monthOffset =
      (2026 - today.getFullYear()) * 12 + 8 - today.getMonth();
    for (let month = 0; month < Math.abs(monthOffset); month++)
      await userEvent.click(
        rangePicker.getByRole('button', {
          name: monthOffset < 0 ? '前往上个月' : '前往下个月',
        }),
      );
    await userEvent.click(
      rangePicker.getByRole('button', { name: /^2026年9月6日 星期日/ }),
    );
    await userEvent.click(
      rangePicker.getByRole('button', { name: /^2026年9月6日 星期日/ }),
    );
    await expect(
      canvas.queryAllByRole('textbox', { name: /下单时间.*时间/ }),
    ).toHaveLength(0);
    await expect(canvas.getByTestId('record-query-count')).toHaveTextContent(
      /^1$/,
    );
    await userEvent.click(canvas.getByRole('button', { name: '查询' }));
    await canvas.findByText('共 2 条记录');
    await expect(
      canvas.getByRole('row', { name: /ORD-202609-1002/ }),
    ).toHaveTextContent('¥1,280.00');
    await expect(
      canvas.getByRole('row', { name: /ORD-202609-1014/ }),
    ).toHaveTextContent('¥5,600.00');
    await expect(
      JSON.parse(canvas.getByTestId('record-query').textContent!),
    ).toMatchObject({
      filter: {
        op: 'AND',
        operands: expect.arrayContaining([
          {
            op: 'BETWEEN',
            field: 'createdAt',
            lowerBound: Date.parse('2026-09-05T16:00:00Z'),
            upperBound: Date.parse('2026-09-06T15:59:59.999Z'),
          },
        ]),
      },
    });
    await expect(
      canvas.getByRole('region', { name: '已应用筛选' }),
    ).toHaveTextContent('下单时间 介于 2026-09-06 至 2026-09-06');
    await userEvent.click(canvas.getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(canvas.getByTestId('record-save-count')).toHaveTextContent(/^1$/),
    );
    for (const name of [
      'text-values',
      'remote-select',
      'multi-select',
      'datetime-range',
    ])
      await expect(canvas.getByTestId('record-write')).toHaveTextContent(
        `"name": "${name}"`,
      );
    await expect(
      JSON.parse(canvas.getByTestId('record-write').textContent!),
    ).toMatchObject({
      config: {
        filters: {
          root: {
            operands: expect.arrayContaining([
              expect.objectContaining({
                field: 'createdAt',
                component: { name: 'datetime-range' },
                props: {
                  lowerBound: { date: '2026-09-06' },
                  upperBound: { date: '2026-09-06' },
                },
              }),
            ]),
          },
        },
      },
    });
  },
};
