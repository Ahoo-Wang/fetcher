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
import type { ViewHost } from '../../src/record/ViewHost.js';
import { ViewServiceError } from '../../src/record/viewServiceContract.js';
import {
  instance,
  managementPermissions,
  selected,
  setup,
} from './fixtures.js';

it.each(['save', 'rename', 'delete'] as const)(
  'requires reconciliation for unclassified or unavailable %s failures',
  async operation => {
    for (const failure of [
      new TypeError('Network failed'),
      new ViewServiceError('UNAVAILABLE', 'Service unavailable'),
    ]) {
      const { engine, host } = setup({
        host: {
          permission: { getInstance: managementPermissions },
        } as ViewHost,
      });
      host.instance!.rename = vi.fn(async (id, title) => ({
        ...instance(id),
        title,
      }));
      host.instance!.delete = vi.fn().mockResolvedValue(undefined);
      host.instance![operation] = vi.fn().mockRejectedValue(failure);
      host.instance!.load = vi.fn(async () => ({
        ...instance(),
        revision: operation === 'delete' ? 'r1' : 'r2',
      }));
      try {
        await engine.load();
        engine.setTitle('Retained edit');
        await expect(
          operation === 'save'
            ? engine.save()
            : operation === 'rename'
              ? engine.renameInstance('Rename')
              : engine.deleteInstance(),
        ).rejects.toBe(failure);
        expect(selected(engine)).toMatchObject({
          requiresReload: true,
          instance: { title: 'Retained edit' },
        });
        expect(
          engine.getCapabilitiesSnapshot().instances.mine.retryDelete,
        ).toBe(operation === 'delete');
        await expect(engine.save()).rejects.toThrow('核对');
        await expect(engine.renameInstance('Blocked')).rejects.toThrow('核对');
        if (operation !== 'delete')
          await expect(engine.deleteInstance()).rejects.toThrow('核对');
        expect(host.instance![operation]).toHaveBeenCalledOnce();
        await engine.reloadInstance();
        expect(selected(engine)).toMatchObject({
          requiresReload: false,
          instance: {
            title: 'Retained edit',
            revision: operation === 'delete' ? 'r1' : 'r2',
          },
        });
        expect(
          engine.getCapabilitiesSnapshot().instances.mine.retryDelete,
        ).toBe(false);
        if (operation === 'delete') {
          host.instance!.save = vi.fn().mockRejectedValue(failure);
          await expect(engine.save()).rejects.toBe(failure);
          await expect(engine.deleteInstance()).rejects.toThrow('核对');
          expect(host.instance!.delete).toHaveBeenCalledOnce();
        }
      } finally {
        engine.dispose();
      }
    }
  },
);
