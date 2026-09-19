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

import { describe, expect, it } from 'vitest';
import type { Issue } from '../src/index.js';
import { describeConfig } from '../src/ui/describeConfig.js';
import {
  defaultMessages,
  formatIssue,
  formatIssues,
  formatMessage,
  type ViewMessages,
} from '../src/ui/messages.js';
import type { MessageFormatters } from '../src/ui/MessagesProvider.js';
import { analysisConfig, dashboardConfig, recordConfig } from './fixtures.js';

/** The formatters a component would get, without a component to get them. */
function wording(overrides: ViewMessages = {}): MessageFormatters {
  const merged = { ...defaultMessages, ...overrides };
  return {
    label: (key: string, params?: Issue['params'], fallback?: string) => {
      const found = formatMessage(merged, key, params);
      return found === key && fallback !== undefined ? fallback : found;
    },
    issue: found => formatIssue(merged, found),
    issues: found => formatIssues(merged, found),
  };
}

describe('describeConfig', () => {
  it('counts what a record config decides', () => {
    expect(
      describeConfig(
        recordConfig({
          pageSize: 50,
          sort: [{ field: 'amount', direction: 'ASC' }],
        }),
        wording(),
      ),
    ).toBe('50 per page · Table · 2 columns · 1 sorts');
  });

  it('names the layout rather than quoting the stored value', () => {
    // The config stores `card`; nobody reads a config, so the summary says
    // the word the rest of the package uses for that layout.
    expect(
      describeConfig(recordConfig({ layout: 'card' }), wording()),
    ).toContain('Cards');
  });

  it('counts what an analysis config decides', () => {
    expect(describeConfig(analysisConfig({ limit: 25 }), wording())).toBe(
      '1 groups · 1 metrics · up to 25 rows',
    );
  });

  it('counts a dashboard by its panels', () => {
    expect(describeConfig(dashboardConfig(), wording())).toBe('0 panels');
  });

  it('says it in the words the application chose', () => {
    // The whole point of going through the catalogue: a host that reworded
    // the summary gets its own sentence, not this one translated.
    expect(
      describeConfig(
        recordConfig(),
        wording({ 'label.conflict.summary.record': '{columns} of them' }),
      ),
    ).toBe('2 of them');
  });
});
