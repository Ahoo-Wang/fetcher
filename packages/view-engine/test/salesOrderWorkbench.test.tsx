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

import { afterEach, expect, it } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { OrderWorkbench } from '../examples/react/sales-order/OrderWorkbench.js';
afterEach(cleanup);
it('keeps business state for appearance changes but resets it for a new scope', async () => {
  const view = render(<OrderWorkbench scopeKey="first-user" />);
  fireEvent.click(await screen.findByRole('button', { name: '创建订单' }));
  fireEvent.click(await screen.findByRole('button', { name: '确认创建' }));
  await screen.findByRole('dialog', { name: '订单详情 SO-202609-1019' });
  view.rerender(<OrderWorkbench scopeKey="first-user" appearance="dark" />);
  expect(
    screen.getByRole('dialog', { name: '订单详情 SO-202609-1019' }),
  ).toBeTruthy();
  view.rerender(<OrderWorkbench scopeKey="second-user" appearance="dark" />);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findByText('共 18 条记录')).toBeTruthy();
});

it('creates a real 2400 yuan order and preserves it when changing role', async () => {
  render(<OrderWorkbench />);
  fireEvent.click(await screen.findByRole('button', { name: '创建订单' }));
  const dialog = await screen.findByRole('dialog', { name: '创建销售订单' });
  expect(within(dialog).getByLabelText('订单合计').textContent).toContain(
    '2,400',
  );
  fireEvent.click(within(dialog).getByRole('button', { name: '确认创建' }));
  const details = await screen.findByRole('dialog', {
    name: '订单详情 SO-202609-1019',
  });
  fireEvent.click(within(details).getByRole('button', { name: '关闭详情' }));
  fireEvent.change(screen.getByLabelText('演示岗位'), {
    target: { value: 'manager' },
  });
  expect(await screen.findByText('SO-202609-1019')).toBeTruthy();
});

it('keeps the form usable when either required date is cleared and re-entered', async () => {
  render(<OrderWorkbench />);
  fireEvent.click(await screen.findByRole('button', { name: '创建订单' }));
  const dialog = await screen.findByRole('dialog', { name: '创建销售订单' });
  for (const name of ['承诺交期', '应收到期日']) {
    const input = within(dialog).getByLabelText(name) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '2026-09-20' } });
    expect(input.value).toBe('2026-09-20');
  }
  fireEvent.click(within(dialog).getByRole('button', { name: '确认创建' }));
  expect(
    await screen.findByRole('dialog', { name: '订单详情 SO-202609-1019' }),
  ).toBeTruthy();
});

it('keeps the order open when handing submission to its next role', async () => {
  render(<OrderWorkbench stage="review" initialRole="sales" />);
  fireEvent.click(
    await screen.findByRole('button', { name: '查看订单 SO-202609-1014' }),
  );
  let dialog = await screen.findByRole('dialog', {
    name: '订单详情 SO-202609-1014',
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: '提交审核', exact: true }),
  );
  fireEvent.click(await screen.findByRole('button', { name: '确认提交审核' }));
  dialog = await screen.findByRole('dialog', {
    name: '订单详情 SO-202609-1014',
  });
  const handoff = await within(dialog).findByRole('button', {
    name: '交给销售主管',
  });
  await waitFor(() =>
    expect((handoff as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(handoff);
  expect(
    await within(dialog).findByRole('button', {
      name: '审核通过',
      exact: true,
    }),
  ).toBeTruthy();
  expect(
    (within(dialog).getByLabelText('处理岗位') as HTMLSelectElement).value,
  ).toBe('manager');
});

it('exposes a failed refresh and its retry inside the order dialog without replaying money', async () => {
  render(
    <OrderWorkbench
      stage="release"
      initialRole="finance"
      failRefreshAfterWrite
    />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: '查看订单 SO-202609-1003' }),
  );
  let dialog = await screen.findByRole('dialog', {
    name: '订单详情 SO-202609-1003',
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: '登记收款', exact: true }),
  );
  fireEvent.change(await screen.findByRole('textbox', { name: '凭证号' }), {
    target: { value: 'RETRY-IN-DIALOG' },
  });
  fireEvent.click(screen.getByRole('button', { name: '确认登记收款' }));
  dialog = await screen.findByRole('dialog', {
    name: '订单详情 SO-202609-1003',
  });
  await within(dialog).findByRole('button', { name: '重试刷新' });
  expect(within(dialog).getByRole('alert').textContent).toContain('操作已完成');
  fireEvent.click(within(dialog).getByRole('button', { name: '关闭详情' }));
  expect(
    (screen.getByLabelText('演示岗位') as HTMLSelectElement).disabled,
  ).toBe(true);
  fireEvent.click(
    await screen.findByRole('button', { name: '查看订单 SO-202609-1003' }),
  );
  dialog = await screen.findByRole('dialog', {
    name: '订单详情 SO-202609-1003',
  });
  fireEvent.click(within(dialog).getByRole('button', { name: '重试刷新' }));
  fireEvent.click(within(dialog).getByText('收付款与票据记录'));
  expect(await within(dialog).findAllByText(/RETRY-IN-DIALOG/)).toHaveLength(1);
});
