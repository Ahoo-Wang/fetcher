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
import { TZDate } from '@date-fns/tz';
import {
  DeletionState,
  FilterOperator,
  SearchMode,
  StringComparison,
  TimeUnit,
} from '@ahoo-wang/fetcher-wow';
import { PlusIcon, Settings2Icon, XIcon } from 'lucide-react';
import type {
  FilterDateTimeValue,
  FilterDraftNode,
  FilterFieldDefinition,
  FilterScalarDraftValue,
} from './filterModel.js';
import { FILTER_OPERATORS } from './filterCore.js';
import { FilterDatePicker } from './FilterDatePicker.js';
import { FilterSelect } from './FilterSelect.js';
import { FilterTimeInput } from './FilterTimeInput.js';
import { Button } from '../components/ui/button.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '../components/ui/input-group.js';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '../components/ui/popover.js';

export interface FilterValueEditorProps {
  node: FilterDraftNode;
  field?: FilterFieldDefinition;
  fields: readonly FilterFieldDefinition[];
  disabled?: boolean;
  onChange(node: FilterDraftNode): void;
}

const booleanOptions = [
  { value: true, label: '是' },
  { value: false, label: '否' },
];
const scalarTypes = [
  { value: 'string', label: '文本' },
  { value: 'number', label: '数值' },
  { value: 'boolean', label: '布尔' },
] as const;
const stringOptions = [
  { value: StringComparison.CASE_SENSITIVE, label: '区分大小写' },
  { value: StringComparison.CASE_INSENSITIVE, label: '忽略大小写' },
];
const timeUnits = [
  { value: TimeUnit.NANOSECONDS, label: '纳秒' },
  { value: TimeUnit.MICROSECONDS, label: '微秒' },
  { value: TimeUnit.MILLISECONDS, label: '毫秒' },
  { value: TimeUnit.SECONDS, label: '秒' },
  { value: TimeUnit.MINUTES, label: '分钟' },
  { value: TimeUnit.HOURS, label: '小时' },
  { value: TimeUnit.DAYS, label: '天' },
];

function textValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function typedValue(value: unknown): value is FilterScalarDraftValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'value' in value &&
    scalarTypes.some(item => item.value === value.type)
  );
}

function dateText(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function calendarDate(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return dateText(date) === value ? date : undefined;
}

function dateTimeValue(value: unknown, timeZone?: string): FilterDateTimeValue {
  if (value === undefined || value === null) return {};
  if (typeof value === 'object' && !Array.isArray(value))
    return value as FilterDateTimeValue;
  if (typeof value === 'number' && Number.isFinite(value)) {
    try {
      const date = timeZone ? new TZDate(value, timeZone) : new Date(value);
      if (Number.isFinite(date.getTime())) {
        const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
          .map(part => String(part).padStart(2, '0'))
          .join(':');
        return {
          date: dateText(date),
          offsetMinutes: date.getTimezoneOffset(),
          time:
            time +
            (date.getMilliseconds()
              ? `.${String(date.getMilliseconds()).padStart(3, '0')}`
              : ''),
        };
      }
    } catch {
      /* The compiler reports invalid field timezone metadata. */
    }
  }
  return { date: textValue(value) };
}

function ValueOptions({
  label,
  nullable,
  emptyString,
  disabled,
  onChange,
}: {
  label: string;
  nullable: boolean;
  emptyString: boolean;
  disabled?: boolean;
  onChange(value: unknown): void;
}) {
  const [open, setOpen] = useState(false);
  function choose(value: unknown) {
    onChange(value);
    setOpen(false);
  }
  return (
    <>
      <InputGroupButton
        aria-label={`清空${label}`}
        disabled={disabled}
        onClick={() => choose(undefined)}
      >
        清空
      </InputGroupButton>
      {(nullable || emptyString) && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<InputGroupButton />}
            aria-label={`${label}选项`}
            disabled={disabled}
          >
            特殊值
          </PopoverTrigger>
          <PopoverContent align="start" className="fve:w-auto">
            <PopoverTitle>{label}</PopoverTitle>
            {emptyString && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => choose('')}
              >
                设为空字符串
              </Button>
            )}
            {nullable && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => choose(null)}
              >
                设为空值
              </Button>
            )}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}

