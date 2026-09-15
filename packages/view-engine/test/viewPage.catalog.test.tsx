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

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ViewPage } from './fixtures/OwnedViewPage.js';
import { page } from './engine/fixtures.js';
import { instance, setup } from './fixtures/viewPage.js';

afterEach(cleanup);

it('offers catalog reload after a failed first page and paging for later pages', async () => {
  const { host } = setup();
  const system = {
    ...structuredClone(instance),
    id: 'system',
    title: '所有订单',
    scope: { type: 'public', source: 'system' } as const,
  };
  host.instance!.list = vi
    .fn()
    .mockRejectedValueOnce(new Error('目录不可用'))
    .mockResolvedValueOnce(page([instance], 'more'))
    .mockResolvedValueOnce(page([system]));
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  await screen.findByRole('cell', { name: '42' });
  expect((await screen.findAllByRole('alert'))[0].textContent).toContain(
    '目录不可用',
  );
  fireEvent.click(screen.getAllByRole('button', { name: '重新加载目录' })[0]);
  const more = await screen.findAllByRole('button', { name: '加载更多视图' });
  expect(screen.queryByRole('button', { name: '重新加载目录' })).toBeNull();
  fireEvent.click(more[0]);
  await screen.findAllByRole('button', { name: /所有订单/ });
  expect(screen.queryByRole('button', { name: '加载更多视图' })).toBeNull();
  expect(host.instance!.list).toHaveBeenCalledTimes(3);
});

it('offers an independent preference retry after a failed preference read', async () => {
  const { host } = setup();
  host.instance!.list = vi.fn(async () => page([instance]));
  host.preference = {
    load: vi
      .fn()
      .mockRejectedValueOnce(new Error('偏好暂不可用'))
      .mockResolvedValueOnce({
        revision: 'p2',
        order: [],
        defaultInstanceId: null,
        effectiveDefaultInstanceId: null,
      }),
  };
  render(<ViewPage scopeKey="test-user" definitionId="orders" host={host} />);
  expect((await screen.findAllByRole('alert'))[0].textContent).toContain(
    '偏好暂不可用',
  );
  fireEvent.click(
    screen.getAllByRole('button', { name: '重新加载个人偏好' })[0],
  );
  await vi.waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(host.preference!.load).toHaveBeenCalledTimes(2);
});
