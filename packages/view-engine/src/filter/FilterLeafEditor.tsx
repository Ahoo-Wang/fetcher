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
import { compileFilterDraft, newFilterDraft } from './filterCore.js';
import { copy } from '../lib/snapshot.js';
import {
  filterComponentProps,
  filterComponentReference,
  restoreFilterConfiguration,
} from './filterConfiguration.js';
import type { FilterNodeLocation } from './filterTree.js';
import type { FilterOption } from './filterTypes.js';
import type { FilterPanelState } from './useFilterPanelState.js';
import { FilterValueEditor } from './FilterValueEditor.js';
import { EditorBoundary, EditorSession } from './FilterEditorSession.js';
import { message, ownValue, without } from './filterPanelUtils.js';

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
      timeZone={props.timeZone}
      showTime={
        filterComponentReference(node, field, props.editors).options
          ?.showTime === true
      }
      errors={errors}
      errorId={errorId}
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
  const { options: editorOptions } = resolved;
  const Custom = resolved.registration.component;
  let reportedOperator = node.op;
  return (
    <EditorBoundary
      key={`${epoch}:${node.id}:${ownValue(editorEpochs, node.id) ?? 0}`}
      editor={Custom}
      operator={node.op}
      mode={mode}
      onError={error =>
        setEditorOutputErrors(previous => ({ ...previous, [node.id]: error }))
      }
      onRecover={error =>
        setEditorOutputErrors(previous =>
          ownValue(previous, node.id) === error
            ? without(previous, node.id)
            : previous,
        )
      }
      onFallback={() => {
        const properties = filterComponentProps(node);
        const candidate = {
          ...properties,
          id: node.id,
          op: node.op,
          field: node.field,
          editor: { name: 'builtin' },
        };
        const valid =
          compileFilterDraft(
            candidate,
            scopeFields,
            props.allowedOperators,
            undefined,
            undefined,
            props.timeZone,
          ).errors.length === 0;
        update(
          node.id,
          valid
            ? candidate
            : {
                ...newFilterDraft(node.op, node.field),
                id: node.id,
                editor: { name: 'builtin' },
              },
        );
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
        props={copy(resolved.props ?? {})}
        operator={node.op}
        field={field ? copy(field) : undefined}
        fields={copy(scopeFields)}
        timeZone={props.timeZone}
        mode={mode}
        context={props.context}
        optionSources={props.extensions?.optionSources}
        options={editorOptions ? copy(editorOptions) : undefined}
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
        onClear={
          resolved.registration.clear
            ? () => {
                const current = currentEditorNode({
                  ...node,
                  op: reportedOperator,
                });
                if (current) clearNode(current);
              }
            : undefined
        }
        onRemove={() => {
          if (currentEditorNode({ ...node, op: reportedOperator }))
            update(node.id);
        }}
        onValidityChange={(valid, error) => {
          if (!currentEditorNode({ ...node, op: reportedOperator })) return;
          setEditorValidity(previous =>
            valid
              ? without(previous, node.id)
              : ownValue(previous, node.id) ===
                  (error ?? '输入尚未完成或格式无效。')
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
          try {
            const nextDraft = restoreFilterConfiguration({
              mode,
              root: {
                id: current.id,
                operator: current.op,
                field: current.field,
                component: resolved.reference!,
                props: next,
              },
            });
            update(node.id, nextDraft, true);
          } catch (error) {
            setEditorOutputErrors(previous =>
              ownValue(previous, node.id) === message(error)
                ? previous
                : { ...previous, [node.id]: message(error) },
            );
          }
        }}
      />
    </EditorBoundary>
  );
}
