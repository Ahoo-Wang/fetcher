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
  waitForSearch = wait,
}: {
  scenario: 'success' | 'empty' | 'error';
  waitForSearch?: () => Promise<void>;
}) {
  const [value, setValue] = useState<string>();
  const [searchStatus, setSearchStatus] = useState('idle');
  const search = async (term: string): Promise<UserOption[]> => {
    setSearchStatus('loading');
    await waitForSearch();
    if (scenario === 'error') {
      setSearchStatus('error');
      throw new Error('Unable to load options');
    }
    const options =
      scenario === 'empty'
        ? []
        : userOptions.filter(option =>
            option.label.toLowerCase().includes(term.toLowerCase()),
          );
    setSearchStatus(options.length === 0 ? 'empty' : 'success');
    return options;
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
          : `Search: ${searchStatus}`}
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

let releaseRemoteSearch: (() => void) | undefined;

export const RemoteLoadingAndSuccess: Story = {
  render: () => (
    <RemoteSelectDemo
      scenario="success"
      waitForSearch={() =>
        new Promise<void>(resolve => {
          releaseRemoteSearch = resolve;
        })
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'User search' });
    await userEvent.click(input);
    await userEvent.type(input, 'Ada');
    const dropdown = canvasElement.ownerDocument.querySelector<HTMLElement>(
      '.ant-select-dropdown:not(.ant-select-dropdown-hidden)',
    );
    await expect(dropdown).not.toBeNull();
    const options = within(dropdown!);
    await expect(await options.findByText('数据加载中...')).toBeVisible();
    releaseRemoteSearch?.();
    releaseRemoteSearch = undefined;
    await userEvent.click(await options.findByText('Ada'));
    await expect(await canvas.findByText('Selected: Ada')).toBeVisible();
  },
};

export const RemoteEmpty: Story = {
  render: () => <RemoteSelectDemo scenario="empty" />,
  play: ({ canvasElement }) => searchAndExpect(canvasElement, 'Search: empty'),
};

export const RemoteError: Story = {
  render: () => <RemoteSelectDemo scenario="error" />,
  play: ({ canvasElement }) => searchAndExpect(canvasElement, 'Search: error'),
};

export const FullscreenDisabled: Story = {
  render: () => <Fullscreen disabled>Fullscreen unavailable</Fullscreen>,
};

async function searchAndExpect(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  const input = canvas.getByRole('combobox', { name: 'User search' });
  await userEvent.click(input);
  await userEvent.type(input, 'Nobody');
  await expect(await canvas.findByText(text)).toBeVisible();
  await userEvent.tab();
}
