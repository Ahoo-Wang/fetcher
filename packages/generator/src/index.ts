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

import { openAPIParser } from '@/parser/openAPIParser.ts';
import { ModuleResolver } from '@/module/moduleResolver.ts';
import { ModuleInfoResolver } from '@/module/moduleInfoResolver.ts';
import { ModelResolver } from '@/model/modelResolver.ts';
import { CodeGenerator } from '@/codeGenerator.ts';
import { Project } from 'ts-morph';

export function generate(inputPath: string, outputDir: string): void {
  const openAPI = openAPIParser.parse(inputPath);
  if (!openAPI) {
    throw new Error('OpenAPI specification is invalid');
  }

  const modelResolver = new ModelResolver(new ModuleInfoResolver());
  const moduleResolver = new ModuleResolver(
    new ModuleInfoResolver(),
    modelResolver,
  );

  moduleResolver.resolve(openAPI);
  const codeGenerator = new CodeGenerator(outputDir, new Project());
  codeGenerator.generate(moduleResolver.getModules());
}
