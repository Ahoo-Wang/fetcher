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

/** The steps whose `pnpm -r --report-summary` file names the failed packages. */
export const REPORTED = ['build', 'typecheck', 'test'];

const reason = error => String(error?.message ?? error).split('\n')[0];

/**
 * The Markdown of the job summary. `peers` is the rows of `peerRows` or
 * `{ error }` when they could not be read; `steps` (the workflow's `steps`
 * context) and each `failures[id]` (failed package directories) likewise.
 */
export function summary({ ref, sha, node, pnpm, peers, steps, failures }) {
  const lines = [
    `### CoSec TypeScript against this fetcher (Node ${node || 'unknown'})`,
    '',
    `CoSec \`${ref || 'unknown'}\` at \`${sha || 'unknown'}\`.`,
  ];
  if (pnpm) {
    const pinned = pnpm.pinned?.replace(/^pnpm@/, '');
    lines.push(
      '',
      pnpm.error
        ? `pnpm: ${pnpm.used || 'unknown'} (CoSec's pin not read: ${pnpm.error}).`
        : pinned && pnpm.used && pinned !== pnpm.used
          ? `pnpm: ${pnpm.used}, **not** the ${pinned} CoSec pins.`
          : `pnpm: ${pnpm.used || 'unknown'} (CoSec pins ${pinned || 'none'}).`,
    );
  }
  lines.push('');
  if (peers.error) {
    lines.push(`Peer ranges not read: ${peers.error}`);
  } else {
    lines.push(
      '| CoSec package | Peer | Declared range | Packed here | Satisfied |',
      '| --- | --- | --- | --- | --- |',
    );
    for (const row of peers) {
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
    if (peers.some(row => row.satisfied === false))
      lines.push(
        '',
        'A packed version is outside the range CoSec declares. This is not a ' +
          'failure of this change: CoSec widens the range when it takes this ' +
          'fetcher version.',
      );
  }
  const failed = STEPS.filter(([id]) => steps[id]?.outcome === 'failure');
  lines.push('');
  if (steps.error) {
    lines.push(`Step outcomes not read: ${steps.error}`);
  } else if (failed.length === 0) {
    lines.push(
      Object.values(steps).some(step => step.outcome === 'cancelled')
        ? 'The run was cancelled.'
        : 'Every step passed.',
    );
  } else {
    lines.push('Failed:', '');
    for (const [id, title] of failed) {
      const packages = failures[id] ?? [];
      lines.push(
        packages.error
          ? `- ${title} (its per-package report not read: ${packages.error})`
          : packages.length
            ? `- ${title}: ${packages.map(name => `\`${name}\``).join(', ')}`
            : `- ${title}`,
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * The summary for a CoSec workspace after a run. The library functions throw
 * on what they cannot read; here each of those becomes a line in the summary,
 * so the summary step never turns the check red on its own.
 */
export function report({ workspaceDir, reportsDir, packagesDir, env }) {
  const attempt = read => {
    try {
      return read();
    } catch (error) {
      return { error: reason(error) };
    }
  };
  const steps = attempt(() => JSON.parse(env.STEPS || '{}') ?? {});
  const pinned = attempt(
    () =>
      JSON.parse(readFileSync(join(workspaceDir, 'package.json'), 'utf8'))
        .packageManager,
  );
  return summary({
    ref: env.COSEC_REF,
    sha: env.COSEC_SHA,
    node: env.NODE_VERSION,
    pnpm: {
      used: env.PNPM_VERSION,
      pinned: typeof pinned === 'string' ? pinned : undefined,
      error: pinned?.error,
    },
    peers: attempt(() => peerRows(workspaceDir, packedVersions(packagesDir))),
    steps,
    failures: Object.fromEntries(
      REPORTED.map(id => [
        id,
        attempt(() => failedPackages(join(reportsDir, `${id}.json`))),
      ]),
    ),
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [workspaceDir, reportsDir] = process.argv.slice(2);
  try {
    assert.ok(
      workspaceDir && reportsDir,
      'Usage: downstream-cosec.mjs <cosec typescript dir> <reports dir>',
    );
    process.stdout.write(
      report({
        workspaceDir,
        reportsDir,
        packagesDir: new URL('../../packages/', import.meta.url).pathname,
        env: process.env,
      }),
    );
  } catch (error) {
    // The steps' own outcomes decide the check; a summary that cannot be
    // written must not add a failure of its own.
    process.stdout.write(`CoSec summary not written: ${reason(error)}\n`);
  }
}
