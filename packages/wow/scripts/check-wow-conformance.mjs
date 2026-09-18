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

/*
 * A small Kotlin lexer, just enough to find where a call's arguments end.
 *
 * A bracket inside a string, a char literal or a comment is not syntax, and
 * treating it as syntax is how this script has gone blind before:
 * `require(value != ")") { "…" }` closed the call at the quoted `)` and the
 * rule vanished, with the checker still reporting success. Each helper takes
 * the index of the token's first character and returns the index just past it.
 */

function skipLineComment(source, index) {
  const end = source.indexOf('\n', index);
  return end < 0 ? source.length : end + 1;
}

function skipBlockComment(source, index) {
  const end = source.indexOf('*/', index + 2);
  return end < 0 ? source.length : end + 2;
}

function skipRawString(source, index) {
  const end = source.indexOf('"""', index + 3);
  return end < 0 ? source.length : end + 3;
}

/** A `"…"` string, including `${…}` templates that may hold strings of their own. */
function skipString(source, index) {
  let at = index + 1;
  while (at < source.length) {
    const char = source[at];
    if (char === '\\') at += 2;
    else if (char === '"') return at + 1;
    else if (char === '$' && source[at + 1] === '{')
      at = skipBalanced(source, at + 2, '{', '}');
    else at += 1;
  }
  return at;
}

function skipChar(source, index) {
  let at = index + 1;
  while (at < source.length && source[at] !== "'")
    at += source[at] === '\\' ? 2 : 1;
  return at + 1;
}

/** Skips a token that brackets inside it cannot count against, or returns -1. */
function skipOpaque(source, index) {
  const char = source[index];
  const next = source[index + 1];
  if (char === '/' && next === '/') return skipLineComment(source, index);
  if (char === '/' && next === '*') return skipBlockComment(source, index);
  if (source.startsWith('"""', index)) return skipRawString(source, index);
  if (char === '"') return skipString(source, index);
  if (char === "'") return skipChar(source, index);
  return -1;
}

/** Index just past the bracket that closes one opened before `index`. */
function skipBalanced(source, index, open, close) {
  let depth = 1;
  let at = index;
  while (at < source.length && depth > 0) {
    const skipped = skipOpaque(source, at);
    if (skipped >= 0) {
      at = skipped;
      continue;
    }
    if (source[at] === open) depth += 1;
    else if (source[at] === close) depth -= 1;
    at += 1;
  }
  return at;
}

/** Past whitespace and comments, which may sit between a call and its block. */
function skipTrivia(source, index) {
  let at = index;
  while (at < source.length) {
    if (/\s/.test(source[at])) at += 1;
    else if (source.startsWith('//', at)) at = skipLineComment(source, at);
    else if (source.startsWith('/*', at)) at = skipBlockComment(source, at);
    else break;
  }
  return at;
}

/** The text of the string literal starting at `index`, or null if none does. */
function literalAt(source, index) {
  if (source.startsWith('"""', index))
    return source.slice(index + 3, skipRawString(source, index) - 3);
  if (source[index] === '"')
    return source.slice(index + 1, skipString(source, index) - 1);
  return null;
}

/**
 * Every message a rule is stated with in one Kotlin file.
 *
 * Kotlin states a rule in more than one way, and a checker that knows only one
 * reports success while missing the rest: `require`, `check` and their
 * `NotNull` forms take a trailing `{ "…" }` block; `error(…)` and a `throw`
 * take the message as their first argument.
 */
