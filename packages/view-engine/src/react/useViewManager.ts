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

import { useCallback, useMemo, useState } from 'react';
import {
  isSystemScope,
  type Issue,
  type ViewPreferences,
} from '../model/index.js';
import {
  isViewWriteError,
  type ConflictChoice,
  type ViewEngine,
  type WriteHandle,
  type WritePayload,
  type WriteState,
} from '../runtime/index.js';
import { toIssue } from './issues.js';
import type { ViewListState } from './useViewList.js';

/**
 * The key the order and the default view are recorded under.
 *
 * Both are one preference record, so both contend for one slot and share one
 * outcome: there is no instance to hang them off, and a row cannot be asked
 * to recover a write that was never about it.
 */
export const PREFERENCES_KEY = 'preferences';

export type MoveDirection = 'up' | 'down';

/** What may be done to one row. `save` is not among them: nothing here edits a config. */
export interface ManagedInstanceAbilities {
  rename: boolean;
  delete: boolean;
}

export interface ViewManagerAbilities {
  reorder: boolean;
  setDefault: boolean;
  instance(id: string): ManagedInstanceAbilities;
}

export interface ViewManagerController {
  rename(id: string, title: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  setDefault(id: string | null): Promise<boolean>;
  move(id: string, direction: MoveDirection): Promise<boolean>;
  /** Unresolved outcomes, by instance id or {@link PREFERENCES_KEY}. */
  outcomes: ReadonlyMap<string, WriteState>;
  retry(key: string): Promise<boolean>;
  abandon(key: string): void;
  resolveConflict(key: string, choice: ConflictChoice): Promise<boolean>;
  /** The key of the write in flight, so one row alone shows progress. */
  pending: string | null;
  can: ViewManagerAbilities;
}

/**
 * One recorded outcome. The handle is the engine's, kept here rather than
 * handed out: a caller acts on the row it can see, and `retry`, `abandon` and
 * `resolveConflict` address the write for it.
 */
interface Outcome {
  state: WriteState;
  /**
   * Absent when there is nothing left to replay: a command the engine refused
   * before dispatching, or a conflict it has already settled.
   */
  handle: WriteHandle | null;
}

/**
 * The revision and the request id of a write that never left. A refusal is
 * recorded so the row can say why it did not happen, and its payload is the
 * intent rather than anything sent, so it quotes neither.
 */
const UNSENT = '';

const NO_OUTCOMES: ReadonlyMap<string, Outcome> = new Map();

const NO_INSTANCE_WRITES: ManagedInstanceAbilities = {
  rename: false,
  delete: false,
};

/**
 * A refusal, in the shape the row already renders. `ViewCommandError` means
 * nothing was sent, which is exactly a rejection with no outcome to recover.
 */
function refused(payload: WritePayload, issue: Issue): WriteState {
  return { requestId: UNSENT, payload, kind: 'rejected', issue };
}

/**
 * Managing the views a list shows, rather than the one that is open: rename,
 * delete, reorder and choose a default, with the recovery actions for writes
 * that no runtime owns.
 *
 * Every command resolves rather than rejects, as `useSaveCommands` does: what
 * happened lands in `outcomes` under the row it belongs to, so a click handler
 * needs no try/catch and an unresolved write stays visible until the user
 * retries, overwrites or abandons it. A write that lands reloads the list,
 * because it is the list that changed.
 */
export function useViewManager(
  engine: ViewEngine,
  definitionId: string,
  list: ViewListState,
): ViewManagerController {
  // Kept here rather than read back from `engine.pendingWrites()`: that map is
  // keyed by request id and says nothing about which row raised a write, and
  // the error each command rejects with already carries both halves.
  const [outcomes, setOutcomes] =
    useState<ReadonlyMap<string, Outcome>>(NO_OUTCOMES);
  const [pending, setPending] = useState<string | null>(null);
  const { items, permissions, preferences, reload } = list;

  const record = useCallback((key: string, outcome: Outcome | null): void => {
    setOutcomes(current => {
      if (outcome === null && !current.has(key)) return current;
      const next = new Map(current);
      if (outcome) next.set(key, outcome);
      else next.delete(key);
      return next;
    });
  }, []);

  const run = useCallback(
    async (
      key: string,
      intent: WritePayload,
      code: string,
      command: () => Promise<unknown>,
    ): Promise<boolean> => {
      setPending(key);
      try {
        await command();
        // It landed: nothing is left to recover, and the list it changed —
        // the titles, the order, the default — is now a revision behind.
        record(key, null);
        reload();
        return true;
      } catch (caught) {
        record(
          key,
          isViewWriteError(caught)
            ? { state: caught.state, handle: caught.handle }
            : { state: refused(intent, toIssue(caught, code)), handle: null },
        );
        return false;
      } finally {
        // Another key's command may have taken the slot while this one was in
        // flight; the one that holds it is the one that clears it.
        setPending(current => (current === key ? null : current));
      }
    },
    [record, reload],
  );

  /**
   * The preferences this command means to store. It is only read when the
   * engine refuses before sending, which is why it may quote no revision.
   */
  const preferencesIntent = useCallback(
    (change: Partial<ViewPreferences>): WritePayload => ({
      action: 'preferences',
      definitionId,
      next: {
        order: preferences?.order ?? [],
        defaultInstanceId: preferences?.defaultInstanceId ?? null,
        revision: preferences?.revision ?? UNSENT,
        ...change,
      },
    }),
    [definitionId, preferences],
  );

  const rename = useCallback(
    (id: string, title: string) =>
      run(
        id,
        { action: 'rename', id, revision: UNSENT, title },
        'view.rename.failed',
        () => engine.rename(id, title),
      ),
    [engine, run],
  );

  const remove = useCallback(
    (id: string) =>
      run(
        id,
        { action: 'delete', id, revision: UNSENT },
        'view.delete.failed',
        () => engine.delete(id),
      ),
    [engine, run],
  );

  const setDefault = useCallback(
    (id: string | null) =>
      run(
        PREFERENCES_KEY,
        preferencesIntent({ defaultInstanceId: id }),
        'view.preferences.failed',
        () => engine.setDefault(definitionId, id),
      ),
    [definitionId, engine, preferencesIntent, run],
  );

  const move = useCallback(
    (id: string, direction: MoveDirection) => {
      const order = items.map(item => item.id);
      const from = order.indexOf(id);
      const to = from + (direction === 'up' ? -1 : 1);
      // A row at either end has nowhere to go, and a row the list no longer
      // holds cannot be placed. Submitting the order unchanged would still
      // cost a revision and still be able to conflict.
      if (from < 0 || to < 0 || to >= order.length)
        return Promise.resolve(false);
      [order[from], order[to]] = [order[to], order[from]];
      return run(
        PREFERENCES_KEY,
        preferencesIntent({ order }),
        'view.preferences.failed',
        // The whole visible order goes, not the one pair that moved: the
        // server holds a list, not a diff.
        () => engine.reorder(definitionId, order),
      );
    },
    [definitionId, engine, items, preferencesIntent, run],
  );

  const retry = useCallback(
    (key: string) => {
      const outcome = outcomes.get(key);
      // Nothing to replay: a refusal never left, and a settled conflict is no
      // longer the engine's to answer for.
      if (!outcome?.handle) return Promise.resolve(false);
      const { handle, state } = outcome;
      return run(key, state.payload, 'view.retry.failed', () =>
        engine.retryWrite(handle),
      );
    },
    [engine, outcomes, run],
  );

  const abandon = useCallback(
    (key: string): void => {
      const outcome = outcomes.get(key);
      if (!outcome) return;
      if (outcome.handle) {
        try {
          engine.abandonWrite(outcome.handle);
        } catch {
          // Already settled. Dropping it is the whole intent, and a row left
          // showing a message nothing can clear is the only wrong answer.
        }
      }
      record(key, null);
    },
    [engine, outcomes, record],
  );

  const resolveConflict = useCallback(
    async (key: string, choice: ConflictChoice): Promise<boolean> => {
      const outcome = outcomes.get(key);
      if (!outcome?.handle || outcome.state.kind !== 'conflict') return false;
      const { handle, state } = outcome;
      const landed = await run(key, state.payload, 'view.resolve.failed', () =>
        engine.resolveConflict(handle, choice),
      );
      // Reloading a preference conflict is not the end of it (design §7.3):
      // the stored order and default are read again, and the user's own
      // intent is kept and put to them once more rather than replayed at the
      // new revision behind their back. The list has reloaded, the row goes
      // on saying what happened, and the handle goes — the engine settled it,
      // so pressing the same button again is a new write.
      if (landed && key === PREFERENCES_KEY && choice === 'reload')
        record(key, { state, handle: null });
      return landed;
    },
    [engine, outcomes, record, run],
  );

  const can = useMemo<ViewManagerAbilities>(
    () => ({
      reorder: permissions.reorder,
      setDefault: permissions.setDefault,
      instance: (id: string) => {
        // A system view ships with the definition, so no store write reaches
        // it whatever the permissions answer for its id.
        const summary = items.find(item => item.id === id);
        if (summary && isSystemScope(summary.scope)) return NO_INSTANCE_WRITES;
        const granted = permissions.instance(id);
        return { rename: granted.rename, delete: granted.delete };
      },
    }),
    [items, permissions],
  );

  const states = useMemo<ReadonlyMap<string, WriteState>>(() => {
    const projected = new Map<string, WriteState>();
    for (const [key, outcome] of outcomes) projected.set(key, outcome.state);
    return projected;
  }, [outcomes]);

  return {
    rename,
    delete: remove,
    setDefault,
    move,
    outcomes: states,
    retry,
    abandon,
    resolveConflict,
    pending,
    can,
  };
}
