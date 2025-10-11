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

import { SerialTypedEventBus } from '../serialTypedEventBus';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Libraries/EventBus/SerialTypedEventBus',
  parameters: {
    docs: {
      description: {
        component:
          'SerialTypedEventBus handles events serially, calling handlers one after another.',
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
          'Demonstrates basic usage of SerialTypedEventBus with event subscription and emission.',
      },
    },
  },
  play: async () => {
    const eventBus = new SerialTypedEventBus<UserEvent>('user-events');
    eventBus.on(logHandler);

    await eventBus.emit({ userId: '123', action: 'login' });

    eventBus.destroy();
  },
};
