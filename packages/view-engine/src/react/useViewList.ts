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

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Issue,
  ViewInstanceSummary,
  ViewKind,
  ViewPreferences,
} from '../model/index.js';
import { orderSummaries, type ViewEngine } from '../runtime/index.js';
import type { ViewPermissions } from '../store/ViewStore.js';
import { toIssue } from './issues.js';

export interface ViewListOptions {
  /**
   * Narrows the list to one kind, before it is ordered and before a default
   * is resolved from it.
   *
   * One data definition holds record and analysis instances together, while a
   * workbench draws one of the two. Without this the sidebar offers views the
   * body cannot render, and the effective default may land on one of them —
   * which is a blank page rather than a view. Left out, every kind is listed,
   * which is what a dashboard definition wants.
   */
  kind?: ViewKind;
}

export interface ViewListState {
  /** Summaries in the order the workbench shows them. */
  items: ViewInstanceSummary[];
  preferences: ViewPreferences | null;
  permissions: ViewPermissions;
  /** The view to open when the caller names none; null until preferences settle. */
  defaultInstanceId: string | null;
  loading: boolean;
  error: Issue | null;
  /** Kept apart: without preferences the list still works, in server order. */
  preferencesError: Issue | null;
  reload(): void;
}

/**
 * A completed load, tagged with the request it answered and the definition
 * it is about. The two are asked separately: `key` says whether this is the
 * newest answer, `definitionId` whether it is still about the right thing.
 */
interface Loaded<T> {
  key: string;
  definitionId: string;
  value: T | null;
  error: Issue | null;
}

const NOTHING_LOADED: Loaded<never> = {
  key: '',
  definitionId: '',
  value: null,
  error: null,
};

/**
 * The list, the preferences and the permissions of one definition.
 *
 * They load independently and never block each other: a failed list leaves an
 * open view alone, and failed preferences only drop back to server order.
 * Loading is derived from whether the answer on hand belongs to the current
 * request, so the effect writes state only when a response arrives.
 */
export function useViewList(
  engine: ViewEngine,
  definitionId: string,
  options: ViewListOptions = {},
): ViewListState {
  // Read off the object rather than kept: a caller writes the options inline,
  // so the object is new every render and the kind inside it is not.
  const { kind } = options;
  const [token, setToken] = useState(0);
  const [list, setList] =
    useState<Loaded<ViewInstanceSummary[]>>(NOTHING_LOADED);
  const [preferences, setPreferences] =
    useState<Loaded<ViewPreferences>>(NOTHING_LOADED);
  const key = `${token}:${definitionId}`;

  useEffect(() => {
    let cancelled = false;

    void engine.list(definitionId).then(
      value => {
        if (!cancelled) setList({ key, definitionId, value, error: null });
      },
      (error: unknown) => {
        if (!cancelled)
          setList({
            key,
            definitionId,
            value: null,
            error: toIssue(error, 'view.list.failed'),
          });
      },
    );

    void engine.preferences(definitionId).then(
      value => {
        if (!cancelled)
          setPreferences({ key, definitionId, value, error: null });
      },
      (error: unknown) => {
        if (!cancelled)
          setPreferences({
            key,
            definitionId,
            value: null,
            error: toIssue(error, 'view.preferences.failed'),
          });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [engine, definitionId, key]);

  const permissions = useMemo(
    () => engine.permissions(definitionId),
    [engine, definitionId],
  );
  const reload = useCallback(() => setToken(current => current + 1), []);

  // A reload refreshes; it does not blank. What is on hand for *this*
  // definition stays on screen until the new answer lands, because a list
  // that empties mid-reload has no default view for a moment — and a
  // workbench riding on the default would close its runtime and lose the
  // unsaved draft with it. Only a change of definition clears the answer,
  // since then what is on hand is about something else.
  const current = list.definitionId === definitionId ? list : NOTHING_LOADED;
  const preferencesSettled = preferences.definitionId === definitionId;
  const currentPreferences = preferencesSettled ? preferences : NOTHING_LOADED;

  const items = useMemo(() => {
    // The narrowing happens first, so both the order and the default below
    // are resolved among the views the caller can actually open.
    const all = current.value ?? [];
    const scoped = kind ? all.filter(summary => summary.kind === kind) : all;
    return currentPreferences.value
      ? orderSummaries(scoped, currentPreferences.value)
      : scoped;
  }, [current.value, currentPreferences.value, kind]);

  return {
    items,
    preferences: currentPreferences.value,
    permissions,
    // No default until preferences have settled: answering from server order
    // in the meantime opens one view and then swaps it for another.
    defaultInstanceId: !preferencesSettled
      ? null
      : currentPreferences.value
        ? engine.resolveDefault(items, currentPreferences.value)
        : (items[0]?.id ?? null),
    loading: list.key !== key,
    error: current.error,
    preferencesError: currentPreferences.error,
    reload,
  };
}