function ScalarEditor({
  value,
  label,
  dateLabel = label,
  field,
  nullable = false,
  disabled,
  onChange,
}: {
  value: unknown;
  label: string;
  dateLabel?: string;
  field?: FilterFieldDefinition;
  nullable?: boolean;
  disabled?: boolean;
  onChange(value: unknown): void;
}) {
  const wrapped = typedValue(value);
  const raw = wrapped ? value.value : value;
  const freeType = !field?.type || field.type === 'array';
  const kind = freeType
    ? wrapped
      ? value.type
      : typeof value === 'number' || typeof value === 'boolean'
        ? typeof value
        : 'string'
    : field.type;
  const choices =
    field?.options ?? (kind === 'boolean' ? booleanOptions : undefined);
  const changeValue = (next: unknown) =>
    onChange(
      next === undefined && (freeType || kind === 'number') && !field?.options
        ? { type: kind, value: undefined }
        : next,
    );
  if (choices) {
    const options = [
      ...choices.map((option, index) => ({ ...option, value: String(index) })),
      ...(nullable ? [{ value: 'null', label: '空值' }] : []),
    ];
    const selected =
      raw === null && nullable
        ? 'null'
        : choices.findIndex(option => Object.is(option.value, raw));
    const incompatible = raw !== undefined && selected === -1;
    return (
      <span className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center">
        {freeType && !field?.options && (
          <FilterSelect
            label={`${label}类型`}
            value={kind}
            options={scalarTypes}
            inline
            disabled={disabled}
            onValueChange={type => onChange({ type, value: raw })}
          />
        )}
        <FilterSelect
          label={label}
          placeholder={incompatible ? `已有值：${textValue(raw)}` : '未设置'}
          value={
            raw === undefined ? null : incompatible ? null : String(selected)
          }
          options={options}
          inline
          disabled={disabled}
          onClear={() => changeValue(undefined)}
          onValueChange={selected =>
            onChange(
              selected === 'null' ? null : choices[Number(selected)].value,
            )
          }
        />
        {incompatible && (
          <>
            <InputGroupText role="alert">值与选项不兼容</InputGroupText>
            <InputGroupButton
              aria-label={`清空${label}`}
              disabled={disabled}
              size="icon-xs"
              onClick={() => changeValue(undefined)}
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          </>
        )}
      </span>
    );
  }
  if (kind === 'date' || kind === 'datetime') {
    const parts =
      kind === 'datetime'
        ? dateTimeValue(raw, field?.timeZone)
        : { date: textValue(raw) || undefined };
    const updateDate = (date: string | undefined) =>
      onChange(kind === 'datetime' ? { ...parts, date } : date);
    return (
      <span className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center">
        <InputGroupInput
          aria-label={`${dateLabel}日期`}
          placeholder={raw === null ? '空值' : 'YYYY-MM-DD'}
          value={parts.date ?? ''}
          disabled={disabled}
          className="fve:w-28 fve:flex-none"
          onChange={event => updateDate(event.target.value || undefined)}
        />
        <FilterDatePicker
          label={`${dateLabel}日历`}
          value={calendarDate(parts.date)}
          disabled={disabled}
          inline
          onValueChange={date => updateDate(date ? dateText(date) : undefined)}
        />
        {kind === 'datetime' && (
          <FilterTimeInput
            label={`${dateLabel}时间`}
            value={parts.time}
            disabled={disabled}
            inline
            onValueChange={time =>
              onChange({ ...parts, time: time || undefined })
            }
          />
        )}
        <ValueOptions
          label={label}
          nullable={nullable}
          emptyString={false}
          disabled={disabled}
          onChange={onChange}
        />
      </span>
    );
  }
  const incompatible =
    raw !== undefined &&
    raw !== null &&
    (wrapped ? value.type !== kind : typeof raw !== kind);
  return (
    <span className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center">
      {freeType && (
        <FilterSelect
          label={`${label}类型`}
          value={kind}
          options={scalarTypes}
          inline
          disabled={disabled}
          onValueChange={type => onChange({ type, value: raw })}
        />
      )}
      <InputGroupInput
        aria-label={label}
        value={textValue(raw)}
        disabled={disabled}
        inputMode={kind === 'number' ? 'decimal' : undefined}
        placeholder={raw === null ? '空值' : raw === '' ? '空字符串' : '未设置'}
        aria-invalid={incompatible || undefined}
        className="fve:w-32 fve:flex-none"
        onChange={event => {
          const next = event.target.value || undefined;
          onChange(
            kind === 'number' || (freeType && wrapped)
              ? { type: kind, value: next }
              : next,
          );
        }}
      />
      <ValueOptions
        label={label}
        nullable={nullable}
        emptyString={kind === 'string'}
        disabled={disabled}
        onChange={changeValue}
      />
      {incompatible && (
        <InputGroupText role="alert">值与字段类型不兼容</InputGroupText>
      )}
    </span>
  );
}

