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
  DeletionState,
  filter,
  FilterOperator,
  StringComparison,
  type ElementFilterExpression,
} from '../../src';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('filter', () => {
  it('builds the Wow FilterExpression wire shape', () => {
    expect(
      filter.and(
        filter.deletion(DeletionState.ACTIVE),
        filter.eq('state.status', 'PAID'),
        filter.elementMatch('state.items', filter.gt('quantity', 0)),
        filter.search('wow', 'state.name'),
        filter.today('state.createdAt', { zoneId: 'UTC' }),
      ),
    ).toEqual({
      op: FilterOperator.AND,
      operands: [
        { op: FilterOperator.DELETION, state: DeletionState.ACTIVE },
        { op: FilterOperator.EQ, field: 'state.status', value: 'PAID' },
        {
          op: FilterOperator.ELEMENT_MATCH,
          field: 'state.items',
          predicate: { op: FilterOperator.GT, field: 'quantity', value: 0 },
        },
        { op: FilterOperator.SEARCH, query: 'wow', fields: ['state.name'] },
        {
          op: FilterOperator.TODAY,
          field: 'state.createdAt',
          zoneId: 'UTC',
        },
      ],
    });
  });

  it('uses explicit string comparison semantics', () => {
    expect(
      filter.contains('state.name', 'wow', StringComparison.CASE_INSENSITIVE),
    ).toEqual({
      op: FilterOperator.CONTAINS,
      field: 'state.name',
      value: 'wow',
      stringComparison: StringComparison.CASE_INSENSITIVE,
    });
  });

  it('restricts element predicates recursively', () => {
    const predicate = filter.and(
      filter.eq('sku', 'product-1'),
      filter.gt('quantity', 0),
    );

    expectTypeOf(predicate).toMatchTypeOf<
      ElementFilterExpression<'sku' | 'quantity'>
    >();
    expect(filter.elementMatch('state.items', predicate)).toEqual({
      op: FilterOperator.ELEMENT_MATCH,
      field: 'state.items',
      predicate,
    });

    const invalidElementPredicates = () => {
      // @ts-expect-error DELETION cannot be scoped to an array element.
      filter.elementMatch('state.items', filter.deletion(DeletionState.ACTIVE));
      // @ts-expect-error SEARCH cannot be scoped to an array element.
      filter.elementMatch('state.items', filter.search('wow'));
      filter.elementMatch(
        'state.items',
        // @ts-expect-error Unsupported filters remain invalid inside logical predicates.
        filter.and(filter.eq('sku', 'product-1'), filter.search('wow')),
      );
    };
    expectTypeOf(invalidElementPredicates).toBeFunction();
  });

  it('rejects unsupported element predicates at runtime', () => {
    const deletion = filter.deletion(DeletionState.ACTIVE);
    const nestedSearch = filter.and(
      filter.eq('sku', 'product-1'),
      filter.search('wow'),
    );

    expect(() =>
      filter.elementMatch(
        'state.items',
        deletion as unknown as ElementFilterExpression,
      ),
    ).toThrow();
    expect(() =>
      filter.elementMatch(
        'state.items',
        nestedSearch as unknown as ElementFilterExpression,
      ),
    ).toThrow();
  });

  it.each([
    ['empty logical operands', () => Reflect.apply(filter.and, null, [])],
    [
      'empty collection values',
      () => Reflect.apply(filter.isIn, null, ['status']),
    ],
    ['invalid logical field', () => filter.eq('bad field', 'value')],
    [
      'object equality value',
      () => Reflect.apply(filter.eq, null, ['status', {}]),
    ],
    [
      'null comparison value',
      () => Reflect.apply(filter.gt, null, ['score', null]),
    ],
    [
      'null collection value',
      () => Reflect.apply(filter.isIn, null, ['status', null]),
    ],
    ['blank search query', () => filter.search(' ')],
    [
      'invalid before-today time',
      () => filter.beforeToday('createdAt', '25:00'),
    ],
    ['non-positive recent days', () => filter.recentDays('createdAt', 0)],
    ['fractional earlier days', () => filter.earlierDays('createdAt', 1.5)],
    ['blank zone ID', () => filter.today('createdAt', { zoneId: ' ' })],
    [
      'invalid zone ID',
      () => filter.today('createdAt', { zoneId: 'Mars/Phobos' }),
    ],
    [
      'blank date pattern',
      () => filter.today('createdAt', { datePattern: '' }),
    ],
    [
      'invalid date pattern',
      () => filter.today('createdAt', { datePattern: '[' }),
    ],
  ])('rejects %s', (_name, create) => {
    expect(create).toThrow();
  });
});
