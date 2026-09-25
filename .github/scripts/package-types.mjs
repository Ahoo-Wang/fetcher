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
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Checks the declarations of every published package the way consumers
 * resolve them. Each package is packed as npm would publish it, then:
 *
 * 1. `@arethetypeswrong/cli` (attw) resolves every `exports` entry under
 *    node10, node16 from CommonJS, node16 from ES modules and bundler.
 * 2. The dual consumer check covers what attw cannot see, since it resolves
 *    each entry on its own: declarations that clash when one compilation
 *    loads both the ES module (`.d.ts`) and the CommonJS (`.d.cts`)
 *    declarations of a package, as a project with `.mts` and `.cts` files or
 *    a dual-mode dependency graph does. A global augmentation with an
 *    accessor, for one, is then declared twice and does not merge (TS2300).
 *    Every tarball is installed into one project and, for each package, an
 *    `.mts` and a `.cts` file that both import it — every entry with a
 *    `require` condition from both, ES-module-only entries from the `.mts`
 *    only — are type-checked in one `tsc` run under node16 and nodenext,
 *    strict, without `skipLibCheck`.
 *
 * Run after `pnpm build`. Any problem fails the check unless {@link IGNORED}
 * (attw) or {@link CONSUMER_IGNORED} (dual consumer) names it, with the
 * reason.
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

/** The module modes the dual consumer is compiled under. */
export const CONSUMER_MODULES = ['node16', 'nodenext'];

/**
 * Dual consumer errors that are accepted, each with why. A rule matches on
 * the checked package, the error code, the file (a RegExp on the path from
 * the consumer project, `node_modules/` included) and the message (a
 * RegExp); an omitted field matches anything.
 */
export const CONSUMER_IGNORED = [
  {
    package: '@ahoo-wang/fetcher-viewer',
    file: /^node_modules\/(?:antd|@rc-component\/[^/]+)\//,
    reason:
      "Errors inside antd's and @rc-component's own declarations, which " +
      'only appear without skipLibCheck under node16/nodenext; not in ' +
      'declarations published from here.',
  },
];

function matchesPattern(value, expected) {
  if (expected === undefined) return true;
  return expected instanceof RegExp
    ? expected.test(value)
    : matches(value, expected);
}

/**
 * Splits the dual consumer diagnostics of `packageName` into unexpected and
 * ignored ones.
 */
export function classifyDiagnostics(
  diagnostics,
  packageName,
  ignored = CONSUMER_IGNORED,
) {
  const unexpected = [];
  const accepted = [];
  for (const diagnostic of diagnostics) {
    const rule = ignored.find(
      candidate =>
        matches(packageName, candidate.package) &&
        matches(diagnostic.code, candidate.code) &&
        matchesPattern(diagnostic.file, candidate.file) &&
        matchesPattern(diagnostic.message, candidate.message),
    );
    (rule ? accepted : unexpected).push(diagnostic);
  }
  return { unexpected, accepted };
}

/**
 * The entries a consumer imports, from a manifest's `exports`: the specifier
 * and whether it resolves from ES modules (`import`) and from CommonJS
 * (`require`). `./package.json` is left out; a manifest without `exports`
 * has one entry, the package root, resolving from both.
 */
export function consumerEntries(manifest) {
  const exports = manifest.exports ?? { '.': manifest.main ?? './index.js' };
  const entries = [];
  for (const [subpath, target] of Object.entries(exports)) {
    if (subpath === './package.json' || !subpath.startsWith('.')) continue;
    const conditional = typeof target === 'object' && target !== null;
    entries.push({
      specifier:
        subpath === '.'
          ? manifest.name
          : `${manifest.name}/${subpath.slice(2)}`,
      import: !conditional || 'import' in target || 'default' in target,
      require: !conditional || 'require' in target || 'default' in target,
    });
  }
  return entries;
}

/**
 * The two consumer sources for one package: `consumer.mts` imports every
 * entry that resolves from ES modules, `consumer.cts` every entry that
 * resolves from CommonJS. Type-only namespace imports load each declaration
 * file, global augmentations included, without needing a runtime.
 */
