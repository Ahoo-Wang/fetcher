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

import { expect, it } from 'vitest';
import ts from 'typescript';
import { resolve } from 'node:path';

function compile(source: string) {
  const fileName = resolve('test/map-extensions-contract.ts');
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, version, onError, shouldCreateNewSourceFile) =>
    name === fileName
      ? ts.createSourceFile(name, source, version)
      : getSourceFile(name, version, onError, shouldCreateNewSourceFile);
  const program = ts.createProgram([fileName], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

it('accepts x-* extension values on Paths, Responses and Callback', () => {
  const source = `import type {
  Callback, OpenAPI, Operation, PathItem, Paths, Responses,
} from '../src';
const extensions = {
  'x-flag': true, 'x-count': 1, 'x-name': 'cache',
  'x-list': [1, 'two'], 'x-object': { nested: { deep: true } },
};
export const paths: Paths = { '/widgets': {}, ...extensions };
export const responses: Responses = {
  '200': { description: 'OK' }, '2XX': { description: 'Any success' },
  default: { $ref: '#/components/responses/Error' }, ...extensions,
};
export const callback: Callback = {
  '{$request.body#/callbackUrl}': {},
  '$request.body#/url': {},
  'https://example.com/hook?id={$request.body#/id}': {},
  ...extensions,
};
const operation: Operation = {
  responses: { '204': { description: 'No content' }, 'x-reason': 'cache' },
  callbacks: { onEvent: { '{$request.body#/url}': {}, 'x-order': 1 } },
};
export const document: OpenAPI = {
  openapi: '3.1.0',
  info: { title: 'Widgets', version: '1.0.0' },
  paths: { '/widgets': { get: operation }, 'x-internal': true },
};

// Path, status and expression keys keep their value types.
// @ts-expect-error A path item is an object.
export const badPath: Paths = { '/widgets': true };
// @ts-expect-error A response requires a description.
export const badResponse: Responses = { '200': {} };
// @ts-expect-error A response is an object.
export const badDefault: Responses = { default: 'OK' };
// @ts-expect-error A callback path item is an object.
export const badCallback: Callback = { '{$request.body#/url}': 1 };
// @ts-expect-error A path starts with a slash.
export const relativePath: Paths = { widgets: {} };

// Reading by key keeps the value types.
const item: PathItem = paths['/widgets'];
const ok: Responses[\`2\${string}\`] = responses['200'];
const hook: PathItem = callback['{$request.body#/callbackUrl}'];
for (const [path, pathItem] of Object.entries(document.paths)) {
  void path.length;
  void pathItem;
}
void [item, ok, hook];
`;
  expect(compile(source)).toEqual([]);
}, 30_000);
