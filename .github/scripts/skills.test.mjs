/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  MIGRATION_SKILL,
  REMOVED_REACT_EXPORTS,
  moduleExports,
  parseYaml,
  skillProblems,
  workspacePackages,
} from './skills.mjs';

const repository = fileURLToPath(new URL('../..', import.meta.url));

function write(root, files) {
  for (const [path, content] of Object.entries(files)) {
    // `null` removes a file or directory a fixture wrote earlier.
    if (content === null) {
      rmSync(join(root, path), { recursive: true, force: true });
      continue;
    }
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(
      join(root, path),
      typeof content === 'string' ? content : JSON.stringify(content),
    );
  }
  return root;
}

const firedGrader = (name, negative = false) =>
  `---\ntype: tool_used\ntool: Skill\ninput_match: '"skill"\\s*:\\s*"(?:[\\w-]+:)?${name}"'\n${negative ? 'min: 0\nmax: 0\narm: both\n' : ''}---\n\nFired.\n`;

function evalCase(name, caseName, { negative = false } = {}) {
  const dir = `skills/${name}/evals/${caseName}`;
  return {
    [`${dir}/prompt.md`]: `---\nname: ${caseName}\ntags: [${negative ? 'negative' : 'trigger'}]\nruns: 3\nmax_turns: 8\nallowed_tools: [Read, Glob, Grep, Skill]\n---\n\nPrompt for ${caseName}.\n`,
    [`${dir}/graders/skill.md`]: firedGrader(name, negative),
    [`${dir}/graders/criteria.md`]:
      '---\ntype: llm\nweight: 1\n---\n\nNames `Client`.\n',
  };
}

function skill(name, { body = '', description } = {}) {
  return {
    [`skills/${name}/SKILL.md`]: `---\nname: ${name}\ndescription: >\n  ${description ?? `Use ${name} when testing.`}\n---\n\n${body}\n`,
    [`skills/${name}/references/api.md`]: '# API\n',
    [`skills/${name}/agents/openai.yaml`]: `interface:\n  display_name: 'X'\n  short_description: 'Y'\n  default_prompt: 'Use $${name} to test.'\n`,
    ...evalCase(name, 'first'),
    ...evalCase(name, 'second'),
    ...evalCase(name, 'elsewhere', { negative: true }),
  };
}

const migrationBody = `The \`@ahoo-wang/wow-*\` packages are not on npm yet.\n\n${REMOVED_REACT_EXPORTS.join(', ')}`;

function workspace(files) {
  const root = mkdtempSync(join(tmpdir(), 'skills-'));
  return write(root, {
    'packages/core/package.json': {
      name: '@ahoo-wang/fetcher',
      exports: {
        '.': { types: './dist/index.d.ts' },
        './extra': {
          import: {
            types: './dist/extra/index.d.ts',
            default: './dist/extra.es.js',
          },
          require: {
            types: './dist/extra/index.d.cts',
            default: './dist/extra.cjs',
          },
        },
      },
    },
    'packages/core/src/index.ts':
      "export * from './client.js';\nexport { helper as publicHelper, type Shape } from './helper';\nexport type {\n  // grouped\n  Options,\n} from './options.js';\n",
    'packages/core/src/client.ts':
      'export class Client {}\nexport default Client;\nexport const enum Mode { A }\n/* export class Hidden {} */\n',
    'packages/core/src/helper.ts':
      'export function helper() {}\nexport interface Shape {}\n',
    'packages/core/src/options.ts': 'export interface Options {}\n',
    'packages/core/src/extra/index.ts': 'export async function extra() {}\n',
    ...skill(MIGRATION_SKILL, { body: migrationBody }),
    ...files,
  });
}

test("this repository's skills are consistent with the packages", () => {
  assert.deepEqual(skillProblems(repository), []);
});

test('the export walker follows star, named and declared exports', () => {
  const root = workspace({});
  const names = moduleExports(join(root, 'packages/core/src/index.ts'));
  assert.deepEqual(
    [...names].sort(),
    ['Client', 'Mode', 'Options', 'Shape', 'publicHelper'].sort(),
  );
  assert.deepEqual(
    [...workspacePackages(root).get('@ahoo-wang/fetcher').entries.keys()],
    ['.', './extra'],
  );
});

test('a well-formed skill passes', () => {
  const root = workspace(
    skill('good', {
      body: "```ts\nimport { Client, publicHelper as h, type Options } from '@ahoo-wang/fetcher';\nimport { extra } from '@ahoo-wang/fetcher/extra';\n```\nSee `Client` and `$good`.",
    }),
  );
  assert.deepEqual(skillProblems(root), []);
});

