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

import { useState, type ReactNode } from 'react';
import type {
  Issue,
  ViewConfig,
  ViewInstance,
  ViewPreferences,
} from '../model/index.js';
import type {
  ConflictChoice,
  WriteAction,
  WritePayload,
} from '../runtime/index.js';
import type { SaveCommands } from '../react/index.js';
import { Button } from './components/button.js';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/dialog.js';
import { describeConfig } from './describeConfig.js';
import { useViewMessages } from './MessagesProvider.js';
import { DialogContent } from './popups.js';
import { SaveAsDialog } from './SaveAsDialog.js';

export interface WriteOutcomeProps {
  commands: SaveCommands;
  /** The view's title, so a copy out of a conflict can be offered from it. */
  title: string;
  onSaved?(instance: ViewInstance): void;
  onRenamed?(instance: ViewInstance): void;
  onDeleted?(): void;
  /** Called when a recovered write (retry, overwrite, reload) landed. */
  onRecovered?(action: WriteAction): void;
}

/** The one line and the row of buttons every outcome is drawn as. */
function OutcomeStrip({
  tone,
  children,
}: {
  tone: 'alert' | 'status';
  children: ReactNode;
}) {
  return (
    <section
      data-slot="write-outcome"
      role={tone}
      className={
        tone === 'alert'
          ? 'border-destructive text-destructive flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm'
          : 'text-warning border-warning flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm'
      }
    >
      {children}
    </section>
  );
}

/**
 * The config a write was carrying, as the user last had it. A rename and a
 * delete carry none — there is nothing of theirs to put beside the server's.
 */
function localConfig(payload: WritePayload): ViewConfig | null {
  switch (payload.action) {
    case 'save':
      return payload.config;
    case 'create':
      return payload.input.config;
    default:
      return null;
  }
}

/** The server's config, when what it sent back was an instance at all. */
function remoteConfig(
  remote: ViewInstance | ViewPreferences,
): ViewConfig | null {
  return 'config' in remote ? remote.config : null;
}

/**
 * What became of the last write, and the way out of it.
 *
 * It is one line rather than a block, because the result below it is still
 * the real one and a banner that pushed it off screen would be reporting a
 * problem by causing a second. Every outcome that needs a decision keeps its
 * buttons here until the user makes one; nothing here times out.
 */
