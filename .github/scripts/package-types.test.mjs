/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  CONSUMER_MODULES,
  IGNORED,
  classify,
  consumerConfig,
  consumerEntries,
  consumerManifest,
  consumerSources,
  consumerWorkspace,
  describe,
  CONSUMER_IGNORED,
  classifyDiagnostics,
  describeDiagnostic,
  legacyUmdProblems,
  parseDiagnostics,
  publishedPackages,
} from './package-types.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));

// Problems as attw 0.18 reports them for the 5.1.3 packages.
const falseEsm = {
  kind: 'FalseESM',
  typesFileName: '/node_modules/@ahoo-wang/fetcher/dist/index.d.ts',
  implementationFileName: '/node_modules/@ahoo-wang/fetcher/dist/index.umd.cjs',
};
const cjsToEsm = {
  kind: 'CJSResolvesToESM',
  entrypoint: '.',
  resolutionKind: 'node16-cjs',
};
const internal = {
  kind: 'InternalResolutionError',
  resolutionOption: 'node16',
  fileName: '/node_modules/@ahoo-wang/fetcher-openapi/dist/index.d.ts',
  moduleSpecifier: './info',
};
const subpath = entrypoint => ({
  kind: 'NoResolution',
  entrypoint,
  resolutionKind: 'node16-cjs',
});

test('every problem fails unless a rule accepts it', () => {
  const { unexpected, accepted } = classify({
    packageName: '@ahoo-wang/fetcher',
    problems: [falseEsm, cjsToEsm, internal],
  });
  assert.deepEqual(unexpected, [falseEsm, cjsToEsm, internal]);
  assert.deepEqual(accepted, []);
});

test('only the ES-module-only react subpaths may fail to resolve from CommonJS', () => {
  const react = classify({
    packageName: '@ahoo-wang/fetcher-react',
    problems: [subpath('./core'), subpath('./fetcher'), subpath('.')],
  });
  assert.deepEqual(react.accepted, [subpath('./core'), subpath('./fetcher')]);
  assert.deepEqual(react.unexpected, [subpath('.')]);
  // Nor anywhere else, and never for ES module or bundler resolution.
  assert.deepEqual(
    classify({
      packageName: '@ahoo-wang/fetcher',
      problems: [subpath('./core')],
    }).accepted,
    [],
  );
  assert.deepEqual(
    classify({
      packageName: '@ahoo-wang/fetcher-react',
      problems: [{ ...subpath('./core'), resolutionKind: 'bundler' }],
    }).accepted,
    [],
  );
});

test('the wow locale subpaths may fail to resolve only under node10', () => {
  const locale = resolutionKind => ({
    kind: 'NoResolution',
    entrypoint: './query/locale/zh_CN',
    resolutionKind,
  });
  const { accepted, unexpected } = classify({
    packageName: '@ahoo-wang/fetcher-wow',
    problems: [locale('node10'), locale('node16-cjs')],
  });
  assert.deepEqual(accepted, [locale('node10')]);
  assert.deepEqual(unexpected, [locale('node16-cjs')]);
});

test('every ignore rule gives its reason', () => {
  for (const rule of IGNORED) assert.ok(rule.reason?.length > 20, rule.kind);
});

test('problems are described by file and specifier', () => {
  assert.equal(
    describe(internal),
    "InternalResolutionError node16 dist/index.d.ts imports './info'",
  );
  assert.equal(describe(cjsToEsm), 'CJSResolvesToESM . node16-cjs');
  assert.equal(describe(falseEsm), 'FalseESM dist/index.d.ts');
});

test('private and unpublished packages are not checked', () => {
  const root = mkdtempSync(join(tmpdir(), 'package-types-'));
  for (const [name, manifest] of [
    ['public', { name: 'public' }],
    ['private', { name: 'private', private: true }],
    ['view-engine', { name: '@ahoo-wang/fetcher-view-engine' }],
  ]) {
    mkdirSync(join(root, 'packages', name), { recursive: true });
    writeFileSync(
      join(root, 'packages', name, 'package.json'),
      JSON.stringify(manifest),
    );
  }
  mkdirSync(join(root, 'packages', 'empty'));
  assert.deepEqual(publishedPackages(root), [join(root, 'packages', 'public')]);
});

test('this repository checks its published packages', () => {
  const checked = publishedPackages(repository);
  for (const name of ['fetcher', 'react', 'wow', 'generator', 'viewer'])
    assert.ok(checked.includes(join(repository, 'packages', name)), name);
});

