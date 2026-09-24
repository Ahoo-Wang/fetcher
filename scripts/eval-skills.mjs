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

/**
 * `pnpm eval:skills [skill…]` — runs each skill's eval suite
 * (`skills/<name>/evals/<case>/prompt.md` + `graders/*.md`) with
 * `claude plugin eval`, one skill directory at a time, and prints a summary.
 *
 * Local only: every run is a real agent session on your Claude login and costs
 * money, so CI never runs it (CI checks the suites' shape in
 * `.github/scripts/skills.mjs`). Reports land in `skills/<name>/evals/results/`
 * (git-ignored).
 *
 * Environment:
 * - `SKILLS_EVAL_MAX_COST`: per-skill `--max-cost-usd` ceiling (default 2).
 * - `SKILLS_EVAL_RUNS`: `--runs` per case, overriding each case's `runs`
 *   (default 1).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const skillsDir = join(root, 'skills');

function positiveNumber(name, fallback, integer = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    (integer && !Number.isInteger(value))
  ) {
    console.error(
      `${name} must be a positive ${integer ? 'integer' : 'number'}, got '${raw}'`,
    );
    process.exit(2);
  }
  return value;
}

const maxCost = positiveNumber('SKILLS_EVAL_MAX_COST', 2);
const runs = positiveNumber('SKILLS_EVAL_RUNS', 1, true);

const all = readdirSync(skillsDir, { withFileTypes: true })
  .filter(
    entry =>
      entry.isDirectory() && existsSync(join(skillsDir, entry.name, 'evals')),
  )
  .map(entry => entry.name)
  .sort();
const requested = process.argv.slice(2);
const unknown = requested.filter(name => !all.includes(name));
if (unknown.length > 0) {
  console.error(
    `No eval suite for: ${unknown.join(', ')} (have: ${all.join(', ')})`,
  );
  process.exit(2);
}
const skills = requested.length > 0 ? requested : all;

const results = [];
for (const skill of skills) {
  console.log(`\n=== ${skill} (runs ${runs}, max $${maxCost})`);
  const started = Date.now();
  const run = spawnSync(
    'claude',
    [
      'plugin',
      'eval',
      '.',
      '--trust-plugin',
      '--no-publish',
      '--runs',
      String(runs),
      '--max-cost-usd',
      String(maxCost),
    ],
    { cwd: join(skillsDir, skill), stdio: 'inherit' },
  );
  if (run.error)
    console.error(`  could not start claude: ${run.error.message}`);
  results.push({
    skill,
    code: run.error ? 127 : (run.status ?? 1),
    seconds: Math.round((Date.now() - started) / 1000),
  });
}

// `claude plugin eval` exits 1 when a case scores below the threshold and 2
// when the cost ceiling aborts the run.
const meaning = code =>
  ({
    0: 'pass',
    1: 'below threshold',
    2: 'cost ceiling hit',
    127: 'claude not found',
  })[code] ?? 'error';
console.log('\nSkill evals:');
for (const { skill, code, seconds } of results)
  console.log(
    `  ${skill.padEnd(28)} exit ${String(code).padEnd(4)} ${meaning(code).padEnd(16)} ${seconds}s`,
  );
const failed = results.filter(({ code }) => code !== 0);
console.log(
  failed.length === 0
    ? `All ${results.length} suites passed.`
    : `${failed.length} of ${results.length} suites did not pass: ${failed.map(({ skill }) => skill).join(', ')}`,
);
process.exit(failed.length === 0 ? 0 : 1);
