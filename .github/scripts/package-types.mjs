/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Checks the declarations of every published package the way consumers
 * resolve them: each package is packed as npm would publish it and handed to
 * `@arethetypeswrong/cli` (attw), which resolves every `exports` entry under
 * node10, node16 from CommonJS, node16 from ES modules and bundler.
 *
 * Run after `pnpm build`. Any problem fails the check unless {@link IGNORED}
 * names it, with the reason.
 */

/**
 * Problems that are accepted, each with why. A rule matches on the attw
 * problem kind, the package, the entry point and the resolution kind; an
 * omitted field matches anything.
 */
export const IGNORED = [
  {
    kind: 'NoResolution',
    package: '@ahoo-wang/fetcher-react',
    entrypoint: ['./core', './fetcher'],
    resolutionKind: ['node10', 'node16-cjs'],
    reason:
      'The /core and /fetcher subpaths are ES modules only (import ' +
      'condition), for @ahoo-wang/wow-react; CommonJS consumers use the ' +
      'package root, and node10 resolution does not read `exports` at all.',
  },
  {
    kind: 'NoResolution',
    package: '@ahoo-wang/fetcher-wow',
    entrypoint: ['./query/locale/zh_CN', './query/locale/en_US'],
    resolutionKind: 'node10',
    reason:
      'node10 resolution (deprecated in TypeScript) does not read `exports`, ' +
      'so it finds no subpath; node16 and bundler resolve the locale ' +
      'subpaths from both CommonJS and ES modules.',
  },
];

const PROBLEM_FIELDS = ['entrypoint', 'resolutionKind'];

function matches(value, expected) {
  if (expected === undefined) return true;
  return Array.isArray(expected)
    ? expected.includes(value)
    : value === expected;
}

/** The ignore rule that accepts `problem` in `packageName`, if any. */
export function ignoredBy(problem, packageName, ignored = IGNORED) {
  return ignored.find(
    rule =>
      matches(problem.kind, rule.kind) &&
      matches(packageName, rule.package) &&
      PROBLEM_FIELDS.every(field => matches(problem[field], rule[field])),
  );
}

