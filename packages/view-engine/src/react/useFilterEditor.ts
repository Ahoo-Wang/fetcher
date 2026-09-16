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

import { useCallback, useMemo } from 'react';
import type {
  FieldDefinition,
  FilterLeaf,
  FilterMode,
  FilterNode,
  FilterOperatorName,
  FilterTree,
  Issue,
} from '../model/index.js';
import {
  clearFilter,
  countLeaves,
  describeFilter,
  insertAt,
  isSimpleTree,
  nodeAt,
  operatorsOf,
  removeAt,
  updateAt,
  type EditorDescriptor,
  type FilterPath,
  type FilterSummaryItem,
} from '../filter/index.js';
import type { ViewRuntime } from '../runtime/index.js';
import { useViewRuntime } from './useViewEngine.js';

export interface FilterEditorController {
  /** The tree being edited, which is the draft's, never the applied one. */
  tree: FilterTree;
  mode: FilterMode;
  /** Fields the definition offers, in declaration order. */
  fields: FieldDefinition[];
  /** Issues about the filter only; the rest of the config is not this editor's. */
  issues: Issue[];
  /** Conditions currently in force, for a summary bar. */
  applied: FilterSummaryItem[];
  count: number;
  /** False when the tree needs the advanced editor to be shown faithfully. */
  simple: boolean;
  setMode(mode: FilterMode): void;
  addLeaf(field: string, parent?: FilterPath): void;
  updateLeaf(path: FilterPath, patch: Partial<FilterLeaf>): void;
  addGroup(op: 'and' | 'or', parent?: FilterPath): void;
  remove(path: FilterPath): void;
  clear(): void;
  /** Applies the draft, which is what runs the query. */
  submit(): void;
  /** Auto-refresh pauses between these two, so typing is never interrupted. */
  focus(): void;
  blur(): void;
  operatorsFor(field: string): FilterOperatorName[];
  editorFor(path: FilterPath): EditorDescriptor | null;
}

const ROOT: FilterPath = [];
/** Stable identity for "no runtime yet"; every edit produces a new tree. */
const EMPTY_TREE: FilterTree = { op: 'and', children: [] };

/**
 * Editing of the draft filter tree, addressed by path.
 *
 * It holds no state of its own: every action is an `edit` on the runtime, so
 * two editors over one view agree, and undo is just not submitting.
 */
export function useFilterEditor(
  runtime: ViewRuntime | null,
): FilterEditorController {
  const state = useViewRuntime(runtime);
  const fields = useMemo(() => runtime?.definition.fields ?? [], [runtime]);
  const kinds = runtime?.kinds;
  const tree = state?.draft.filter ?? EMPTY_TREE;

  const byName = useMemo(
    () => new Map(fields.map(field => [field.name, field])),
    [fields],
  );

  const write = useCallback(
    (next: FilterTree) => runtime?.edit({ filter: next }),
    [runtime],
  );

  const addLeaf = useCallback(
    (field: string, parent: FilterPath = ROOT) => {
      const definition = byName.get(field);
      const kind = definition && kinds?.get(definition.kind);
      if (!definition || !kind) return;
      const operator = kind.defaultOperator;
      const leaf: FilterNode = {
        field,
        operator,
        // The kind decides what an untouched value looks like for its operator.
        value: kind.emptyValue(operator, definition) as FilterLeaf['value'],
      };
      write(insertAt(tree, parent, leaf));
    },
    [byName, kinds, tree, write],
  );

  const updateLeaf = useCallback(
    (path: FilterPath, patch: Partial<FilterLeaf>) => {
      write(
        updateAt(tree, path, node =>
          'children' in node ? node : { ...node, ...patch },
        ),
      );
    },
    [tree, write],
  );

  const addGroup = useCallback(
    (op: 'and' | 'or', parent: FilterPath = ROOT) => {
      write(insertAt(tree, parent, { op, children: [] }));
    },
    [tree, write],
  );

  return {
    tree,
    mode: state?.draft.filterMode ?? 'simple',
    fields,
    issues: (state?.issues ?? []).filter(found => found.path[0] === 'filter'),
    applied: useMemo(
      () =>
        state && kinds
          ? describeFilter(fields, state.applied.filter, kinds)
          : [],
      [state, fields, kinds],
    ),
    count: countLeaves(tree),
    simple: isSimpleTree(tree),
    setMode: useCallback(
      (mode: FilterMode) => runtime?.edit({ filterMode: mode }),
      [runtime],
    ),
    addLeaf,
    updateLeaf,
    addGroup,
    remove: useCallback(
      (path: FilterPath) => write(removeAt(tree, path)),
      [tree, write],
    ),
    clear: useCallback(() => write(clearFilter()), [write]),
    submit: useCallback(() => runtime?.apply(), [runtime]),
    focus: useCallback(() => runtime?.setEditing(true), [runtime]),
    blur: useCallback(() => runtime?.setEditing(false), [runtime]),
    operatorsFor: useCallback(
      (field: string) => {
        const definition = byName.get(field);
        const kind = definition && kinds?.get(definition.kind);
        return definition && kind ? operatorsOf(definition, kind) : [];
      },
      [byName, kinds],
    ),
    editorFor: useCallback(
      (path: FilterPath) => {
        const node = nodeAt(tree, path);
        if (!node || 'children' in node) return null;
        const definition = byName.get(node.field);
        const kind = definition && kinds?.get(definition.kind);
        return kind && definition
          ? kind.editor(node.operator, definition, node.value)
          : null;
      },
      [byName, kinds, tree],
    ),
  };
}
