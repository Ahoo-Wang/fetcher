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

import { ParallelTypedEventBus } from '../parallelTypedEventBus';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Libraries/EventBus/ParallelTypedEventBus',
  parameters: {
    docs: {
      description: {
        component:
          'ParallelTypedEventBus handles events in parallel, calling handlers concurrently.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Example event type
interface UserEvent {
  userId: string;
  action: string;
}

// Example handler
const logHandler = {
  name: 'logHandler',
  order: 1,
  handle: (event: UserEvent) => {
    console.log(`User ${event.userId} performed ${event.action}`);
  },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicUsage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates basic usage of ParallelTypedEventBus with concurrent event handling.',
      },
    },
  },
  play: async () => {
    const eventBus = new ParallelTypedEventBus<UserEvent>('user-events');
    eventBus.on(logHandler);

    await eventBus.emit({ userId: '456', action: 'logout' });

    eventBus.destroy();
  },
};
