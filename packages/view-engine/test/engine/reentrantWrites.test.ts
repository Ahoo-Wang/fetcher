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

import { expect, it, vi } from 'vitest';
import type { ViewHost, ViewInstance } from '../../src/record/recordModel.js';
import { deferred, instance, setup } from './fixtures.js';

it.each(['loaded', 'pending'] as const)(
  'keeps %s navigation triggered by save-as source cancellation newer than the created copy',
  async navigation => {
    const response = deferred<ViewInstance>();
    const destination = deferred<ViewInstance>();
    const { engine, paged } = setup({
      instances: {
        instances:
          navigation === 'loaded'
            ? [instance(), instance('third')]
            : [instance()],
        defaultInstanceId: 'mine',
      },
      host: {
        createInstance: () => response.promise,
        loadInstance: () => destination.promise,
      } as unknown as ViewHost,
    });
    await engine.load();
    const stalled = deferred<{ list: never[]; total: number }>();
    paged.mockReturnValueOnce(stalled.promise);
    const refreshing = engine.refresh();
    await vi.waitFor(() => expect(paged).toHaveBeenCalledTimes(2));
    const saving = engine.saveAs({
      title: 'Copy',
      scope: { type: 'personal' },
    });
    let redirected: Promise<void> | undefined;
    let redirect = true;
    const unsubscribe = engine.subscribe(() => {
      const state = engine.getSnapshot();
      if (
        redirect &&
        state.selectedInstanceId === 'mine' &&
        state.sessions.mine.queryStatus === 'idle'
      ) {
        redirect = false;
        redirected = engine.selectInstance('third');
      }
    });
    try {
      response.resolve({ ...instance('created'), title: 'Copy' });
      await saving;
      expect(redirected).toBeDefined();
      expect(engine.getSnapshot().selectedInstanceId).toBe(
        navigation === 'loaded' ? 'third' : 'mine',
      );
      expect(engine.getSnapshot().sessions.created.queryStatus).toBe('idle');
      destination.resolve(instance('third'));
      await redirected;
      expect(engine.getSnapshot().selectedInstanceId).toBe('third');
      expect(engine.getSnapshot().sessions.third.queryStatus).toBe('success');
      expect(engine.getSnapshot().sessions.mine.writeStatus).toBe('idle');
    } finally {
      unsubscribe();
      engine.dispose();
      stalled.resolve({ list: [], total: 0 });
      destination.resolve(instance('third'));
      await Promise.all([refreshing, redirected]);
    }
  },
);
