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
 * Points a Wow checkout at this commit's fetcher packages (downstream-wow.yml).
 *
 * Each package is packed (`pnpm pack`, which rewrites `workspace:` and
 * `catalog:` ranges to real ones) and Wow's workspace overrides every
 * `@ahoo-wang/fetcher*` to its tarball. A tarball installs like a published
 * package, so its peers — React above all — resolve inside Wow's tree; a
 * `link:` would drag in this repository's copy and render two Reacts.
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

/** Wow's pnpm-workspace.yaml with an `overrides:` block for the packages. */
export function withOverrides(workspaceYaml, entries) {
  assert.doesNotMatch(
    workspaceYaml,
    /^overrides:/m,
    'Wow already declares overrides; merge them here instead of replacing them',
  );
  const lines = Object.entries(entries).map(
    ([name, spec]) => `  '${name}': '${spec}'`,
  );
  return `${workspaceYaml.replace(/\n*$/, '\n')}\noverrides:\n${lines.join('\n')}\n`;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [packsDir, wowDir] = process.argv.slice(2);
  assert.ok(
    packsDir && wowDir,
    'Usage: downstream-overrides.mjs <packs> <wow>',
  );
  const entries = overrides(
    new URL('../../packages/', import.meta.url).pathname,
    packsDir,
  );
  const file = join(wowDir, 'pnpm-workspace.yaml');
  writeFileSync(file, withOverrides(readFileSync(file, 'utf8'), entries));
  for (const [name, spec] of Object.entries(entries))
    console.log(`${name} -> ${spec}`);
}