function messagesIn(source) {
  const found = [];
  const push = message => {
    if (message !== null) found.push(message);
  };

  for (const match of source.matchAll(
    /\b(?:require|check)(?:NotNull)?\s*\(/g,
  )) {
    const closed = skipBalanced(
      source,
      match.index + match[0].length,
      '(',
      ')',
    );
    const block = skipTrivia(source, closed);
    if (source[block] === '{')
      push(literalAt(source, skipTrivia(source, block + 1)));
  }
  for (const match of source.matchAll(
    /\bthrow\s+\w*(?:Exception|Error)\s*\(|\berror\s*\(/g,
  ))
    push(literalAt(source, skipTrivia(source, match.index + match[0].length)));

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

/*
 * Wire values: every enum in the protocol package, and the `@JsonSubTypes`
 * names a sealed interface is dispatched on. They drift the way rules do —
 * Wow adds `AggregationFunction.MEDIAN` and nothing here notices — so they are
 * compared from the Kotlin side: a value Wow has that this package lacks is
 * missing, and a value this package sends that Wow does not know is refused
 * with a 400 unless it is accounted for below.
 */

/** Kotlin names whose counterpart here is spelled differently. */
const ENUM_NAMES = {
  // The wire discriminator `op` is the @JsonSubTypes name, which only happens
  // to agree with `enum class FilterOperator`; both are held to it here.
  FilterExpression: 'FilterOperator',
  Direction: 'SortDirection',
  AggregationGroup: 'AggregationGroupType',
  AggregationExpression: 'AggregationExpressionType',
  AggregationMetric: 'AggregationMetricType',
  DerivedExpression: 'DerivedExpressionType',
  HavingExpression: 'HavingExpressionType',
};

/**
 * Enums Wow uses from the JDK rather than declaring, so they appear in no
 * wow-api source. `RelativeTimeFilter.timeUnit` and `Temporal.Epoch.timeUnit`
 * take `java.util.concurrent.TimeUnit` directly; its constants have been fixed
 * since Java 6, and this package's `TimeUnit` must still match them.
 */
const JDK_ENUMS = {
  TimeUnit: [
    'NANOSECONDS',
    'MICROSECONDS',
    'MILLISECONDS',
    'SECONDS',
    'MINUTES',
    'HOURS',
    'DAYS',
  ],
};

/** Kotlin enums this package has no reason to mirror, and why. */
const SERVER_ONLY_ENUMS = {
  QueryCardinality:
    'Schema metadata. This package neither holds nor sends a schema.',
  QueryValueKind: 'Schema metadata, as above.',
  QuerySemanticType:
    'How a schema says a temporal field is stored (TEMPORAL_DATE, TEMPORAL_EPOCH, TEMPORAL_FORMATTED). Schema metadata, as above.',
};

/** Values kept here that current Wow does not have, and why. */
const TS_ONLY_VALUES = {
  Operator: {
    RAW: 'Removed from Wow in #2999. The deprecated Condition API exists for servers older than that, which still accept it.',
  },
};

/** Index just past the brace that closes the one opened before `index`. */
function closeBrace(source, index) {
  return skipBalanced(source, index, '{', '}');
}

/** Splits `source` at `separator` wherever it is not nested in anything. */
function splitTopLevel(source, separator) {
  const parts = [];
  let depth = 0;
  let start = 0;
  let at = 0;
  while (at < source.length) {
    const skipped = skipOpaque(source, at);
    if (skipped >= 0) {
      at = skipped;
      continue;
    }
    const char = source[at];
    if ('([{'.includes(char)) depth += 1;
    else if (')]}'.includes(char)) depth -= 1;
    else if (char === separator && depth === 0) {
      parts.push(source.slice(start, at));
      start = at + 1;
    }
    at += 1;
  }
  parts.push(source.slice(start));
  return parts;
}

/** Past any annotations, and their bracketed arguments, starting at `index`. */
function skipAnnotations(source, index) {
  let at = skipTrivia(source, index);
  while (source[at] === '@') {
    const name = /^@[\w.]+/.exec(source.slice(at));
    if (!name) break;
    at = skipTrivia(source, at + name[0].length);
    if (source[at] === '(')
      at = skipTrivia(source, skipBalanced(source, at + 1, '(', ')'));
  }
  return at;
}

/**
 * Every `const val NAME = "…"` in a file, keyed by the path it is referred to
 * by. Wow spells its most important discriminators this way —
 * `name = QueryProtocol.FilterExpression.Operator.MATCH_ALL` on all fifty
 * filter operators — so reading only literals would skip the one set of wire
 * values that matters most. Scopes are the enclosing `object`s, which is how
 * QueryProtocol nests them.
 */
function constantsIn(source, into) {
  const scopes = [];
  let depth = 0;
  let pending = null;
  let at = 0;
  while (at < source.length) {
    const skipped = skipOpaque(source, at);
    if (skipped >= 0) {
      at = skipped;
      continue;
    }
    const head = source.slice(at, at + 160);
    const boundary = at === 0 || !/[\w$]/.test(source[at - 1]);
    const object = boundary && /^object\s+(\w+)/.exec(head);
    if (object) {
      pending = object[1];
      at += object[0].length;
      continue;
    }
    const constant =
      boundary && /^const\s+val\s+(\w+)\s*(?::\s*\w+\s*)?=\s*/.exec(head);
    if (constant) {
      const value = literalAt(source, at + constant[0].length);
      if (value !== null)
        into.set(
          [...scopes.map(scope => scope.name), constant[1]].join('.'),
          value,
        );
      at += constant[0].length;
      continue;
    }
    // An object with no body names nothing, so a later brace is not its own.
    if (
      source[at] === '\n' &&
      /^\s*(?:@|(?:data|class|interface|fun|val|var|sealed|enum|private|internal|public|override|const)\b)/.test(
        source.slice(at + 1, at + 40),
      )
    )
      pending = null;
    if (source[at] === '{') {
      depth += 1;
      if (pending) {
        scopes.push({ name: pending, depth });
        pending = null;
      }
    } else if (source[at] === '}') {
      if (scopes.at(-1)?.depth === depth) scopes.pop();
      depth -= 1;
    }
    at += 1;
  }
}

/**
 * The value a reference like `QueryProtocol.FilterExpression.Operator.ID` or a
 * bare `NEW_TYPE` stands for. A key matches when one is a segment-suffix of the
 * other, and only a single match counts: an ambiguous reference is unreadable,
 * and unreadable is reported rather than guessed at.
 */
function resolveConstant(reference, constants) {
  if (constants.has(reference)) return constants.get(reference);
  const matches = [...constants.keys()].filter(
    key => key.endsWith(`.${reference}`) || reference.endsWith(`.${key}`),
  );
  return matches.length === 1 ? constants.get(matches[0]) : undefined;
}

/**
 * The name of the interface an annotation belongs to, skipping any further
 * annotations between them. Their arguments hold brackets of their own —
 * `@Schema(oneOf = [...])` — so they are stepped over with the lexer.
 */
function interfaceAfter(source, index) {
  const at = skipAnnotations(source, index);
  const declaration =
    /^(?:(?:sealed|abstract|public|internal|private)\s+)*interface\s+(\w+)/.exec(
      source.slice(at),
    );
  return declaration ? declaration[1] : null;
}

/**
 * Every enum and discriminator set in the protocol package, and every place
 * the parser recognised one but could not read it.
 *
 * Failing closed is the point. Each blind spot this checker has had took the
 * same shape: a name it could not read was dropped, the rest still matched,
 * and the run reported success. Comparing both ways catches a name that goes
 * missing whole; it cannot catch one value dropped from a set that otherwise
 * matches on both sides. So a value that cannot be read is an error here.
 */
function wowEnums(root) {
  const files = kotlinFiles(root).map(file => readFileSync(file, 'utf8'));
  const constants = new Map();
  for (const source of files) constantsIn(source, constants);

  const found = new Map();
  const unreadable = [];
  for (const source of files) {
    for (const match of source.matchAll(/\benum\s+class\s+(\w+)[^{]*\{/g)) {
      const open = match.index + match[0].length;
      const body = source.slice(open, closeBrace(source, open) - 1);
      // Entries end at the first top-level `;`, after which members may follow.
      const [entries] = splitTopLevel(body, ';');
      const values = [];
      for (const entry of splitTopLevel(entries, ',')) {
        if (skipTrivia(entry, 0) >= entry.length) continue; // a trailing comma
        // `@Deprecated("…") NEW_VALUE` is as much an entry as `NEW_VALUE`.
        const rest = entry.slice(skipAnnotations(entry, 0));
        const name =
          /^`([^`]+)`/.exec(rest)?.[1] ?? /^[A-Za-z_]\w*/.exec(rest)?.[0];
        if (name) values.push(name);
        else
          unreadable.push(
            `${match[1]}: cannot read the entry \`${entry.trim().slice(0, 60)}\``,
          );
      }
      found.set(match[1], values);
    }

    for (const match of source.matchAll(/@JsonSubTypes\s*\(/g)) {
      const open = match.index + match[0].length;
      const close = skipBalanced(source, open, '(', ')');
      const args = source.slice(open, close - 1);
      const owner = interfaceAfter(source, close) ?? 'an unnamed @JsonSubTypes';
      const names = [];
      for (const name of args.matchAll(/\bname\s*=\s*/g)) {
        const at = name.index + name[0].length;
        const literal = literalAt(args, at);
        if (literal !== null) {
          names.push(literal);
          continue;
        }
        const reference = /^[A-Za-z_][\w.]*/.exec(args.slice(at))?.[0];
        const value = reference && resolveConstant(reference, constants);
        if (value !== undefined && value !== null) names.push(value);
        else
          unreadable.push(
            `${owner}: cannot read the discriminator \`${reference ?? args.slice(at, at + 40).trim()}\``,
          );
      }
      if (names.length > 0) found.set(owner, names);
    }
  }
  return { found, unreadable };
}

/** Every `export enum` in this package's query source, name to values. */
function tsEnums() {
  const found = new Map();
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.ts')) {
        const source = readFileSync(path, 'utf8');
        for (const match of source.matchAll(
          /export\s+enum\s+(\w+)\s*\{([\s\S]*?)\n\}/g,
        ))
          found.set(
            match[1],
            [...match[2].matchAll(/=\s*(?:'([^']*)'|"([^"]*)")/g)].map(
              value => value[1] ?? value[2],
            ),
          );
      }
    }
  };
  walk(join(here, '..', 'src', 'query'));
  return found;
}

function compareEnums(root) {
  const failures = [];
  const skipped = [];
  const ts = tsEnums();
  const { found, unreadable } = wowEnums(root);
  failures.push(...unreadable);
  const wow = new Map([...Object.entries(JDK_ENUMS), ...found]);
  const matched = new Set();
  for (const [name, values] of wow) {
    if (SERVER_ONLY_ENUMS[name]) {
      skipped.push(`${name} — ${SERVER_ONLY_ENUMS[name]}`);
      continue;
    }
    const local = ts.get(ENUM_NAMES[name] ?? name);
    matched.add(ENUM_NAMES[name] ?? name);
    if (!local) {
      failures.push(`${name}: no counterpart here`);
      continue;
    }
    const allowed = TS_ONLY_VALUES[name] ?? {};
    for (const value of values)
      if (!local.includes(value))
        failures.push(`${name}.${value}: Wow has it, this package does not`);
    for (const value of local)
      if (!values.includes(value) && !allowed[value])
        failures.push(
          `${name}.${value}: this package sends it, Wow does not know it`,
        );
    for (const value of Object.keys(allowed))
      if (values.includes(value) || !local.includes(value))
        failures.push(
          `${name}.${value}: listed as kept here only, which is no longer true`,
        );
  }
  // The other direction. Comparing only from the Kotlin side never looks at an
  // enum Wow deleted outright: its name is simply absent, and this package
  // would go on sending its values into a 400 while every check passed.
  for (const name of ts.keys())
    if (!matched.has(name))
      failures.push(`${name}: this package sends it, Wow does not declare it`);
  return { failures, skipped };
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

const enums = compareEnums(root);
if (enums.failures.length > 0) {
  console.error(
    `\n${enums.failures.length} wire value(s) out of step with Wow:`,
  );
  for (const failure of enums.failures) console.error(`  ! ${failure}`);
} else {
  console.log('\nEvery wow-api enum and discriminator matches.');
}
for (const skipped of enums.skipped) console.log(`  - ${skipped}`);

process.exit(missing.length > 0 || enums.failures.length > 0 ? 1 : 0);
