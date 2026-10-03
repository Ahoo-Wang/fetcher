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
import type { OpenAPI, Reference, Schema } from '../src';

// A 3.1 document using JSON Schema 2020-12 keywords. The value of this test is
// that it type-checks; at run time it only confirms the shape survives.
const cursorPage: Schema = {
  $id: 'https://example.test/schemas/cursor-page',
  $comment: 'A page of rows and the cursor of the next one.',
  type: 'object',
  $defs: { row: { type: 'object', additionalProperties: true } },
  properties: {
    rows: { type: 'array', items: { $ref: '#/$defs/row' } },
    cursor: { type: 'string', contentEncoding: 'base64' },
    range: {
      type: 'array',
      prefixItems: [{ type: 'integer' }, { type: 'integer' }],
      unevaluatedItems: false,
    },
  },
  patternProperties: { '^x-': {} },
  propertyNames: { pattern: '^[a-z]' },
  dependentRequired: { cursor: ['rows'] },
  unevaluatedProperties: false,
  if: { properties: { cursor: { const: null } } },
  then: { required: ['rows'] },
  else: { required: ['rows', 'cursor'] },
  examples: [{ rows: [], cursor: null }],
};

const document: OpenAPI = {
  openapi: '3.1.0',
  info: { title: 'Rows', version: '1.0.0' },
  paths: {},
  components: { schemas: { CursorPage: cursorPage } },
};

describe('OpenAPI 3.1 schemas', () => {
  it('accept JSON Schema 2020-12 keywords', () => {
    expect(document.components?.schemas?.CursorPage).toBe(cursorPage);
  });

  it('keep $ref as what tells a Reference from a Schema', () => {
    const refOrSchema = (value: Schema | Reference): string =>
      '$ref' in value ? value.$ref : (value.type?.toString() ?? 'untyped');
    expect(refOrSchema({ $ref: '#/$defs/row' })).toBe('#/$defs/row');
    expect(refOrSchema(cursorPage)).toBe('object');
  });
});
