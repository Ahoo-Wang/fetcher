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

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Holds `check-wow-conformance.mjs` to finding every shape Kotlin states a
 * rule with.
 *
 * The script is the only thing that can notice a rule Wow adds upstream, and
 * it reports success by finding nothing — so a gap in how it reads Kotlin
 * looks exactly like conformance. Two earlier drafts were wrong that way: one
 * stopped at the first `)` and saw a third of the rules, the other knew only
 * `require`. The fixture beside this file carries one rule in each shape, and
 * the script has to name all of them.
 */
const script = fileURLToPath(
  new URL('../../scripts/check-wow-conformance.mjs', import.meta.url),
);
const fixture = fileURLToPath(
  new URL('../fixtures/wow-synthetic', import.meta.url),
);

const run = () => {
  const result = spawnSync(process.execPath, [script, fixture], {
    encoding: 'utf8',
  });
  return { ...result, output: `${result.stdout}${result.stderr}` };
};

describe('check-wow-conformance', () => {
  it.each([
    'Synthetic plain require.',
    'Synthetic require with parentheses in its condition.',
    'Synthetic requireNotNull.',
    'Synthetic check.',
    'Synthetic checkNotNull.',
    'Synthetic error call.',
    'Synthetic throw.',
    'Synthetic paren inside a string.',
    'Synthetic paren inside a char.',
    'Synthetic paren inside a block comment.',
    'Synthetic paren inside a line comment.',
    'Synthetic paren inside a template.',
    // The template holds a string of its own; the message must not end there.
    'Synthetic ${listOf("nested").first()} message.',
  ])('reads a rule stated as: %s', rule => {
    expect(run().output).toContain(rule);
  });

  // Wire values are compared from the Kotlin side, and each shape of drift
  // has a line in `SyntheticEnums.kt` that should produce it.
  it.each([
    [
      'a value Wow gained',
      'AggregationFunction.MEDIAN: Wow has it, this package does not',
    ],
    [
      'a value Wow dropped',
      'SearchMode.PHRASE: this package sends it, Wow does not know it',
    ],
    [
      'a kept-here-only value Wow brought back',
      'Operator.RAW: listed as kept here only, which is no longer true',
    ],
    ['an enum with no counterpart', 'SyntheticOnlyInWow: no counterpart here'],
    [
      'discriminators on a sealed interface',
      'SyntheticDispatch: no counterpart here',
    ],
    [
      'an entry that is not UPPER_SNAKE',
      'Direction.random: Wow has it, this package does not',
    ],
    [
      'a discriminator holding a hyphen, past an annotation with brackets',
      'HavingExpression.not-null: Wow has it, this package does not',
    ],
    // The fixture declares no FilterOperator: to the checker, Wow deleted it.
    [
      'an enum Wow deleted outright',
      'FilterOperator: this package sends it, Wow does not declare it',
    ],
  ])('reports %s', (_shape, report) => {
    expect(run().output).toContain(report);
  });

  it('exits non-zero when the register does not name a rule', () => {
    // None of the fixture's rules is in the register, so every one of them is
    // reported and the run fails. That is the whole contract.
    expect(run().status).toBe(1);
  });

  it('refuses a directory that is not a Wow checkout', () => {
    const result = spawnSync(process.execPath, [script, fixture + '/wow-api'], {
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('Not a Wow checkout');
  });
});
