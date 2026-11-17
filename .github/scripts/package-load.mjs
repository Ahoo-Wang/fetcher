/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  consumerEntries,
  installConsumer,
  pack,
  publishedPackages,
} from './package-types.mjs';

/**
 * Loads every published package at run time the way consumers do: each
 * package is packed as npm would publish it, every tarball is installed into
 * one project, and each `exports` entry is loaded with `require()` (entries
 * with a `require` condition) and `import()` (entries with an `import`
 * condition) by the running Node. CI runs it on the lowest Node versions the
 * packages declare, so a `require` entry that pulls in an ES-module-only
 * dependency fails where `require(esm)` is unavailable. A package whose
 * `engines.node` excludes the running Node is skipped.
 *
 * Run after `pnpm build`.
 */

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!match) throw new Error(`Unsupported version: ${version}`);
  return match.slice(1, 4).map(Number);
}

function compare(left, right) {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

/**
 * Whether `version` satisfies an `engines.node` range. Supports what the
 * manifests use: `>=x.y.z`, `^x.y.z` and `||` alternatives; no range means
 * any version.
 */
export function satisfies(version, range) {
  if (!range) return true;
  const current = parseVersion(version);
  return range.split('||').some(alternative => {
    const comparator = alternative.trim();
    if (comparator.startsWith('>=')) {
      return compare(current, parseVersion(comparator.slice(2))) >= 0;
    }
    if (comparator.startsWith('^')) {
      const minimum = parseVersion(comparator.slice(1));
      return current[0] === minimum[0] && compare(current, minimum) >= 0;
    }
    throw new Error(`Unsupported engines range: ${range}`);
  });
}

/** The loads to try for one manifest: `{ specifier, mode }`. */
export function loadChecks(manifest) {
  return consumerEntries(manifest).flatMap(entry => [
    ...(entry.require ? [{ specifier: entry.specifier, mode: 'require' }] : []),
    ...(entry.import ? [{ specifier: entry.specifier, mode: 'import' }] : []),
  ]);
}

/** The `node` arguments that load one specifier in one mode. */
export function loadArguments({ specifier, mode }) {
  const name = JSON.stringify(specifier);
  return mode === 'require'
    ? ['-e', `require(${name})`]
    : ['--input-type=module', '-e', `await import(${name})`];
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const root = process.argv[2] ?? process.cwd();
  const destination = mkdtempSync(join(tmpdir(), 'package-load-'));
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
    const project = installConsumer(root, tarballs, destination);
    console.log(`Loading every package entry on Node ${process.version}`);
    for (const [name, manifest] of Object.entries(manifests)) {
      const range = manifest.engines?.node;
      if (!satisfies(process.version, range)) {
        console.log(`skip ${name} (engines.node ${range})`);
        continue;
      }
      for (const check of loadChecks(manifest)) {
        const result = spawnSync(process.execPath, loadArguments(check), {
          cwd: project,
          encoding: 'utf8',
        });
        if (result.error) throw result.error;
        const ok = result.status === 0;
        failed ||= !ok;
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${check.mode} ${check.specifier}`);
        if (!ok) {
          const reason = (result.stderr || result.stdout)
            .split('\n')
            .filter(line => line.trim())
            .slice(0, 6);
          for (const line of reason) console.log(`       ${line}`);
        }
      }
    }
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
  if (failed) process.exitCode = 1;
}
