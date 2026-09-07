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

import type { FilterOperator } from '@ahoo-wang/fetcher-wow';
import {
  compileFilterDraft,
  createFilterDraft,
  isSimpleFilter,
} from './filterCore.js';
import type { FilterNodeLocation } from './filterTree.js';
import type { FilterOption } from './filterTypes.js';
import type { FilterPanelState } from './useFilterPanelState.js';
import { FilterValueEditor } from './FilterValueEditor.js';
import { EditorBoundary, EditorSession } from './FilterEditorSession.js';
import { message, without } from './filterPanelUtils.js';

export function FilterLeafEditor({
  location,
  operators,
  errors,
  errorId,
  panel,
}: {
  location: FilterNodeLocation;
  operators: readonly FilterOption<FilterOperator>[];
  errors: readonly string[];
  errorId?: string;
  panel: FilterPanelState;
}) {
  const {
    props,
    disabled,
    builtIn,
    resolutions,
    epoch,
    editorEpochs,
    panelId,
    mode,
    update,
    setEditorOutputErrors,
    setBuiltIn,
    setEditorValidity,
    currentEditorNode,
    changeOperator,
    clearNode,
  } = panel;
  const { node, fields: scopeFields } = location;
  const field = scopeFields.find(field => field.field === node.field);
  const builtin = (
    <FilterValueEditor
      node={node}
      field={field}
      fields={scopeFields}
      disabled={disabled}
      onChange={next =>
        update(node.id, { ...next, id: node.id, field: node.field })
      }
    />
  );
  if (builtIn.has(node.id)) return builtin;
  const resolved = resolutions.get(node.id);
  if (resolved?.error) return null;
  if (!resolved?.registration) return builtin;
  const { expression, options: editorOptions } = resolved;
  const Custom = resolved.registration.component;
  let reportedOperator = node.op;
  return (
    <EditorBoundary
      key={`${epoch}:${node.id}:${editorEpochs[node.id] ?? 0}`}
      onError={error =>
        setEditorOutputErrors(previous => ({ ...previous, [node.id]: error }))
      }
      onFallback={() => {
        setBuiltIn(previous => new Set([...previous, node.id]));
        setEditorValidity(previous => without(previous, node.id));
        setEditorOutputErrors(previous => without(previous, node.id));
      }}
    >
      <EditorSession
        editor={Custom}
        id={`${panelId}-${node.id}`}
        operators={operators}
        errors={errors}
        errorId={errors.length ? errorId : undefined}
        node={expression ? structuredClone(expression) : undefined}
        operator={node.op}
        field={field ? Object.freeze({ ...field }) : undefined}
        fields={scopeFields}
        mode={mode}
        context={props.context}
        options={editorOptions}
        disabled={disabled}
        onOperatorChange={op => {
          const current = currentEditorNode({
            ...node,
            op: reportedOperator,
          });
          if (!current) return;
          if (
            !operators.some(option => option.value === op && !option.disabled)
          ) {
            setEditorOutputErrors(previous => ({
              ...previous,
              [node.id]: '操作不在当前筛选器的可用范围内。',
            }));
            return;
          }
          if (current.op === op) return;
          changeOperator(current, op);
          reportedOperator = op;
        }}
        onClear={() => {
          const current = currentEditorNode({
            ...node,
            op: reportedOperator,
          });
          if (current) clearNode(current);
        }}
        onRemove={() => {
          if (currentEditorNode({ ...node, op: reportedOperator }))
            update(node.id);
        }}
        onValidityChange={(valid, error) => {
          if (!currentEditorNode({ ...node, op: reportedOperator })) return;
          setEditorValidity(previous =>
            valid
              ? without(previous, node.id)
              : previous[node.id] === (error ?? '输入尚未完成或格式无效。')
                ? previous
                : {
                    ...previous,
                    [node.id]: error ?? '输入尚未完成或格式无效。',
                  },
          );
        }}
        onChange={next => {
          const current = currentEditorNode({
            ...node,
            op: reportedOperator,
          });
          if (!current) return;
          if (next === undefined) {
            clearNode(current);
            return;
          }
          try {
            if (
              next &&
              ('field' in next ? next.field : undefined) !== node.field
            )
              throw new Error('自定义筛选器不能改变绑定字段。');
            const nextDraft = { ...createFilterDraft(next), id: node.id };
            if (next && (nextDraft.operands || nextDraft.predicate))
              throw new Error('非容器筛选器不能改变为条件容器。');
            const validation = compileFilterDraft(
              nextDraft,
              scopeFields,
              props.allowedOperators,
            );
            if (validation.errors.length)
              throw new Error(
                validation.errors.map(error => error.message).join('；'),
              );
            if (mode === 'simple' && !isSimpleFilter(nextDraft))
              throw new Error('扩展输出不支持简单模式。');
            update(node.id, nextDraft);
            reportedOperator = nextDraft.op;
          } catch (error) {
            setEditorOutputErrors(previous =>
              previous[node.id] === message(error)
                ? previous
                : { ...previous, [node.id]: message(error) },
            );
          }
        }}
      />
    </EditorBoundary>
  );
}
