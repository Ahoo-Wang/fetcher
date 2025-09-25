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

import { ModelGenerator } from '@/model';
import { Project } from 'ts-morph';
import { GenerateContext, GeneratorOptions } from '@/types.ts';

export class CodeGenerator {

  private readonly project: Project = new Project();


  constructor(private readonly options: GeneratorOptions) {
  }

  async generate(): Promise<void> {
    const context: GenerateContext = {
      openAPI: this.options.parser.parse(this.options.inputPath)!,
      project: this.project,
      outputDir: this.options.outputDir,
    };
    const modelGenerator = new ModelGenerator(context);
    modelGenerator.generate();
    await this.project.save();
  }
}