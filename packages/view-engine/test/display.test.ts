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

import { describe, expect, it } from 'vitest';
import { displayValue } from '../src/ui/display.js';

/**
 * Expected text comes from the same Intl call, not a literal: the ICU data a
 * Node release ships changes spacing and punctuation, and the test is about
 * which zone, language and fields are asked for.
 */
function formatted(
  value: number,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(value);
}

/** 17:21:55 on 18 Sep 2026 in Shanghai; 02:21:55 the same day in Los Angeles. */
const INSTANT = 1789723315014;
const DATE_TIME = { dateStyle: 'medium', timeStyle: 'medium' } as const;

describe('displayValue', () => {
  it('shows an epoch-millisecond datetime in the zone and language asked', () => {
    const context = { locale: 'zh-CN', timeZone: 'Asia/Shanghai' };
    const shown = displayValue(INSTANT, { kind: 'datetime' }, context);

    expect(shown).toBe(
      formatted(INSTANT, 'zh-CN', { ...DATE_TIME, ...context }),
    );
    expect(shown).toContain('17:21:55');
  });

  it('reads the same instant by the clock of the zone it is shown in', () => {
    const shanghai = displayValue(
      INSTANT,
      { kind: 'datetime' },
      { locale: 'en-GB', timeZone: 'Asia/Shanghai' },
    );
    const angeles = displayValue(
      INSTANT,
      { kind: 'datetime' },
      { locale: 'en-GB', timeZone: 'America/Los_Angeles' },
    );

    expect(shanghai).toContain('17:21:55');
    expect(angeles).toContain('02:21:55');
  });

  it('reads a Date as the instant it holds', () => {
    const context = { locale: 'en-GB', timeZone: 'UTC' };

    expect(displayValue(new Date(INSTANT), { kind: 'datetime' }, context)).toBe(
      formatted(INSTANT, 'en-GB', { ...DATE_TIME, timeZone: 'UTC' }),
    );
    expect(displayValue('', { kind: 'date' }, context)).toBeUndefined();
  });

  it('reads an ISO string and an epoch written as a string alike', () => {
    const context = { locale: 'en-GB', timeZone: 'UTC' };
    const expected = formatted(INSTANT, 'en-GB', {
      ...DATE_TIME,
      timeZone: 'UTC',
    });

    expect(
      displayValue(
        new Date(INSTANT).toISOString(),
        { kind: 'datetime' },
        context,
      ),
    ).toBe(expected);
    expect(displayValue(String(INSTANT), { kind: 'datetime' }, context)).toBe(
      expected,
    );
  });

  // Read as an instant at UTC midnight and shown in Los Angeles, the 18th
  // would come out as the 17th.
  it('keeps a calendar date on its own day, whatever the zone', () => {
    const shown = displayValue(
      '2026-09-18',
      { kind: 'date' },
      { locale: 'en-GB', timeZone: 'America/Los_Angeles' },
    );

    expect(shown).toBe(
      formatted(Date.UTC(2026, 8, 18), 'en-GB', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }),
    );
    expect(shown).toContain('18');
  });

  it('follows the renderer key before the kind', () => {
    const context = { locale: 'en-GB', timeZone: 'UTC' };

    expect(
      displayValue(INSTANT, { kind: 'number', cell: 'datetime' }, context),
    ).toBe(formatted(INSTANT, 'en-GB', { ...DATE_TIME, timeZone: 'UTC' }));
    expect(
      displayValue(INSTANT, { kind: 'datetime', cell: 'custom' }, context),
    ).toBeUndefined();
  });

  it('names an enum value, and each value of an array, by its option', () => {
    const options = [
      { value: 'FAILED', label: '失败' },
      { value: 'SUCCEEDED', label: '已成功' },
    ];
    const field = { kind: 'enum', options };

    expect(displayValue('FAILED', field, {})).toBe('失败');
    expect(displayValue(['FAILED', 'SUCCEEDED'], field, {})).toBe(
      '失败, 已成功',
    );
    // A code the definition does not name is left to the caller, as is.
    expect(displayValue('UNKNOWN', field, {})).toBeUndefined();
    expect(displayValue(['UNKNOWN'], field, {})).toBeUndefined();
    expect(displayValue(['FAILED', 'UNKNOWN'], field, {})).toBe(
      '失败, UNKNOWN',
    );
  });

  it('shows a date histogram key as the bucket it starts', () => {
    const day = Date.UTC(2026, 8, 18);
    const utc = { locale: 'en-GB', timeZone: 'UTC' };

    expect(displayValue(day, { dateUnit: 'DAY' }, utc)).toBe(
      formatted(day, 'en-GB', { dateStyle: 'medium', timeZone: 'UTC' }),
    );
    expect(displayValue(day, { dateUnit: 'MONTH' }, utc)).toBe(
      formatted(day, 'en-GB', {
        year: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }),
    );
    expect(displayValue(day, { dateUnit: 'QUARTER' }, utc)).toBe('2026 Q3');
    expect(displayValue(day, { dateUnit: 'YEAR' }, utc)).toBe('2026');
    expect(displayValue(day, { dateUnit: 'HOUR' }, utc)).toBe(
      formatted(day, 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }),
    );
    expect(displayValue(day, { dateUnit: 'SECOND' }, utc)).toBe(
      formatted(day, 'en-GB', { ...DATE_TIME, timeZone: 'UTC' }),
    );
    expect(displayValue('soon', { dateUnit: 'DAY' }, utc)).toBeUndefined();
  });

  // Buckets cut at UTC midnight and read in Los Angeles would each carry the
  // date before; the group's own zone is the one its keys are in.
  it('reads bucket keys in the zone the group cut them in', () => {
    const day = Date.UTC(2026, 8, 18);
    const shown = displayValue(
      day,
      { dateUnit: 'DAY', timeZone: 'UTC' },
      { locale: 'en-GB', timeZone: 'America/Los_Angeles' },
    );

    expect(shown).toBe(
      formatted(day, 'en-GB', { dateStyle: 'medium', timeZone: 'UTC' }),
    );
  });

  it('leaves to the caller what it has nothing to add to', () => {
    expect(displayValue(null, { kind: 'datetime' }, {})).toBeUndefined();
    expect(displayValue('soon', { kind: 'datetime' }, {})).toBeUndefined();
    expect(displayValue(42, { kind: 'number' }, {})).toBeUndefined();
    expect(displayValue(true, { kind: 'boolean' }, {})).toBeUndefined();
  });

  it('shows a time in the runtime zone rather than not at all when the zone is unknown', () => {
    expect(
      displayValue(
        INSTANT,
        { kind: 'datetime' },
        { locale: 'en-GB', timeZone: 'Mars/Olympus_Mons' },
      ),
    ).toBe(formatted(INSTANT, 'en-GB', DATE_TIME));
  });
});
