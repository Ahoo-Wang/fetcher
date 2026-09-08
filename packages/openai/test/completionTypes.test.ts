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
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('compiles the true, false, omitted and dynamic stream return contracts', () => {
  const program = ts.createProgram(
    [fileURLToPath(new URL('./fixtures/completionTypes.ts', import.meta.url))],
    {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      experimentalDecorators: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    diagnostics.map(diagnostic =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    ),
  ).toEqual([]);
});
