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

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryViewStore, ViewEngine } from '../src/index.js';
import type { FilterSummaryItem } from '../src/index.js';
import { useFilterEditor } from '../src/react/index.js';
import type { FilterEditorController } from '../src/react/index.js';
import { AppliedBar } from '../src/ui/AppliedBar.js';
import { MessagesProvider } from '../src/ui/MessagesProvider.js';
import { zhCN } from '../src/ui/messages/zh-CN.js';
import { ordersDefinition, recordConfig, testSource } from './fixtures.js';

/**
 * One condition as the kernel hands it over: the parts, and the English line
 * the kind reads them as. The bar shows the parts — `text` is what a host
 * consuming the summary itself still gets — so every item here carries both.
 */
function condition(over: Partial<FilterSummaryItem> = {}): FilterSummaryItem {
  return {
    path: ['children', 0],
    text: 'Warehouse EQ CN',
    unresolved: false,
    field: 'warehouse',
    label: 'Warehouse',
    kind: 'string',
    operator: 'EQ',
    value: { kind: 'text', value: 'CN' },
    ...over,
  };
}

afterEach(cleanup);

/**
 * A controller with only what the bar reads. The bar describes what came
 * back and offers one action per item; everything else on the controller is
 * the editor's business, and a stub says so.
 */
function stub(
  applied: FilterSummaryItem[],
  actions: Partial<FilterEditorController> = {},
): FilterEditorController {
  return {
    applied,
    scoped: [],
    clearValue: vi.fn(),
    submit: vi.fn(),
    ...actions,
  } as unknown as FilterEditorController;
}

/** The host's own condition, which the bar shows but cannot take out. */
function customer(): FilterSummaryItem {
  return condition({
    text: 'Customer EQ c-1',
    field: 'customer',
    label: 'Customer',
    value: { kind: 'text', value: 'c-1' },
  });
}

/** The bar over a live runtime, with the editor in reach. */
function overRuntime() {
  const engine = new ViewEngine({
    definitions: [ordersDefinition()],
    store: new MemoryViewStore({ instances: [] }),
    resolveSource: () => testSource(),
  });
  const runtime = engine.create('orders', {
    title: 'Scratch',
    scope: 'personal',
    config: recordConfig(),
  });
  let latest: FilterEditorController | null = null;
  function Probe() {
    const filter = useFilterEditor(runtime);
    latest = filter;
    return (
      <AppliedBar
        filter={filter}
        hasResult={runtime.getSnapshot().result !== null}
      />
    );
  }
  render(<Probe />);
  return { filter: () => latest as FilterEditorController };
}

