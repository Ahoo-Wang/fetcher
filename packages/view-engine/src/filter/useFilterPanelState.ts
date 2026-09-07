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

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FilterOperator, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import { cloneSnapshot, type DeepReadonly } from '../lib/types.js';
import {
  compileFilterDraft,
  createFilterDraft,
  FILTER_OPERATORS,
  isSimpleFilter,
  newFilterDraft,
} from './filterCore.js';
import type { FilterDraftNode, FilterMode } from './filterModel.js';
import type {
  FilterPanelProps,
  FilterPanelToolbarProps,
} from './filterReactTypes.js';
import {
  locateFilterNodes,
  replaceFilterNode,
  sameFilterState,
} from './filterTree.js';
import {
  appendNode,
  clearValue,
  transitionFilterOperator,
} from './filterDraftTransitions.js';
import { message, without } from './filterPanelUtils.js';
import { useFilterPanelEditors } from './useFilterPanelEditors.js';
import { useFilterPanelQuery } from './useFilterPanelQuery.js';

function readValue(value: DeepReadonly<FilterExpression>) {
  try {
    return { draft: createFilterDraft(value), error: undefined };
  } catch (error) {
    return {
      draft: newFilterDraft(FilterOperator.MATCH_ALL),
      error: message(error),
    };
  }
}
export function useFilterPanelState(props: FilterPanelProps) {
  const { fields, value, onDraftChange, disabled = false } = props;
  const [initial] = useState(() => {
    const loaded = readValue(value);
    const restored =
      props.draft && !loaded.error
        ? compileFilterDraft(props.draft, fields, props.allowedOperators)
        : undefined;
    return {
      ...loaded,
      baseline:
        restored?.expression && sameFilterState(restored.expression, value)
          ? props.draft!
          : loaded.draft,
    };
  });
  const [localDraft, setLocalDraft] = useState(initial.draft);
  const controlledDraft = useMemo(
    () =>
      props.draft ? cloneSnapshot<FilterDraftNode>(props.draft) : undefined,
    [props.draft],
  );
  const draft = controlledDraft ?? localDraft;
  const draftRef = useRef(draft);
  // Child layout effects may publish before this hook commits; callbacks must see this render's draft.
  // eslint-disable-next-line react-hooks/refs
  draftRef.current = draft;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [localBaseline, setBaseline] = useState(initial.baseline);
  const baseline = props.appliedDraft ?? localBaseline;
  const [loadError, setLoadError] = useState(initial.error);
  const [localMode, setLocalMode] = useState<FilterMode>(() =>
    isSimpleFilter(draft) ? 'simple' : 'advanced',
  );
  const observedValue = useRef(value);
  const panelId = useId();
  const simple = isSimpleFilter(draft);
  const requestedMode = props.mode ?? localMode;
  const mode =
    requestedMode === 'simple' && !simple ? 'advanced' : requestedMode;
  const {
    locations,
    compiled,
    resolutions,
    issues,
    valid,
    pending,
    builtIn,
    epoch,
    editorEpochs,
    setEditorValidity,
    setEditorOutputErrors,
    setBuiltIn,
    setEpoch,
    setEditorEpochs,
  } = useFilterPanelEditors(props, draft, baseline, mode, loadError);
  const {
    apply,
    applyError,
    setApplyError,
    submittedRef,
    setSubmission,
    submitting,
  } = useFilterPanelQuery(props, draft, compiled, valid, setBaseline);
  useEffect(() => {
    if (sameFilterState(value, observedValue.current)) return;
    observedValue.current = value;
    if (submittedRef.current && sameFilterState(value, submittedRef.current)) {
      submittedRef.current = undefined;
      setSubmission(undefined);
      return;
    }
    submittedRef.current = undefined;
    setSubmission(undefined);
    if (!loadError && props.draft && props.appliedDraft) {
      const applied = compileFilterDraft(
        props.appliedDraft,
        fields,
        props.allowedOperators,
      );
      if (applied.expression && sameFilterState(applied.expression, value)) {
        // The owner supplied the editing baseline for this value; keep its draft and editor IDs.
        return;
      }
    }
    const next = readValue(value);
    draftRef.current = next.draft;
    // External applied values replace the editing session; acknowledgements above preserve in-progress edits.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The value-change guard resets this local session once per external replacement.
    setLocalDraft(next.draft);
    onDraftChange?.(next.draft);
    setBaseline(next.draft);
    setLoadError(next.error);
    setEditorValidity({});
    setEditorOutputErrors({});
    setBuiltIn(new Set());
    setApplyError(undefined);
    setEpoch(count => count + 1);
  }, [
    value,
    props.draft,
    props.appliedDraft,
    props.allowedOperators,
    fields,
    loadError,
    onDraftChange,
    submittedRef,
    setSubmission,
    setApplyError,
    setEditorValidity,
    setEditorOutputErrors,
    setBuiltIn,
    setEpoch,
  ]);

  function change(next: FilterDraftNode) {
    if (!mounted.current || sameFilterState(draftRef.current, next)) return;
    draftRef.current = next;
    setLocalDraft(next);
    onDraftChange?.(next);
    setApplyError(undefined);
    const ids = new Set(
      locateFilterNodes(next, fields).map(({ node }) => node.id),
    );
    setEditorValidity(previous =>
      Object.fromEntries(
        Object.entries(previous).filter(([id]) => ids.has(id)),
      ),
    );
    setEditorOutputErrors(previous =>
      Object.fromEntries(
        Object.entries(previous).filter(([id]) => ids.has(id)),
      ),
    );
  }
  function update(id: string, next?: FilterDraftNode) {
    change(
      replaceFilterNode(draftRef.current, id, next) ??
        newFilterDraft(FilterOperator.MATCH_ALL),
    );
    setEditorValidity(previous => without(previous, id));
    setEditorOutputErrors(previous => without(previous, id));
  }
  function clearNode(node: FilterDraftNode) {
    update(
      node.id,
      FILTER_OPERATORS[node.op].input === 'none' ? undefined : clearValue(node),
    );
    setEditorEpochs(previous => ({
      ...previous,
      [node.id]: (previous[node.id] ?? 0) + 1,
    }));
  }
  function changeOperator(node: FilterDraftNode, op: FilterOperator) {
    const next = transitionFilterOperator(node, op);
    const before = FILTER_OPERATORS[node.op]?.input,
      after = FILTER_OPERATORS[op]?.input;
    change(replaceFilterNode(draftRef.current, node.id, next)!);
    if (
      before !== after &&
      after !== 'none' &&
      [
        'value',
        'values',
        'lowerBound',
        'upperBound',
        'time',
        'days',
        'query',
      ].some(key => node[key as keyof FilterDraftNode] !== undefined)
    ) {
      setEditorOutputErrors(previous =>
        previous[node.id] !== undefined
          ? previous
          : {
              ...previous,
              [node.id]: '操作已改变，请设置新值，或删除此筛选器。',
            },
      );
    }
  }
  function append(target: FilterDraftNode, child: FilterDraftNode) {
    const current = locateFilterNodes(draftRef.current, fields).find(
      item => item.node.id === target.id,
    )?.node;
    if (!current) return;
    const next = appendNode(current, child);
    if (mode === 'advanced' || isSimpleFilter(next)) update(current.id, next);
  }
  function currentEditorNode(node: FilterDraftNode) {
    if (!mounted.current) return undefined;
    const current = locateFilterNodes(draftRef.current, fields).find(
      location => location.node.id === node.id,
    )?.node;
    return current?.op === node.op && current.field === node.field
      ? current
      : undefined;
  }
  const toolbar: FilterPanelToolbarProps = {
    panelId,
    mode,
    pending,
    disabled,
    options: [
      {
        value: 'simple',
        label: '简单',
        disabled: !simple || (mode === 'advanced' && issues.length > 0),
      },
      { value: 'advanced', label: '高级' },
    ],
    onModeChange(next) {
      if (disabled || (next === 'simple' && (!simple || issues.length > 0)))
        return;
      setLocalMode(next);
      props.onModeChange?.(next);
    },
  };
  function removeField(targetId: string, field: string) {
    const current = locateFilterNodes(draftRef.current, fields).find(
      item => item.node.id === targetId,
    )?.node;
    if (!current) return;
    if (current.operands) {
      const operands = current.operands.filter(node => node.field !== field);
      if (operands.length === current.operands.length) return;
      update(
        current.id,
        !operands.length &&
          current.id === draftRef.current.id &&
          current.op === FilterOperator.AND
          ? newFilterDraft(FilterOperator.MATCH_ALL)
          : { ...current, operands },
      );
    } else if (current.field === field) update(current.id);
  }
  function undo() {
    change(cloneSnapshot<FilterDraftNode>(baseline));
    setEditorValidity({});
    setEditorOutputErrors({});
    setBuiltIn(new Set());
    setEpoch(count => count + 1);
  }
  function clear() {
    change(newFilterDraft(FilterOperator.MATCH_ALL));
    setLoadError(undefined);
    setEditorValidity({});
    setEditorOutputErrors({});
    setEpoch(count => count + 1);
  }
  return {
    props,
    disabled,
    draft,
    mode,
    panelId,
    locations,
    simple,
    resolutions,
    issues,
    pending,
    loadError,
    applyError,
    epoch,
    editorEpochs,
    builtIn,
    toolbar,
    submitting,
    applyDisabled:
      disabled ||
      !!loadError ||
      issues.length > 0 ||
      !compiled.expression ||
      submitting,
    update,
    clearNode,
    changeOperator,
    append,
    removeField,
    currentEditorNode,
    setEditorValidity,
    setEditorOutputErrors,
    setBuiltIn,
    apply,
    undo,
    clear,
  };
}
export type FilterPanelState = ReturnType<typeof useFilterPanelState>;
