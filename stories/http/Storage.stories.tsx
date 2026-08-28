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
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

type Scenario = 'read-write' | 'serialization' | 'notifications' | 'cleanup';

interface Preferences {
  theme: 'light' | 'dark';
}

async function runScenario(scenario: Scenario): Promise<string> {
  const storage = new InMemoryStorage();
  const preferences = new KeyStorage<Preferences>({
    key: 'preferences',
    storage,
    defaultValue: { theme: 'light' },
  });

  if (scenario === 'read-write') {
    preferences.set({ theme: 'dark' });
    const result = preferences.get()?.theme ?? 'missing';
    preferences.destroy();
    return result;
  }

  if (scenario === 'serialization') {
    preferences.set({ theme: 'dark' });
    const result = storage.getItem('preferences') ?? 'missing';
    preferences.destroy();
    return result;
  }

  let notificationCount = 0;
  let transition = '';
  const remove = preferences.addListener({
    name: 'story-listener',
    handle: ({ oldValue, newValue }) => {
      notificationCount++;
      transition = `${oldValue?.theme ?? 'none'} → ${newValue?.theme ?? 'none'}`;
    },
  });
  preferences.set({ theme: 'dark' });
  await Promise.resolve();
  await Promise.resolve();

  if (scenario === 'notifications') {
    remove();
    preferences.destroy();
    return transition;
  }

  remove();
  preferences.set({ theme: 'light' });
  preferences.destroy();
  return `${notificationCount} notification · destroyed`;
}

function StorageDemo({ scenario }: { scenario: Scenario }) {
  const [output, setOutput] = useState('Ready');
  return (
    <section className="story-stack" aria-label="Storage">
      <button onClick={() => void runScenario(scenario).then(setOutput)}>
        Write value
      </button>
      <output className="story-output" aria-live="polite">
        {output}
      </output>
    </section>
  );
}

const meta = {
  title: 'HTTP & Streaming/Storage',
  component: StorageDemo,
  args: { scenario: 'read-write' },
  argTypes: { scenario: { control: 'radio' } },
} satisfies Meta<typeof StorageDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function writeAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Write value' }));
  await expect(await canvas.findByText(text)).toBeVisible();
}

export const ReadWrite: Story = {
  args: { scenario: 'read-write' },
  play: ({ canvasElement }) => writeAndExpect(canvasElement, 'dark'),
};

export const Serialization: Story = {
  args: { scenario: 'serialization' },
  play: ({ canvasElement }) =>
    writeAndExpect(canvasElement, '{"theme":"dark"}'),
};

export const ChangeNotifications: Story = {
  args: { scenario: 'notifications' },
  play: ({ canvasElement }) => writeAndExpect(canvasElement, 'light → dark'),
};

export const Cleanup: Story = {
  args: { scenario: 'cleanup' },
  play: ({ canvasElement }) =>
    writeAndExpect(canvasElement, '1 notification · destroyed'),
};