test('imports of names a package does not export fail', () => {
  const root = workspace(
    skill('bad', {
      body: "```ts\nimport {\n  // old name\n  LegacyClient,\n  Client,\n} from '@ahoo-wang/fetcher';\nimport { nope } from '@ahoo-wang/fetcher/missing';\n```",
    }),
  );
  assert.deepEqual(skillProblems(root), [
    "skills/bad/SKILL.md: import { LegacyClient } from '@ahoo-wang/fetcher': not exported",
    "skills/bad/SKILL.md: import from '@ahoo-wang/fetcher/missing': no such entry point",
  ]);
});

test('backticked API names in SKILL.md must be exported somewhere', () => {
  const root = workspace(
    skill('prose', {
      body: 'Use `GhostClient` and `useGhost()` with `Response`, then `Client.create()`.',
    }),
  );
  assert.deepEqual(skillProblems(root), [
    'skills/prose/SKILL.md: `GhostClient` is not exported by any package here',
    'skills/prose/SKILL.md: `useGhost()` is not exported by any package here',
  ]);
});

test('frontmatter, links, agents and evals are checked', () => {
  const long = Array.from({ length: 61 }, () => 'word').join(' ');
  const root = workspace({
    ...skill('wrong', { description: long }),
    'skills/wrong/SKILL.md': `---\nname: renamed\ndescription: ${long}\n---\n\nLoad \`references/missing.md\`; see $no-such-skill.\n`,
    'skills/wrong/agents/openai.yaml': "interface:\n  display_name: 'X'\n",
  });
  assert.deepEqual(skillProblems(root), [
    "skills/wrong/SKILL.md: name 'renamed' ≠ directory 'wrong'",
    'skills/wrong/SKILL.md: description has 61 words (budget 60)',
    'skills/wrong/SKILL.md: references/missing.md not found',
    'skills/wrong/agents/openai.yaml: interface.short_description missing',
    'skills/wrong/agents/openai.yaml: interface.default_prompt missing',
    'skills/wrong/agents/openai.yaml: interface.default_prompt does not name $wrong',
    'skills/wrong/SKILL.md: $no-such-skill is not a skill here',
  ]);
});

test('eval suites must be in the claude plugin eval format', () => {
  const root = workspace({
    ...skill('evals'),
    'skills/evals/evals/evals.json': { skill_name: 'evals', evals: [] },
    'skills/evals/evals/first/prompt.md':
      '---\nname: other\nruns: many\ntags: trigger\nturns: 3\n---\n\n',
    'skills/evals/evals/second/graders/criteria.md':
      '---\ntype: judge\n---\n\nx\n',
    'skills/evals/evals/second/graders/empty.md': '---\ntype: llm\n---\n\n',
    'skills/evals/evals/second/graders/arm.md':
      '---\ntype: regex\npattern: x\narm: without\n---\n\nx\n',
    'skills/evals/evals/elsewhere/graders/skill.md': firedGrader(
      'evals',
      true,
    ).replace('arm: both\n', ''),
    'skills/evals/evals/results/2026-01-01/aggregate-result.json': '{}',
  });
  assert.deepEqual(skillProblems(root), [
    'skills/evals/evals/evals.json: skill-creator format is not read by `claude plugin eval`; use evals/<case>/prompt.md + graders/',
    'skills/evals/evals/elsewhere/graders/skill.md: a negative trigger check must set `arm: both`, or `--ablation with-without` leaves it unscored',
    'skills/evals/evals/first/prompt.md: unknown key turns',
    "skills/evals/evals/first/prompt.md: name 'other' ≠ directory 'first'",
    'skills/evals/evals/first/prompt.md: runs must be a positive integer',
    'skills/evals/evals/first/prompt.md: tags must be a list',
    'skills/evals/evals/first/prompt.md: prompt body is empty',
    "skills/evals/evals/second/graders/arm.md: unknown arm 'without' (use with-only or both)",
    "skills/evals/evals/second/graders/criteria.md: unknown grader type 'judge'",
    'skills/evals/evals/second/graders/empty.md: llm grader has no criteria',
  ]);
});