test('5.x packs the old dist/index.umd.js as a copy nothing resolves to', () => {
  const bundle = Buffer.from('(function(){})();');
  const manifest = {
    name: '@ahoo-wang/fetcher-cosec',
    main: './dist/index.umd.cjs',
    exports: {
      '.': {
        require: {
          types: './dist/index.d.cts',
          default: './dist/index.umd.cjs',
        },
      },
    },
  };
  const packed = files => path => files[path];
  const both = {
    'dist/index.umd.cjs': bundle,
    'dist/index.umd.js': Buffer.from(bundle),
  };
  assert.deepEqual(legacyUmdProblems(manifest, packed(both)), []);
  assert.deepEqual(
    legacyUmdProblems(manifest, packed({ 'dist/index.umd.cjs': bundle })),
    ['dist/index.umd.js is not packed'],
  );
  assert.deepEqual(
    legacyUmdProblems(
      manifest,
      packed({ ...both, 'dist/index.umd.js': Buffer.from('other') }),
    ),
    ['dist/index.umd.js differs from dist/index.umd.cjs'],
  );
  assert.deepEqual(
    legacyUmdProblems(
      { ...manifest, main: './dist/index.umd.js' },
      packed(both),
    ),
    ['main or exports reference dist/index.umd.js'],
  );
  // Packages that never had the old path are not checked.
  assert.deepEqual(
    legacyUmdProblems({ name: '@ahoo-wang/fetcher' }, packed({})),
    [],
  );
});

// The react manifest's exports: a dual root and two ES-module-only subpaths.
const reactManifest = {
  name: '@ahoo-wang/fetcher-react',
  exports: {
    '.': {
      import: { types: './dist/index.d.ts', default: './dist/index.es.js' },
      require: { types: './dist/index.d.cts', default: './dist/index.umd.cjs' },
    },
    './core': {
      import: { types: './dist/core/index.d.ts', default: './dist/core.es.js' },
    },
    './fetcher': {
      import: {
        types: './dist/fetcher/index.d.ts',
        default: './dist/fetcher.es.js',
      },
    },
    './package.json': './package.json',
  },
};

test('the dual consumer imports every entry, ES-module-only ones from .mts only', () => {
  const entries = consumerEntries(reactManifest);
  assert.deepEqual(entries, [
    { specifier: '@ahoo-wang/fetcher-react', import: true, require: true },
    {
      specifier: '@ahoo-wang/fetcher-react/core',
      import: true,
      require: false,
    },
    {
      specifier: '@ahoo-wang/fetcher-react/fetcher',
      import: true,
      require: false,
    },
  ]);
  const sources = consumerSources(entries);
  for (const specifier of [
    "'@ahoo-wang/fetcher-react'",
    "'@ahoo-wang/fetcher-react/core'",
    "'@ahoo-wang/fetcher-react/fetcher'",
  ])
    assert.ok(sources['consumer.mts'].includes(specifier), specifier);
  assert.ok(sources['consumer.cts'].includes("'@ahoo-wang/fetcher-react'"));
  assert.ok(!sources['consumer.cts'].includes("fetcher-react/core'"));
  assert.ok(!sources['consumer.cts'].includes("fetcher-react/fetcher'"));
  // Type-only imports load the declarations, and their global augmentations.
  assert.match(sources['consumer.cts'], /^import type \* as entry0 from/);
});

test('an entry without conditions, or a package without exports, resolves from both', () => {
  assert.deepEqual(
    consumerEntries({ name: 'plain', exports: { '.': './index.js' } }),
    [{ specifier: 'plain', import: true, require: true }],
  );
  assert.deepEqual(consumerEntries({ name: 'legacy', main: 'index.js' }), [
    { specifier: 'legacy', import: true, require: true },
  ]);
  assert.deepEqual(
    consumerEntries({
      name: 'default-only',
      exports: { '.': { types: './i.d.ts', default: './i.js' } },
    }),
    [{ specifier: 'default-only', import: true, require: true }],
  );
  // A CommonJS consumer of an ES-module-only package still compiles.
  assert.equal(
    consumerSources([{ specifier: 'esm', import: true, require: false }])[
      'consumer.cts'
    ],
    'export {};\n',
  );
});

test('the dual consumer is one strict program with both files, lib checked', () => {
  assert.deepEqual(CONSUMER_MODULES, ['node16', 'nodenext']);
  for (const module of CONSUMER_MODULES) {
    const { compilerOptions, files } = consumerConfig(module);
    assert.equal(compilerOptions.module, module);
    assert.equal(compilerOptions.moduleResolution, module);
    assert.equal(compilerOptions.strict, true);
    assert.equal(compilerOptions.skipLibCheck, false);
    assert.deepEqual(files, ['consumer.mts', 'consumer.cts']);
  }
});

