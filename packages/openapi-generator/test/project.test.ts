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
import { describe, expect, it, vi } from 'vitest';
import { Project } from 'ts-morph';

describe('project');
it('create', async () => {
  const project = new Project({});
  const sourceFile = project.createSourceFile('test.ts', '', { overwrite: true });

  sourceFile.addImportDeclaration({
    moduleSpecifier: '@ahoo-wang/fetcher-wow',
    namedImports: ['Identifier'],
  });
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@ahoo-wang/fetcher-decorator',
    namedImports: ['api', 'get'],
  });
  // /**
  //  * 需要去重
  //  */
  // sourceFile.addImportDeclaration({
  //   moduleSpecifier: '@/test',
  //   namedImports: ['Test'],
  // });

  const interfaceDef = sourceFile.addInterface({ name: 'TestInterface', isExported: true });
  interfaceDef.addProperty({
    name: 'name',
    type: 'string|null',
    isReadonly: true,
  });
  interfaceDef.addExtends('Identifier');
  interfaceDef.addJsDoc({
    description: 'Test interface',
  });

  const classDef = sourceFile.addClass({ name: 'TestClass', isExported: true });
  classDef.addDecorator({ name: 'api', arguments: ['"/test"', '{timeout:1}'] });
  classDef.addImplements('TestInterface');
  sourceFile.fixMissingImports();
  sourceFile.fixUnusedIdentifiers();
  await project.save();
});