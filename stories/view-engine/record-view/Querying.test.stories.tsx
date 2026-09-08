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
import { playBusinessRecords } from './persistence.play.js';
import {
  playCursorRecords,
  playEmptyRecords,
  playQueryFailure,
} from './querying.play.js';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import displayMeta, {
  BusinessRecords as DisplayBusinessRecords,
  CursorRecords as DisplayCursorRecords,
  EmptyRecords as DisplayEmptyRecords,
  QueryFailure as DisplayQueryFailure,
} from './Querying.stories.js';
import type { StoryObj as RegressionStoryObj } from '@storybook/react-vite';

const meta = {
  ...displayMeta,
  title: 'View Engine/Record View/查询与分页/回归',
  tags: ['!dev', '!autodocs', 'test'],
};

export default meta;

type Story = RegressionStoryObj<typeof displayMeta>;

export const BusinessRecords: Story = {
  ...DisplayBusinessRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playBusinessRecords,
};

export const CursorRecords: Story = {
  ...DisplayCursorRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playCursorRecords,
};

export const EmptyRecords: Story = {
  ...DisplayEmptyRecords,
  tags: ['!dev', '!autodocs', 'test'],
  play: playEmptyRecords,
};

export const QueryFailure: Story = {
  ...DisplayQueryFailure,
  tags: ['!dev', '!autodocs', 'test'],
  play: playQueryFailure,
};
