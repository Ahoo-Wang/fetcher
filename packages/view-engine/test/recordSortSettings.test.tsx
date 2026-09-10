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

import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FieldSort } from '@ahoo-wang/fetcher-wow';
import { SortDirection } from '@ahoo-wang/fetcher-wow';
import { RecordSortSettings } from '../src/record/page/RecordSortSettings.js';
import { definition } from './fixtures/viewPage.js';
afterEach(cleanup);
it('reorders active rules and removes them without persisting drag metadata', async () => {
  const onChange = vi.fn();
  const fields = [
    ...definition.fields,
    { field: 'name', label: '名称', type: 'string' as const, sortable: true },
  ];
  function Example() {
    const [sort, setSort] = useState<FieldSort[]>([
      { field: 'amount', direction: SortDirection.ASC },
      { field: 'name', direction: SortDirection.DESC },
    ]);
    return (
      <RecordSortSettings
        definition={{ ...definition, fields }}
        sort={sort}
        onChange={next => {
          onChange(next);
          setSort(next);
        }}
      />
    );
  }
  render(<Example />);
  fireEvent.click(screen.getByRole('button', { name: '排序：金额 ↑、名称 ↓' }));
  const handle = await screen.findByRole('button', {
    name: '拖动调整金额排序优先级',
  });
  handle.focus();
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  expect(onChange.mock.lastCall?.[0]).toEqual([
    { field: 'name', direction: 'DESC' },
    { field: 'amount', direction: 'ASC' },
  ]);
  expect(document.activeElement).toBe(handle);
  expect(
    screen.getByRole('combobox', { name: '金额排序' }).textContent,
  ).toContain('从低到高');
  expect(
    screen.getByRole('combobox', { name: '名称排序' }).textContent,
  ).toContain('倒序');
  expect(screen.getByRole('combobox', { name: '添加排序' })).toHaveProperty(
    'disabled',
    true,
  );
  fireEvent.click(screen.getByRole('button', { name: '移除金额排序' }));
  expect(onChange.mock.lastCall?.[0]).toEqual([
    { field: 'name', direction: 'DESC' },
  ]);
  expect(screen.getByRole('combobox', { name: '添加排序' })).toHaveProperty(
    'disabled',
    false,
  );
  fireEvent.click(screen.getByRole('button', { name: '清除全部' }));
  expect(screen.getByText('尚未设置排序')).toBeTruthy();
  expect(onChange.mock.lastCall?.[0]).toEqual([]);
});
