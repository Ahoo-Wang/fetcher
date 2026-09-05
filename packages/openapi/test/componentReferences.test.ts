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

it('accepts references in every reusable component map', () => {
  const fileName = resolve('test/component-reference-contract.ts');
  const source = `import type { Components } from '../src';
const ref = { $ref: '#/components/schemas/Target' };
const components: Components = {
  schemas: { Alias: ref }, responses: { Alias: ref },
  parameters: { Alias: ref }, requestBodies: { Alias: ref },
  securitySchemes: { Alias: ref }, links: { Alias: ref }, callbacks: { Alias: ref },
};`;
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
  expect(
    ts
      .getPreEmitDiagnostics(program)
      .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')),
  ).toEqual([]);
});
