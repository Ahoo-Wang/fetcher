#!/usr/bin/env node
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
 * Diffs the conformance register against a Wow checkout.
 *
 * The register in `test/query/wowConformance.test.ts` says how this package
 * treats each rule Wow enforces, and its tests keep those answers honest. What
 * they cannot see is a rule Wow added after the register was written: nothing
 * fails, the rule is simply absent, and the first sign of it is a 400 in
 * someone's application. This script is that missing half.
 *
 * It reads the protocol package — `wow-api`'s query package, which is the
 * contract a client speaks — and reports any message the register does not
 * name, and any name the register still carries that Wow no longer throws.
 *
 *   node scripts/check-wow-conformance.mjs ../../../Wow
 *   WOW_HOME=/path/to/Wow node scripts/check-wow-conformance.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REGISTER = join(here, '..', 'test', 'query', 'wowConformance.test.ts');

/** The protocol a client speaks. Schema and backend rules live elsewhere. */
const PROTOCOL_DIR = join(
  'wow-api',
  'src',
  'main',
  'kotlin',
  'me',
  'ahoo',
  'wow',
  'api',
  'query',
);

/**
 * Messages in that package the register deliberately leaves out.
 *
 * `LegacyConditionAdapter.kt` converts the deprecated `Condition` shape into a
 * `FilterExpression` on the server. This package can still build a `Condition`
 * for an older server, but the conversion is not a rule its builders can break.
 */
const OUT_OF_SCOPE_FILES = ['LegacyConditionAdapter.kt'];

function kotlinFiles(root) {
  const dir = join(root, PROTOCOL_DIR);
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`Not a Wow checkout: no ${PROTOCOL_DIR} under ${root}`);
  }
  const out = [];
  const walk = current => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (
        entry.name.endsWith('.kt') &&
        !OUT_OF_SCOPE_FILES.includes(entry.name)
      )
        out.push(path);
    }
  };
  walk(dir);
  return out;
}

/**
 * Reduces a message to what can be compared across the two sources.
 *
 * Kotlin interpolates (`${AggregationQuery.MAX_SORT_FIELDS}`), the register
 * writes the constant's bare name, and neither spelling is the rule. Collapsing
 * every interpolation to one token compares what the rule actually says.
 */
function normalize(message) {
  return message
    .replace(/\$\{[^}]*\}/g, '$')
    .replace(/\$[A-Za-z_]\w*/g, '$')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reads the string a `require`/`check` fails with, and every thrown message.
 *
 * The condition of a `require` holds parentheses of its own, so this balances
 * them rather than matching to the first `)` — an earlier regex stopped at
 * `require(operands.isNotEmpty()` and silently found a third of the rules.
 *
 * Kotlin states a rule in more than one way, and a checker that knows only
 * `require` reports success while missing the rest. `requireNotNull` and
 * `checkNotNull` take the same trailing message block; `error(...)` and a bare
 * `throw` take the message as their first argument.
 */
function messagesIn(source) {
  const found = [];
  const literal = /"((?:[^"\\]|\\.)*)"/y;

  const readFrom = (from, within) => {
    literal.lastIndex = from;
    const slice = source.slice(from, from + within);
    const match = /"((?:[^"\\]|\\.)*)"/.exec(slice);
    if (match) found.push(match[1]);
  };

  for (const match of source.matchAll(
    /\b(?:require|check)(?:NotNull)?\s*\(/g,
  )) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (index < source.length && depth > 0) {
      const char = source[index];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      index++;
    }
    // The lazy message block follows the condition: `require(x) { "…" }`.
    const tail = source.slice(index, index + 400);
    const block = /^\s*\{/.exec(tail);
    if (block) readFrom(index, 400);
  }
  for (const match of source.matchAll(
    /\bthrow\s+\w*(?:Exception|Error)\s*\(|\berror\s*\(/g,
  ))
    readFrom(match.index + match[0].length, 400);

  return found;
}

/** Every rule Wow states in the protocol package, normalized. */
function wowRules(root) {
  const found = new Map();
  for (const file of kotlinFiles(root))
    for (const message of messagesIn(readFileSync(file, 'utf8')))
      found.set(normalize(message), message);
  return found;
}

/** Every rule the register names, with the disambiguating suffix removed. */
function registeredRules() {
  const source = readFileSync(REGISTER, 'utf8');
  const names = new Map();
  for (const match of source.matchAll(
    /\bwow:\s*\n?\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g,
  )) {
    const raw = (match[1] ?? match[2] ?? '').replace(/\\(['"\\])/g, '$1');
    names.set(normalize(raw.replace(/\s*\([^)]*\)$/, '')), raw);
  }
  if (names.size === 0) throw new Error(`No rules found in ${REGISTER}`);
  return names;
}

const root = resolve(process.argv[2] ?? process.env.WOW_HOME ?? '');
if (!process.argv[2] && !process.env.WOW_HOME) {
  console.error(
    'Usage: node scripts/check-wow-conformance.mjs <path-to-Wow>  (or set WOW_HOME)',
  );
  process.exit(2);
}

const wow = wowRules(root);
const registered = registeredRules();

const missing = [...wow]
  .filter(([key]) => !registered.has(key))
  .map(([, message]) => message)
  .sort();
const stale = [...registered]
  .filter(([key]) => !wow.has(key))
  .map(([, message]) => message)
  .sort();

console.log(
  `wow-api query rules: ${wow.size}   register entries: ${registered.size}`,
);

if (missing.length > 0) {
  console.error(
    `\n${missing.length} rule(s) Wow enforces that the register does not name:`,
  );
  for (const rule of missing) console.error(`  + ${rule}`);
} else {
  console.log('\nEvery wow-api query rule is named in the register.');
}

if (stale.length > 0) {
  console.log(
    `\n${stale.length} register entr(ies) not found in wow-api — expected for` +
      ' wow-query and backend rules, worth a look otherwise:',
  );
  for (const rule of stale) console.log(`  ? ${rule}`);
}

process.exit(missing.length > 0 ? 1 : 0);
