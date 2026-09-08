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
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { installFetchFixture } from './http';

const meta = {
  title: '开发验证/夹具生命周期/回归',
  tags: ['!dev', '!autodocs', 'test'],
  render: () => <p>验证请求取消、清理与重新安装。</p>,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AbortAndRestore: Story = {
  play: async () => {
    const original = globalThis.fetch;
    let restore = installFetchFixture();
    try {
      const cancelled = new AbortController();
      cancelled.abort();
      await expect(
        fetch('https://api.example.test/slow', { signal: cancelled.signal }),
      ).rejects.toMatchObject({ name: 'AbortError' });
      const pending = new AbortController();
      const response = fetch('https://api.example.test/slow', {
        signal: pending.signal,
      });
      pending.abort();
      await expect(response).rejects.toMatchObject({ name: 'AbortError' });
      const completed = new AbortController();
      await expect(
        (
          await fetch('https://api.example.test/slow', {
            signal: completed.signal,
          })
        ).json(),
      ).resolves.toEqual({ status: 'completed' });
      completed.abort();
      restore();
      await expect(globalThis.fetch === original).toBe(true);
      restore = installFetchFixture();
      await expect(
        (await fetch('https://api.example.test/users')).json(),
      ).resolves.toHaveLength(2);
    } finally {
      restore();
    }
    await expect(globalThis.fetch === original).toBe(true);
  },
};
