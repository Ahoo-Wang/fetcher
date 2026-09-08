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

import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as api from '../src/react.js';
import { RecordCell } from '../src/record/table/RecordCell.js';
import type {
  RendererReference,
  ViewFieldDefinition,
} from '../src/record/recordModel.js';
import type { ViewExtensions } from '../src/record/recordReactTypes.js';
import { definition, instance } from './fixtures/recordTable.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function cell(
  value: unknown,
  renderer: RendererReference,
  field: Partial<ViewFieldDefinition> = {},
  extensions?: ViewExtensions,
) {
  return (
    <RecordCell
      column={{ id: 'value', kind: 'field', field: 'value', renderer }}
      record={{ value, url: '/orders/1' }}
      rowKey="1"
      index={0}
      definition={{
        ...definition,
        fields: [{ field: 'value', label: '字段', ...field }],
      }}
      instance={instance}
      appliedFilter={null}
      extensions={extensions}
      refresh={async () => {}}
    />
  );
}
it('exports six standalone cells', () => {
  for (const name of [
    'TextCell',
    'TagsCell',
    'StatusCell',
    'LinkCell',
    'DateTimeCell',
    'NumberCell',
  ])
    expect(api).toHaveProperty(name, expect.any(Function));
});
it('renders typed enum labels and expands the remaining tags', async () => {
  render(
    cell(
      [1, '1', 1, false],
      { name: 'fve/tags', options: { maxVisible: 1 } },
      {
        options: [
          { value: 1, label: '数字一' },
          { value: '1', label: '字符串一' },
          { value: false, label: '禁用' },
        ],
      },
    ),
  );
  expect(
    screen.getByText('数字一').closest('[data-slot="badge"]'),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '查看全部 3 个标签' }));
  expect(await screen.findByText('字符串一')).toBeTruthy();
  expect(screen.getByText('禁用')).toBeTruthy();
});
it('uses semantic status tones and keeps unknown values readable', () => {
  const options = { tones: [{ value: 1, tone: 'success' }] };
  const view = render(
    cell(
      1,
      { name: 'fve/status', options },
      { options: [{ value: 1, label: '已付款' }] },
    ),
  );
  expect(
    screen.getByText('已付款').closest('[data-tone="success"]'),
  ).toBeTruthy();
  view.rerender(cell('1', { name: 'fve/status', options }));
  expect(screen.getByText('1').closest('[data-tone="neutral"]')).toBeTruthy();
});
it('copies raw values while retaining enum display labels', async () => {
  const writeText = vi.fn(async () => {});
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  render(
    cell(
      '001',
      { name: 'fve/text', options: { copyable: true } },
      { options: [{ value: '001', label: '订单一' }] },
    ),
  );
  expect(screen.getByText('订单一')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '复制文本' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('001'));
  expect(await screen.findByRole('status')).toHaveProperty(
    'textContent',
    '已复制',
  );
});
it('shows a local clipboard failure and does not attach old feedback to a changed value', async () => {
  let reject!: (reason: unknown) => void;
  const writeText = vi.fn(
    () =>
      new Promise<void>((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
  );
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const view = render(
    cell('old', { name: 'fve/text', options: { copyable: true } }),
  );
  fireEvent.click(screen.getByRole('button', { name: '复制文本' }));
  view.rerender(cell('new', { name: 'fve/text', options: { copyable: true } }));
  reject(new Error('denied'));
  await waitFor(() =>
    expect(screen.queryByText('复制失败，请重试')).toBeNull(),
  );
  writeText.mockImplementation(async () => {
    throw new Error('denied');
  });
  fireEvent.click(screen.getByRole('button', { name: '复制文本' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    '复制失败，请重试',
  );
});
it('allows relative URLs and forces safe new-tab attributes', () => {
  render(
    cell('订单详情', {
      name: 'fve/link',
      options: { hrefField: 'url', newTab: true },
    }),
  );
  const link = screen.getByRole('link', { name: '订单详情' });
  expect(link.getAttribute('href')).toBe('/orders/1');
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
});
it.each([
  'javascript:alert(1)',
  '\u00a0javascript:alert(1)',
  '\u2000data:text/html,test',
  'java\nscript:alert(1)',
  'data:text/html,test',
  'vbscript:run',
  'file:///tmp/file',
])('does not turn unsafe URL %j into a link', value => {
  render(cell(value, { name: 'fve/link' }));
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(
    screen.getByTitle(value, { normalizer: text => text }).textContent,
  ).toBe(value);
});
it('shares currency and percent precision with numeric summaries', () => {
  const view = render(
    cell(
      0.125,
      { name: 'fve/number' },
      {
        type: 'number',
        numberFormat: { style: 'percent', maximumFractionDigits: 1 },
      },
    ),
  );
  expect(screen.getByText('12.5%')).toBeTruthy();
  view.rerender(
    cell(
      1234.5,
      { name: 'fve/number' },
      { type: 'number', numberFormat: { style: 'currency', currency: 'CNY' } },
    ),
  );
  expect(screen.getByText('¥1,234.50')).toBeTruthy();
  view.rerender(cell('¥1,234.50', { name: 'fve/number' }));
  expect(screen.getByText('—')).toBeTruthy();
});
it('preserves calendar dates, handles epoch zero and rejects invalid dates', () => {
  const view = render(
    cell(
      '2026-09-08',
      { name: 'fve/date-time' },
      { type: 'date', timeZone: 'America/Los_Angeles' },
    ),
  );
  expect(screen.getByText('2026-09-08')).toBeTruthy();
  view.rerender(
    cell(
      0,
      {
        name: 'fve/date-time',
        options: { locale: 'en-GB', dateStyle: 'short', timeStyle: 'short' },
      },
      { type: 'datetime', timeZone: 'UTC' },
    ),
  );
  expect(screen.getByText('01/01/1970, 00:00')).toBeTruthy();
  view.rerender(
    cell('2026-02-30', { name: 'fve/date-time' }, { type: 'date' }),
  );
  expect(screen.getByText('—')).toBeTruthy();
});
it('keeps explicit registry precedence and rejects invalid builtin options', () => {
  render(
    cell(
      1,
      { name: 'fve/status', options: { tones: 'bad' } },
      {},
      { cells: { 'fve/status': () => <span>自定义覆盖</span> } },
    ),
  );
  expect(screen.getByText('自定义覆盖')).toBeTruthy();
  expect(() =>
    render(cell(['a'], { name: 'fve/tags', options: { maxVisible: 0 } })),
  ).toThrow(/maxVisible/);
});
it('restores builtin renderer options through JSON without runtime registrations', () => {
  const renderer: RendererReference = JSON.parse(
    JSON.stringify({
      name: 'fve/text',
      options: { copyable: true, ellipsis: true },
    }),
  );
  render(cell(false, renderer));
  expect(screen.getByText('否')).toBeTruthy();
  expect(screen.getByRole('button', { name: '复制文本' })).toBeTruthy();
});

it('uses the field timezone for local date/time strings and rejects DST gaps', () => {
  const view = render(
    cell(
      '2026-03-08T02:30',
      { name: 'fve/date-time' },
      { type: 'datetime', timeZone: 'America/New_York' },
    ),
  );
  expect(screen.getByText('—')).toBeTruthy();
  view.rerender(
    cell(
      '2026-09-08T10:30',
      {
        name: 'fve/date-time',
        options: { locale: 'en-GB', dateStyle: 'short', timeStyle: 'short' },
      },
      { type: 'datetime', timeZone: 'Asia/Shanghai' },
    ),
  );
  expect(screen.getByText('08/09/2026, 10:30')).toBeTruthy();
});
it('reports unavailable clipboard support while retaining copyable zero', async () => {
  vi.stubGlobal('navigator', {});
  render(<api.TextCell value={0} copyable />);
  fireEvent.click(screen.getByRole('button', { name: '复制文本' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    '复制失败，请重试',
  );
  expect(screen.getByText('0')).toBeTruthy();
});
it('does not coerce unknown numeric tag identifiers into formatted numbers', () => {
  render(<api.TagsCell value={[1234, '1234']} />);
  expect(screen.getAllByText('1234')).toHaveLength(2);
});

it.each(['2026-09-08T10:30:00.1234', '2026-03-08T02:30:00.1234'])(
  'does not fall back to host timezone for unsupported local time precision %j',
  value => {
    render(
      cell(
        value,
        { name: 'fve/date-time' },
        { type: 'datetime', timeZone: 'Asia/Shanghai' },
      ),
    );
    expect(screen.getByText('—')).toBeTruthy();
  },
);
it('normalizes surrounding whitespace before interpreting a local date and time', () => {
  render(
    cell(
      ' 2026-09-08 10:30 ',
      {
        name: 'fve/date-time',
        options: { locale: 'en-GB', dateStyle: 'short', timeStyle: 'short' },
      },
      { type: 'datetime', timeZone: 'Asia/Shanghai' },
    ),
  );
  expect(screen.getByText('08/09/2026, 10:30')).toBeTruthy();
});

it.each(['2026-09-08t10:30', '2026-09-08  10:30', '2026/09/08 10:30'])(
  'does not parse %j in the machine timezone',
  value => {
    render(
      cell(
        value,
        {
          name: 'fve/date-time',
          options: { locale: 'en-GB', dateStyle: 'short', timeStyle: 'short' },
        },
        { type: 'datetime', timeZone: 'Etc/GMT+12' },
      ),
    );
    if (value.includes('/')) expect(screen.getByText('—')).toBeTruthy();
    else expect(screen.getByText('08/09/2026, 10:30')).toBeTruthy();
  },
);
it('normalizes explicit timezone text without a host-local fallback', () => {
  render(
    cell(
      '2026-09-08  10:30z',
      {
        name: 'fve/date-time',
        options: { locale: 'en-GB', dateStyle: 'short', timeStyle: 'short' },
      },
      { type: 'datetime', timeZone: 'Asia/Shanghai' },
    ),
  );
  expect(screen.getByText('08/09/2026, 18:30')).toBeTruthy();
});
