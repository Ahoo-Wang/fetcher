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
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project } from 'ts-morph';
import type { Schema } from '@ahoo-wang/fetcher-openapi';
import { CodeGenerator } from '../src';
import { ApiClientGenerator } from '../src/client';
import { GenerateContext } from '../src/generateContext';
import { TypeGenerator } from '../src/model';
import {
  extractOperationEndpoints,
  extractPathParameters,
  extractSchema,
} from '../src/utils';

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

function generateModel(schema: Schema, assignments: string) {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { strict: true, skipLibCheck: true },
  });
  const file = project.createSourceFile('/types.ts', '');
  new TypeGenerator(
    { name: 'Model', path: '/' },
    file,
    { key: 'Model', schema },
    '/',
  ).generate();
  file.addStatements(assignments);
  return {
    file,
    diagnostics: project.getPreEmitDiagnostics().map(d => d.getMessageText()),
  };
}

describe('review regressions', () => {
  it.each(['commonjs', 'module'] as const)(
    'loads the published generator dependency chain through %s',
    mode => {
      const script = `
        (async () => {
          const load = ${mode === 'commonjs' ? 'require' : 'specifier => import(specifier)'};
          const assertModule = await load('node:assert/strict');
          const assert = assertModule.default ?? assertModule;
          const core = await load('@ahoo-wang/fetcher');
          assert.equal(typeof core.Fetcher, 'function');
          await load('@ahoo-wang/fetcher-eventstream');
          const response = new Response('data: ready\\n\\n', {
            headers: { 'Content-Type': 'text/event-stream' },
          });
          const reader = response.requiredEventStream().getReader();
          assert.equal((await reader.read()).value.data, 'ready');
          await reader.cancel();
          const decorator = await load('@ahoo-wang/fetcher-decorator');
          assert.equal(typeof decorator.api, 'function');
          const wow = await load('@ahoo-wang/fetcher-wow');
          assert.equal(wow.getPropertyValue({ nested: { value: 42 } }, ['nested', 'value']), 42);
          for (const locale of ['en_US', 'zh_CN']) {
            const loaded = await load('@ahoo-wang/fetcher-wow/query/locale/' + locale);
            assert.equal(typeof loaded[locale].EQ, 'string');
          }
          const generator = await load('@ahoo-wang/fetcher-generator');
          assert.equal(typeof generator.CodeGenerator, 'function');
          console.log('exports-ok');
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `;
      expect(
        execFileSync(process.execPath, [`--input-type=${mode}`, '-e', script], {
          cwd: fileURLToPath(new URL('..', import.meta.url)),
          encoding: 'utf8',
          timeout: 10000,
        }).trim(),
      ).toBe('exports-ok');
    },
  );

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

  it('uses JSON extraction for application/json string responses', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const context = new GenerateContext({
      project,
      outputDir: '/out',
      contextAggregates: new Map(),
      logger,
      openAPI: {
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
      },
    });
    new ApiClientGenerator(context).generate();
    const method = project
      .getSourceFileOrThrow('/out/MessagesApiClient.ts')
      .getClassOrThrow('MessagesApiClient')
      .getMethodOrThrow('message');
    expect(
      method
        .getDecoratorOrThrow('get')
        .getArguments()
        .map(arg => arg.getText()),
    ).toEqual(["'/message'"]);
    expect(method.getReturnTypeNodeOrThrow().getText()).toBe('Promise<string>');
  });

  it('inherits path parameters and allows operation overrides', () => {
    const [endpoint] = extractOperationEndpoints({
      '/pets/{id}': {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        get: { responses: {} },
      },
    });
    expect(extractPathParameters(endpoint.operation, {})).toEqual([
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
    ]);
    const [overridden] = extractOperationEndpoints({
      '/pets/{id}': {
        parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } }],
        get: {
          parameters: [{ name: 'id', in: 'path', schema: { type: 'integer' } }],
          responses: {},
        },
      },
    });
    expect(extractPathParameters(overridden.operation, {})).toEqual([
      { name: 'id', in: 'path', schema: { type: 'integer' } },
    ]);
  });

  it.each([
    [{ type: 'integer', enum: [0, 1] }, 'const value: Model = 0;'],
    [
      { enum: [0, 'one', false, null, ''] },
      "const values: Model[] = [0, 'one', false, null, ''];",
    ],
    [
      {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'integer', enum: [0, 1] } },
      },
      'const value: Model = { status: 0 };',
    ],
  ] satisfies [Schema, string][])(
    'preserves numeric and mixed enum values %#',
    (schema, assignment) => {
      const { diagnostics, file } = generateModel(schema, assignment);
      expect(file.getText()).not.toMatch(/enum Model\s*\{\s*\}/);
      expect(diagnostics).toEqual([]);
    },
  );

  it('keeps string enum members available when an empty value is present', () => {
    const { diagnostics, file } = generateModel(
      { type: 'string', enum: ['', 'ON'] },
      "const values: Model[] = [Model[''], Model.ON];",
    );
    expect(file.getEnum('Model')).toBeDefined();
    expect(diagnostics).toEqual([]);
  });

  it('preserves optional properties in models and nested objects', () => {
    const { diagnostics, file } = generateModel(
      {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          optional: { type: 'string' },
          nested: {
            type: 'object',
            properties: { optional: { type: 'string' } },
          },
        },
      },
      "const value: Model = { id: '1', nested: {} };\n// @ts-expect-error id remains required\nconst invalid: Model = {};",
    );
    expect(diagnostics).toEqual([]);
    expect(
      file
        .getInterfaceOrThrow('Model')
        .getPropertyOrThrow('optional')
        .hasQuestionToken(),
    ).toBe(true);
  });

  it('allows optional properties alongside additional properties', () => {
    const schema: Schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: { type: 'string' },
    };
    expect(
      generateModel(schema, 'const value: Model = {};').diagnostics,
    ).toEqual([]);
    expect(
      generateModel(
        { type: 'object', properties: { nested: schema } },
        'const value: Model = { nested: {} };',
      ).diagnostics,
    ).toEqual([]);
  });

  it('preserves OpenAPI 3.0 nullable on properties and named schemas', () => {
    expect(
      generateModel(
        { type: 'string', nullable: true },
        'const value: Model = null;',
      ).diagnostics,
    ).toEqual([]);
    expect(
      generateModel(
        {
          type: 'object',
          required: ['value'],
          properties: { value: { type: 'string', nullable: true } },
        },
        'const value: Model = { value: null };',
      ).diagnostics,
    ).toEqual([]);
  });

  it('resolves reusable component aliases and rejects reference cycles', () => {
    const components = {
      schemas: {
        Alias: { $ref: '#/components/schemas/Value' },
        Value: { type: 'string' as const },
      },
    };
    expect(
      extractSchema({ $ref: '#/components/schemas/Alias' }, components),
    ).toEqual({ type: 'string' });
    expect(() =>
      extractSchema(
        { $ref: '#/components/schemas/Alias' },
        { schemas: { Alias: { $ref: '#/components/schemas/Alias' } } },
      ),
    ).toThrow(/cyclic/i);
  });
});

