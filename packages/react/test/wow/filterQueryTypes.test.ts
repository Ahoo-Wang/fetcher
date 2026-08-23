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

import { expectTypeOf, it } from 'vitest';
import type {
  Condition,
  FilterExpression,
  ListQueryRequest,
  PagedQueryRequest,
  SingleQueryRequest,
} from '@ahoo-wang/fetcher-wow';
import type {
  UseCountQueryOptions,
  UseCountQueryReturn,
  UseFetcherCountQueryOptions,
  UseFetcherCountQueryReturn,
  UseFetcherListQueryOptions,
  UseFetcherListQueryReturn,
  UseFetcherListStreamQueryOptions,
  UseFetcherListStreamQueryReturn,
  UseFetcherPagedQueryOptions,
  UseFetcherPagedQueryReturn,
  UseFetcherSingleQueryOptions,
  UseFetcherSingleQueryReturn,
  UseListQueryOptions,
  UseListQueryReturn,
  UseListStreamQueryOptions,
  UseListStreamQueryReturn,
  UsePagedQueryOptions,
  UsePagedQueryReturn,
  UseSingleQueryOptions,
  UseSingleQueryReturn,
} from '../../src';

type Fields = 'id' | 'status';
type Item = { id: string; status: string };
type CountQueryRequest = Condition<Fields> | FilterExpression<Fields>;
type InitialQuery<T extends { initialQuery?: unknown }> = NonNullable<
  T['initialQuery']
>;
type SetQuery<T> = T extends { setQuery: (query: infer Q) => void } ? Q : never;

it('accepts FilterExpression requests across Wow query hooks', () => {
  expectTypeOf<InitialQuery<UseListQueryOptions<Item, Fields>>>().toEqualTypeOf<
    ListQueryRequest<Fields>
  >();
  expectTypeOf<SetQuery<UseListQueryReturn<Item, Fields>>>().toEqualTypeOf<
    ListQueryRequest<Fields>
  >();
  expectTypeOf<
    InitialQuery<UseFetcherListQueryOptions<Item, Fields>>
  >().toEqualTypeOf<ListQueryRequest<Fields>>();
  expectTypeOf<
    SetQuery<UseFetcherListQueryReturn<Item, Fields>>
  >().toEqualTypeOf<ListQueryRequest<Fields>>();

  expectTypeOf<
    InitialQuery<UseListStreamQueryOptions<Item, Fields>>
  >().toEqualTypeOf<ListQueryRequest<Fields>>();
  expectTypeOf<
    SetQuery<UseListStreamQueryReturn<Item, Fields>>
  >().toEqualTypeOf<ListQueryRequest<Fields>>();
  expectTypeOf<
    InitialQuery<UseFetcherListStreamQueryOptions<Item, Fields>>
  >().toEqualTypeOf<ListQueryRequest<Fields>>();
  expectTypeOf<
    SetQuery<UseFetcherListStreamQueryReturn<Item, Fields>>
  >().toEqualTypeOf<ListQueryRequest<Fields>>();

  expectTypeOf<
    InitialQuery<UsePagedQueryOptions<Item, Fields>>
  >().toEqualTypeOf<PagedQueryRequest<Fields>>();
  expectTypeOf<SetQuery<UsePagedQueryReturn<Item, Fields>>>().toEqualTypeOf<
    PagedQueryRequest<Fields>
  >();
  expectTypeOf<
    InitialQuery<UseFetcherPagedQueryOptions<Item, Fields>>
  >().toEqualTypeOf<PagedQueryRequest<Fields>>();
  expectTypeOf<
    SetQuery<UseFetcherPagedQueryReturn<Item, Fields>>
  >().toEqualTypeOf<PagedQueryRequest<Fields>>();

  expectTypeOf<
    InitialQuery<UseSingleQueryOptions<Item, Fields>>
  >().toEqualTypeOf<SingleQueryRequest<Fields>>();
  expectTypeOf<SetQuery<UseSingleQueryReturn<Item, Fields>>>().toEqualTypeOf<
    SingleQueryRequest<Fields>
  >();
  expectTypeOf<
    InitialQuery<UseFetcherSingleQueryOptions<Item, Fields>>
  >().toEqualTypeOf<SingleQueryRequest<Fields>>();
  expectTypeOf<
    SetQuery<UseFetcherSingleQueryReturn<Item, Fields>>
  >().toEqualTypeOf<SingleQueryRequest<Fields>>();

  expectTypeOf<
    InitialQuery<UseCountQueryOptions<Fields>>
  >().toEqualTypeOf<CountQueryRequest>();
  expectTypeOf<
    SetQuery<UseCountQueryReturn<Fields>>
  >().toEqualTypeOf<CountQueryRequest>();
  expectTypeOf<
    InitialQuery<UseFetcherCountQueryOptions<Fields>>
  >().toEqualTypeOf<CountQueryRequest>();
  expectTypeOf<
    SetQuery<UseFetcherCountQueryReturn<Fields>>
  >().toEqualTypeOf<CountQueryRequest>();
});
