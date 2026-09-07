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

import {
  Component,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FilterOperator, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import { cloneSnapshot, type DeepReadonly } from '../lib/types.js';
import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import {
  compileFilterDraft,
  createFilterDraft,
  FILTER_OPERATORS,
  getFieldOperators,
  isSimpleFilter,
  newFilterDraft,
} from './filterCore.js';
import type {
  FilterDraftNode,
  FilterEditorReference,
  FilterFieldDefinition,
  FilterMode,
} from './filterModel.js';
import type {
  FilterRegistration,
  FilterComponentProps,
  FilterPanelProps,
  FilterPanelToolbarProps,
} from './filterReactTypes.js';
import type { FilterOption } from './filterTypes.js';
import {
  locateFilterNodes,
  replaceFilterNode,
  sameFilterState,
  isFilterDraftPending,
  type FilterNodeLocation,
} from './filterTree.js';
import { FieldFilter } from './FieldFilter.js';
import { FilterSelect } from './FilterSelect.js';
import { FilterValueEditor } from './FilterValueEditor.js';
import { Button } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu.js';
import { FilterFieldPicker, type FieldChoice } from './FilterFieldPicker.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from '../components/ui/input-group.js';
import { cn } from '../lib/utils.js';

const logicalOperators = [
  FilterOperator.AND,
  FilterOperator.OR,
  FilterOperator.NOR,
] as const;
const groupLabels = {
  AND: '满足全部条件',
  OR: '满足任一条件',
  NOR: '全部条件均不满足',
};
const filterLayout =
  'fve:grid fve:grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))] fve:items-start fve:gap-2';
function appendNode(
  target: FilterDraftNode,
  child: FilterDraftNode,
): FilterDraftNode {
  if (target.operands)
    return { ...target, operands: [...target.operands, child] };
  if (target.op === FilterOperator.MATCH_ALL) return child;
  return { ...newFilterDraft(FilterOperator.AND), operands: [target, child] };
}
function message(error: unknown) {
  return (
    (error instanceof Error ? error.message : String(error)) ||
    '筛选器处理失败。'
  );
}
function without(values: Record<string, string>, id: string) {
  if (!(id in values)) return values;
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== id),
  );
}
function clearValue(node: FilterDraftNode): FilterDraftNode {
  const next = { ...node };
  for (const key of [
    'value',
    'values',
    'lowerBound',
    'upperBound',
    'query',
    'state',
    'time',
    'days',
  ] as const)
    delete next[key];
  return next;
}
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
class EditorSession extends Component<
  FilterComponentProps & { editor: FilterRegistration['component'] }
> {
  private active = true;
  state = {
    editor: this.props.editor,
    operator: this.props.operator,
    mode: this.props.mode,
    generation: {},
  };
  static getDerivedStateFromProps(
    props: EditorSession['props'],
    state: EditorSession['state'],
  ) {
    if (
      props.editor === state.editor &&
      props.operator === state.operator &&
      props.mode === state.mode
    )
      return null;
    return {
      editor: props.editor,
      operator: props.operator,
      mode: props.mode,
      generation: {},
    };
  }
  componentDidMount() {
    this.active = true;
  }
  componentWillUnmount() {
    this.active = false;
  }
  render() {
    const { editor: Editor, ...props } = this.props;
    const generation = this.state.generation;
    const isActive = () => this.active && this.state.generation === generation;
    return (
      <Editor
        {...props}
        onChange={node => {
          if (isActive() && !this.props.disabled) props.onChange(node);
        }}
        onOperatorChange={operator => {
          if (isActive() && !this.props.disabled)
            props.onOperatorChange(operator);
        }}
        onClear={() => {
          if (isActive() && !this.props.disabled) props.onClear();
        }}
        onRemove={() => {
          if (isActive() && !this.props.disabled) props.onRemove();
        }}
        onValidityChange={(valid, message) => {
          if (isActive()) props.onValidityChange(valid, message);
        }}
      />
    );
  }
}
class EditorBoundary extends Component<
  { children: ReactNode; onError(message: string): void; onFallback(): void },
  { error?: string }
> {
  state: { error?: string } = {};
  static getDerivedStateFromError(error: unknown) {
    return { error: message(error) };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(message(error));
  }
  render() {
    return this.state.error ? (
      <Button variant="outline" onClick={this.props.onFallback}>
        使用内置编辑器
      </Button>
    ) : (
      this.props.children
    );
  }
}

