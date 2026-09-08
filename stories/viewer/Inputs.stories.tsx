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
import { AntdProvider } from '../shared/AntdProvider.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Fullscreen,
  NumberRange,
  RemoteSelect,
  TagInput,
} from '@ahoo-wang/fetcher-viewer';
import { useEffect, useRef, useState } from 'react';

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
  decorators: [
    Story => (
      <AntdProvider>
        <Story />
      </AntdProvider>
    ),
  ],
  title: 'Viewer/输入与过滤/Inputs',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const NumberRangeValidation: Story = {
  render: () => <NumberRangeDemo />,
};

export const Tags: Story = {
  render: () => <TagInputDemo />,
};

function ControlledRemoteSearch() {
  const release = useRef<(() => void) | undefined>(undefined);
  const [pending, setPending] = useState(false);
  useEffect(() => () => release.current?.(), []);
  return (
    <>
      <RemoteSelectDemo
        scenario="success"
        waitForSearch={() =>
          new Promise<void>(resolve => {
            release.current?.();
            release.current = resolve;
            setPending(true);
          })
        }
      />
      <button
        disabled={!pending}
        onClick={() => {
          release.current?.();
          release.current = undefined;
          setPending(false);
        }}
      >
        Complete search
      </button>
    </>
  );
}

export const RemoteLoadingAndSuccess: Story = {
  render: () => <ControlledRemoteSearch />,
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
