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
import { playExtensions, playNarrowDark } from './libraryDelivery.play.js';
import displayMeta, {
  FiveExtensions as DisplayFiveExtensions,
  NarrowDark as DisplayNarrowDark,
} from './QuickStart.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'View Engine/快速开始/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const FiveExtensions: Story = {
  ...DisplayFiveExtensions,
  tags: ['!dev', '!autodocs', 'test'],
  play: playExtensions,
};

export const NarrowDark: Story = {
  ...DisplayNarrowDark,
  tags: ['!dev', '!autodocs', 'test'],
  play: playNarrowDark,
};
