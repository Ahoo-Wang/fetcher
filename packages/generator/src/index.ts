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
import { GenerateContext, GeneratorOptions } from '@/types.ts';
import { AggregateResolver } from '@/aggregate';
import { Project } from 'ts-morph';

export class CodeGenerator {

  private readonly project: Project;

  constructor(private readonly options: GeneratorOptions) {
    this.project = options.project;
  }

  async generate(): Promise<void> {
    const openAPI = this.options.parser.parse(this.options.inputPath)!;
    const aggregateResolver = new AggregateResolver(openAPI);
    const aggregates = aggregateResolver.resolve();
    const context: GenerateContext = {
      openAPI: openAPI,
      project: this.project,
      outputDir: this.options.outputDir,
      aggregates,
    };
    const modelGenerator = new ModelGenerator(context);
    modelGenerator.generate();
    await this.project.save();
  }
}