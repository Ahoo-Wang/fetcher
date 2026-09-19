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

import type {
  AnalysisDateUnit,
  FieldOption,
  NumberFormat,
} from '../model/index.js';

/** Where a value is shown: the language, and the zone its times read in. */
export interface DisplayContext {
  /** A BCP 47 tag; the runtime's own when left out. */
  locale?: string;
  /** An IANA zone; the runtime's own when left out. */
  timeZone?: string;
}

/** What a column knows about the field behind it. */
export interface DisplayField {
  kind?: string;
  /** Renderer key; the kind's when the field names none. */
  cell?: string;
  options?: readonly FieldOption[];
  /** For a date histogram group: its keys are the starts of these buckets. */
  dateUnit?: AnalysisDateUnit;
  /** The zone those buckets were cut in, when the group named one. */
  timeZone?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const EPOCH = /^-?\d+$/;

/**
 * A value as its field shows it, or `undefined` when the field's kind has
 * nothing to add and the caller's own rendering stands: a number keeps its
 * format, a boolean its wording.
 *
 * Wow keeps a time as epoch milliseconds, so a raw table is a column of
 * thirteen-digit numbers; and an enum is a code the definition has already
 * named. Times read in the context's zone, which is the engine's: the one a
 * relative filter such as "today" is evaluated in, so what a row is filtered
 * by and what it shows agree.
 */
export function displayValue(
  value: unknown,
  field: DisplayField,
  context: DisplayContext,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (field.options && field.options.length > 0) {
    const label = optionLabel(value, field.options);
    if (label !== undefined) return label;
  }
  if (field.dateUnit !== undefined) {
    const date = toDate(value);
    return date
      ? bucket(
          date,
          field.dateUnit,
          field.timeZone ?? context.timeZone,
          context.locale,
        )
      : undefined;
  }
  switch (field.cell ?? field.kind) {
    case 'datetime': {
      const date = toDate(value);
      return date
        ? format(date, context.locale, {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: context.timeZone,
          })
        : undefined;
    }
    case 'date': {
      const date = toDate(value);
      if (!date) return undefined;
      // `2026-09-18` names a day, not an instant. Read in any zone but UTC it
      // could come out as the day before.
      const calendar = typeof value === 'string' && DATE_ONLY.test(value);
      return format(date, context.locale, {
        dateStyle: 'medium',
        timeZone: calendar ? 'UTC' : context.timeZone,
      });
    }
    default:
      return undefined;
  }
}

/** A number in the format its field declared; as written when it has none. */
export function formatNumber(value: number, format?: NumberFormat): string {
  if (!format) return String(value);
  const { locale, ...options } = format;
  return new Intl.NumberFormat(locale, options).format(value);
}

/** The label of each value an enum holds; `undefined` when none is known. */
function optionLabel(
  value: unknown,
  options: readonly FieldOption[],
): string | undefined {
  const labelOf = (item: unknown) =>
    options.find(option => option.value === item)?.label;
  if (!Array.isArray(value)) return labelOf(value);
  const labels = value.map(item => labelOf(item) ?? String(item));
  return value.some(item => labelOf(item) !== undefined)
    ? labels.join(', ')
    : undefined;
}

function toDate(value: unknown): Date | undefined {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'number'
        ? new Date(value)
        : typeof value === 'string' && value.trim() !== ''
          ? new Date(EPOCH.test(value) ? Number(value) : value)
          : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

/** A bucket key as the bucket it starts: a day, a month, a quarter. */
function bucket(
  date: Date,
  unit: AnalysisDateUnit,
  timeZone: string | undefined,
  locale: string | undefined,
): string {
  switch (unit) {
    case 'YEAR':
      return format(date, locale, { year: 'numeric', timeZone });
    case 'QUARTER': {
      const parts = formatter(locale, {
        year: 'numeric',
        month: 'numeric',
        timeZone,
      }).formatToParts(date);
      const part = (type: string) =>
        parts.find(found => found.type === type)?.value ?? '';
      return `${part('year')} Q${Math.floor((Number(part('month')) - 1) / 3) + 1}`;
    }
    case 'MONTH':
      return format(date, locale, { year: 'numeric', month: 'long', timeZone });
    case 'WEEK':
    case 'DAY':
      return format(date, locale, { dateStyle: 'medium', timeZone });
    case 'HOUR':
    case 'MINUTE':
      return format(date, locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
      });
    case 'SECOND':
      return format(date, locale, {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone,
      });
  }
}

function format(
  date: Date,
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  return formatter(locale, options).format(date);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * A formatter per locale and options, built once: a table formats every cell
 * of a page, and building one is the expensive part. An unknown zone is
 * dropped before the language is, and the runtime's own is the last resort,
 * so a bad setting never leaves the value unshown.
 */
function formatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = JSON.stringify([locale ?? null, options]);
  let found = formatters.get(key);
  if (!found) {
    const anyZone = { ...options, timeZone: undefined };
    found =
      build(locale, options) ??
      build(locale, anyZone) ??
      new Intl.DateTimeFormat(undefined, anyZone);
    formatters.set(key, found);
  }
  return found;
}

function build(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat | undefined {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch {
    return undefined;
  }
}