export function consumerSources(entries) {
  const source = side =>
    entries
      .filter(entry => entry[side])
      .map(
        (entry, index) =>
          `import type * as entry${index} from '${entry.specifier}';\n` +
          `export type Entry${index} = typeof entry${index};\n`,
      )
      .join('') || 'export {};\n';
  return {
    'consumer.mts': source('import'),
    'consumer.cts': source('require'),
  };
}

/** The dual consumer's tsconfig for one module mode. */
export function consumerConfig(module) {
  return {
    compilerOptions: {
      module,
      moduleResolution: module,
      target: 'es2022',
      lib: ['es2022', 'dom', 'dom.iterable'],
      types: [],
      strict: true,
      skipLibCheck: false,
      noEmit: true,
    },
    files: ['consumer.mts', 'consumer.cts'],
  };
}

/**
 * The errors in `tsc --pretty false` output:
 * `{ file, line, column, code, message }`, `file` as tsc printed it (empty
 * for a global error). Continuation lines of a message are dropped.
 */
export function parseDiagnostics(output) {
  const diagnostics = [];
  for (const line of output.split(/\r?\n/)) {
    const located = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(line);
    const global = /^error (TS\d+): (.*)$/.exec(line);
    if (located) {
      const [, file, row, column, code, message] = located;
      diagnostics.push({
        file,
        line: Number(row),
        column: Number(column),
        code,
        message,
      });
    } else if (global) {
      const [, code, message] = global;
      diagnostics.push({ file: '', code, message });
    }
  }
  return diagnostics;
}

/**
 * One line per diagnostic, the path shortened to the package, e.g.
 * `TS2300 fetcher-eventstream/dist/responses.d.ts:12 Duplicate identifier …`.
 */
export function describeDiagnostic(diagnostic) {
  const file = diagnostic.file
    .replaceAll('\\', '/')
    .replace(/^(?:.*\/)?node_modules\/(?:@ahoo-wang\/)?/, '');
  const where = file
    ? `${file}${diagnostic.line ? `:${diagnostic.line}` : ''} `
    : '';
  return `${diagnostic.code} ${where}${diagnostic.message}`;
}

function packedSpecifiers(tarballs) {
  return Object.fromEntries(
    Object.entries(tarballs).map(([name, tarball]) => [
      name,
      `file:${tarball}`,
    ]),
  );
}

/**
 * The dual consumer project's manifest: every tarball as a dependency, plus
 * the given type packages.
 */
export function consumerManifest(tarballs, typings = {}) {
  return {
    name: 'dual-consumer',
    private: true,
    dependencies: { ...packedSpecifiers(tarballs), ...typings },
  };
}

/**
 * The dual consumer project's pnpm settings: every tarball also as an
 * override, so peers resolve to the packed packages rather than the registry,
 * and laid out as npm does, one copy of each package, so a clash is between a
 * package's .d.ts and .d.cts, not between two installed copies.
 */
export function consumerWorkspace(tarballs) {
  return {
    nodeLinker: 'hoisted',
    autoInstallPeers: true,
    strictPeerDependencies: false,
    overrides: packedSpecifiers(tarballs),
  };
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

function installConsumer(root, tarballs, destination) {
  const project = join(destination, 'dual-consumer');
  mkdirSync(project);
  // Declarations that import react need its types, at the workspace's version.
  const typings = {};
  for (const name of ['@types/react', '@types/react-dom']) {
    const manifest = join(root, 'node_modules', name, 'package.json');
    if (existsSync(manifest))
      typings[name] = JSON.parse(readFileSync(manifest, 'utf8')).version;
  }
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify(consumerManifest(tarballs, typings), null, 2),
  );
  // JSON is YAML.
  writeFileSync(
    join(project, 'pnpm-workspace.yaml'),
    JSON.stringify(consumerWorkspace(tarballs), null, 2),
  );
  execFileSync(
    'pnpm',
    ['install', '--prefer-offline', '--ignore-scripts', '--reporter=silent'],
    { cwd: project, stdio: ['ignore', 'ignore', 'inherit'] },
  );
  return project;
}

