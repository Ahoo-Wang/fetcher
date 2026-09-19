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

import type { ViewConfig } from '../model/index.js';
import type { MessageFormatters } from './MessagesProvider.js';

/**
 * One config as a single line.
 *
 * A conflict asks the user to choose between two configs, and neither is
 * something they can read: a config is a tree of ids. This says the handful
 * of facts that actually differ between two ways of looking at the same
 * data, so the choice is made on what changes rather than on trust.
 *
 * It is a pure function of the config and the wording — no clock, no
 * definition, no field labels — because a conflicting remote config may name
 * fields this release has never heard of.
 */
export function describeConfig(
  config: ViewConfig,
  messages: MessageFormatters,
): string {
  switch (config.kind) {
    case 'record':
      return messages.label('label.conflict.summary.record', {
        pageSize: config.pageSize,
        // The layout is a word the catalogue already owns; the stored value
        // is `card`, and the label that names it is the plural one.
        layout: messages.label(
          config.layout === 'card'
            ? 'label.layout.cards'
            : 'label.layout.table',
        ),
        columns: config.table.columns.length,
        sorts: config.sort.length,
      });
    case 'analysis':
      return messages.label('label.conflict.summary.analysis', {
        groups: config.groups.length,
        metrics: config.metrics.length,
        limit: config.limit,
      });
    case 'dashboard':
      return messages.label('label.conflict.summary.dashboard', {
        panels: config.panels.length,
      });
  }
}
