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

import { SigmaIcon } from 'lucide-react';
import { Button } from '../components/button.js';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../components/empty.js';
import { useViewMessages } from '../MessagesProvider.js';
import type { MessageKey } from '../messages.js';
import type { EmptyWayOut } from '../record/emptyWayOut.js';

export interface AnalysisEmptyProps {
  /**
   * Which way out the query that matched no group has (`emptyWayOut`, the
   * record view's own rule). Left out — a table drawn on its own, a
   * dashboard panel — the state is the sentence alone: there is no editor
   * beside it to send the reader to.
   */
  wayOut?: EmptyWayOut;
  /** The one way out; without it the state is a sentence and nothing more. */
  onAction?(): void;
}

/**
 * An aggregation that matched no group, said once for both layouts.
 *
 * The table drew this sentence and the chart drew an empty pair of axes — a
 * drawing of nothing, which reads as a chart that failed rather than as a
 * range nothing fell into. The layouts answer the same question, so they say
 * the same sentence, and it says what happened to the *range* rather than to
 * the analysis: 「没有符合条件的组」, not "nothing to aggregate".
 *
 * Inside the workbench it also says what to do next, exactly as the record
 * view's empty result does (`record/EmptyResult.tsx`) and chosen by the same
 * rule: back to a saved view's own conditions when the reader added to
 * them, clear the conditions of a view never saved, and otherwise open the
 * tray — where the range is — to ask something else. A dead end with no way
 * off it left the reader hunting for the control that caused it, on a tray
 * that is folded away more often than not. One action, never two.
 */
export function AnalysisEmpty({ wayOut, onAction }: AnalysisEmptyProps = {}) {
  const messages = useViewMessages();
  return (
    <Empty data-slot="analysis-empty" data-way-out={wayOut}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SigmaIcon />
        </EmptyMedia>
        <EmptyTitle>{messages.label('label.analysis.empty')}</EmptyTitle>
        {wayOut && (
          <EmptyDescription>{messages.label(HINT[wayOut])}</EmptyDescription>
        )}
      </EmptyHeader>
      {wayOut && onAction && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onAction}>
            {messages.label(ACTION[wayOut])}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

/**
 * What the sentence under the title says: the conditions left nothing to
 * group, the saved view itself has nothing right now, or there is nothing
 * at all. The same three readings the record view gives, in the words of a
 * result counted in groups.
 */
const HINT: Record<EmptyWayOut, MessageKey> = {
  restore: 'label.analysis.empty-hint',
  clear: 'label.analysis.empty-hint',
  edit: 'label.analysis.empty-view',
  add: 'label.analysis.empty-none',
};

const ACTION: Record<EmptyWayOut, MessageKey> = {
  restore: 'label.analysis.empty-restore',
  clear: 'label.analysis.empty-clear',
  edit: 'label.analysis.empty-edit',
  add: 'label.analysis.empty-add',
};
