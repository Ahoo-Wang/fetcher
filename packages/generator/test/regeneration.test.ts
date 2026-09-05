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

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodeGenerator } from '../src';

const directories: string[] = [];
afterEach(() =>
  directories
    .splice(0)
    .forEach(dir => rmSync(dir, { recursive: true, force: true })),
);
const logger = {
  info() {},
  success() {},
  error() {},
  progress() {},
  progressWithCount() {},
};

describe('review regressions', () => {
  it('regenerates included output without accumulating declarations', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fetcher-regeneration-'));
    directories.push(dir);
    const inputPath = join(dir, 'openapi.json');
    const tsConfigFilePath = join(dir, 'tsconfig.json');
    const outputDir = join(dir, 'out');
    writeFileSync(
      tsConfigFilePath,
      JSON.stringify({
        compilerOptions: { experimentalDecorators: true },
        include: ['out/**/*.ts'],
      }),
    );
    writeFileSync(
      inputPath,
      JSON.stringify({
        openapi: '3.0.4',
        info: {},
        paths: {
          '/message': {
            get: {
              tags: ['Messages'],
              operationId: 'message',
              responses: {
                '200': {
                  content: {
                    'application/json': { schema: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      }),
    );
    const options = { inputPath, outputDir, tsConfigFilePath, logger };
    await new CodeGenerator(options).generate();
    const first = readFileSync(join(outputDir, 'MessagesApiClient.ts'), 'utf8');
    writeFileSync(join(outputDir, 'custom.ts'), 'export const custom = 1;');
    await new CodeGenerator(options).generate();
    expect(readFileSync(join(outputDir, 'custom.ts'), 'utf8')).toBe(
      'export const custom = 1;\n',
    );
    expect(readFileSync(join(outputDir, 'MessagesApiClient.ts'), 'utf8')).toBe(
      first,
    );
  });
});
