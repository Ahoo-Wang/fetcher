/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo Wang)].
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

import { expect, it } from 'vitest';
import {
  validateLocalViewState,
  type ServiceState,
} from '../src/record/localViewState.js';
import { committedWrite } from '../src/contracts/viewServiceContract.js';
import { definition, instance } from './engine/fixtures.js';

function state(): ServiceState {
  return {
    instances: [{ ...instance(), ownerKey: 'developer' }],
    seeded: [],
    catalogRevision: 0,
    preferences: {},
    receipts: {},
  };
}

it('accepts a stored instance receipt whose target matches its committed value', () => {
  expect(() =>
    validateLocalViewState(
      {
        ...state(),
        receipts: {
          key: {
            resource: 'instance',
            action: 'save',
            targetId: 'mine',
            input: {},
            observation: committedWrite(
              { ...instance(), revision: 'r2' },
              'r2',
            ),
          },
        },
      },
      definition,
    ),
  ).not.toThrow();
});

it('rejects a stored instance receipt whose target differs from its committed value', () => {
  expect(() =>
    validateLocalViewState(
      {
        ...state(),
        receipts: {
          key: {
            resource: 'instance',
            action: 'save',
            targetId: 'other',
            input: {},
            observation: committedWrite(
              { ...instance(), revision: 'r2' },
              'r2',
            ),
          },
        },
      },
      definition,
    ),
  ).toThrow(/目标/);
  expect(() =>
    validateLocalViewState(
      {
        ...state(),
        receipts: {
          key: {
            resource: 'instance',
            action: 'delete',
            targetId: null,
            input: {},
            observation: committedWrite(
              { id: 'mine', revision: 'tomb' },
              'tomb',
            ),
          },
        },
      },
      definition,
    ),
  ).toThrow(/目标/);
});