function Parameters({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={<InputGroupButton size="icon-xs" />}
        aria-label={`${label}参数`}
        disabled={disabled}
      >
        <Settings2Icon aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverTitle>{label}参数</PopoverTitle>
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function FilterValueEditor({
  node,
  field,
  fields,
  disabled,
  onChange,
}: FilterValueEditorProps) {
  const descriptor = FILTER_OPERATORS[node.op];
  if (!descriptor)
    return <InputGroupText role="alert">未知操作</InputGroupText>;
  const label = field?.label ?? descriptor.label;
  const stringOperation = [
    FilterOperator.CONTAINS,
    FilterOperator.STARTS_WITH,
    FilterOperator.ENDS_WITH,
  ].includes(node.op);
  const valueField =
    descriptor.category === 'root' || stringOperation
      ? { field: '', label, type: 'string' as const }
      : field;
  const update = (patch: Partial<FilterDraftNode>) =>
    onChange({ ...node, ...patch });
  let input: ReactNode;
  switch (descriptor.input) {
    case 'value':
      input = (
        <ScalarEditor
          label={`${label}值`}
          dateLabel={label}
          value={node.value}
          field={valueField}
          nullable={
            node.op === FilterOperator.EQ || node.op === FilterOperator.NE
          }
          disabled={disabled}
          onChange={value => update({ value })}
        />
      );
      break;
    case 'values':
      input = (
        <span className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center">
          {(node.values ?? []).map((value, index) => (
            <span
              key={index}
              className="fve:inline-flex fve:max-w-full fve:flex-wrap fve:items-center"
            >
              <ScalarEditor
                label={`${label}值${index + 1}`}
                value={value}
                field={valueField}
                disabled={disabled}
                onChange={value =>
                  update({
                    values: node.values?.map((current, position) =>
                      position === index ? value : current,
                    ),
                  })
                }
              />
              <InputGroupButton
                aria-label={`删除${label}值${index + 1}`}
                disabled={disabled}
                size="icon-xs"
                onClick={() =>
                  update({
                    values: node.values?.filter(
                      (_, position) => position !== index,
                    ),
                  })
                }
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            </span>
          ))}
          <InputGroupButton
            aria-label={`添加${label}值`}
            disabled={disabled}
            onClick={() =>
              update({ values: [...(node.values ?? []), undefined] })
            }
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            添加值
          </InputGroupButton>
        </span>
      );
      break;
    case 'between':
      input = (
        <>
          <ScalarEditor
            label={`${label}下限`}
            value={node.lowerBound}
            field={field}
            disabled={disabled}
            onChange={lowerBound => update({ lowerBound })}
          />
          <InputGroupText>至</InputGroupText>
          <ScalarEditor
            label={`${label}上限`}
            value={node.upperBound}
            field={field}
            disabled={disabled}
            onChange={upperBound => update({ upperBound })}
          />
        </>
      );
      break;
    case 'search':
      input = (
        <>
          <InputGroupInput
            aria-label="搜索内容"
            value={node.query ?? ''}
            placeholder="搜索内容"
            disabled={disabled}
            className="fve:w-40 fve:flex-none"
            onChange={event =>
              update({ query: event.target.value || undefined })
            }
          />
          <Parameters label="搜索" disabled={disabled}>
            <FilterSelect
              label="搜索模式"
              placeholder="默认模式"
              value={node.mode}
              disabled={disabled}
              options={[
                { value: SearchMode.TERMS, label: '词项' },
                { value: SearchMode.PHRASE, label: '短语' },
              ]}
              onClear={() => update({ mode: undefined })}
              onValueChange={mode => update({ mode })}
            />
            <InputGroupText>
              {node.fields === undefined
                ? '默认搜索字段'
                : node.fields.length === 0
                  ? '全部搜索字段'
                  : '搜索字段'}
            </InputGroupText>
            {(node.fields ?? []).map((path, index) => (
              <InputGroup key={index}>
                <InputGroupInput
                  aria-label={`搜索字段${index + 1}`}
                  value={path}
                  disabled={disabled}
                  onChange={event =>
                    update({
                      fields: node.fields?.map((value, position) =>
                        position === index ? event.target.value : value,
                      ),
                    })
                  }
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={`删除搜索字段${fields.find(item => item.field === path)?.label ?? path}`}
                    disabled={disabled}
                    size="icon-xs"
                    onClick={() =>
                      update({
                        fields: node.fields?.filter(
                          (_, position) => position !== index,
                        ),
                      })
                    }
                  >
                    <XIcon aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            ))}
            <FilterSelect
              label="添加搜索字段"
              placeholder="添加搜索字段"
              disabled={disabled}
              options={fields.map(item => ({
                value: item.field,
                label: item.label,
                disabled: node.fields?.includes(item.field),
              }))}
              onValueChange={path =>
                update({ fields: [...(node.fields ?? []), path] })
              }
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => update({ fields: undefined })}
            >
              使用默认搜索字段
            </Button>
            {node.fields === undefined && (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => update({ fields: [] })}
              >
                搜索全部字段
              </Button>
            )}
          </Parameters>
        </>
      );
      break;
    case 'deletion':
      input = (
        <FilterSelect
          label="删除状态"
          placeholder="未设置"
          value={node.state}
          inline
          disabled={disabled}
          options={[
            { value: DeletionState.ACTIVE, label: '未删除' },
            { value: DeletionState.DELETED, label: '已删除' },
            { value: DeletionState.ALL, label: '全部' },
          ]}
          onClear={() => update({ state: undefined })}
          onValueChange={state => update({ state })}
        />
      );
      break;
    case 'time':
      input = (
        <FilterTimeInput
          label={`${label}时间`}
          value={node.time}
          disabled={disabled}
          inline
          onValueChange={time => update({ time: time || undefined })}
        />
      );
      break;
    case 'days':
      input = (
        <>
          <InputGroupInput
            aria-label={`${label}天数`}
            value={node.days ?? ''}
            placeholder="天数"
            inputMode="numeric"
            disabled={disabled}
            className="fve:w-20 fve:flex-none"
            onChange={event =>
              update({ days: event.target.value || undefined })
            }
          />
          <InputGroupText>天</InputGroupText>
        </>
      );
      break;
  }
  return (
    <>
      {input}
      {(descriptor.relativeTime || stringOperation) && (
        <Parameters label={label} disabled={disabled}>
          {stringOperation && (
            <FilterSelect
              label="大小写比较"
              placeholder="默认比较方式"
              value={node.stringComparison}
              options={stringOptions}
              disabled={disabled}
              onClear={() => update({ stringComparison: undefined })}
              onValueChange={stringComparison => update({ stringComparison })}
            />
          )}
          {descriptor.relativeTime && (
            <>
              <InputGroup>
                <InputGroupInput
                  aria-label="时区"
                  placeholder="时区（未指定）"
                  value={node.zoneId ?? ''}
                  disabled={disabled}
                  onChange={event =>
                    update({ zoneId: event.target.value || undefined })
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroupInput
                  aria-label="日期格式"
                  placeholder="日期格式（未指定）"
                  value={node.datePattern ?? ''}
                  disabled={disabled}
                  onChange={event =>
                    update({ datePattern: event.target.value || undefined })
                  }
                />
              </InputGroup>
              <FilterSelect
                label="时间单位"
                placeholder="默认时间单位"
                value={node.timeUnit}
                options={timeUnits}
                disabled={disabled}
                onClear={() => update({ timeUnit: undefined })}
                onValueChange={timeUnit => update({ timeUnit })}
              />
            </>
          )}
        </Parameters>
      )}
    </>
  );
}
