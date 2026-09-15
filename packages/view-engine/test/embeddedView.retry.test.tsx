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
import { EmbeddedView } from '../src/view/EmbeddedView.js';
import type { ViewHost } from '../src/contracts/ViewHost.js';
import { instance, page, preference, setup } from './engine/fixtures.js';

vi.hoisted(() =>
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);
afterEach(cleanup);

it('shows a retry entry when the embedded instance cannot be read, then embeds after a retry', async () => {
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('暂时不可访问'))
    .mockResolvedValue(instance('ghost'));
  const { engine } = setup({
    instances: undefined,
    host: {
      instance: { list: async () => page([]), load },
      preference: { load: async () => preference(null) },
    } as unknown as ViewHost,
  });
  await engine.load();
  render(<EmbeddedView engine={engine} instanceId="ghost" />);
  const alert = await screen.findByRole('alert');
  expect(alert.textContent).toContain('嵌入视图不存在或当前不可访问');
  fireEvent.click(screen.getByRole('button', { name: '重试嵌入' }));
  await screen.findByRole('heading', { name: 'ghost' });
  expect(load).toHaveBeenCalledTimes(2);
  engine.dispose();
});