/** One line per problem, e.g. `CJSResolvesToESM . node16-cjs`. */
export function describe(problem) {
  const where = [
    problem.entrypoint,
    problem.resolutionKind ?? problem.resolutionOption,
  ]
    .filter(Boolean)
    .join(' ');
  const file =
    problem.fileName ?? problem.typesFileName ?? problem.implementationFileName;
  const detail = problem.moduleSpecifier
    ? `${file} imports '${problem.moduleSpecifier}'`
    : file;
  return [
    problem.kind,
    where,
    detail?.replace(/^\/node_modules\/(?:@[^/]+\/)?[^/]+\//, ''),
  ]
    .filter(Boolean)
    .join(' ');
}

/** Splits an attw JSON analysis into unexpected and ignored problems. */
export function classify(analysis, ignored = IGNORED) {
  const unexpected = [];
  const accepted = [];
  for (const problem of analysis.problems ?? []) {
    (ignoredBy(problem, analysis.packageName, ignored)
      ? accepted
      : unexpected
    ).push(problem);
  }
  return { unexpected, accepted };
}

/**
 * Packages scripts/publish-npm.sh skips: view-engine is under active
 * development and not published on the 5.x line.
 */
export const UNPUBLISHED = ['view-engine'];

/** Directories under `packages/` that are published: not private, not skipped. */
export function publishedPackages(root) {
  const parent = join(root, 'packages');
  return readdirSync(parent, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !UNPUBLISHED.includes(entry.name))
    .map(entry => join(parent, entry.name))
    .filter(directory => {
      const manifest = join(directory, 'package.json');
      return (
        existsSync(manifest) &&
        !JSON.parse(readFileSync(manifest, 'utf8')).private
      );
    });
}

/**
 * 5.x packages that published their UMD bundle as `dist/index.umd.js`. The
 * `require` target is now `dist/index.umd.cjs`; the old path keeps the same
 * bundle for CDN users who load it by URL (scripts/legacy-umd-path.mjs), and
 * must not be what `exports` or `main` resolve to.
 */
export const LEGACY_UMD_PACKAGES = [
  '@ahoo-wang/fetcher-cosec',
  '@ahoo-wang/fetcher-eventbus',
  '@ahoo-wang/fetcher-openai',
  '@ahoo-wang/fetcher-openapi',
  '@ahoo-wang/fetcher-react',
  '@ahoo-wang/fetcher-storage',
  '@ahoo-wang/fetcher-viewer',
];

/**
 * What is wrong with the legacy UMD copy of a packed package: `manifest` is
 * its package.json, `read(path)` returns a packed file's contents or
 * undefined when the tarball lacks it.
 */
export function legacyUmdProblems(manifest, read) {
  if (!LEGACY_UMD_PACKAGES.includes(manifest.name)) return [];
  const problems = [];
  const umd = read('dist/index.umd.cjs');
  const legacy = read('dist/index.umd.js');
  if (umd === undefined) problems.push('dist/index.umd.cjs is not packed');
  if (legacy === undefined) problems.push('dist/index.umd.js is not packed');
  else if (umd !== undefined && !legacy.equals(umd))
    problems.push('dist/index.umd.js differs from dist/index.umd.cjs');
  if (/index\.umd\.js/.test(JSON.stringify([manifest.main, manifest.exports])))
    problems.push('main or exports reference dist/index.umd.js');
  return problems;
}

function pack(directory, destination) {
  const before = new Set(readdirSync(destination));
  // pnpm pack rewrites workspace: and catalog: ranges as publishing does.
  execFileSync('pnpm', ['pack', '--pack-destination', destination], {
    cwd: directory,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const tarball = readdirSync(destination).find(
    name => name.endsWith('.tgz') && !before.has(name),
  );
  if (!tarball) throw new Error(`pnpm pack wrote no tarball for ${directory}`);
  return join(destination, tarball);
}

function analyze(root, tarball) {
  // attw exits before a piped stdout drains, so its JSON goes to a file.
  const report = `${tarball}.json`;
  const out = openSync(report, 'w');
  try {
    const result = spawnSync(
      'pnpm',
      ['exec', 'attw', tarball, '--format', 'json', '--no-color'],
      { cwd: root, stdio: ['ignore', out, 'inherit'] },
    );
    // attw exits 1 when it finds problems; anything else is a failure to run.
    if (result.error) throw result.error;
    if (result.status !== 0 && result.status !== 1)
      throw new Error(`attw exited with ${result.status} for ${tarball}`);
  } finally {
    closeSync(out);
  }
  return JSON.parse(readFileSync(report, 'utf8')).analysis;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const root = process.argv[2] ?? process.cwd();
  const destination = mkdtempSync(join(tmpdir(), 'package-types-'));
  let failed = false;
  try {
    for (const directory of publishedPackages(root)) {
      const name = JSON.parse(
        readFileSync(join(directory, 'package.json'), 'utf8'),
      ).name;
      const tarball = pack(directory, destination);
      const analysis = analyze(root, tarball);
      const { unexpected, accepted } = classify({
        packageName: name,
        ...analysis,
      });
      const contents = `${tarball}.contents`;
      mkdirSync(contents);
      execFileSync('tar', ['-xzf', tarball, '-C', contents]);
      const packed = join(contents, 'package');
      const legacy = legacyUmdProblems(
        JSON.parse(readFileSync(join(packed, 'package.json'), 'utf8')),
        path =>
          existsSync(join(packed, path))
            ? readFileSync(join(packed, path))
            : undefined,
      );
      const bad = unexpected.length + legacy.length > 0;
      failed ||= bad;
      console.log(
        `${bad ? 'FAIL' : 'ok  '} ${name}` +
          (accepted.length > 0 ? ` (${accepted.length} ignored)` : ''),
      );
      for (const problem of unexpected)
        console.log(`       ${describe(problem)}`);
      for (const problem of legacy) console.log(`       ${problem}`);
    }
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
  if (failed) {
    console.error(
      '\nPublished declarations must resolve under node10, node16 (CommonJS ' +
        'and ES modules) and bundler, and 5.x keeps the old ' +
        'dist/index.umd.js as a copy of dist/index.umd.cjs. Fix the build ' +
        'output, or add a rule with its reason to IGNORED in ' +
        '.github/scripts/package-types.mjs.',
    );
    process.exit(1);
  }
  console.log('Package types: every published entry point resolves.');
}