test('the dual consumer installs the packed tarballs, peers included, once each', () => {
  const tarballs = { '@ahoo-wang/fetcher': '/tmp/ahoo-wang-fetcher-6.0.0.tgz' };
  const manifest = consumerManifest(tarballs, { '@types/react': '19.3.0' });
  assert.deepEqual(manifest.dependencies, {
    '@ahoo-wang/fetcher': 'file:/tmp/ahoo-wang-fetcher-6.0.0.tgz',
    '@types/react': '19.3.0',
  });
  const workspace = consumerWorkspace(tarballs);
  assert.deepEqual(workspace.overrides, {
    '@ahoo-wang/fetcher': 'file:/tmp/ahoo-wang-fetcher-6.0.0.tgz',
  });
  assert.equal(workspace.nodeLinker, 'hoisted');
});

// tsc 6.0 output for 5.1.4's eventstream: getters in `declare global` do not
// merge across the .d.ts and the .d.cts.
const duplicateGetters = [
  "node_modules/@ahoo-wang/fetcher-eventstream/dist/responses.d.cts(13,17): error TS2300: Duplicate identifier 'contentType'.",
  "node_modules/@ahoo-wang/fetcher-eventstream/dist/responses.d.ts(22,17): error TS2300: Duplicate identifier 'isEventStream'.",
  '  node_modules/@ahoo-wang/fetcher-eventstream/dist/responses.d.cts(22,17)',
  "    'isEventStream' was also declared here.",
  "error TS5110: Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'.",
  '',
].join('\n');

test('tsc errors are parsed, with and without a location', () => {
  const diagnostics = parseDiagnostics(duplicateGetters);
  assert.deepEqual(diagnostics, [
    {
      file: 'node_modules/@ahoo-wang/fetcher-eventstream/dist/responses.d.cts',
      line: 13,
      column: 17,
      code: 'TS2300',
      message: "Duplicate identifier 'contentType'.",
    },
    {
      file: 'node_modules/@ahoo-wang/fetcher-eventstream/dist/responses.d.ts',
      line: 22,
      column: 17,
      code: 'TS2300',
      message: "Duplicate identifier 'isEventStream'.",
    },
    {
      file: '',
      code: 'TS5110',
      message:
        "Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'.",
    },
  ]);
  assert.deepEqual(parseDiagnostics(''), []);
});

test('diagnostics are described by package file and line', () => {
  const [cts, , global] = parseDiagnostics(duplicateGetters);
  assert.equal(
    describeDiagnostic(cts),
    "TS2300 fetcher-eventstream/dist/responses.d.cts:13 Duplicate identifier 'contentType'.",
  );
  assert.match(describeDiagnostic(global), /^TS5110 Option 'module'/);
  assert.equal(
    describeDiagnostic({
      file: 'node_modules/@types/react/index.d.ts',
      line: 1,
      code: 'TS1',
      message: 'm',
    }),
    'TS1 @types/react/index.d.ts:1 m',
  );
});

test('only third-party dual consumer errors are ignored for the viewer', () => {
  const [getter] = parseDiagnostics(duplicateGetters);
  const deepAntd = {
    file: 'node_modules/@ahoo-wang/fetcher-viewer/dist/types.d.ts',
    line: 3,
    column: 30,
    code: 'TS2307',
    message:
      "Cannot find module 'antd/es/config-provider/SizeContext' or its corresponding type declarations.",
  };
  const rcComponent = {
    file: 'node_modules/@rc-component/image/es/PreviewGroup.d.ts',
    line: 6,
    column: 18,
    code: 'TS2430',
    message: "Interface 'GroupPreviewConfig' incorrectly extends …",
  };
  const viewer = classifyDiagnostics(
    [getter, deepAntd, rcComponent],
    '@ahoo-wang/fetcher-viewer',
  );
  // The .d.ts/.d.cts clash is never accepted, not even for the viewer; nor is
  // a published declaration importing antd by deep path.
  assert.deepEqual(viewer.unexpected, [getter, deepAntd]);
  assert.deepEqual(viewer.accepted, [rcComponent]);
  // Nor are the viewer's rules accepted for another package.
  assert.deepEqual(
    classifyDiagnostics([rcComponent], '@ahoo-wang/fetcher-react').unexpected,
    [rcComponent],
  );
  for (const rule of CONSUMER_IGNORED)
    assert.ok(rule.reason?.length > 20, rule.package);
});
