/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Points a downstream pnpm workspace at this commit's fetcher packages:
 * Wow's repository root (downstream-wow.yml) or CoSec's `typescript/`
 * (downstream-cosec.yml).
 *
 * Each package is packed (`pnpm pack`, which rewrites `workspace:` and
 * `catalog:` ranges to real ones) and the downstream workspace overrides every
 * `@ahoo-wang/fetcher*` to its tarball. A tarball installs like a published
 * package, so its peers — React above all — resolve inside the downstream
 * tree; a `link:` would drag in this repository's copy and render two Reacts.
 */

/** The tarball `pnpm pack` writes for a manifest. */
export function tarballName({ name, version }) {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
}

/** `{ packageName: 'file:<absolute tarball>' }` for every packed package. */
export function overrides(packagesDir, packsDir) {
  const result = {};
  for (const directory of readdirSync(packagesDir).sort()) {
    const manifest = join(packagesDir, directory, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    if (pkg.private) continue;
    const tarball = resolve(packsDir, tarballName(pkg));
    assert.ok(existsSync(tarball), `Not packed: ${tarball}`);
    result[pkg.name] = `file:${tarball}`;
  }
  assert.ok(Object.keys(result).length > 0, 'No package was packed');
  return result;
}

/**
 * The package an override key targets: `a>b@<2` overrides `b`, `@s/c@^1`
 * overrides `@s/c`. A `>` followed by a name separates parent from child;
 * one followed by `=`, a digit or a space belongs to a version range.
 */
export function overrideTarget(key) {
  const separators = [...key.matchAll(/>(?=[@\w])(?!\d)/g)];
  const target = key.slice((separators.at(-1)?.index ?? -1) + 1);
  const at = target.indexOf('@', 1);
  return at === -1 ? target : target.slice(0, at);
}

/**
 * A downstream pnpm-workspace.yaml with the packages' overrides added to its
 * own.
 *
 * Its `overrides:` block (Wow's security pins for its tooling, say) is kept as
 * written, comments included; the packed packages go at its top. An override
 * that already targets one of them fails instead: it is a deliberate pin, and
 * replacing it would test something other than what the downstream runs.
 */
export function withOverrides(workspaceYaml, entries) {
  const lines = workspaceYaml.replace(/\n*$/, '').split('\n');
  const start = lines.findIndex(line => /^overrides:/.test(line));
  const quote = name => `'${name}'`;
  if (start === -1) {
    const block = Object.entries(entries).map(
      ([name, spec]) => `  ${quote(name)}: ${quote(spec)}`,
    );
    return `${lines.join('\n')}\n\noverrides:\n${block.join('\n')}\n`;
  }
  assert.match(
    lines[start],
    /^overrides:\s*(#.*)?$/,
    'The downstream declares overrides in flow style; extend downstream-overrides.mjs',
  );
  let end = start + 1;
  while (end < lines.length && !/^[^\s#]/.test(lines[end])) end++;
  const body = lines.slice(start + 1, end);
  const keyLines = body.filter(line => /^\s+[^\s#]/.test(line));
  const indent = keyLines[0]?.match(/^\s+/)[0] ?? '  ';
  for (const line of keyLines) {
    const key = line.trim().match(/^(['"]?)(.+?)\1\s*:/)?.[2];
    assert.ok(key, `Unrecognised override line downstream: ${line}`);
    assert.ok(
      !Object.hasOwn(entries, overrideTarget(key)),
      `The downstream already overrides ${overrideTarget(key)} (${key}); ` +
        'drop that override there or decide here which one the check uses',
    );
  }
  const added = Object.entries(entries).map(
    ([name, spec]) => `${indent}${quote(name)}: ${quote(spec)}`,
  );
  return `${[
    ...lines.slice(0, start + 1),
    `${indent}# Packed builds of this fetcher commit (downstream check).`,
    ...added,
    ...lines.slice(start + 1),
  ].join('\n')}\n`;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [packsDir, workspaceDir] = process.argv.slice(2);
  assert.ok(
    packsDir && workspaceDir,
    'Usage: downstream-overrides.mjs <packs> <downstream workspace>',
  );
  const entries = overrides(
    new URL('../../packages/', import.meta.url).pathname,
    packsDir,
  );
  // Overrides in the workspace's package.json would sit beside the workspace
  // file's and could pin a fetcher package unseen; Wow and CoSec keep them in
  // pnpm-workspace.yaml.
  const downstreamPackage = JSON.parse(
    readFileSync(join(workspaceDir, 'package.json'), 'utf8'),
  );
  assert.equal(
    downstreamPackage.pnpm?.overrides,
    undefined,
    'The downstream declares pnpm.overrides in package.json; merge them here as well',
  );
  const file = join(workspaceDir, 'pnpm-workspace.yaml');
  writeFileSync(file, withOverrides(readFileSync(file, 'utf8'), entries));
  for (const [name, spec] of Object.entries(entries))
    console.log(`${name} -> ${spec}`);
}