test('a skill needs three cases, a firing case and a negative case', () => {
  const root = workspace({
    ...skill('thin'),
    'skills/thin/evals/elsewhere/graders/skill.md': firedGrader('other', true),
    'skills/thin/evals/second/prompt.md': null,
    'skills/thin/evals/second/graders/skill.md': null,
  });
  assert.deepEqual(skillProblems(root), [
    'skills/thin/evals/second/prompt.md: missing',
    'skills/thin/evals: no negative case (a tool_used Skill grader naming thin with max: 0)',
  ]);
  const bare = workspace({
    ...skill('bare'),
    'skills/bare/evals/second': null,
    'skills/bare/evals/elsewhere': null,
    'skills/bare/evals/first/graders/skill.md': null,
  });
  assert.deepEqual(skillProblems(bare), [
    'skills/bare/evals: needs at least 3 cases (evals/<case>/prompt.md), found 1',
    'skills/bare/evals: no case asserts that bare fires (a tool_used Skill grader naming it)',
    'skills/bare/evals: no negative case (a tool_used Skill grader naming bare with max: 0)',
  ]);
});

test('only the migration skill may name packages that left or are not here', () => {
  const root = workspace(
    skill('pointer', {
      body: 'Wow hooks moved to `@ahoo-wang/wow-react`; `@ahoo-wang/fetcher-wow` is gone.',
    }),
  );
  assert.deepEqual(skillProblems(root), [
    'skills/pointer/SKILL.md: @ahoo-wang/wow-react is not published from this repository (only $fetcher-v6-migration may name it)',
    'skills/pointer/SKILL.md: @ahoo-wang/fetcher-wow is not published from this repository (only $fetcher-v6-migration may name it)',
  ]);
});

test('the migration skill must say the Wow packages are not on npm and list every removed export', () => {
  const root = workspace(
    skill(MIGRATION_SKILL, {
      body: "Install `@ahoo-wang/wow-react`.\n\n```diff\n-import { usePagedQuery } from '@ahoo-wang/fetcher';\n+import { Client } from '@ahoo-wang/fetcher';\n```",
    }),
  );
  const problems = skillProblems(root);
  assert.ok(
    problems.includes(
      `skills/${MIGRATION_SKILL}/SKILL.md: names @ahoo-wang/wow-* but never says they are not on npm yet`,
    ),
  );
  assert.ok(
    problems.includes(
      `skills/${MIGRATION_SKILL}/SKILL.md: removed export useDataMonitor is not listed`,
    ),
  );
  // The removed side of a diff is not checked as an import.
  assert.ok(!problems.some(line => line.includes('import { usePagedQuery }')));
});

test('the YAML subset parser reads block scalars and rejects the rest', () => {
  assert.deepEqual(
    parseYaml("a:\n  b: 'it''s'\n  c: >\n    one\n    two\nd: \"x\"\n"),
    { a: { b: "it's", c: 'one two' }, d: 'x' },
  );
  assert.deepEqual(parseYaml('a: [Read, \'b, c\', "d"]\nb: []\n'), {
    a: ['Read', 'b, c', 'd'],
    b: [],
  });
  assert.throws(() => parseYaml('- item\n'), /unsupported YAML/);
  assert.throws(() => parseYaml('a: [[1]]\n'), /unsupported YAML value/);
  assert.throws(() => parseYaml('a: {b: 1}\n'), /unsupported YAML value/);
  assert.throws(() => parseYaml('a: 1\na: 2\n'), /duplicate key/);
});

// When TypeScript and built declarations are present (a local run after
// `pnpm install && pnpm build`), the source walker must agree with the
// compiler about every published entry point. CI runs this file before
// installing, where it is skipped.
const require = createRequire(import.meta.url);
let typescript;
try {
  typescript = require(join(repository, 'node_modules/typescript'));
} catch {
  typescript = undefined;
}
const built = existsSync(join(repository, 'packages/fetcher/dist/index.d.ts'));

test(
  'the source walker matches the compiler on the built declarations',
  { skip: !typescript || !built ? 'needs pnpm install and pnpm build' : false },
  () => {
    for (const [name, { entries }] of workspacePackages(repository))
      for (const [subpath, source] of entries) {
        const declaration = source
          .replace(/[/\\]src[/\\]/, '/dist/')
          .replace(/\.ts$/, '.d.ts');
        const program = typescript.createProgram([declaration], {
          skipLibCheck: true,
        });
        const checker = program.getTypeChecker();
        const symbol = checker.getSymbolAtLocation(
          program.getSourceFile(declaration),
        );
        const compiler = checker
          .getExportsOfModule(symbol)
          .map(exported => exported.name)
          .sort();
        assert.deepEqual(
          [...moduleExports(source)].sort(),
          compiler,
          `${name} ${subpath}`,
        );
      }
  },
);
