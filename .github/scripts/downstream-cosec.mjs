/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The job summary of downstream-cosec.yml: which CoSec commit was tested, on
 * which Node, whether CoSec's declared peer ranges admit the fetcher versions
 * packed here, and — when the run failed — the step and the CoSec package.
 *
 * An unmet peer range is reported, not failed: it means CoSec should widen the
 * range when it takes this fetcher version, which is CoSec's change to make.
 */

/** `{ name: version }` of every published package under `packagesDir`. */
export function packedVersions(packagesDir) {
  const result = {};
  for (const directory of readdirSync(packagesDir).sort()) {
    const manifest = join(packagesDir, directory, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    if (!pkg.private) result[pkg.name] = pkg.version;
  }
  return result;
}

const unquote = value =>
  value
    .replace(/\s+#.*$/, '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2');

/**
 * The catalogs of a pnpm-workspace.yaml, `{ catalogName: { dep: range } }`:
 * the top-level `catalog:` is `default`, each entry under `catalogs:` its own.
 * Only the block style CoSec writes is read; anything else fails loudly.
 */
export function catalogs(workspaceYaml) {
  const result = {};
  let section = null;
  let named = null;
  for (const line of workspaceYaml.split('\n')) {
    if (/^\s*(#.*)?$/.test(line)) continue;
    const top = line.match(/^(\S[^:]*):\s*(.*)$/);
    if (top) {
      section = top[1] === 'catalog' || top[1] === 'catalogs' ? top[1] : null;
      named = null;
      if (section) {
        assert.equal(
          unquote(top[2]),
          '',
          `${top[1]} is not in block style; extend downstream-cosec.mjs`,
        );
        if (section === 'catalog') result.default ??= {};
      }
      continue;
    }
    if (!section) continue;
    const entry = line.match(/^(\s+)(['"]?)([^'"]+?)\2:\s*(.*)$/);
    assert.ok(entry, `Unrecognised catalog line: ${line}`);
    const [, indent, , key, value] = entry;
    if (section === 'catalogs' && indent.length === 2) {
      assert.equal(unquote(value), '', `catalogs.${key} is not a block`);
      named = result[key] ??= {};
    } else {
      const target = section === 'catalog' ? result.default : named;
      assert.ok(target, `Catalog entry outside a catalog: ${line}`);
      target[key] = unquote(value);
    }
  }
  return result;
}

function parseVersion(text) {
  const match = text.match(
    /^v?(\d+)(?:\.(\d+)(?:\.(\d+)(?:-([0-9A-Za-z.-]+))?)?)?(?:\+[0-9A-Za-z.-]+)?$/,
  );
  if (!match) return null;
  const [, major, minor, patch, pre] = match;
  return {
    parts: [Number(major), Number(minor ?? 0), Number(patch ?? 0)],
    given: [major, minor, patch].filter(part => part !== undefined).length,
    pre: pre ? pre.split('.') : [],
  };
}

function compareIdentifiers(a, b) {
  const numeric = /^\d+$/;
  if (numeric.test(a) && numeric.test(b)) return Number(a) - Number(b);
  if (numeric.test(a)) return -1;
  if (numeric.test(b)) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function compare(a, b) {
  for (let i = 0; i < 3; i++)
    if (a.parts[i] !== b.parts[i]) return a.parts[i] - b.parts[i];
  if (!a.pre.length || !b.pre.length) return b.pre.length - a.pre.length;
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    if (a.pre[i] === undefined) return -1;
    if (b.pre[i] === undefined) return 1;
    const order = compareIdentifiers(a.pre[i], b.pre[i]);
    if (order) return order;
  }
  return 0;
}

// The exclusive upper edge `^`, `~` and partial versions stand for: `<X.Y.Z-0`,
// so no prerelease of X.Y.Z gets in.
const bound = parts => ({ parts, pre: ['0'], given: 3, implied: true });

/** `[[operator, version]]` that one comparator stands for. */
function comparators(token) {
  const match = token.match(/^(\^|~|>=|<=|>|<|=)?(.+)$/);
  const version = match && parseVersion(match[2]);
  if (!version) return null;
  const operator = match[1];
  const [major, minor, patch] = version.parts;
  if (operator === '^' || operator === '~') {
    let upper;
    if (operator === '~')
      upper = version.given > 1 ? [major, minor + 1, 0] : [major + 1, 0, 0];
    else if (major > 0 || version.given === 1) upper = [major + 1, 0, 0];
    else if (minor > 0 || version.given === 2) upper = [0, minor + 1, 0];
    else upper = [0, 0, patch + 1];
    return [
      ['>=', version],
      ['<', bound(upper)],
    ];
  }
  // npm reads `>6` as `>=7.0.0` and `<=6` as `<7.0.0-0`; not needed for peers.
  if (version.given < 3 && (operator === '>' || operator === '<=')) return null;
  if (version.given < 3 && (operator ?? '=') === '=') {
    const upper =
      version.given === 1 ? [major + 1, 0, 0] : [major, minor + 1, 0];
    return [
      ['>=', version],
      ['<', bound(upper)],
    ];
  }
  return [[operator ?? '=', version]];
}

/**
 * Whether `version` satisfies the npm range `range`, for the forms peer
 * ranges use: `||` alternatives of space-separated comparators with `^`, `~`,
 * `>=`, `>`, `<=`, `<`, `=` or a bare (possibly partial) version. A
 * prerelease satisfies a set only when one of its comparators is a prerelease
 * of the same major.minor.patch, as npm decides. `undefined` for a form it
 * does not read (`*`, `x`, hyphen ranges): the summary then says so.
 */
export function satisfies(version, range) {
  const target = parseVersion(version);
  assert.ok(target && target.given === 3, `Not a version: ${version}`);
  let answer = false;
  for (const alternative of range.split('||')) {
    const tokens = alternative
      .trim()
      .replace(/(\^|~|>=|<=|>|<|=)\s+/g, '$1')
      .split(/\s+/);
    const set = tokens.map(comparators);
    if (set.some(item => item === null)) return undefined;
    const flat = set.flat();
    const holds = flat.every(([operator, edge]) => {
      const order = compare(target, edge);
      return {
        '>=': order >= 0,
        '>': order > 0,
        '<=': order <= 0,
        '<': order < 0,
        '=': order === 0,
      }[operator];
    });
    const prereleaseAllowed =
      !target.pre.length ||
      flat.some(
        ([operator, edge]) =>
          !edge.implied &&
          edge.pre.length &&
          edge.parts.every((part, i) => part === target.parts[i]),
      );
    if (holds && prereleaseAllowed) answer = true;
  }
  return answer;
}

/**
 * One row per peer dependency a published package of the downstream workspace
 * declares on a packed package: the declared range (a `catalog:` reference
 * resolved through the workspace's catalogs) and whether the packed version
 * satisfies it.
 */
export function peerRows(workspaceDir, packed) {
  const workspace = catalogs(
    readFileSync(join(workspaceDir, 'pnpm-workspace.yaml'), 'utf8'),
  );
  const rows = [];
  for (const directory of readdirSync(workspaceDir).sort()) {
    const manifest = join(workspaceDir, directory, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    if (pkg.private) continue;
    for (const [peer, declared] of Object.entries(pkg.peerDependencies ?? {})) {
      if (!Object.hasOwn(packed, peer)) continue;
      const reference = declared.match(/^catalog:(.*)$/);
      const range = reference
        ? workspace[reference[1] || 'default']?.[peer]
        : declared;
      assert.ok(range, `${pkg.name}: ${peer} is ${declared}, not in a catalog`);
      rows.push({
        package: pkg.name,
        peer,
        range,
        version: packed[peer],
        satisfied: satisfies(packed[peer], range),
      });
    }
  }
  return rows;
}

/** Packages that failed in a `pnpm -r --report-summary` file. */
export function failedPackages(reportFile) {
  if (!existsSync(reportFile)) return [];
  const { executionStatus = {} } = JSON.parse(readFileSync(reportFile, 'utf8'));
  return Object.entries(executionStatus)
    .filter(([, run]) => run.status === 'failure')
    .map(([directory]) => basename(directory));
}

const STEPS = [
  ['overrides', 'Merge the packed builds into CoSec'],
  ['install', 'Install'],
  ['build', 'Build'],
  ['typecheck', 'Type-check'],
  ['scripts', 'Workspace script tests'],
  ['test', 'Package tests'],
];

/** The Markdown of the job summary. */
export function summary({ ref, sha, node, rows, steps, reports }) {
  const lines = [
    `### CoSec TypeScript against this fetcher (Node ${node})`,
    '',
    `CoSec \`${ref}\` at \`${sha || 'unknown'}\`.`,
    '',
    '| CoSec package | Peer | Declared range | Packed here | Satisfied |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    const mark =
      row.satisfied === undefined
        ? 'not read'
        : row.satisfied
          ? 'yes'
          : '**no**';
    lines.push(
      `| \`${row.package}\` | \`${row.peer}\` | \`${row.range}\` | ${row.version} | ${mark} |`,
    );
  }
  if (rows.some(row => row.satisfied === false))
    lines.push(
      '',
      'A packed version is outside the range CoSec declares. This is not a ' +
        'failure of this change: CoSec widens the range when it takes this ' +
        'fetcher version.',
    );
  const failed = STEPS.filter(([id]) => steps[id]?.outcome === 'failure');
  lines.push('');
  if (failed.length === 0) {
    lines.push(
      Object.values(steps).some(step => step.outcome === 'cancelled')
        ? 'The run was cancelled.'
        : 'Every step passed.',
    );
  } else {
    lines.push('Failed:', '');
    for (const [id, title] of failed) {
      const packages = reports[id] ? failedPackages(reports[id]) : [];
      lines.push(
        packages.length
          ? `- ${title}: ${packages.map(name => `\`${name}\``).join(', ')}`
          : `- ${title}`,
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [workspaceDir, reportsDir] = process.argv.slice(2);
  assert.ok(
    workspaceDir && reportsDir,
    'Usage: downstream-cosec.mjs <cosec typescript dir> <reports dir>',
  );
  const packed = packedVersions(
    new URL('../../packages/', import.meta.url).pathname,
  );
  const reports = Object.fromEntries(
    ['build', 'typecheck', 'test'].map(id => [
      id,
      join(reportsDir, `${id}.json`),
    ]),
  );
  process.stdout.write(
    summary({
      ref: process.env.COSEC_REF,
      sha: process.env.COSEC_SHA,
      node: process.env.NODE_VERSION,
      rows: peerRows(workspaceDir, packed),
      steps: JSON.parse(process.env.STEPS ?? '{}'),
      reports,
    }),
  );
}