describe('allOf required and nullable interactions', () => {
  it.each([false, true])(
    'combines required fields across siblings (required-only: %s)',
    requiredOnly => {
      const schema: Schema = {
        allOf: [
          { type: 'object', properties: { id: { type: 'string' } } },
          requiredOnly
            ? { required: ['id'] }
            : {
                type: 'object',
                required: ['id'],
                properties: { id: { type: 'string' } },
              },
        ],
      };
      const { diagnostics } = generateModel(
        schema,
        "const valid: Model = { id: '1' };\n// @ts-expect-error allOf requires id\nconst invalid: Model = {};\n// @ts-expect-error the original string constraint remains\nconst wrong: Model = { id: 1 };\n// @ts-expect-error required string must not become undefined\nconst undefinedId: Model = { id: undefined };",
      );
      expect(diagnostics).toEqual([]);
    },
  );

  it('intersects a nullable reference instead of extending its union', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: { strict: true, skipLibCheck: true },
    });
    const file = project.createSourceFile('/types.ts', '');
    const schemas: Record<string, Schema> = {
      Base: {
        type: 'object',
        nullable: true,
        properties: { id: { type: 'string' } },
      },
      Derived: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          { type: 'object', properties: { name: { type: 'string' } } },
        ],
      },
      Required: {
        allOf: [{ $ref: '#/components/schemas/Base' }, { required: ['id'] }],
      },
    };
    for (const [name, schema] of Object.entries(schemas)) {
      new TypeGenerator({ name, path: '/' }, file, { key: name, schema }, '/', {
        schemas,
      }).generate();
    }
    file.addStatements(
      "const valid: Derived = { id: '1', name: 'test' };\n// @ts-expect-error the non-null object sibling excludes null\nconst invalid: Derived = null;\nconst nullable: Required = null;\nconst required: Required = { id: '1' };\n// @ts-expect-error required-only sibling rejects an object missing id\nconst missing: Required = {};",
    );
    expect(
      project.getPreEmitDiagnostics().map(d => d.getMessageText()),
    ).toEqual([]);
  });

  it('intersects nullable type with non-null allOf constraints', () => {
    expect(
      generateModel(
        {
          type: 'object',
          nullable: true,
          allOf: [{ type: 'object', properties: { id: { type: 'string' } } }],
        },
        'const valid: Model = {};\n// @ts-expect-error the allOf object constraint excludes null\nconst invalid: Model = null;',
      ).diagnostics,
    ).toEqual([]);
  });

  it('retains runtime members of a nullable string enum that excludes null', () => {
    expect(
      generateModel(
        { type: 'string', enum: ['ON'], nullable: true },
        'const valid: Model = Model.ON;\n// @ts-expect-error enum excludes null\nconst invalid: Model = null;',
      ).diagnostics,
    ).toEqual([]);
  });

  it('does not make null valid when enum excludes it', () => {
    expect(
      generateModel(
        { type: 'integer', enum: [0, 1], nullable: true },
        'const valid: Model = 0;\n// @ts-expect-error nullable does not remove enum restrictions\nconst invalid: Model = null;',
      ).diagnostics,
    ).toEqual([]);
    expect(
      generateModel(
        { type: 'integer', enum: [0, 1, null], nullable: true },
        'const valid: Model = null;',
      ).diagnostics,
    ).toEqual([]);
  });
});

