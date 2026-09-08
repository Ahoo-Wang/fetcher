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
import { installDocumentationFetchFixture } from '../fixtures/http';
import { ReactRequests } from './ReactRequests';

const meta = {
  title: 'Docs/React requests',
  component: ReactRequests,
  beforeEach: installDocumentationFetchFixture,
  args: { baseURL: 'https://api.example.test' },
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof ReactRequests>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Failure: Story = {};

export const Cancellation: Story = {};