/** Type-checks the dual consumer of one package; diagnostics by mode. */
function checkConsumer(root, project, manifest) {
  const directory = mkdtempSync(join(project, 'check-'));
  const sources = consumerSources(consumerEntries(manifest));
  for (const [file, source] of Object.entries(sources))
    writeFileSync(join(directory, file), source);
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const results = {};
  for (const module of CONSUMER_MODULES) {
    const config = `tsconfig.${module}.json`;
    writeFileSync(
      join(directory, config),
      JSON.stringify(consumerConfig(module), null, 2),
    );
    const result = spawnSync(
      process.execPath,
      [tsc, '-p', config, '--pretty', 'false'],
      { cwd: directory, encoding: 'utf8' },
    );
    if (result.error) throw result.error;
    const diagnostics = parseDiagnostics(
      `${result.stdout}\n${result.stderr}`,
    ).map(diagnostic => ({
      ...diagnostic,
      file: diagnostic.file
        ? relative(project, join(directory, diagnostic.file))
        : '',
    }));
    if (result.status !== 0 && diagnostics.length === 0)
      throw new Error(
        `tsc exited with ${result.status} for ${manifest.name} (${module}):\n` +
          result.stdout +
          result.stderr,
      );
    results[module] = diagnostics;
  }
  return results;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const root = process.argv[2] ?? process.cwd();
  const destination = mkdtempSync(join(tmpdir(), 'package-types-'));
  let failed = false;
  try {
    const manifests = {};
    const tarballs = {};
    for (const directory of publishedPackages(root)) {
      const manifest = JSON.parse(
        readFileSync(join(directory, 'package.json'), 'utf8'),
      );
      manifests[manifest.name] = manifest;
      tarballs[manifest.name] = pack(directory, destination);
    }

    console.log('attw: every entry under node10, node16 and bundler');
    for (const [name, tarball] of Object.entries(tarballs)) {
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

    console.log(
      '\nDual consumer: .mts and .cts importing the package in one tsc run ' +
        `(${CONSUMER_MODULES.join(', ')})`,
    );
    const project = installConsumer(root, tarballs, destination);
    for (const [name, manifest] of Object.entries(manifests)) {
      const results = Object.entries(
        checkConsumer(root, project, manifest),
      ).map(([module, diagnostics]) => [
        module,
        classifyDiagnostics(diagnostics, name),
      ]);
      const problems = results.filter(
        ([, { unexpected }]) => unexpected.length > 0,
      );
      const ignored = results.reduce(
        (count, [, { accepted }]) => count + accepted.length,
        0,
      );
      failed ||= problems.length > 0;
      console.log(
        `${problems.length > 0 ? 'FAIL' : 'ok  '} ${name}` +
          (ignored > 0 ? ` (${ignored} ignored)` : ''),
      );
      for (const [module, { unexpected }] of problems) {
        console.log(`       ${module}: ${unexpected.length} error(s)`);
        for (const diagnostic of unexpected)
          console.log(`         ${describeDiagnostic(diagnostic)}`);
      }
    }
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
  if (failed) {
    console.error(
      '\nPublished declarations must resolve under node10, node16 (CommonJS ' +
        'and ES modules) and bundler, must type-check when one program ' +
        'loads both their .d.ts and .d.cts, and 5.x keeps the old ' +
        'dist/index.umd.js as a copy of dist/index.umd.cjs. Fix the build ' +
        'output or the declarations, or add a rule with its reason to ' +
        'IGNORED (attw) or CONSUMER_IGNORED (dual consumer) in ' +
        '.github/scripts/package-types.mjs.',
    );
    process.exit(1);
  }
  console.log(
    '\nPackage types: every published entry point resolves, and the ES ' +
      'module and CommonJS declarations load together.',
  );
}