describe('allOf preserves every referenced and inline constraint', () => {
  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    'retains inherited required properties (reverse: %s, two refs: %s)',
    (reverse, twoReferences) => {
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: { strict: true, skipLibCheck: true },
      });
      const file = project.createSourceFile('/types.ts', '');
      const members: (Schema | { $ref: string })[] = [
        { $ref: '#/components/schemas/Base' },
        twoReferences
          ? { $ref: '#/components/schemas/OptionalBase' }
          : {
              type: 'object',
              properties: { id: { type: 'string' }, other: { type: 'string' } },
            },
      ];
      const schemas: Record<string, Schema> = {
        Base: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        OptionalBase: {
          type: 'object',
          properties: { id: { type: 'string' }, other: { type: 'string' } },
        },
        Derived: { allOf: reverse ? [...members].reverse() : members },
      };
      for (const [name, schema] of Object.entries(schemas)) {
        new TypeGenerator(
          { name, path: '/' },
          file,
          { key: name, schema },
          '/',
          { schemas },
        ).generate();
      }
      file.addStatements(
        "const valid: Derived = { id: '1' };\n// @ts-expect-error inherited id remains required\nconst missing: Derived = {};\n// @ts-expect-error inherited id must be a string\nconst wrong: Derived = { id: 1 };\n// @ts-expect-error required does not permit undefined\nconst unset: Derived = { id: undefined };",
      );
      expect(
        project.getPreEmitDiagnostics().map(d => d.getMessageText()),
      ).toEqual([]);
    },
  );

  it.each([false, true])(
    'intersects incompatible properties instead of taking the last type: %s',
    reverse => {
      const members: Schema[] = [
        {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'number' } },
        },
      ];
      expect(
        generateModel(
          { allOf: reverse ? [...members].reverse() : members },
          "// @ts-expect-error string violates the number constraint\nconst stringId: Model = { id: '1' };\n// @ts-expect-error number violates the string constraint\nconst numberId: Model = { id: 1 };\n// @ts-expect-error id is still required\nconst missing: Model = {};",
        ).diagnostics,
      ).toEqual([]);
    },
  );
});

it('requires keys absent from an object schema properties map', () => {
  expect(
    generateModel(
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['id'],
      },
      'const valid: Model = { id: 1 };\n// @ts-expect-error required is independent from properties\nconst missing: Model = {};',
    ).diagnostics,
  ).toEqual([]);
});

describe('required additional property constraints', () => {
  it.each([true, false])(
    'uses the additional-property schema for required keys (properties present: %s)',
    withProperties => {
      const schema: Schema = {
        type: 'object',
        ...(withProperties
          ? { properties: { name: { type: 'string' as const } } }
          : {}),
        required: ['id'],
        additionalProperties: { type: 'string' },
      };
      const assignments =
        "const valid: Model = { id: '1' };\n// @ts-expect-error id is required\nconst missing: Model = {};\n// @ts-expect-error undeclared required id obeys additionalProperties\nconst wrong: Model = { id: 1 };";
      expect(generateModel(schema, assignments).diagnostics).toEqual([]);
      expect(
        generateModel(
          {
            type: 'object',
            required: ['nested'],
            properties: { nested: schema },
          },
          "const valid: Model = { nested: { id: '1' } };\n// @ts-expect-error nested id follows additionalProperties too\nconst wrong: Model = { nested: { id: 1 } };",
        ).diagnostics,
      ).toEqual([]);
    },
  );

  it.each([false, true, undefined])(
    'respects boolean/default additionalProperties: %s',
    additionalProperties => {
      const schema: Schema = {
        type: 'object',
        properties: {},
        required: ['id'],
        additionalProperties,
      };
      const assignments =
        additionalProperties === false
          ? "// @ts-expect-error a forbidden required field makes the schema impossible\nconst invalid: Model = { id: '1' };"
          : "const valid: Model[] = [{ id: null }, { id: 1 }, { id: '1' }];\n// @ts-expect-error id cannot be missing\nconst missing: Model = {};";
      expect(generateModel(schema, assignments).diagnostics).toEqual([]);
    },
  );
});