export function WriteOutcome({
  commands,
  title,
  onSaved,
  onRenamed,
  onDeleted,
  onRecovered,
}: WriteOutcomeProps) {
  const messages = useViewMessages();
  const [confirming, setConfirming] = useState<ConflictChoice | null>(null);
  const [copying, setCopying] = useState(false);
  const { write, error } = commands.state;

  /**
   * A recovered write lands like the original one would have: a recovered
   * create or save opens what it made, a rename keeps the instance current,
   * a delete lets the view go. Every landing also reports through
   * onRecovered, which is where a host that wires nothing else stays fresh.
   * A reload is not a landing: the server's state was adopted, so nothing is
   * opened or let go of — the list may still have moved.
   */
  const notify = (
    action: WriteAction | undefined,
    instance: ViewInstance | null,
    reloaded = false,
  ) => {
    if (!action) return;
    if (reloaded) {
      onRecovered?.(action);
      return;
    }
    switch (action) {
      case 'delete':
        onDeleted?.();
        onRecovered?.(action);
        return;
      case 'rename':
        if (instance) onRenamed?.(instance);
        onRecovered?.(action);
        return;
      default:
        if (instance) onSaved?.(instance);
        onRecovered?.(action);
    }
  };

  if (write?.kind === 'conflict') {
    const resolve = (choice: ConflictChoice) => {
      const action = write.payload.action;
      setConfirming(null);
      void commands
        .resolveConflict(choice)
        .then(
          result =>
            result.landed &&
            notify(action, result.instance, choice === 'reload'),
        );
    };
    return (
      <>
        <OutcomeStrip tone="alert">
          <span className="min-w-0 flex-1">
            {messages.label('label.write.conflict')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming('reload')}
          >
            {messages.label('label.conflict.theirs')}
          </Button>
          {/* Each way out is offered only where it can be taken: a copy needs
              somewhere to create it, an overwrite needs the right to write. */}
          {commands.can.saveAs && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCopying(true)}
            >
              {messages.label('label.conflict.copy')}
            </Button>
          )}
          {commands.can.save && (
            <Button size="sm" onClick={() => setConfirming('overwrite')}>
              {messages.label('label.conflict.mine')}
            </Button>
          )}
        </OutcomeStrip>

        <ConflictConfirm
          choice={confirming}
          local={localConfig(write.payload)}
          remote={remoteConfig(write.remote)}
          onOpenChange={open => setConfirming(open ? confirming : null)}
          onConfirm={resolve}
        />

        <SaveAsDialog
          open={copying}
          onOpenChange={setCopying}
          commands={commands}
          title={title}
          onSaved={onSaved}
        />
      </>
    );
  }

  if (write?.kind === 'unknown') {
    return (
      <OutcomeStrip tone="status">
        <span className="min-w-0 flex-1">
          {messages.label('label.write.unknown')}
        </span>
        <Button
          size="sm"
          onClick={() => {
            const action = write.payload.action;
            void commands
              .retry()
              .then(result => result.landed && notify(action, result.instance));
          }}
        >
          {messages.label('label.unknown.retry')}
        </Button>
        <Button variant="outline" size="sm" onClick={commands.abandon}>
          {messages.label('label.unknown.leave')}
        </Button>
      </OutcomeStrip>
    );
  }

  const refused = write?.kind === 'rejected' ? write.issue : error;
  return refused ? <RefusalLine issue={refused} /> : null;
}

/** A refusal says why and offers nothing: there is nothing to recover. */
function RefusalLine({ issue }: { issue: Issue }) {
  const messages = useViewMessages();
  return (
    <OutcomeStrip tone="alert">
      <span className="min-w-0 flex-1">
        {messages.issue(issue)}
        {issue.params?.reason !== undefined &&
          ` ${String(issue.params.reason)}`}
      </span>
    </OutcomeStrip>
  );
}

/**
 * The same choice, put once more with both configs on the table.
 *
 * Either answer loses something a user cannot see from the button that
 * offered it, so the two ways of looking are summarised side by side first.
 */
function ConflictConfirm({
  choice,
  local,
  remote,
  onOpenChange,
  onConfirm,
}: {
  /** The choice awaiting confirmation, or null while none is. */
  choice: ConflictChoice | null;
  local: ViewConfig | null;
  remote: ViewConfig | null;
  onOpenChange(open: boolean): void;
  onConfirm(choice: ConflictChoice): void;
}) {
  const messages = useViewMessages();
  const taking = choice === 'reload';
  return (
    <Dialog open={choice !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {messages.label(
              taking
                ? 'label.conflict.confirm-theirs'
                : 'label.conflict.confirm-mine',
            )}
          </DialogTitle>
          <DialogDescription>
            {messages.label('label.conflict.choice')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ConfigSide titleKey="label.conflict.local" config={local} />
          <ConfigSide titleKey="label.conflict.remote" config={remote} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {messages.label('label.dialog.cancel')}
          </DialogClose>
          <Button
            onClick={() => choice !== null && onConfirm(choice)}
            variant={taking ? 'default' : 'destructive'}
          >
            {messages.label(
              taking ? 'label.conflict.theirs' : 'label.conflict.mine',
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfigSide({
  titleKey,
  config,
}: {
  titleKey: string;
  config: ViewConfig | null;
}) {
  const messages = useViewMessages();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-medium">{messages.label(titleKey)}</span>
      {config && (
        <span className="text-muted-foreground">
          {describeConfig(config, messages)}
        </span>
      )}
    </div>
  );
}
