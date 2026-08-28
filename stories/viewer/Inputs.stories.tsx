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
import {
  Fullscreen,
  NumberRange,
  RemoteSelect,
  TagInput,
} from '@ahoo-wang/fetcher-viewer';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

interface UserOption {
  label: string;
  value: string;
}

const userOptions: UserOption[] = [
  { label: 'Ada', value: 'u-ada' },
  { label: 'Lin', value: 'u-lin' },
];

const wait = () => new Promise<void>(resolve => window.setTimeout(resolve, 20));

function NumberRangeDemo() {
  const [range, setRange] = useState<(number | undefined)[]>([]);
  return (
    <section className="story-stack" aria-label="Number range">
      <NumberRange
        min={0}
        max={100}
        placeholder={['Minimum', 'Maximum']}
        onChange={setRange}
      />
      <output className="story-output" aria-live="polite">
        {range[0] ?? '—'} → {range[1] ?? '—'}
      </output>
    </section>
  );
}

function TagInputDemo() {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <section className="story-stack" aria-label="Tag input">
      <TagInput
        aria-label="Tags"
        placeholder="Add tags"
        value={tags}
        onChange={setTags}
      />
      <output className="story-output" aria-live="polite">
        Tags: {tags.join(', ') || 'none'}
      </output>
    </section>
  );
}

function RemoteSelectDemo({
  scenario,
}: {
  scenario: 'success' | 'empty' | 'error';
}) {
  const [value, setValue] = useState<string>();
  const search = async (term: string): Promise<UserOption[]> => {
    await wait();
    if (scenario === 'error') throw new Error('Unable to load options');
    if (scenario === 'empty') return [];
    return userOptions.filter(option =>
      option.label.toLowerCase().includes(term.toLowerCase()),
    );
  };
  return (
    <section className="story-stack" aria-label="Remote select">
      <RemoteSelect<string, UserOption>
        aria-label="User search"
        placeholder="Search users"
        debounce={{ delay: 20 }}
        search={search}
        value={value}
        onChange={setValue}
        style={{ width: 320 }}
      />
      <output className="story-output" aria-live="polite">
        {value
          ? `Selected: ${userOptions.find(option => option.value === value)?.label}`
          : scenario === 'error'
            ? 'Errors use the empty-state presentation'
            : 'No selection'}
      </output>
    </section>
  );
}

const meta = {
  title: 'Viewer/Inputs',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NumberRangeValidation: Story = {
  render: () => <NumberRangeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Minimum'), '10');
    await userEvent.type(canvas.getByPlaceholderText('Maximum'), '20');
    await expect(await canvas.findByText('10 → 20')).toBeVisible();
  },
};

export const Tags: Story = {
  render: () => <TagInputDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Tags' }),
      'alpha,',
    );
    await expect(await canvas.findByText('Tags: alpha')).toBeVisible();
  },
};

export const RemoteLoadingAndSuccess: Story = {
  render: () => <RemoteSelectDemo scenario="success" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox', { name: 'User search' });
    await userEvent.click(input);
    await userEvent.type(input, 'Ada');
    await expect(await page.findByText('数据加载中...')).toBeVisible();
    await userEvent.click(await page.findByText('Ada'));
    await expect(await canvas.findByText('Selected: Ada')).toBeVisible();
  },
};

export const RemoteEmpty: Story = {
  render: () => <RemoteSelectDemo scenario="empty" />,
};

export const RemoteError: Story = {
  render: () => <RemoteSelectDemo scenario="error" />,
};

export const FullscreenDisabled: Story = {
  render: () => <Fullscreen disabled>Fullscreen unavailable</Fullscreen>,
};
