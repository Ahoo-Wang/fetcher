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

/**
 * What the column and sort settings are opened against: a controller whose
 * commands are spies, and the formatters a component would have got from a
 * provider. Both let a suite assert what a control writes without an engine,
 * a runtime or a source behind it.
 */

import { vi } from 'vitest';
import type { RecordTableController } from '../../src/react/index.js';
import type { MessageFormatters } from '../../src/ui/MessagesProvider.js';
import {
  formatIssue,
  formatIssues,
  formatMessage,
  type ViewMessages,
} from '../../src/ui/messages.js';

export function tableController(
  overrides: Partial<RecordTableController> = {},
): RecordTableController {
  return {
    columns: [],
    card: { title: '', fields: [] },
    rows: [],
    paging: null,
    summaries: null,
    status: 'success',
    error: null,
    loading: false,
    sort: [],
    sortOf: () => null,
    toggleSort: vi.fn(),
    setSort: vi.fn(),
    layout: 'table',
    layouts: ['table'],
    setLayout: vi.fn(),
    columnFields: [],
    setColumns: vi.fn(),
    setColumnOrder: vi.fn(),
    pinnedOf: () => null,
    setPinned: vi.fn(),
    summaryOf: () => null,
    setSummary: vi.fn(),
    pageSize: 20,
    pageSizes: [20],
    setPageSize: vi.fn(),
    selection: [],
    selectedRows: [],
    isSelected: () => false,
    toggle: vi.fn(),
    toggleAll: vi.fn(),
    clearSelection: vi.fn(),
    goTo: vi.fn(),
    hasNext: false,
    next: vi.fn(),
    previous: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

/** The formatters a provider would hand down, for a function tested alone. */
export function formattersFor(messages: ViewMessages): MessageFormatters {
  return {
    label: (key, params, fallback) => {
      const found = formatMessage(messages, key, params);
      return found === key && fallback !== undefined ? fallback : found;
    },
    issue: found => formatIssue(messages, found),
    issues: found => formatIssues(messages, found),
  };
}