export function FilterPanel(props: FilterPanelProps) {
  const {
    fields,
    value,
    onApply,
    onPendingChange,
    onDraftChange,
    onValidityChange,
    disabled = false,
    querying = false,
  } = props;
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
  const [applyError, setApplyError] = useState<string>();
  const [editorValidity, setEditorValidity] = useState<Record<string, string>>(
    {},
  );
  const [editorOutputErrors, setEditorOutputErrors] = useState<
    Record<string, string>
  >({});
  const [builtIn, setBuiltIn] = useState<ReadonlySet<string>>(new Set());
  const [epoch, setEpoch] = useState(0);
  const [editorEpochs, setEditorEpochs] = useState<Record<string, number>>({});
  const [localMode, setLocalMode] = useState<FilterMode>(() =>
    isSimpleFilter(draft) ? 'simple' : 'advanced',
  );
  const observedValue = useRef(value);
  const submittedValue = useRef<FilterExpression | undefined>(undefined);
  const panelId = useId();
  const locations = locateFilterNodes(draft, fields);
  const simple = isSimpleFilter(draft);
  const requestedMode = props.mode ?? localMode;
  const mode =
    requestedMode === 'simple' && !simple ? 'advanced' : requestedMode;
  const compiled = compileFilterDraft(draft, fields, props.allowedOperators);
  const resolutions = new Map(
    locations
      .filter(
        ({ node }) =>
          !['logical', 'element'].includes(FILTER_OPERATORS[node.op]?.category),
      )
      .map(location => [location.node.id, resolveEditor(location)]),
  );
  const issues = locations.flatMap(({ node }) =>
    [
      ...compiled.errors
        .filter(error => error.id === node.id)
        .map(error => error.message),
      editorValidity[node.id],
      editorOutputErrors[node.id],
      resolutions.get(node.id)?.error,
    ]
      .filter((item): item is string => item !== undefined)
      .map(text => ({
        id: node.id,
        message: text || '输入尚未完成或格式无效。',
      })),
  );
  const valid = !loadError && issues.length === 0;
  const pending = isFilterDraftPending(draft, baseline, valid);
  const previousValidity = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (previousValidity.current !== valid) {
      previousValidity.current = valid;
      onValidityChange?.(valid);
    }
  }, [valid, onValidityChange]);
  const previousPending = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (previousPending.current !== pending) {
      previousPending.current = pending;
      onPendingChange?.(pending);
    }
  }, [pending, onPendingChange]);

  useEffect(() => {
    if (sameFilterState(value, observedValue.current)) return;
    observedValue.current = value;
    if (
      submittedValue.current &&
      sameFilterState(value, submittedValue.current)
    ) {
      submittedValue.current = undefined;
      return;
    }
    submittedValue.current = undefined;
    const next = readValue(value);
    draftRef.current = next.draft;
    setLocalDraft(next.draft);
    onDraftChange?.(next.draft);
    setBaseline(next.draft);
    setLoadError(next.error);
    setEditorValidity({});
    setEditorOutputErrors({});
    setBuiltIn(new Set());
    setApplyError(undefined);
    setEpoch(count => count + 1);
  }, [value, onDraftChange]);

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
    const next = { ...newFilterDraft(op, node.field), id: node.id };
    const before = FILTER_OPERATORS[node.op]?.input,
      after = FILTER_OPERATORS[op]?.input;
    if (before === after) {
      const keys =
        after === 'value'
          ? ['value']
          : after === 'values'
            ? ['values']
            : after === 'between'
              ? ['lowerBound', 'upperBound']
              : after === 'time'
                ? ['time']
                : after === 'days'
                  ? ['days']
                  : [];
      for (const key of keys)
        if (key in node)
          Object.assign(next, { [key]: node[key as keyof FilterDraftNode] });
    }
    if (
      FILTER_OPERATORS[node.op]?.relativeTime &&
      FILTER_OPERATORS[op]?.relativeTime
    ) {
      for (const key of ['zoneId', 'datePattern', 'timeUnit'] as const)
        if (key in node) Object.assign(next, { [key]: node[key] });
    }
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
  function addControl(
    target: FilterDraftNode,
    scopeFields: readonly FilterFieldDefinition[],
    scope: string,
    label: string,
  ) {
    const bindings = target.operands ?? [target];
    const options: FieldChoice[] = scopeFields.flatMap(field => {
      const operators = getFieldOperators(field).filter(
        op => !props.allowedOperators || props.allowedOperators.includes(op),
      );
      if (
        !operators.length ||
        (mode === 'simple' &&
          field.type === 'array' &&
          operators.every(op => FILTER_OPERATORS[op].category === 'element'))
      )
        return [];
      return [
        {
          value: `field:${field.field}`,
          label: field.label,
          group: field.group ?? '',
          count: bindings.filter(node => node.field === field.field).length,
          repeatable: mode === 'advanced',
        },
      ];
    });
    if (mode === 'advanced') {
      for (const op of Object.values(FilterOperator))
        if (
          FILTER_OPERATORS[op].category === 'root' &&
          (scope === 'root' ||
            op === FilterOperator.MATCH_ALL ||
            op === FilterOperator.MATCH_NONE) &&
          (!props.allowedOperators || props.allowedOperators.includes(op))
        )
          options.push({
            value: `op:${op}`,
            label: FILTER_OPERATORS[op].label,
            group: '其他条件',
          });
    }
    return (
      <DropdownMenu>
        <FilterFieldPicker
          label={label}
          options={options}
          disabled={disabled || options.length === 0}
          onAdd={choice => {
            const option = options.find(option => option.value === choice);
            if (disabled || !choice || !option) return;
            if (choice.startsWith('op:'))
              append(target, newFilterDraft(choice.slice(3) as FilterOperator));
            else {
              const field = scopeFields.find(
                field => field.field === choice.slice(6),
              )!;
              const op = getFieldOperators(field).find(
                op =>
                  (!props.allowedOperators ||
                    props.allowedOperators.includes(op)) &&
                  (mode === 'advanced' ||
                    FILTER_OPERATORS[op].category !== 'element'),
              )!;
              if (op) append(target, newFilterDraft(op, field.field));
            }
          }}
          onRemove={choice => {
            if (disabled || !choice.startsWith('field:')) return;
            const field = choice.slice(6);
            const current = locateFilterNodes(draftRef.current, fields).find(
              item => item.node.id === target.id,
            )?.node;
            if (!current) return;
            if (current.operands) {
              const operands = current.operands.filter(
                node => node.field !== field,
              );
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
          }}
        >
          {mode === 'advanced' && (
            <DropdownMenuTrigger
              aria-label={
                label === '添加筛选' ? '添加逻辑分组' : `${label}：添加逻辑分组`
              }
              title="添加逻辑分组"
              disabled={
                disabled ||
                logicalOperators.every(
                  op =>
                    props.allowedOperators &&
                    !props.allowedOperators.includes(op),
                )
              }
              render={<Button type="button" variant="outline" size="icon-sm" />}
            >
              <ChevronDownIcon aria-hidden="true" />
            </DropdownMenuTrigger>
          )}
        </FilterFieldPicker>
        {mode === 'advanced' && (
          <DropdownMenuContent align="start" className="fve:min-w-56">
            {logicalOperators.map(op => (
              <DropdownMenuItem
                key={op}
                disabled={
                  disabled ||
                  (!!props.allowedOperators &&
                    !props.allowedOperators.includes(op))
                }
                onClick={() => {
                  if (
                    !disabled &&
                    (!props.allowedOperators ||
                      props.allowedOperators.includes(op))
                  )
                    append(target, newFilterDraft(op));
                }}
              >
                <span className="fve:w-8 fve:font-medium">{op}</span>
                <span className="fve:text-muted-foreground">
                  {groupLabels[op]}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    );
  }
  function resolveEditor(location: FilterNodeLocation): {
    expression?: FilterExpression;
    registration?: FilterRegistration;
    options?: FilterEditorReference['options'];
    error?: string;
  } {
    if (builtIn.has(location.node.id)) return {};
    const { node, fields: scopeFields } = location;
    const field = scopeFields.find(field => field.field === node.field);
    const result = compileFilterDraft(
      node,
      scopeFields,
      props.allowedOperators,
    );
    const expression =
      result.expression?.op === FilterOperator.MATCH_ALL &&
      node.op !== FilterOperator.MATCH_ALL
        ? undefined
        : result.expression;
    for (const reference of [field?.editor, props.editors?.[node.op]]) {
      if (!reference) continue;
      const registration = props.extensions?.filters?.[reference.name];
      if (!registration) return { error: `未注册筛选器：${reference.name}` };
      if (!registration.modes.includes(mode)) continue;
      try {
        if (registration.supports && !registration.supports(expression))
          continue;
      } catch (error) {
        return { error: message(error) };
      }
      return { expression, registration, options: reference.options };
    }
    return { expression };
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
  function leafEditor(
    location: FilterNodeLocation,
    operators: readonly FilterOption<FilterOperator>[],
    errors: readonly string[],
    errorId?: string,
  ) {
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
  function renderNode(node: FilterDraftNode, showAddControl = true): ReactNode {
    const location = locations.find(location => location.node.id === node.id)!;
    const descriptor = FILTER_OPERATORS[node.op];
    const field = location.fields.find(field => field.field === node.field);
    const label =
      field?.label ?? node.field ?? descriptor?.label ?? String(node.op);
    const nodeIssues = issues.filter(issue => issue.id === node.id);
    const errorId = `${panelId}-${node.id}-error`;
    if (node.operands || node.op === FilterOperator.ELEMENT_MATCH) {
      const element = node.op === FilterOperator.ELEMENT_MATCH;
      return (
        <div
          key={`${epoch}:${node.id}`}
          data-filter-id={node.id}
          className="fve:col-span-full fve:min-w-0 fve:w-full fve:rounded-lg fve:border fve:border-border fve:p-3"
          role="group"
          aria-label={
            element
              ? `${label}元素条件`
              : `条件组合 ${locations.indexOf(location) + 1}`
          }
          aria-describedby={nodeIssues.length ? errorId : undefined}
        >
          <div className="fve:mb-2 fve:flex fve:flex-wrap fve:items-center fve:gap-2">
            {element ? (
              <strong>{label}：同一元素满足</strong>
            ) : (
              <FilterSelect
                label="组合方式"
                value={node.op}
                options={logicalOperators.map(op => ({
                  value: op,
                  label: groupLabels[op],
                  disabled:
                    !!props.allowedOperators &&
                    !props.allowedOperators.includes(op),
                }))}
                disabled={disabled}
                onValueChange={op => update(node.id, { ...node, op })}
              />
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`删除${label}条件`}
              disabled={disabled}
              onClick={() => update(node.id)}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <div className={filterLayout}>
            {element
              ? node.predicate && renderNode(node.predicate, false)
              : node.operands?.map(child => renderNode(child))}
          </div>
          {element && node.predicate && (
            <div className="fve:mt-2">
              {addControl(
                node.predicate,
                field?.fields ?? [],
                locations.find(item => item.node.id === node.predicate!.id)!
                  .scope,
                `${label}元素内添加筛选`,
              )}
            </div>
          )}
          {!element && showAddControl && (
            <div className="fve:mt-2">
              {addControl(
                node,
                location.fields,
                location.scope,
                `添加到组合 ${locations.indexOf(location) + 1}`,
              )}
            </div>
          )}
          {nodeIssues.length > 0 && (
            <div role="alert" id={errorId}>
              {nodeIssues.map(issue => issue.message).join('；')}
            </div>
          )}
        </div>
      );
    }
    const operators = (
      field
        ? getFieldOperators(field)
        : Object.values(FilterOperator).filter(
            op =>
              FILTER_OPERATORS[op].category === 'root' &&
              (location.scope === 'root' ||
                op === FilterOperator.MATCH_ALL ||
                op === FilterOperator.MATCH_NONE),
          )
    ).filter(
      op =>
        (!props.allowedOperators || props.allowedOperators.includes(op)) &&
        (mode === 'advanced' || FILTER_OPERATORS[op].category === 'field'),
    );
    const options = [...new Set([...operators, node.op])].map(op => ({
      value: op,
      label: FILTER_OPERATORS[op]?.label ?? String(op),
      disabled: !operators.includes(op),
    }));
    const editor = leafEditor(
      location,
      options,
      nodeIssues.map(issue => issue.message),
      errorId,
    );
    const complete =
      !builtIn.has(node.id) &&
      resolutions.get(node.id)?.registration?.render === 'filter';
    return (
      <div
        key={`${epoch}:${node.id}`}
        data-filter-id={node.id}
        data-slot="filter-cell"
        className="fve:min-w-0 fve:max-w-full"
        aria-describedby={nodeIssues.length ? errorId : undefined}
      >
        {complete ? (
          editor
        ) : field || node.field ? (
          <FieldFilter
            field={{ field: node.field!, label }}
            operator={node.op}
            operators={options}
            onOperatorChange={op => changeOperator(node, op)}
            onRemove={() => update(node.id)}
            disabled={disabled}
          >
            {editor}
          </FieldFilter>
        ) : (
          <InputGroup
            aria-label={label}
            className="fve:h-auto fve:min-h-8 fve:w-full fve:max-w-full fve:flex-wrap"
          >
            <FilterSelect
              label="特殊条件类型"
              value={node.op}
              options={options}
              onValueChange={op => changeOperator(node, op)}
              inline
              disabled={disabled}
            />
            {editor}
            <InputGroupAddon align="inline-end" className="fve:ml-auto">
              <InputGroupButton
                aria-label={`删除${label}条件`}
                size="icon-xs"
                disabled={disabled}
                onClick={() => update(node.id)}
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        )}
        {nodeIssues.length > 0 && (
          <div
            role="alert"
            id={errorId}
            className="fve:mt-1 fve:text-sm fve:text-destructive"
          >
            {nodeIssues.map(issue => issue.message).join('；')}
          </div>
        )}
      </div>
    );
  }
  function apply() {
    if (
      disabled ||
      loadError ||
      issues.length ||
      !compiled.expression ||
      (querying &&
        sameFilterState(compiled.expression, submittedValue.current ?? value))
    )
      return;
    const before = submittedValue.current;
    submittedValue.current = compiled.expression;
    try {
      onApply(compiled.expression);
      setBaseline(structuredClone(draft));
      setApplyError(undefined);
    } catch (error) {
      submittedValue.current = before;
      setApplyError(message(error));
    }
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
  return (
    <>
      {props.renderToolbar?.(toolbar)}
      <section
        id={panelId}
        hidden={props.collapsed}
        className={cn(
          'fve-root fve:flex fve:min-w-0 fve:flex-col fve:gap-3',
          props.className,
        )}
        aria-label="筛选器"
        onKeyDown={event => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      >
        {!props.renderToolbar && (
          <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-2">
            <strong>筛选条件</strong>
            <FilterSelect
              label="筛选模式"
              value={mode}
              options={toolbar.options}
              onValueChange={toolbar.onModeChange}
              disabled={disabled}
            />
            <span role="status" aria-live="polite">
              {pending ? '待查询' : ''}
            </span>
          </div>
        )}
        {!simple && (
          <p className="fve:m-0 fve:text-sm fve:text-muted-foreground">
            当前包含同一字段的多条规则、嵌套或特殊条件，需使用高级模式。
          </p>
        )}
        {mode === 'advanced' && simple && issues.length > 0 && (
          <p className="fve:m-0 fve:text-sm fve:text-muted-foreground">
            当前条件尚未完善，完成后可切换简单模式。
          </p>
        )}
        {loadError && <div role="alert">条件加载失败：{loadError}</div>}
        <div className={filterLayout}>
          {draft.op === FilterOperator.MATCH_ALL
            ? null
            : mode === 'simple' && draft.op === FilterOperator.AND
              ? draft.operands?.map(child => renderNode(child))
              : renderNode(draft, false)}
        </div>
        <div className="fve:flex fve:flex-wrap fve:items-center fve:gap-2">
          {addControl(draft, fields, 'root', '添加筛选')}
          <div className="fve:ml-auto fve:flex fve:flex-wrap fve:items-center fve:justify-end fve:gap-2">
            {!props.collapsed && props.renderToolbar && pending && (
              <span
                role="status"
                className="fve:text-sm fve:text-muted-foreground"
              >
                筛选未生效
              </span>
            )}
            <Button
              variant="ghost"
              disabled={disabled || !pending}
              onClick={() => {
                change(cloneSnapshot<FilterDraftNode>(baseline));
                setEditorValidity({});
                setEditorOutputErrors({});
                setBuiltIn(new Set());
                setEpoch(count => count + 1);
              }}
            >
              撤销筛选修改
            </Button>
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                change(newFilterDraft(FilterOperator.MATCH_ALL));
                setLoadError(undefined);
                setEditorValidity({});
                setEditorOutputErrors({});
                setEpoch(count => count + 1);
              }}
            >
              清空条件
            </Button>
            <Button
              disabled={
                disabled ||
                !!loadError ||
                issues.length > 0 ||
                !compiled.expression ||
                (querying &&
                  sameFilterState(
                    compiled.expression,
                    submittedValue.current ?? value,
                  ))
              }
              onClick={apply}
            >
              <SearchIcon aria-hidden="true" />
              {querying &&
              sameFilterState(
                compiled.expression,
                submittedValue.current ?? value,
              )
                ? '查询中'
                : '查询'}
            </Button>
          </div>
        </div>
        {applyError && <div role="alert">{applyError}</div>}
        {props.queryError && <div role="alert">{props.queryError}</div>}
      </section>
    </>
  );
}