describe('AppliedBar', () => {
  it('says nothing before a result exists to describe', () => {
    // An empty `applied` means "no condition" *or* "no answer yet", and the
    // bar cannot tell them apart on its own — so it is told.
    const { container } = render(
      <AppliedBar filter={stub([])} hasResult={false} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('says so plainly when the result ran under no condition at all', () => {
    render(<AppliedBar filter={stub([])} hasResult />);

    const bar = screen.getByRole('region', { name: 'Showing' });
    expect(bar.textContent).toContain('All records');
  });

  it('lists the conditions the rows in front of you were fetched under', () => {
    render(<AppliedBar filter={stub([condition()])} hasResult />);

    // The badge is built from the parts, so the operator is the catalogue's
    // word for it rather than the enum name the English line carries.
    expect(screen.getByText('Warehouse eq CN')).toBeDefined();
    expect(screen.queryByText('All records')).toBeNull();
  });

  it('wears a condition whose field is gone plainly, and marks it', () => {
    render(
      <AppliedBar
        filter={stub([
          condition({
            text: 'legacy EQ 1',
            unresolved: true,
            field: 'legacy',
            label: 'legacy',
            kind: undefined,
            value: { kind: 'blank' },
          }),
        ])}
        hasResult
      />,
    );

    // It is still in force, so it is named rather than hidden; it is not
    // something to go on building on, so it is not dressed as one. The
    // value cannot be read, but the question it was asked under can.
    const badge = screen.getByText('legacy eq');
    expect(badge.hasAttribute('data-unresolved')).toBe(true);
    expect(badge.className).toContain('border-border');
  });

  it('takes a condition out of force from its badge, keeping the field', async () => {
    const { filter } = overRuntime();
    act(() => {
      filter().addLeaf('warehouse');
      filter().updateLeaf([0], { value: 'CN' });
      filter().submit();
    });
    await waitFor(() =>
      expect(screen.getByText('Warehouse eq CN')).toBeDefined(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Unset Warehouse eq CN' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('Warehouse eq CN')).toBeNull(),
    );
    // The condition left the query; the row is still in the editor, blank,
    // for the next question.
    expect(filter().applied).toEqual([]);
    expect(filter().tree.children[0]).toMatchObject({ field: 'warehouse' });
  });

  it('clears the value and re-runs in one go', () => {
    const clearValue = vi.fn();
    const submit = vi.fn();
    render(
      <AppliedBar
        filter={stub(
          [
            condition({
              path: ['children', 1, 'children', 0],
              text: 'Amount GT 10',
              field: 'amount',
              label: 'Amount',
              kind: 'number',
              operator: 'GT',
              value: { kind: 'text', value: 10 },
            }),
          ],
          { clearValue, submit },
        )}
        hasResult
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Unset Amount gt 10' }));

    // The editor addresses nodes by index; the `children` keys of a summary
    // path are not part of the address.
    expect(clearValue).toHaveBeenCalledWith([1, 0]);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('freezes its removes with the rest of the view', () => {
    render(<AppliedBar filter={stub([condition()])} hasResult disabled />);

    expect(
      (
        screen.getByRole('button', {
          name: 'Unset Warehouse eq CN',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  /**
   * The host's own conditions are in force beside the view's own, and the
   * editor has no path that reaches them: they are not in the draft, and
   * `clearValue` cannot address them. So they are named — a reader who
   * cannot see why the list is short learns nothing — and they carry no ✕,
   * because the only honest thing a ✕ could do here is fail.
   */
  it("names the host scope after the view's own, without a way to remove it", () => {
    render(
      <AppliedBar
        filter={stub([condition()], { scoped: [customer()] })}
        hasResult
      />,
    );

    const badges = [...document.querySelectorAll('[data-slot="badge"]')];
    expect(badges.map(badge => badge.textContent?.trim())).toEqual([
      'Warehouse eq CN',
      'Customer eq c-1 Set by the page',
    ]);
    // The view's own is removable and dressed as a condition; the page's is
    // worn plainly and offers nothing to press.
    expect(badges[0].hasAttribute('data-scoped')).toBe(false);
    expect(badges[1].hasAttribute('data-scoped')).toBe(true);
    expect(badges[1].className).toContain('border-border');
    expect(
      screen.queryByRole('button', { name: 'Unset Customer eq c-1' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Unset Warehouse eq CN' }),
    ).toBeDefined();
  });

  /**
   * "All records" answers for everything in force, and a scope is in force.
   * Saying it beside a narrowing the page applied would be the bar telling
   * the reader the opposite of what the rows below it are.
   */
  it('does not call a scoped result all of them', () => {
    render(
      <AppliedBar filter={stub([], { scoped: [customer()] })} hasResult />,
    );

    expect(screen.queryByText('All records')).toBeNull();
    expect(screen.getByText(/Customer eq c-1/)).toBeDefined();
  });

  /**
   * Read-only is not "disabled": an embedded view shows what its author
   * saved, and a ✕ that is only ever grey still tells the reader there is a
   * condition here they might get to drop.
   */
  it('renders no remove at all when it is read-only', () => {
    render(<AppliedBar filter={stub([condition()])} hasResult readOnly />);

    expect(screen.getByText('Warehouse eq CN')).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

/**
 * The bar is the most visible text of the result area, and it used to be the
 * one line no catalogue could reach: each kind handed over a finished English
 * sentence — "Status IN Pending", "is empty", "on or before" — so a page in
 * Chinese had an English badge sitting on top of its rows. It is built from
 * parts now, and these say so in the language that is in force.
 */
describe('the applied badge in another language', () => {
  const inChinese = (applied: FilterSummaryItem[]) =>
    render(
      <MessagesProvider messages={zhCN}>
        <AppliedBar filter={stub(applied)} hasResult />
      </MessagesProvider>,
    );

  /** The saved view every Chinese story opens with: 状态 is one of 待出库. */
  const status = (): FilterSummaryItem =>
    condition({
      text: 'Status IN Pending',
      field: 'status',
      label: '状态',
      kind: 'enum',
      operator: 'IN',
      value: { kind: 'list', values: ['PENDING'], labels: ['待出库'] },
    });

  it('says the field, the operator and the option in Chinese', () => {
    inChinese([status()]);

    expect(screen.getByText('状态 是其中之一 待出库')).toBeDefined();
    // And nothing of the English line the kind produced beside it.
    expect(screen.queryByText(/Status IN Pending/)).toBeNull();
  });

  it('names the whole bar in Chinese, remove included', () => {
    inChinese([status()]);

    expect(screen.getByRole('region', { name: '正在显示' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: '清空 状态 是其中之一 待出库' }),
    ).toBeDefined();
  });

  it('reads a presence question as the operator alone', () => {
    // `is empty` was hard-coded English inside the kind; the operator word
    // is the whole condition, so the catalogue is all it needs.
    inChinese([
      condition({
        text: 'Warehouse is empty',
        label: '仓库',
        operator: 'IS_NULL',
        value: { kind: 'none' },
      }),
    ]);

    expect(screen.getByText('仓库 为空')).toBeDefined();
  });

  it('reads a named period and a relative window as words', () => {
    inChinese([
      condition({
        text: 'Created on or before next quarter',
        path: ['children', 0],
        field: 'createdAt',
        label: '创建时间',
        kind: 'datetime',
        operator: 'LTE',
        value: { kind: 'preset', preset: 'nextQuarter' },
      }),
      condition({
        text: 'Created last 7 day',
        path: ['children', 1],
        field: 'createdAt',
        label: '创建时间',
        kind: 'datetime',
        operator: 'BETWEEN',
        value: {
          kind: 'relative',
          amount: 7,
          unit: 'day',
          direction: 'past',
        },
      }),
    ]);

    expect(screen.getByText('创建时间 小于等于 下季度')).toBeDefined();
    expect(screen.getByText('创建时间 介于 过去 7 天')).toBeDefined();
  });

  it("reads a group out under its own operator's word", () => {
    inChinese([
      {
        path: [],
        text: 'Status IN Pending or Amount 1 ~ 9',
        unresolved: false,
        group: 'or',
        items: [
          status(),
          condition({
            text: 'Amount 1 ~ 9',
            path: ['children', 1],
            field: 'amount',
            label: '金额',
            kind: 'number',
            operator: 'BETWEEN',
            value: { kind: 'range', from: 1, to: 9 },
          }),
        ],
      },
    ]);

    expect(
      screen.getByText('满足任一 状态 是其中之一 待出库、金额 介于 1 ~ 9'),
    ).toBeDefined();
  });
});
