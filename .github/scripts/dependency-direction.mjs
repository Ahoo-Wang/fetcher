/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Dependencies run one way only: Wow → fetcher. The Wow packages
 * (`@ahoo-wang/wow-*`, in the Wow repository under `typescript/`) depend on
 * the published fetcher packages; nothing here may depend on them, or the two
 * repositories would have to release in lockstep.
 */
export const FORBIDDEN = /^@ahoo-wang\/wow-/;
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](@ahoo-wang\/wow-[^'"]*)['"]/g;

/** Workspace globs from pnpm-workspace.yaml: `dir/*` or a plain directory. */
function workspaceDirectories(root) {
  const yaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const block = yaml.match(/^packages:\n((?:[ \t]+-.*\n?)+)/m)?.[1] ?? '';
  const directories = [];
  for (const [, raw] of block.matchAll(/-\s*['"]?([^'"\n]+?)['"]?\s*$/gm)) {
    if (raw.endsWith('/*')) {
      const parent = join(root, raw.slice(0, -2));
      if (!existsSync(parent)) continue;
      for (const entry of readdirSync(parent, { withFileTypes: true }))
        if (entry.isDirectory())
          directories.push(join(raw.slice(0, -2), entry.name));
    } else directories.push(raw);
  }
  return directories;
}

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && SOURCE.test(entry.name))
    .map(entry => join(entry.parentPath, entry.name))
    .filter(file => !/[/\\](?:node_modules|dist)[/\\]/.test(file));
}

/** Every place in the repository at `root` that depends on a Wow package. */
export function violations(root) {
  const found = [];
  const directories = ['', ...workspaceDirectories(root)];
  for (const directory of directories) {
    const manifest = join(root, directory, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    const where = join(directory, 'package.json');
    for (const field of DEPENDENCY_FIELDS)
      for (const name of Object.keys(pkg[field] ?? {}))
        if (FORBIDDEN.test(name)) found.push(`${where} ${field}: ${name}`);
    for (const name of Object.keys(pkg.pnpm?.overrides ?? {}))
      if (FORBIDDEN.test(name.replace(/@[^@/]*$/, '')))
        found.push(`${where} pnpm.overrides: ${name}`);
    if (directory === '') continue;
    for (const file of sourceFiles(join(root, directory, 'src')))
      for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORT))
        found.push(`${file.slice(root.length + 1)} imports ${specifier}`);
  }
  const yaml = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  for (const [, name] of yaml.matchAll(/^\s+['"]?(@ahoo-wang\/wow-[^'":]+)/gm))
    found.push(`pnpm-workspace.yaml catalog: ${name}`);
  return found;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const found = violations(process.argv[2] ?? process.cwd());
  if (found.length > 0) {
    console.error(
      'Dependencies run one way, Wow → fetcher: nothing in this repository ' +
        'may depend on @ahoo-wang/wow-*.\n' +
        found.map(line => `  ${line}`).join('\n'),
    );
    process.exit(1);
  }
  console.log(
    'Dependency direction: no workspace depends on @ahoo-wang/wow-*.',
  );
}
