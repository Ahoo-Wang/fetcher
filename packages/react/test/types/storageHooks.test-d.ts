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

// Type tests, checked by `pnpm test:type` (tsc); never executed.
import { expectTypeOf } from 'vitest';
import type { Draft } from 'immer';
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import { useImmerKeyStorage, useKeyStorage } from '../../src';

// #2035: an explicit undefined default does not remove null.
type State = { count: number } | undefined;
declare const optional: KeyStorage<State>;
declare const maybeState: State;

export function usePlainOptionalDefault() {
  const fallback: State = undefined;
  const [value] = useKeyStorage(optional, fallback);
  expectTypeOf(value).toEqualTypeOf<State | null>();
  const [unnarrowed] = useKeyStorage(optional, maybeState);
  expectTypeOf(unnarrowed).toEqualTypeOf<State | null>();
}

export function useImmerOptionalDefault() {
  const fallback: State = undefined;
  const [value, update] = useImmerKeyStorage(optional, fallback);
  expectTypeOf(value).toEqualTypeOf<State | null>();
  update(draft => {
    expectTypeOf(draft).toEqualTypeOf<Draft<State> | null>();
  });
}

// A real default still removes null.
declare const theme: KeyStorage<string>;
export function useDefiniteDefaults() {
  const [value] = useKeyStorage(theme, 'light');
  expectTypeOf(value).toEqualTypeOf<string>();
  const [immerValue] = useImmerKeyStorage(theme, 'light');
  expectTypeOf(immerValue).toEqualTypeOf<string>();
  const [nullable] = useKeyStorage(theme);
  expectTypeOf(nullable).toEqualTypeOf<string | null>();
}

// #2036: the updater receives a mutable Immer draft of readonly state.
type Preferences = {
  readonly count: number;
  readonly tags: readonly string[];
};
const initial: Preferences = { count: 0, tags: [] };
const preferences = new KeyStorage<Preferences>({
  key: 'readonly',
  storage: new InMemoryStorage(),
});

export function useReadonlyWithDefault() {
  const [value, update] = useImmerKeyStorage(preferences, initial);
  expectTypeOf(value).toEqualTypeOf<Preferences>();
  update(draft => {
    draft.count += 1;
    draft.tags.push('new');
  });
  update(() => initial);
  update(() => null);
}

export function useReadonlyWithoutDefault() {
  const [value, update] = useImmerKeyStorage(preferences);
  expectTypeOf(value).toEqualTypeOf<Preferences | null>();
  update(draft => {
    if (!draft) return;
    draft.count += 1;
    draft.tags.push('new');
  });
}
